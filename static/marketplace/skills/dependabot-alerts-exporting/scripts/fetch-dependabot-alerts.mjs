#!/usr/bin/env node

/**
 * GitHub Dependabot Alerts Fetcher
 *
 * Fetches all Dependabot dependency vulnerability alerts from GitHub
 * for a given organization and exports to JSON.
 *
 * Usage:
 *   node fetch-dependabot-alerts.mjs <org> [output-file] [options]
 *
 * Options:
 *   --severity <levels>    Filter by severity: critical,high,medium,low (comma-separated)
 *   --state <state>        Filter by state: open (default), dismissed, fixed, auto_dismissed
 *   --repo <name>          Export single repository only
 *   --ecosystem <name>     Filter by package ecosystem (e.g., npm, pip, maven, gradle)
 *
 * Environment:
 *   GITHUB_TOKEN           Required. Personal access token or gh CLI token.
 *                          Needs: security_events scope (org member) or
 *                                 read:org + repo scope (org admin for all repos)
 *
 * Security:
 *   - Token sourced from environment variable only (never hardcoded)
 *   - Token validated at startup before any API calls
 *   - Token never logged or exposed in error messages
 */

import { writeFileSync } from 'fs';

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Organization name is required');
  console.error('Usage: node fetch-dependabot-alerts.mjs <org> [output-file] [options]');
  process.exit(1);
}

const parseArgs = (args) => {
  const parsed = { positional: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const flag = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed.flags[flag] = args[i + 1];
        i++;
      } else {
        parsed.flags[flag] = true;
      }
    } else {
      parsed.positional.push(args[i]);
    }
  }
  return parsed;
};

const { positional, flags } = parseArgs(args);
const organization = positional[0];
const outputFile = positional[1] || `dependabot-alerts-${organization}-${Date.now()}.json`;
const filterSeverity = flags.severity ? flags.severity.toLowerCase().split(',') : null;
const filterState = flags.state || 'open';
const filterRepo = flags.repo || null;
const filterEcosystem = flags.ecosystem || null;

// Validate token
if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.error('   Set it with: export GITHUB_TOKEN=<your-token>');
  console.error('   Or use gh CLI auth: eval "$(gh auth token)" style workaround');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'pds-dependabot-exporter/1.0'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      // Rate limiting
      if (response.status === 429 || response.status === 403) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        const resetTime = response.headers.get('x-ratelimit-reset');
        const waitMs = resetTime
          ? Math.max(0, parseInt(resetTime, 10) * 1000 - Date.now()) + 1000
          : retryAfter * 1000;
        console.error(`⏳ Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s before retry...`);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = Math.pow(2, attempt) * 1000;
      console.error(`⚠️  Attempt ${attempt} failed: ${err.message}. Retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
    }
  }
}

// Parse the Link header for cursor-based pagination (used by Dependabot alerts API)
function parseNextUrl(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function fetchAllPages(urlBase) {
  const results = [];
  const perPage = 100;
  const sep = urlBase.includes('?') ? '&' : '?';
  let url = `${urlBase}${sep}per_page=${perPage}`;

  while (url) {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);

    // Follow Link header for cursor-based pagination
    url = parseNextUrl(response.headers.get('link'));

    if (url) await sleep(200);
  }

  return results;
}

async function fetchOrgRepos(org) {
  console.log(`📋 Fetching repositories for ${org}...`);
  const repos = await fetchAllPages(`${GITHUB_API}/orgs/${org}/repos?type=all&sort=full_name`);
  console.log(`   Found ${repos.length} repositories`);
  return repos;
}

async function fetchAlertsForRepo(org, repo) {
  try {
    const url = `${GITHUB_API}/repos/${org}/${repo}/dependabot/alerts?state=${filterState}`;
    const alerts = await fetchAllPages(url);
    return alerts;
  } catch (err) {
    // 404 = Dependabot not enabled for repo, 403 = no access
    if (err.message.includes('HTTP 404') || err.message.includes('HTTP 403')) {
      return [];
    }
    throw err;
  }
}

function normalizeAlert(alert, repoName, org) {
  const adv = alert.security_advisory || {};
  const vuln = alert.security_vulnerability || {};
  const dep = alert.dependency || {};
  const pkg = dep.package || {};
  const auto = alert.auto_dismissed_at;

  const cvssScore = adv.cvss?.score ?? null;
  const severity = alert.security_advisory?.severity || vuln.severity || 'unknown';

  return {
    // Identity
    alertNumber: alert.number,
    alertUrl: alert.html_url,
    repository: `${org}/${repoName}`,
    state: alert.state,
    dismissedReason: alert.dismissed_reason || null,
    dismissedComment: alert.dismissed_comment || null,
    autoDismissedAt: auto || null,
    createdAt: alert.created_at,
    updatedAt: alert.updated_at,
    fixedAt: alert.fixed_at || null,

    // Dependency info
    dependency: {
      package: pkg.name || 'unknown',
      ecosystem: pkg.ecosystem || 'unknown',
      manifestPath: dep.manifest_path || null,
      scope: dep.scope || null
    },

    // Vulnerability info
    vulnerability: {
      vulnerableVersionRange: vuln.vulnerable_version_range || null,
      firstPatchedVersion: vuln.first_patched_version?.identifier || null
    },

    // Advisory info
    advisory: {
      ghsaId: adv.ghsa_id || null,
      cveId: adv.cve_id || null,
      summary: adv.summary || null,
      description: adv.description || null,
      severity: severity,
      cvssScore: cvssScore,
      cvssVector: adv.cvss?.vector_string || null,
      cwes: (adv.cwes || []).map(c => ({ cweId: c.cwe_id, name: c.name })),
      references: (adv.references || []).map(r => r.url),
      publishedAt: adv.published_at || null,
      updatedAt: adv.updated_at || null,
      withdrawnAt: adv.withdrawn_at || null,
      advisoryUrl: adv.permalink || null
    },

    // Triage fields (to be populated during triage)
    triage: {
      action: null,          // "dismiss" | "keep_open" | "fix"
      dismissedReason: null, // "tolerable_risk" | "inaccurate" | "not_used" | "no_bandwidth"
      comment: null,
      githubIssueUrl: null,
      reviewer: null,
      triageDate: null,
      confidence: null       // "high" | "medium" | "low"
    }
  };
}

async function main() {
  console.log(`\n🔍 Dependabot Alert Exporter`);
  console.log(`   Organization: ${organization}`);
  console.log(`   State filter: ${filterState}`);
  if (filterSeverity) console.log(`   Severity filter: ${filterSeverity.join(', ')}`);
  if (filterRepo) console.log(`   Repo filter: ${filterRepo}`);
  if (filterEcosystem) console.log(`   Ecosystem filter: ${filterEcosystem}`);
  console.log('');

  // Get repos to scan
  let repos;
  if (filterRepo) {
    repos = [{ name: filterRepo }];
  } else {
    repos = await fetchOrgRepos(organization);
  }

  const allAlerts = [];
  const repoSummary = [];
  let skipped = 0;

  for (const repo of repos) {
    process.stdout.write(`  Scanning ${repo.name}... `);
    const alerts = await fetchAlertsForRepo(organization, repo.name);

    // Apply filters
    let filtered = alerts;
    if (filterSeverity) {
      filtered = filtered.filter(a =>
        filterSeverity.includes((a.security_advisory?.severity || '').toLowerCase())
      );
    }
    if (filterEcosystem) {
      filtered = filtered.filter(a =>
        (a.dependency?.package?.ecosystem || '').toLowerCase() === filterEcosystem.toLowerCase()
      );
    }

    if (filtered.length === 0 && alerts.length === 0) {
      process.stdout.write(`skipped (Dependabot not enabled or no access)\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`${filtered.length} alerts\n`);

    const normalized = filtered.map(a => normalizeAlert(a, repo.name, organization));
    allAlerts.push(...normalized);

    if (filtered.length > 0) {
      const bySeverity = {};
      for (const a of normalized) {
        const sev = a.advisory.severity;
        bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      }
      repoSummary.push({ repository: repo.name, totalAlerts: filtered.length, bySeverity });
    }
  }

  // Build output
  const output = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      organization,
      stateFilter: filterState,
      severityFilter: filterSeverity,
      ecosystemFilter: filterEcosystem,
      totalRepositoriesScanned: repos.length,
      repositoriesSkipped: skipped,
      totalAlerts: allAlerts.length,
    },
    summary: {
      bySeverity: allAlerts.reduce((acc, a) => {
        const sev = a.advisory.severity;
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {}),
      byEcosystem: allAlerts.reduce((acc, a) => {
        const eco = a.dependency.ecosystem;
        acc[eco] = (acc[eco] || 0) + 1;
        return acc;
      }, {}),
      byRepository: repoSummary
    },
    alerts: allAlerts
  };

  writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log('\n✅ Export complete!');
  console.log(`   Output: ${outputFile}`);
  console.log(`   Total alerts: ${allAlerts.length}`);
  console.log('   By severity:');
  for (const [sev, count] of Object.entries(output.summary.bySeverity).sort()) {
    console.log(`     ${sev.toUpperCase()}: ${count}`);
  }
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});

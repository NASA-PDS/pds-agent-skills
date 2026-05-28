#!/usr/bin/env node

/**
 * SonarCloud Security Issues Fetcher
 *
 * Fetches all security vulnerabilities and hotspots from SonarCloud
 * for a given organization and exports to CSV or JSON.
 *
 * Usage:
 *   node fetch-security-issues.mjs <organization> [output-file] [--format csv|json] [options]
 *
 * Options:
 *   --format <format>      Output format: csv (default) or json
 *   --include-snippets     Fetch code snippets (JSON only, slower)
 *   --include-rules        Fetch full rule details (JSON only, slower)
 *   --no-snippets          Skip code snippets (JSON only, faster)
 *   --severity <levels>    Filter by severity (comma-separated)
 *   --status <statuses>    Filter by status (comma-separated)
 *   --project <key>        Export single project only
 *   --created-after <date> Filter issues created after date (YYYY-MM-DD)
 *
 * Environment: SONARCLOUD_TOKEN (required)
 *
 * Security:
 *   - API token sourced from environment variable (never hardcoded)
 *   - Token validated at startup before any API calls
 *   - Token never logged or exposed in error messages
 *   - Used only in Authorization headers for SonarCloud API
 */

import { writeFileSync } from 'fs';

const SONARCLOUD_BASE_URL = 'https://sonarcloud.io/api';
const SONARCLOUD_TOKEN = process.env.SONARCLOUD_TOKEN;

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Organization key is required');
  console.error('Usage: node fetch-security-issues.mjs <organization> [output-file] [--format csv|json] [options]');
  process.exit(1);
}

// Parse flags
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
const format = (flags.format || 'csv').toLowerCase();
const defaultExt = format === 'json' ? '.json' : '.csv';
const outputFile = positional[1] || `sonarcloud-security-issues-${Date.now()}${defaultExt}`;
const includeSnippets = format === 'json' && flags['include-snippets'] && !flags['no-snippets'];
const includeRules = format === 'json' && flags['include-rules'];
const filterSeverity = flags.severity ? flags.severity.split(',') : null;
const filterStatus = flags.status ? flags.status.split(',') : null;
const filterProject = flags.project || null;
const filterCreatedAfter = flags['created-after'] || null;

// Validate format
if (format !== 'csv' && format !== 'json') {
  console.error('❌ Error: Format must be "csv" or "json"');
  process.exit(1);
}

// Validate token
if (!SONARCLOUD_TOKEN) {
  console.error('❌ Error: SONARCLOUD_TOKEN environment variable is not set');
  console.error('Generate a token at: https://sonarcloud.io/account/security');
  console.error('Then set it: export SONARCLOUD_TOKEN=your_token_here');
  process.exit(1);
}

/**
 * Make authenticated request to SonarCloud API with retry logic
 */
async function fetchSonarCloud(endpoint, params = {}) {
  const url = new URL(`${SONARCLOUD_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // SonarCloud uses Basic authentication with token as username and empty password
      const authString = Buffer.from(`${SONARCLOUD_TOKEN}:`).toString('base64');
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json'
        }
      });

      // Handle rate limiting
      if (response.status === 429) {
        console.warn('⚠️  Rate limit hit, waiting 60 seconds...');
        await sleep(60000);
        attempt++;
        continue;
      }

      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ Authentication failed. Check your SONARCLOUD_TOKEN.');
        process.exit(1);
      }

      // Handle other errors
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      console.warn(`⚠️  Request failed (attempt ${attempt}/${maxRetries}), retrying...`);
      await sleep(2000 * attempt); // Exponential backoff
    }
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all projects in the organization with pagination
 */
async function fetchAllProjects(organization) {
  console.log(`📋 Fetching projects for organization: ${organization}`);

  const projects = [];
  let page = 1;
  const pageSize = 500; // Max allowed by API
  let hasMore = true;

  while (hasMore) {
    const data = await fetchSonarCloud('/projects/search', {
      organization,
      p: page,
      ps: pageSize
    });

    projects.push(...data.components);
    console.log(`   Found ${data.components.length} projects (page ${page})`);

    hasMore = data.paging.total > page * pageSize;
    page++;
  }

  console.log(`✅ Total projects: ${projects.length}\n`);
  return projects;
}

/**
 * Fetch all vulnerabilities for a project with pagination
 */
async function fetchVulnerabilities(organization, projectKey) {
  const issues = [];
  let page = 1;
  const pageSize = 500;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchSonarCloud('/issues/search', {
      organization,
      componentKeys: projectKey,
      types: 'VULNERABILITY',
      p: page,
      ps: pageSize
    });

    issues.push(...data.issues);

    hasMore = data.paging.total > page * pageSize;
    page++;
  }

  return issues;
}

/**
 * Fetch all security hotspots for a project with pagination
 */
async function fetchHotspots(organization, projectKey) {
  const hotspots = [];
  let page = 1;
  const pageSize = 500;
  let hasMore = true;

  while (hasMore) {
    try {
      const data = await fetchSonarCloud('/hotspots/search', {
        projectKey,
        p: page,
        ps: pageSize
      });

      hotspots.push(...data.hotspots);

      hasMore = data.paging.total > page * pageSize;
      page++;
    } catch (error) {
      // Some projects may not support hotspots API
      console.warn(`   ⚠️  Could not fetch hotspots: ${error.message}`);
      break;
    }
  }

  return hotspots;
}

/**
 * Convert vulnerability to CSV row
 */
function vulnerabilityToRow(issue, projectKey) {
  return {
    project: projectKey,
    type: 'VULNERABILITY',
    severity: issue.severity || '',
    status: issue.status || '',
    rule: issue.rule || '',
    message: (issue.message || '').replace(/"/g, '""'), // Escape quotes
    component: issue.component || '',
    line: issue.line || '',
    created: issue.creationDate || '',
    url: `https://sonarcloud.io/project/issues?open=${issue.key}&id=${projectKey}`
  };
}

/**
 * Convert security hotspot to CSV row
 */
function hotspotToRow(hotspot, projectKey) {
  return {
    project: projectKey,
    type: 'SECURITY_HOTSPOT',
    severity: '', // Hotspots don't have severity
    status: hotspot.status || '',
    rule: hotspot.rule || '',
    message: (hotspot.message || '').replace(/"/g, '""'), // Escape quotes
    component: hotspot.component || '',
    line: hotspot.line || '',
    created: hotspot.creationDate || '',
    url: `https://sonarcloud.io/project/security_hotspots?id=${projectKey}&hotspots=${hotspot.key}`
  };
}

/**
 * Fetch rule details for a given rule key
 */
async function fetchRuleDetails(ruleKey) {
  try {
    const data = await fetchSonarCloud('/rules/show', { key: ruleKey });
    return {
      key: data.rule.key,
      name: data.rule.name,
      description: data.rule.htmlDesc || data.rule.mdDesc || '',
      category: data.rule.type || '',
      tags: data.rule.tags || [],
      cwe: data.rule.securityStandards?.cwe || [],
      owaspTop10: data.rule.securityStandards?.owaspTop10 || [],
      securityCategory: data.rule.securityCategory || ''
    };
  } catch (error) {
    console.warn(`   ⚠️  Could not fetch rule details for ${ruleKey}: ${error.message}`);
    return {
      key: ruleKey,
      name: ruleKey,
      description: '',
      category: '',
      tags: [],
      cwe: [],
      owaspTop10: [],
      securityCategory: ''
    };
  }
}

/**
 * Fetch code snippet for a given component and line
 */
async function fetchCodeSnippet(componentKey, line) {
  if (!line) return null;

  try {
    const startLine = Math.max(1, line - 2);
    const endLine = line + 2;

    const data = await fetchSonarCloud('/sources/lines', {
      key: componentKey,
      from: startLine,
      to: endLine
    });

    const lines = data.sources || [];
    const snippetLines = lines.map(l => l.code || '');
    const flaggedIndex = lines.findIndex(l => l.line === line);

    return {
      before: snippetLines.slice(0, flaggedIndex),
      flagged: snippetLines[flaggedIndex] || '',
      after: snippetLines.slice(flaggedIndex + 1)
    };
  } catch (error) {
    console.warn(`   ⚠️  Could not fetch code snippet: ${error.message}`);
    return null;
  }
}

/**
 * Convert vulnerability/hotspot to JSON format
 */
async function issueToJSON(issue, projectKey, type, includeSnippets, ruleCache) {
  const jsonIssue = {
    key: issue.key,
    project: projectKey,
    type,
    severity: issue.severity || null,
    status: issue.status || '',
    rule: ruleCache[issue.rule] || { key: issue.rule },
    location: {
      component: issue.component || '',
      line: issue.line || null,
      textRange: issue.textRange || null
    },
    message: issue.message || '',
    created: issue.creationDate || issue.createdAt || '',
    updated: issue.updateDate || issue.updatedAt || '',
    author: issue.author || '',
    effort: issue.effort || '',
    url: type === 'VULNERABILITY'
      ? `https://sonarcloud.io/project/issues?open=${issue.key}&id=${projectKey}`
      : `https://sonarcloud.io/project/security_hotspots?id=${projectKey}&hotspots=${issue.key}`,
    flows: issue.flows || [],
    triage: null
  };

  // Add code snippet if requested
  if (includeSnippets && issue.component && issue.line) {
    const snippet = await fetchCodeSnippet(issue.component, issue.line);
    if (snippet) {
      jsonIssue.location.codeSnippet = snippet;
    }
  }

  return jsonIssue;
}

/**
 * Export issues to CSV
 */
function exportToCSV(rows, filename) {
  const headers = [
    'Project',
    'Type',
    'Severity',
    'Status',
    'Rule',
    'Message',
    'Component',
    'Line',
    'Created',
    'URL'
  ];

  const csvLines = [
    headers.join(','),
    ...rows.map(row => [
      row.project,
      row.type,
      row.severity,
      row.status,
      row.rule,
      `"${row.message}"`,
      row.component,
      row.line,
      row.created,
      row.url
    ].join(','))
  ];

  writeFileSync(filename, csvLines.join('\n'), 'utf-8');
}

/**
 * Export issues to JSON
 */
function exportToJSON(issues, metadata, filename) {
  const output = {
    exportMetadata: metadata,
    issues
  };

  writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 SonarCloud Security Export\n');
  console.log(`Organization: ${organization}`);
  console.log(`Format: ${format.toUpperCase()}`);
  console.log(`Output file: ${outputFile}`);
  if (includeSnippets) console.log(`Options: Include code snippets`);
  if (includeRules) console.log(`Options: Include rule details`);
  if (filterSeverity) console.log(`Filter: Severity = ${filterSeverity.join(', ')}`);
  if (filterStatus) console.log(`Filter: Status = ${filterStatus.join(', ')}`);
  if (filterProject) console.log(`Filter: Project = ${filterProject}`);
  if (filterCreatedAfter) console.log(`Filter: Created after = ${filterCreatedAfter}`);
  console.log();

  try {
    // Fetch all projects (or single project if filtered)
    let projects;
    if (filterProject) {
      console.log(`📋 Fetching single project: ${filterProject}`);
      projects = [{ key: filterProject }];
    } else {
      projects = await fetchAllProjects(organization);
    }

    if (projects.length === 0) {
      console.warn('⚠️  No projects found in organization');
      process.exit(0);
    }

    // Fetch rule details cache if JSON format with rule enrichment
    const ruleCache = {};
    if (format === 'json' && includeRules) {
      console.log('📚 Note: Rule details will be fetched on-demand during export\n');
    }

    // Fetch security issues for each project
    const allRows = [];
    const allIssues = [];
    let totalVulnerabilities = 0;
    let totalHotspots = 0;

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const projectKey = project.key;

      console.log(`[${i + 1}/${projects.length}] Processing: ${projectKey}`);

      // Fetch vulnerabilities
      let vulnerabilities = await fetchVulnerabilities(organization, projectKey);

      // Apply filters
      if (filterSeverity) {
        vulnerabilities = vulnerabilities.filter(v => filterSeverity.includes(v.severity));
      }
      if (filterStatus) {
        vulnerabilities = vulnerabilities.filter(v => filterStatus.includes(v.status));
      }
      if (filterCreatedAfter) {
        vulnerabilities = vulnerabilities.filter(v => v.creationDate >= filterCreatedAfter);
      }

      totalVulnerabilities += vulnerabilities.length;
      console.log(`   📊 Vulnerabilities: ${vulnerabilities.length}`);

      // Fetch security hotspots
      let hotspots = await fetchHotspots(organization, projectKey);

      // Apply filters (hotspots don't have severity)
      if (filterStatus) {
        hotspots = hotspots.filter(h => filterStatus.includes(h.status));
      }
      if (filterCreatedAfter) {
        hotspots = hotspots.filter(h => (h.creationDate || h.createdAt) >= filterCreatedAfter);
      }

      totalHotspots += hotspots.length;
      console.log(`   🔥 Security Hotspots: ${hotspots.length}`);

      // Process based on format
      if (format === 'csv') {
        // CSV: Simple row conversion
        vulnerabilities.forEach(vuln => {
          allRows.push(vulnerabilityToRow(vuln, projectKey));
        });

        hotspots.forEach(hotspot => {
          allRows.push(hotspotToRow(hotspot, projectKey));
        });
      } else {
        // JSON: Rich data with optional enrichment
        for (const vuln of vulnerabilities) {
          // Fetch rule details if not cached and enrichment enabled
          if (includeRules && !ruleCache[vuln.rule]) {
            ruleCache[vuln.rule] = await fetchRuleDetails(vuln.rule);
            await sleep(100); // Rate limiting
          }

          const jsonIssue = await issueToJSON(vuln, projectKey, 'VULNERABILITY', includeSnippets, ruleCache);
          allIssues.push(jsonIssue);

          if (includeSnippets) {
            await sleep(200); // Extra delay for snippet fetching
          }
        }

        for (const hotspot of hotspots) {
          // Fetch rule details if not cached and enrichment enabled
          if (includeRules && !ruleCache[hotspot.rule]) {
            ruleCache[hotspot.rule] = await fetchRuleDetails(hotspot.rule);
            await sleep(100); // Rate limiting
          }

          const jsonIssue = await issueToJSON(hotspot, projectKey, 'SECURITY_HOTSPOT', includeSnippets, ruleCache);
          allIssues.push(jsonIssue);

          if (includeSnippets) {
            await sleep(200); // Extra delay for snippet fetching
          }
        }
      }

      // Small delay to be nice to the API
      await sleep(500);
    }

    // Export
    console.log(`\n📝 Exporting to ${format.toUpperCase()}...`);
    if (format === 'csv') {
      exportToCSV(allRows, outputFile);
    } else {
      const metadata = {
        timestamp: new Date().toISOString(),
        organization,
        totalIssues: allIssues.length,
        totalVulnerabilities,
        totalHotspots,
        totalProjects: projects.length,
        schemaVersion: '1.0.0',
        exportedBy: 'claude-code',
        format: 'json',
        options: {
          includeSnippets,
          includeRules,
          filters: {
            severity: filterSeverity,
            status: filterStatus,
            project: filterProject,
            createdAfter: filterCreatedAfter
          }
        }
      };
      exportToJSON(allIssues, metadata, outputFile);
    }

    // Summary
    const totalIssues = format === 'csv' ? allRows.length : allIssues.length;
    console.log('\n✅ Security export complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Projects scanned: ${projects.length}`);
    console.log(`   Vulnerabilities: ${totalVulnerabilities}`);
    console.log(`   Security Hotspots: ${totalHotspots}`);
    console.log(`   Total issues: ${totalIssues}`);
    console.log(`\n📄 Output file: ${outputFile}`);
    console.log(`   Format: ${format.toUpperCase()}`);

    // Format-specific guidance
    if (totalIssues > 0) {
      console.log('\n💡 Next steps:');
      if (format === 'csv') {
        console.log('   1. Open in spreadsheet tool (Excel, Google Sheets)');
        console.log('   2. Sort by Severity (BLOCKER, CRITICAL first)');
        console.log('   3. Filter by Status (OPEN, CONFIRMED)');
        console.log('   4. Add triage columns: Action, Resolution, Comment, Reviewer');
        console.log('   5. Use sonarcloud-security-updating skill to apply decisions');
      } else {
        console.log('   1. Use sonarcloud-security-triaging skill for AI-assisted triage');
        console.log('   2. Or query with jq: jq \'.issues[] | select(.severity == "CRITICAL")\' output.json');
        console.log('   3. After triage, use sonarcloud-security-updating skill to apply decisions');
      }

      // High priority warning
      const issues = format === 'csv' ? allRows : allIssues;
      const blockerCount = issues.filter(i => i.severity === 'BLOCKER').length;
      const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;

      if (blockerCount > 0 || criticalCount > 0) {
        console.log(`\n⚠️  High priority: ${blockerCount} BLOCKER + ${criticalCount} CRITICAL issues`);
      }
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();

#!/usr/bin/env node

/**
 * Dependabot Fix-PR Checker
 *
 * Enriches a Dependabot alerts export (from fetch-dependabot-alerts.mjs) with the
 * status of the pull request that fixes each alert:
 *   - is there an open PR for the alert?
 *   - is the PR branch up to date with the repository's default branch?
 *   - are the PR's checks passing?
 *
 * Usage:
 *   node check-fix-prs.mjs <alerts.json> [output.json] [options]
 *
 * Options:
 *   --repo <name>        Only check alerts for one repository (name or owner/name)
 *   --exclude <names>    Skip repositories (comma-separated names)
 *
 * Environment:
 *   GITHUB_TOKEN         Required. Needs repo scope (read access to pull requests,
 *                        checks, and Dependabot alerts).
 *
 * Output: a copy of the input where every checked alert has a `fixPullRequest` object.
 *
 * How alerts are matched to PRs:
 *   1. linked   - GitHub's own alert-to-PR link (RepositoryVulnerabilityAlert.dependabotUpdate)
 *   2. probable - no link, but an open Dependabot PR's branch is named for the package
 *                 (the PR's target version is NOT verified against the patched version)
 *   3. none     - no open PR; `updateError` says why Dependabot could not open one, if known
 */

import { readFileSync, writeFileSync } from 'fs';

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_FALLBACK_PR_PAGES = 4;

class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

class InputFileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputFileError';
  }
}

const parseArgs = (argv) => {
  const parsed = { positional: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const flag = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        parsed.flags[flag] = argv[i + 1];
        i++;
      } else {
        parsed.flags[flag] = true;
      }
    } else {
      parsed.positional.push(argv[i]);
    }
  }
  return parsed;
};

const { positional, flags } = parseArgs(process.argv.slice(2));
const inputFile = positional[0];
if (!inputFile) {
  console.error('❌ Error: input alerts JSON file is required');
  console.error('Usage: node check-fix-prs.mjs <alerts.json> [output.json] [--repo <name>] [--exclude <names>]');
  process.exit(1);
}
const outputFile = positional[1] || inputFile.replace(/\.json$/, '') + '-prs.json';
const onlyRepo = typeof flags.repo === 'string' ? flags.repo.split('/').pop().toLowerCase() : null;
const excluded = new Set(
  typeof flags.exclude === 'string' ? flags.exclude.split(',').map(n => n.trim().toLowerCase()) : []
);

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.error('   Set it with: export GITHUB_TOKEN=$(gh auth token)');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'pds-dependabot-fix-pr-checker/1.0'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(url, init = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (err) {
      // fetch throws TypeError on network failure
      if (!(err instanceof TypeError) || attempt === retries) throw err;
      await sleep(Math.pow(2, attempt) * 1000);
      continue;
    }

    const isRateLimited = response.status === 429 ||
      (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');
    if (isRateLimited) {
      const resetTime = response.headers.get('x-ratelimit-reset');
      const waitMs = resetTime
        ? Math.max(0, parseInt(resetTime, 10) * 1000 - Date.now()) + 1000
        : parseInt(response.headers.get('retry-after') || '60', 10) * 1000;
      console.error(`⏳ Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s before retry...`);
      await sleep(waitMs);
      continue;
    }

    if (response.status >= 500 && attempt < retries) {
      await sleep(Math.pow(2, attempt) * 1000);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new GitHubApiError(`HTTP ${response.status}: ${body.slice(0, 300)}`, response.status);
    }
    return response.json();
  }
  throw new GitHubApiError('Retries exhausted', 0);
}

async function graphql(query, variables) {
  const data = await request(`${GITHUB_API}/graphql`, {
    method: 'POST',
    body: JSON.stringify({ query, variables })
  });
  if (data.errors?.length) {
    throw new GitHubApiError(`GraphQL: ${data.errors[0].message}`, 200);
  }
  return data.data;
}

const PR_FIELDS = `
  number url title state isDraft mergeable mergeStateStatus reviewDecision
  baseRefName headRefName headRefOid author { login }
  commits(last: 1) { nodes { commit { statusCheckRollup {
    state
    contexts(first: 100) { totalCount nodes {
      __typename
      ... on CheckRun { name status conclusion }
      ... on StatusContext { context state }
    } }
  } } } }
`;

const ALERT_LINKS_QUERY = `
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef { name }
    vulnerabilityAlerts(first: 50, states: OPEN, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        dependabotUpdate {
          error { errorType title }
          pullRequest { ${PR_FIELDS} }
        }
      }
    }
  }
}`;

const OPEN_PRS_QUERY = `
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: OPEN, first: 50, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes { ${PR_FIELDS} }
    }
  }
}`;

async function fetchAlertLinks(owner, name) {
  const links = new Map();
  let defaultBranch = null;
  let cursor = null;
  do {
    const data = await graphql(ALERT_LINKS_QUERY, { owner, name, cursor });
    const repo = data.repository;
    defaultBranch = repo.defaultBranchRef?.name ?? null;
    for (const node of repo.vulnerabilityAlerts.nodes) {
      links.set(node.number, node.dependabotUpdate);
    }
    const page = repo.vulnerabilityAlerts.pageInfo;
    cursor = page.hasNextPage ? page.endCursor : null;
  } while (cursor);
  return { defaultBranch, links };
}

async function fetchOpenDependabotPrs(owner, name) {
  const prs = [];
  let cursor = null;
  for (let page = 0; page < MAX_FALLBACK_PR_PAGES; page++) {
    const data = await graphql(OPEN_PRS_QUERY, { owner, name, cursor });
    const conn = data.repository.pullRequests;
    prs.push(...conn.nodes.filter(pr => pr.author?.login === 'dependabot'));
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return prs;
}

// 'enabled' | 'paused' | 'disabled' | 'unknown'. "Paused" means Dependabot stopped opening
// security PRs for the repo (GitHub does this after a long run of unmerged PRs).
async function fetchSecurityUpdatesState(owner, name) {
  try {
    const data = await request(`${GITHUB_API}/repos/${owner}/${name}/automated-security-fixes`);
    if (!data.enabled) return 'disabled';
    return data.paused ? 'paused' : 'enabled';
  } catch (err) {
    if (err instanceof GitHubApiError && (err.status === 403 || err.status === 404)) return 'unknown';
    throw err;
  }
}

// Dependabot branches look like dependabot/<ecosystem>/<package>-<version>; scopes lose '@',
// maven coordinates use '-' for ':'. Multi-package branches (".../multi-<hash>") never match.
function normalizePackage(pkg) {
  return pkg.toLowerCase().replace(/^@/, '').replace(/:/g, '-');
}

function findPrByBranchName(prs, pkg) {
  const target = normalizePackage(pkg);
  return prs.find(pr => {
    const rest = pr.headRefName.split('/').slice(2).join('/').toLowerCase().replace(/^@/, '');
    return rest.startsWith(`${target}-`) && /^\d/.test(rest.slice(target.length + 1));
  }) ?? null;
}

function summarizeChecks(pr) {
  const rollup = pr.commits.nodes[0]?.commit?.statusCheckRollup;
  const summary = {
    rollupState: rollup?.state ?? 'NONE',
    total: 0, passed: 0, failed: 0, pending: 0,
    failing: [], pendingChecks: [], truncated: false
  };
  if (!rollup) return summary;

  summary.truncated = rollup.contexts.totalCount > rollup.contexts.nodes.length;
  for (const ctx of rollup.contexts.nodes) {
    const isCheckRun = ctx.__typename === 'CheckRun';
    const name = isCheckRun ? ctx.name : ctx.context;
    let outcome;
    if (isCheckRun) {
      if (ctx.status !== 'COMPLETED') outcome = 'pending';
      else outcome = ['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(ctx.conclusion) ? 'passed' : 'failed';
    } else if (ctx.state === 'SUCCESS') {
      outcome = 'passed';
    } else {
      outcome = ['PENDING', 'EXPECTED'].includes(ctx.state) ? 'pending' : 'failed';
    }
    summary.total++;
    summary[outcome]++;
    if (outcome === 'failed') summary.failing.push(name);
    if (outcome === 'pending') summary.pendingChecks.push(name);
  }
  return summary;
}

async function compareToDefault(owner, name, defaultBranch, headSha) {
  try {
    const data = await request(
      `${GITHUB_API}/repos/${owner}/${name}/compare/${encodeURI(defaultBranch)}...${headSha}`
    );
    return { behindBy: data.behind_by, aheadBy: data.ahead_by, compareStatus: data.status };
  } catch (err) {
    if (err instanceof GitHubApiError && (err.status === 404 || err.status === 422)) {
      return { behindBy: null, aheadBy: null, compareStatus: 'unknown' };
    }
    throw err;
  }
}

function describePr(pr, checks, cmp, baseIsDefault, defaultBranch) {
  const parts = [`PR #${pr.number} "${pr.title}" (${pr.author?.login ?? 'unknown'})`];
  if (pr.state !== 'OPEN') parts.push(pr.state.toLowerCase());
  if (pr.isDraft) parts.push('draft');
  if (checks.total === 0) parts.push('no CI checks');
  else if (checks.failed > 0) parts.push(`CI FAILING ${checks.failed}/${checks.total}: ${checks.failing.join(', ')}`);
  else if (checks.pending > 0) parts.push(`CI pending ${checks.pending}/${checks.total}`);
  else parts.push(`CI passing ${checks.passed}/${checks.total}`);
  if (cmp.behindBy === null) parts.push(`${defaultBranch} comparison unavailable`);
  else if (cmp.behindBy === 0) parts.push(`up to date with ${defaultBranch}`);
  else parts.push(`${cmp.behindBy} commit(s) BEHIND ${defaultBranch}`);
  if (pr.mergeable === 'CONFLICTING') parts.push('merge CONFLICTS');
  if (!baseIsDefault) parts.push(`targets ${pr.baseRefName}, not ${defaultBranch}`);
  if (pr.reviewDecision === 'REVIEW_REQUIRED') parts.push('review required');
  if (pr.reviewDecision === 'CHANGES_REQUESTED') parts.push('changes requested');
  return parts.join('; ');
}

// Blockers in priority order; readiness is the first one, or "ready".
function classify(pr, checks, cmp, baseIsDefault) {
  const blockers = [];
  if (pr.state === 'MERGED') blockers.push('merged');
  if (pr.state === 'CLOSED') blockers.push('closed');
  if (pr.mergeable === 'CONFLICTING') blockers.push('conflicts');
  if (checks.failed > 0) blockers.push('ci-failing');
  if (checks.pending > 0) blockers.push('ci-pending');
  if (cmp.behindBy !== null && cmp.behindBy > 0) blockers.push('behind-default');
  if (checks.total === 0) blockers.push('no-ci');
  if (pr.isDraft) blockers.push('draft');
  if (!baseIsDefault) blockers.push('base-not-default');
  return { blockers, readiness: blockers[0] ?? 'ready' };
}

// "Bump x from 1.0.0 to 1.2.3 [in /dir]" -> "1.2.3". Group/multi-package titles return null.
function parseTargetVersion(title) {
  const match = title.match(/\bfrom\s+\S+\s+to\s+v?(\d[\w.+-]*)/i);
  return match ? match[1] : null;
}

// Qualifiers that name a build flavor or final release, not a pre-release (Guava "-jre", Spring ".RELEASE").
const RELEASE_QUALIFIER = /[.-](jre|android|final|release|ga)$/i;

// Numeric dotted versions only; returns null when either side is not comparable (e.g. pre-releases).
function compareVersions(a, b) {
  const parse = v => v.replace(/^v/i, '').replace(RELEASE_QUALIFIER, '').split('.')
    .map(s => (/^\d+$/.test(s) ? parseInt(s, 10) : NaN));
  const pa = parse(a);
  const pb = parse(b);
  if (pa.some(Number.isNaN) || pb.some(Number.isNaN)) return null;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Combines the shared PR detail with what is specific to one alert: whether the PR's target
// version actually reaches this alert's first patched version.
function forAlert(alert, detail, status, matchedBy, updateError) {
  const targetVersion = parseTargetVersion(detail.title);
  const patched = alert.vulnerability.firstPatchedVersion;
  const versionDiff = targetVersion && patched ? compareVersions(targetVersion, patched) : null;
  const coversPatchedVersion = versionDiff === null ? null : versionDiff >= 0;

  const blockers = coversPatchedVersion === false ? ['insufficient-version', ...detail.blockers] : detail.blockers;
  let summary = detail.summary;
  if (coversPatchedVersion === false) {
    const otherMajor = targetVersion.split('.')[0] !== patched.split('.')[0] ? ' (different major version line)' : '';
    summary += `; WARNING: targets ${targetVersion} but patched version is ${patched}${otherMajor}, so it does NOT fix this alert`;
  } else if (status === 'probable' && coversPatchedVersion === null) {
    summary += `; verify its target version reaches ${patched ?? 'the patched version'}`;
  }
  if (status === 'probable') summary = `PROBABLE match: ${summary}`;

  return {
    status, matchedBy, updateError, ...detail,
    targetVersion, coversPatchedVersion, blockers, readiness: blockers[0] ?? 'ready', summary
  };
}

const prDetailCache = new Map();

async function buildPrDetail(owner, name, defaultBranch, pr) {
  const key = `${owner}/${name}#${pr.number}`;
  if (prDetailCache.has(key)) return prDetailCache.get(key);

  const checks = summarizeChecks(pr);
  const cmp = await compareToDefault(owner, name, defaultBranch, pr.headRefOid);
  const baseIsDefault = pr.baseRefName === defaultBranch;
  const { blockers, readiness } = classify(pr, checks, cmp, baseIsDefault);
  const detail = {
    number: pr.number,
    url: pr.url,
    title: pr.title,
    author: pr.author?.login ?? null,
    state: pr.state,
    isDraft: pr.isDraft,
    baseRef: pr.baseRefName,
    defaultBranch,
    baseIsDefault,
    headSha: pr.headRefOid,
    aheadBy: cmp.aheadBy,
    behindBy: cmp.behindBy,
    upToDate: cmp.behindBy === null ? null : cmp.behindBy === 0,
    mergeable: pr.mergeable,
    mergeStateStatus: pr.mergeStateStatus,
    reviewDecision: pr.reviewDecision,
    checks,
    readiness,
    blockers,
    summary: describePr(pr, checks, cmp, baseIsDefault, defaultBranch)
  };
  prDetailCache.set(key, detail);
  return detail;
}

function noPr(updateError, securityUpdates) {
  let reason = '';
  if (updateError) reason = ` (${updateError.title})`;
  else if (securityUpdates === 'disabled') reason = ' (Dependabot security updates are DISABLED for this repo)';
  else if (securityUpdates === 'paused') reason = ' (Dependabot security updates are PAUSED for this repo)';
  return {
    status: 'none',
    matchedBy: null,
    readiness: 'no-pr',
    updateError: updateError ?? null,
    summary: `No open fix PR${reason}`
  };
}

async function checkRepo(owner, name, alerts) {
  const { defaultBranch, links } = await fetchAlertLinks(owner, name);
  const securityUpdates = await fetchSecurityUpdatesState(owner, name);
  let fallbackPrs = null;

  for (const alert of alerts) {
    const link = links.get(alert.alertNumber);
    if (link === undefined) {
      alert.fixPullRequest = {
        status: 'unknown',
        matchedBy: null,
        readiness: 'unknown',
        summary: 'Alert is no longer open (state changed since the export)'
      };
      continue;
    }

    if (link?.pullRequest) {
      const detail = await buildPrDetail(owner, name, defaultBranch, link.pullRequest);
      alert.fixPullRequest = forAlert(alert, detail, 'linked', 'dependabotUpdate', null);
      continue;
    }

    fallbackPrs ??= await fetchOpenDependabotPrs(owner, name);
    const candidate = findPrByBranchName(fallbackPrs, alert.dependency.package);
    if (candidate) {
      const detail = await buildPrDetail(owner, name, defaultBranch, candidate);
      alert.fixPullRequest = forAlert(alert, detail, 'probable', 'branch-name', link?.error ?? null);
    } else {
      alert.fixPullRequest = noPr(link?.error, securityUpdates);
    }
  }
  return { defaultBranch, securityUpdates };
}

async function main() {
  console.log('\n🔍 Dependabot Fix-PR Checker');
  console.log(`   Input: ${inputFile}`);

  let data;
  try {
    data = JSON.parse(readFileSync(inputFile, 'utf8'));
  } catch (err) {
    if (err instanceof SyntaxError || err.code === 'ENOENT') {
      throw new InputFileError(`Cannot read ${inputFile}: ${err.message}`);
    }
    throw err;
  }
  if (!Array.isArray(data.alerts)) {
    throw new InputFileError(`${inputFile} has no "alerts" array - is it a fetch-dependabot-alerts export?`);
  }

  const byRepo = new Map();
  for (const alert of data.alerts) {
    const repoName = alert.repository.split('/').pop().toLowerCase();
    if (excluded.has(repoName) || (onlyRepo && repoName !== onlyRepo)) {
      alert.fixPullRequest = null;
      continue;
    }
    if (!byRepo.has(alert.repository)) byRepo.set(alert.repository, []);
    byRepo.get(alert.repository).push(alert);
  }

  const repositories = {};
  for (const [repository, alerts] of byRepo) {
    const [owner, name] = repository.split('/');
    process.stdout.write(`  Checking ${repository} (${alerts.length} alerts)... `);
    try {
      const { defaultBranch, securityUpdates } = await checkRepo(owner, name, alerts);
      repositories[repository] = { defaultBranch, securityUpdates, alerts: alerts.length };
      console.log(`default branch ${defaultBranch}, security updates ${securityUpdates}`);
    } catch (err) {
      if (!(err instanceof GitHubApiError)) throw err;
      console.log(`failed: ${err.message}`);
      for (const alert of alerts) {
        alert.fixPullRequest = {
          status: 'unknown',
          matchedBy: null,
          readiness: 'unknown',
          summary: `PR lookup failed: ${err.message}`
        };
      }
    }
    await sleep(200);
  }

  const checked = data.alerts.filter(a => a.fixPullRequest);
  const countBy = (field) => checked.reduce((acc, a) => {
    acc[a.fixPullRequest[field]] = (acc[a.fixPullRequest[field]] || 0) + 1;
    return acc;
  }, {});
  data.fixPrCheck = {
    checkedAt: new Date().toISOString(),
    alertsChecked: checked.length,
    distinctPullRequests: prDetailCache.size,
    repositories,
    byStatus: countBy('status'),
    byReadiness: countBy('readiness')
  };

  writeFileSync(outputFile, JSON.stringify(data, null, 2));

  console.log('\n✅ Fix-PR check complete!');
  console.log(`   Output: ${outputFile}`);
  console.log(`   Alerts checked: ${checked.length} (${prDetailCache.size} distinct PRs)`);
  console.log('   By match status:');
  for (const [status, count] of Object.entries(data.fixPrCheck.byStatus)) console.log(`     ${status}: ${count}`);
  console.log('   By readiness:');
  for (const [readiness, count] of Object.entries(data.fixPrCheck.byReadiness)) console.log(`     ${readiness}: ${count}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

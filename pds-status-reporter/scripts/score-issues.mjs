#!/usr/bin/env node
/**
 * Score and Filter Issues for PDS Status Reports
 *
 * Philosophy: "All completed work matters"
 * - Base score of 2 for all issues (not 0)
 * - Priority/severity labels are optional bonuses (not required)
 * - Minimal exclusions (only truly invalid work)
 * - Respects ignore: true flag in pds-products.yaml
 * - Special handling for operations tasks
 *
 * Usage: node score-issues.mjs <issues-json-file>
 * Example: node score-issues.mjs /tmp/pds-closed-issues.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const [issuesFile] = process.argv.slice(2);
if (!issuesFile) {
  console.error('Usage: node score-issues.mjs <issues-json-file>');
  console.error('Example: node score-issues.mjs /tmp/pds-closed-issues.json');
  process.exit(1);
}

// Load issues
const issues = JSON.parse(readFileSync(issuesFile, 'utf8'));

// Load products mapping to get work streams AND ignored products
const productsPath = join(__dirname, '../resources/pds-products.yaml');
const productsYaml = readFileSync(productsPath, 'utf8');

// Parse products for work stream mapping, ignore flags, and core backbone
const repoToWorkStream = {};
const repoToProduct = {};
const ignoredRepos = new Set();
const forkedRepos = new Set();
const coreBackboneRepos = new Set();

let currentProduct = null;
let currentWorkStream = null;
let currentIgnore = false;
let currentCoreBackbone = false;
let inForkedRepos = false;

for (const line of productsYaml.split('\n')) {
  // Check for forked_repositories section
  if (line.match(/^forked_repositories:/)) {
    inForkedRepos = true;
    continue;
  }

  // Parse forked repos
  if (inForkedRepos && line.match(/^\s+-\s+(.+)$/)) {
    const repo = line.match(/^\s+-\s+(.+)$/)[1].trim();
    forkedRepos.add(repo);
    ignoredRepos.add(repo);
    continue;
  }

  // Product definition
  if (line.match(/^  ([a-z0-9_-]+):/)) {
    currentProduct = line.match(/^  ([a-z0-9_-]+):/)[1];
    currentWorkStream = null;
    currentIgnore = false;
    currentCoreBackbone = false;
    inForkedRepos = false;
  }

  // Check for ignore flag
  if (currentProduct && line.match(/^\s+ignore:\s*true/)) {
    currentIgnore = true;
  }

  // Check for core_backbone flag
  if (currentProduct && line.match(/^\s+core_backbone:\s*true/)) {
    currentCoreBackbone = true;
  }

  // Check for work_stream
  if (currentProduct && line.match(/^\s+work_stream:\s*"?([^"]+)"?/)) {
    currentWorkStream = line.match(/^\s+work_stream:\s*"?([^"]+)"?/)[1];
  }

  // Parse repository names
  if (currentProduct && line.match(/^\s+-\s+(.+)$/)) {
    const repo = line.match(/^\s+-\s+(.+)$/)[1].trim();

    if (currentIgnore) {
      // Add to ignored repos
      ignoredRepos.add(repo);
    } else if (currentWorkStream) {
      // Map to work stream and product
      repoToWorkStream[repo] = currentWorkStream;
      repoToProduct[repo] = currentProduct;

      // Add to core backbone if this product is core backbone
      if (currentCoreBackbone) {
        coreBackboneRepos.add(repo);
      }
    }
  }
}

console.log(`Found ${ignoredRepos.size} repositories to ignore (including ${forkedRepos.size} forked repos)`);
console.log(`Found ${coreBackboneRepos.size} core backbone repositories`);

// Note: core_backbone data is now integrated in pds-products.yaml
// The separate core_backbone.yaml file is deprecated

// Label scoring rules - v2.1 philosophy: "All work matters, Release Themes drive organization"
const labelScores = {
  // Type modifiers - reasonable base scores
  'bug': 3,
  'enhancement': 2,
  'requirement': 2,
  'theme': 3,  // v2.1: Increased from 1 to 3 - Release Themes are planned priorities
  'task': 1,
  'security': 6,
  'backwards-incompatible': 8,

  // Priority - optional bonuses only (reduced from v1.0)
  'p.must-have': 3,
  'p.should-have': 2,
  'p.could-have': 1,
  'p.wont-have': -2,

  // Severity - optional bonuses (reduced from v1.0)
  's.critical': 4,
  's.high': 2,
  's.medium': 1,
  's.low': 0
};

// Minimal exclusions - only truly invalid work
const excludeLabels = new Set([
  'duplicate',
  'invalid',
  'wontfix',
  'icebox',
  'needs.triage',
  'needs.more-info'
]);

// Score each issue
let excludedCount = {
  ignoredRepo: 0,
  excludeLabel: 0,
  dependencyUpdate: 0
};

const scoredIssues = issues.map(issue => {
  const repo = issue.repository.nameWithOwner.split('/')[1];

  // Check if repo should be ignored
  if (ignoredRepos.has(repo)) {
    excludedCount.ignoredRepo++;
    return null;
  }

  const labels = issue.labels.map(l => l.name || l);

  // Check if issue should be excluded (MUCH narrower criteria)
  const hasExcludeLabel = labels.some(l => excludeLabels.has(l));
  if (hasExcludeLabel) {
    excludedCount.excludeLabel++;
    return null;
  }

  // Check if it's a dependency update (skip unless backwards-incompatible)
  const isDependencyUpdate = labels.includes('dependencies') ||
    issue.title.toLowerCase().includes('bump ') ||
    issue.title.toLowerCase().includes('update dependencies');
  if (isDependencyUpdate && !labels.includes('backwards-incompatible')) {
    excludedCount.dependencyUpdate++;
    return null;
  }

  // BASE SCORE: All issues start with 2 points (v2.0 change)
  let score = 2;

  // Calculate score from labels
  for (const label of labels) {
    if (labelScores[label]) {
      score += labelScores[label];
    }
  }

  // Core backbone bonus
  if (coreBackboneRepos.has(repo)) {
    score += 2;
  }

  // Get work stream
  const workStream = repoToWorkStream[repo] || 'unknown';

  // Planetary Data Cloud bonus - important infrastructure work (v2.0)
  if (workStream === 'planetary-data-cloud') {
    score += 2;
  }

  // Get product
  const product = repoToProduct[repo] || repo;

  // Check if this is an operations task
  const isOperationsTask = product === 'operations';

  // Check for nssdca-delivery and data-release tasks
  const isNssdcaDelivery = issue.title.includes('[nssdca-delivery]') || labels.includes('nssdca-delivery');
  const isDataRelease = labels.includes('data-release');

  // Check if this is a Release Theme (Epic)
  const isTheme = labels.includes('theme');

  return {
    ...issue,
    score,
    workStream,
    product,
    repo,
    labels,
    isBreaking: labels.includes('backwards-incompatible'),
    isSecurity: labels.includes('security'),
    isCoreBackbone: coreBackboneRepos.has(repo),
    isOperationsTask,
    isNssdcaDelivery,
    isDataRelease,
    isTheme
  };
}).filter(Boolean); // Remove nulls

// Build theme map and link issues to themes
const themeIssues = scoredIssues.filter(i => i.isTheme);
const themeMap = new Map();

// Index themes by their issue number for quick lookup
for (const theme of themeIssues) {
  const key = `${theme.repository.nameWithOwner}#${theme.number}`;
  themeMap.set(key, theme);
  themeMap.set(`#${theme.number}`, theme); // Also allow shorthand #123
}

console.log(`\n=== RELEASE THEMES ===`);
console.log(`Found ${themeIssues.length} Release Themes (label:theme)`);

// Link issues to themes by detecting references in title/body
// This includes both direct references AND parent-child relationships
for (const issue of scoredIssues) {
  if (issue.isTheme) continue; // Skip themes themselves

  // Look for theme references in body (if available)
  const body = issue.body || '';
  const title = issue.title || '';
  const textToSearch = `${title} ${body}`;

  // Enhanced patterns to detect:
  // 1. Direct references: "Addresses #123", "Closes #123"
  // 2. Parent-child relationships: "Parent: #123", "Subtask of #123", "Child of #123"
  // 3. Task associations: "Part of #123", "For #123"
  const referencePatterns = [
    // Parent-child relationship patterns (check these FIRST - most explicit)
    /(?:parent|parent issue|parent theme|epic):\s*#(\d+)/gi,
    /(?:parent|parent issue|parent theme|epic):\s*([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)#(\d+)/gi,
    /(?:subtask of|sub-task of|child of|task for|task of)\s+#(\d+)/gi,
    /(?:subtask of|sub-task of|child of|task for|task of)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)#(\d+)/gi,

    // Task list patterns (GitHub automatically creates these)
    /(?:tasklist|task list):\s*#(\d+)/gi,

    // Direct reference patterns
    /(?:addresses|closes|fixes|resolves|part of|related to|implements|for)\s+#(\d+)/gi,
    /(?:addresses|closes|fixes|resolves|part of|related to|implements|for)\s+([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)#(\d+)/gi
  ];

  let linkedTheme = null;

  for (const pattern of referencePatterns) {
    const matches = textToSearch.matchAll(pattern);
    for (const match of matches) {
      const issueRef = match[2] ? `${match[1]}#${match[2]}` : `#${match[1]}`;
      if (themeMap.has(issueRef)) {
        linkedTheme = themeMap.get(issueRef);
        break;
      }
      // Also try full repo reference
      if (match[2]) {
        const fullRef = `${match[1]}#${match[2]}`;
        if (themeMap.has(fullRef)) {
          linkedTheme = themeMap.get(fullRef);
          break;
        }
      }
    }
    if (linkedTheme) break;
  }

  issue.linkedTheme = linkedTheme ? {
    number: linkedTheme.number,
    title: linkedTheme.title,
    repo: linkedTheme.repository.nameWithOwner,
    url: linkedTheme.url
  } : null;
}

// Sort by score (highest first)
scoredIssues.sort((a, b) => b.score - a.score);

console.log(`\n=== FILTERING SUMMARY ===`);
console.log(`Total issues in date range: ${issues.length}`);
console.log(`Excluded - Ignored repositories: ${excludedCount.ignoredRepo}`);
console.log(`Excluded - Invalid/duplicate/wontfix: ${excludedCount.excludeLabel}`);
console.log(`Excluded - Dependency updates: ${excludedCount.dependencyUpdate}`);
console.log(`Included in report: ${scoredIssues.length}`);

console.log(`\n=== WORK STREAM BREAKDOWN ===`);
const byWorkStream = {};
for (const issue of scoredIssues) {
  byWorkStream[issue.workStream] = (byWorkStream[issue.workStream] || 0) + 1;
}
for (const [ws, count] of Object.entries(byWorkStream).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${ws}: ${count} issues`);
}

// Save scored issues
const outputPath = '/tmp/pds-scored-issues.json';
writeFileSync(outputPath, JSON.stringify(scoredIssues, null, 2));
console.log(`\nScored issues saved to ${outputPath}`);

// Calculate theme linkage stats
const issuesLinkedToThemes = scoredIssues.filter(i => i.linkedTheme && !i.isTheme).length;
const issuesNotLinkedToThemes = scoredIssues.filter(i => !i.linkedTheme && !i.isTheme && !i.isOperationsTask).length;

console.log(`Issues linked to Release Themes: ${issuesLinkedToThemes}`);
console.log(`Issues not linked to themes: ${issuesNotLinkedToThemes}`);
console.log(`Operations tasks (shown as metrics): ${scoredIssues.filter(i => i.isOperationsTask).length}`);

// Calculate detailed stats
const stats = {
  totalIssues: scoredIssues.length,
  byWorkStream,
  breakingChanges: scoredIssues.filter(i => i.isBreaking).length,
  securityIssues: scoredIssues.filter(i => i.isSecurity).length,
  coreBackboneIssues: scoredIssues.filter(i => i.isCoreBackbone).length,
  operationsTasks: scoredIssues.filter(i => i.isOperationsTask).length,
  nssdcaDeliveries: scoredIssues.filter(i => i.isNssdcaDelivery).length,
  dataReleases: scoredIssues.filter(i => i.isDataRelease).length,
  themeIssues: themeIssues.length,
  issuesLinkedToThemes,
  issuesNotLinkedToThemes
};

console.log(`\n=== KEY METRICS ===`);
console.log(`Release Themes: ${stats.themeIssues}`);
console.log(`Issues linked to themes: ${stats.issuesLinkedToThemes}`);
console.log(`Issues not linked to themes: ${stats.issuesNotLinkedToThemes}`);
console.log(`Breaking changes: ${stats.breakingChanges}`);
console.log(`Security issues: ${stats.securityIssues}`);
console.log(`Core backbone issues: ${stats.coreBackboneIssues}`);
console.log(`Operations tasks: ${stats.operationsTasks}`);
console.log(`  - NSSDCA deliveries: ${stats.nssdcaDeliveries}`);
console.log(`  - Data releases: ${stats.dataReleases}`);

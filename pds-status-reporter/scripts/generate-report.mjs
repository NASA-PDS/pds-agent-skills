#!/usr/bin/env node
/**
 * Generate PDS Status Report
 *
 * Takes scored issues and releases to generate a formatted Markdown report
 * with executive summary, work stream highlights, and product deep-dives.
 *
 * Usage: node generate-report.mjs <timeframe> <start-date> <end-date> [output-file]
 * Example: node generate-report.mjs monthly 2025-10-01 2025-11-06 /tmp/report.md
 */

import { readFileSync, writeFileSync } from 'fs';

// Parse arguments
const [timeframe, startDate, endDate, outputFile = '/tmp/pds-status-report.md'] = process.argv.slice(2);

if (!timeframe || !startDate || !endDate) {
  console.error('Usage: node generate-report.mjs <timeframe> <start-date> <end-date> [output-file]');
  console.error('Example: node generate-report.mjs monthly 2025-10-01 2025-11-06 /tmp/report.md');
  process.exit(1);
}

// Validate timeframe
const validTimeframes = ['monthly', 'quarterly', 'annual'];
if (!validTimeframes.includes(timeframe.toLowerCase())) {
  console.error(`Invalid timeframe: ${timeframe}. Must be one of: ${validTimeframes.join(', ')}`);
  process.exit(1);
}

// Load scored issues and releases
const issues = JSON.parse(readFileSync('/tmp/pds-scored-issues.json', 'utf8'));
const releases = JSON.parse(readFileSync('/tmp/pds-releases.json', 'utf8'));

// Report parameters
const timeframeName = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
const perProductLimits = { monthly: 5, quarterly: 7, annual: 10 };
const perProductLimit = perProductLimits[timeframe.toLowerCase()] || 5;
const execSummaryLimit = 6;
const workStreamLimit = 6;

// Separate operations tasks from other issues
const operationsIssues = issues.filter(i => i.isOperationsTask);
const nonOperationsIssues = issues.filter(i => !i.isOperationsTask);

// Calculate operations metrics
const nssdcaCount = operationsIssues.filter(i => i.isNssdcaDelivery).length;
const dataReleaseCount = operationsIssues.filter(i => i.isDataRelease).length;
const otherOpsCount = operationsIssues.length - nssdcaCount - dataReleaseCount;

console.log(`Operations breakdown: ${nssdcaCount} NSSDCA deliveries, ${dataReleaseCount} data releases, ${otherOpsCount} other`);

// Identify Release Themes and group issues by theme
const themeIssues = issues.filter(i => i.isTheme);
const issuesLinkedToThemes = issues.filter(i => i.linkedTheme && !i.isTheme);
const issuesNotLinkedToThemes = issues.filter(i => !i.linkedTheme && !i.isTheme && !i.isOperationsTask);

console.log(`\n=== THEME ORGANIZATION ===`);
console.log(`Release Themes: ${themeIssues.length}`);
console.log(`Issues linked to themes: ${issuesLinkedToThemes.length}`);
console.log(`Issues not linked to themes: ${issuesNotLinkedToThemes.length}`);

// Build theme groups - map each theme to its related issues
const themeGroups = new Map();
for (const theme of themeIssues) {
  const themeKey = `${theme.repository.nameWithOwner}#${theme.number}`;
  const relatedIssues = issuesLinkedToThemes.filter(i =>
    i.linkedTheme && (
      `${i.linkedTheme.repo}#${i.linkedTheme.number}` === themeKey ||
      i.linkedTheme.number === theme.number
    )
  );

  themeGroups.set(theme, relatedIssues);
}

// Group non-operations issues by product
const byProduct = {};
for (const issue of nonOperationsIssues) {
  if (!byProduct[issue.product]) {
    byProduct[issue.product] = [];
  }
  byProduct[issue.product].push(issue);
}

// Group all issues by work stream (for highlights)
const byWorkStream = {
  'core-data-services': [],
  'web-modernization': [],
  'planetary-data-cloud': []
};

for (const issue of issues) {
  if (byWorkStream[issue.workStream]) {
    byWorkStream[issue.workStream].push(issue);
  }
}

// Rewrite issue title to be more user-friendly and outcome-focused
function rewriteIssueTitle(issue) {
  let title = issue.title;
  const labels = issue.labels;

  // Pattern: "As a X, I want Y" -> "Added/Enabled/Fixed Y"
  const asUserPattern = /^As a[n]? (?:.*?), I (?:want|can|need) (?:to )?(.+)$/i;
  if (asUserPattern.test(title)) {
    const match = title.match(asUserPattern);
    let outcome = match[1];

    // Determine verb based on labels
    if (labels.includes('bug')) {
      return `Fixed: ${outcome}`;
    } else if (labels.includes('requirement')) {
      return `Added: ${outcome}`;
    } else if (labels.includes('enhancement')) {
      return `Improved: ${outcome}`;
    } else {
      return `Completed: ${outcome}`;
    }
  }

  // Pattern: "[Component] Description" -> keep as-is but capitalize properly
  const componentPattern = /^\[([^\]]+)\] (.+)$/;
  if (componentPattern.test(title)) {
    return title; // Keep component-prefixed titles as-is
  }

  // Pattern: "Enable X compatibility" -> "Added X support"
  if (/^Enable (.+) compatibility$/i.test(title)) {
    const match = title.match(/^Enable (.+) compatibility$/i);
    return `Added ${match[1]} support`;
  }

  // Pattern: "Upgrade to X" or "Update to X" -> "Upgraded to X"
  if (/^Upgrade to (.+)$/i.test(title)) {
    const match = title.match(/^Upgrade to (.+)$/i);
    return `Upgraded to ${match[1]}`;
  }
  if (/^Update to (.+)$/i.test(title)) {
    const match = title.match(/^Update to (.+)$/i);
    return `Updated to ${match[1]}`;
  }

  // Pattern: "X does not Y" or "X is not Y" -> "Fixed: X now Y"
  const doesNotPattern = /^(.+) does not (.+)$/i;
  const isNotPattern = /^(.+) is not (.+)$/i;
  if (doesNotPattern.test(title)) {
    const match = title.match(doesNotPattern);
    return `Fixed: ${match[1]} now ${match[2]}`;
  }
  if (isNotPattern.test(title)) {
    const match = title.match(isNotPattern);
    return `Fixed: ${match[1]} is now ${match[2]}`;
  }

  // Pattern: Bug fixes - add "Fixed:" prefix if not present
  if (labels.includes('bug') && !title.toLowerCase().startsWith('fix')) {
    return `Fixed: ${title}`;
  }

  // Pattern: Enhancements - add "Improved:" prefix if not present
  if (labels.includes('enhancement') && !title.toLowerCase().startsWith('improve') && !title.toLowerCase().startsWith('add')) {
    return `Improved: ${title}`;
  }

  // Pattern: Requirements - add "Added:" prefix if not present
  if (labels.includes('requirement') && !title.toLowerCase().startsWith('add')) {
    return `Added: ${title}`;
  }

  // Default: capitalize first letter and return
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// Format issue reference
function formatIssue(issue) {
  const labelContext = issue.labels.filter(l =>
    l.startsWith('p.') || l.startsWith('s.') ||
    ['bug', 'enhancement', 'requirement', 'security', 'backwards-incompatible'].includes(l)
  ).join(', ');

  const breakingIcon = issue.isBreaking ? '⚠️ ' : '';
  const securityIcon = issue.isSecurity ? '🔒 ' : '';

  const friendlyTitle = rewriteIssueTitle(issue);

  return `${breakingIcon}${securityIcon}**${friendlyTitle}** ([${issue.repository.nameWithOwner}#${issue.number}](${issue.url}))${labelContext ? ' - ' + labelContext : ''}`;
}

// Generate Executive Summary
const execSummary = [];

// Add note about Release Themes (highest priority - planned work)
if (themeIssues.length > 0) {
  const themesWithWork = [...themeGroups.entries()].filter(([theme, relatedIssues]) => relatedIssues.length > 0);
  if (themesWithWork.length > 0) {
    const totalThemedWork = themesWithWork.reduce((sum, [_, issues]) => sum + issues.length, 0);
    execSummary.push(`**${themeIssues.length} Release Theme(s) tracked** with ${totalThemedWork} related items completed - representing planned stakeholder priorities`);
  } else {
    execSummary.push(`**${themeIssues.length} Release Theme(s) active** (planning phase - no completed work in this period)`);
  }
}

// Add note about releases
if (releases.length === 0) {
  execSummary.push(`**No product releases** published during this reporting period`);
} else {
  const releasesSummary = releases.map(r => `${r.repo.split('/')[1]}@${r.tagName}`).join(', ');
  execSummary.push(`**${releases.length} product release(s)** published: ${releasesSummary}`);
}

// Add operations metrics
if (operationsIssues.length > 0) {
  const opsSummary = [];
  if (nssdcaCount > 0) opsSummary.push(`${nssdcaCount} NSSDCA deliveries`);
  if (dataReleaseCount > 0) opsSummary.push(`${dataReleaseCount} data releases`);
  if (otherOpsCount > 0) opsSummary.push(`${otherOpsCount} other operational tasks`);
  execSummary.push(`**Operations highlights**: ${opsSummary.join(', ')} completed`);
}

// Add breaking changes
const breakingChanges = issues.filter(i => i.isBreaking);
if (breakingChanges.length > 0) {
  execSummary.push(`**⚠️ ${breakingChanges.length} backwards-incompatible changes** requiring coordination: ${breakingChanges.slice(0, 3).map(i => `${i.repo}#${i.number}`).join(', ')}`);
}

// Add security issues
const securityIssues = issues.filter(i => i.isSecurity);
if (securityIssues.length > 0) {
  execSummary.push(`**🔒 ${securityIssues.length} security issue(s)** resolved: ${securityIssues.slice(0, 3).map(i => `${i.repo}#${i.number}`).join(', ')}`);
}

// Add core backbone highlights
const topIssues = nonOperationsIssues.slice(0, 15);
const coreBackboneIssues = topIssues.filter(i => i.isCoreBackbone);
if (coreBackboneIssues.length > 0) {
  execSummary.push(`**Core backbone improvements**: ${coreBackboneIssues.length} critical infrastructure updates across registry, search API, and cloud platform`);
}

// Add work stream summary
const workStreamSummary = Object.entries(byWorkStream)
  .filter(([ws, issues]) => issues.length > 0)
  .map(([ws, issues]) => `${ws.replace(/-/g, ' ')}: ${issues.length} issues`)
  .join(', ');
execSummary.push(`**Activity by work stream**: ${workStreamSummary}`);

// Trim to limit
const finalExecSummary = execSummary.slice(0, execSummaryLimit);

// Generate Work-Stream Highlights (excluding operations AND theme-linked issues)
function generateWorkStreamHighlights(workStream) {
  const wsIssues = byWorkStream[workStream] || [];

  // Filter to only unthemed, non-operations issues
  const unthemedIssues = wsIssues.filter(i => !i.isOperationsTask && !i.linkedTheme && !i.isTheme);

  // For core-data-services, add operations summary, then top unthemed issues
  if (workStream === 'core-data-services' && operationsIssues.length > 0) {
    const highlights = [];

    // Add operations summary as first item
    const opsParts = [];
    if (nssdcaCount > 0) opsParts.push(`${nssdcaCount} NSSDCA data deliveries`);
    if (dataReleaseCount > 0) opsParts.push(`${dataReleaseCount} data releases`);
    if (otherOpsCount > 0) opsParts.push(`${otherOpsCount} operational tasks`);

    highlights.push(`**Operations**: ${opsParts.join(', ')} completed`);

    // Add top unthemed issues
    for (const issue of unthemedIssues.slice(0, workStreamLimit - 1)) {
      highlights.push(formatIssue(issue));
    }

    return highlights;
  }

  // For other work streams, just show top unthemed issues
  const highlights = unthemedIssues
    .slice(0, workStreamLimit)
    .map(formatIssue);
  return highlights;
}

// Generate Product Deep-Dives (non-operations products only)
function generateProductDeepDive(product, issuesList) {
  const productIssues = issuesList.slice(0, perProductLimit);
  if (productIssues.length === 0) return null;

  const bullets = productIssues.map(formatIssue);
  return {
    product,
    bullets
  };
}

const productDeepDives = Object.entries(byProduct)
  .map(([product, issuesList]) => generateProductDeepDive(product, issuesList))
  .filter(Boolean)
  .filter(pd => pd.bullets.length > 0);

// Generate report markdown
let report = `# PDS ${timeframeName} Status — ${startDate} to ${endDate}\n\n`;

// Executive Summary
report += `## Executive Summary\n\n`;
for (const bullet of finalExecSummary) {
  report += `- ${bullet}\n`;
}
report += `\n`;

// Release Themes Section (NEW - Primary organizing principle)
if (themeIssues.length > 0) {
  report += `## Release Themes\n\n`;
  report += `The following Release Themes were active during this period, representing planned stakeholder priorities:\n\n`;

  // Sort themes by score (highest first)
  const sortedThemes = [...themeIssues].sort((a, b) => b.score - a.score);

  for (const theme of sortedThemes) {
    const relatedIssues = themeGroups.get(theme) || [];
    const themeRef = `${theme.repository.nameWithOwner}#${theme.number}`;
    const workStreamName = theme.workStream.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    report += `### ${rewriteIssueTitle(theme)}\n`;
    report += `**Theme:** [${themeRef}](${theme.url}) | **Work Stream:** ${workStreamName}`;

    // Add status indicators
    if (theme.isBreaking) report += ` | ⚠️ Breaking Change`;
    if (theme.isSecurity) report += ` | 🔒 Security`;

    report += `\n\n`;

    if (relatedIssues.length > 0) {
      report += `**Related work completed (${relatedIssues.length} items):**\n\n`;
      // Show top items (up to perProductLimit)
      const topRelated = relatedIssues.slice(0, perProductLimit);
      for (const issue of topRelated) {
        report += `- ${formatIssue(issue)}\n`;
      }
      if (relatedIssues.length > perProductLimit) {
        report += `- _...and ${relatedIssues.length - perProductLimit} more items_\n`;
      }
    } else {
      report += `**Related work completed:** None in this period (theme may be newly opened or planning phase)\n`;
    }

    report += `\n`;
  }
} else {
  report += `## Release Themes\n\n`;
  report += `No Release Themes (label:theme) were active during this reporting period.\n\n`;
}

// Other Significant Work (for items NOT tied to themes)
report += `## Other Significant Work\n\n`;
report += `The following work was completed but not tied to a specific Release Theme:\n\n`;

// Work-Stream Highlights (now for unthemed items only)
report += `### Work-Stream Highlights\n\n`;

report += `### Core Data Services\n\n`;
const cdsHighlights = generateWorkStreamHighlights('core-data-services');
if (cdsHighlights.length > 0) {
  for (const hl of cdsHighlights) {
    report += `- ${hl}\n`;
  }
} else {
  report += `- No significant activity\n`;
}
report += `\n`;

report += `### Web Modernization\n\n`;
const webHighlights = generateWorkStreamHighlights('web-modernization');
if (webHighlights.length > 0) {
  for (const hl of webHighlights) {
    report += `- ${hl}\n`;
  }
} else {
  report += `- No significant activity\n`;
}
report += `\n`;

report += `### Planetary Data Cloud\n\n`;
const pdcHighlights = generateWorkStreamHighlights('planetary-data-cloud');
if (pdcHighlights.length > 0) {
  for (const hl of pdcHighlights) {
    report += `- ${hl}\n`;
  }
} else {
  report += `- No significant activity\n`;
}
report += `\n`;

// Releases
report += `## Releases\n\n`;
if (releases.length === 0) {
  report += `No product releases were published during this reporting period.\n\n`;
} else {
  for (const release of releases) {
    report += `### ${release.repo} ${release.tagName}\n`;
    report += `**Released:** ${release.publishedAt.split('T')[0]} | **Repo:** ${release.repo}\n\n`;
    report += `- **[Release Notes](${release.url})**\n\n`;
  }
}

// Product Deep-Dives
report += `## Product Deep-Dives\n\n`;

// Add operations section if there are operations tasks
if (operationsIssues.length > 0) {
  report += `### operations\n\n`;
  report += `**Operational deliveries and data releases completed:**\n\n`;

  if (nssdcaCount > 0) {
    report += `- **${nssdcaCount} NSSDCA data deliveries** to the NASA Space Science Data Coordinated Archive\n`;
  }
  if (dataReleaseCount > 0) {
    report += `- **${dataReleaseCount} data releases** published to the PDS archive\n`;
  }
  if (otherOpsCount > 0) {
    report += `- **${otherOpsCount} other operational tasks** completed\n`;
  }

  report += `\nSee [NASA-PDS/operations](https://github.com/NASA-PDS/operations) for detailed tracking.\n\n`;
}

// Add other product deep dives
for (const { product, bullets } of productDeepDives) {
  report += `### ${product}\n\n`;
  for (const bullet of bullets) {
    report += `- ${bullet}\n`;
  }
  report += `\n`;
}

// Impacts & Risks
report += `## Impacts & Risks\n\n`;
if (breakingChanges.length > 0) {
  report += `- **⚠️ Breaking changes**: ${breakingChanges.length} backwards-incompatible changes requiring coordination across systems\n`;
}
if (securityIssues.length > 0) {
  report += `- **🔒 Security**: ${securityIssues.length} security issue(s) resolved\n`;
}
if (releases.length === 0) {
  report += `- **No releases**: No product releases published during this period - development focused on issue resolution and operations\n`;
}
report += `\n`;

// Key Metrics
report += `## Key Metrics\n\n`;
report += `- **Total issues closed:** ${issues.length}\n`;
report += `- **Release Themes tracked:** ${themeIssues.length}\n`;
report += `- **Issues tied to Release Themes:** ${issuesLinkedToThemes.length}\n`;
report += `- **Issues not tied to themes:** ${issuesNotLinkedToThemes.length}\n`;
report += `- **Releases:** ${releases.length} products released\n`;
report += `- **Closed issues by work stream:**\n`;
for (const [ws, wsIssues] of Object.entries(byWorkStream)) {
  if (wsIssues.length > 0) {
    report += `  - ${ws}: ${wsIssues.length}\n`;
  }
}
if (operationsIssues.length > 0) {
  report += `- **Operations deliverables:**\n`;
  if (nssdcaCount > 0) report += `  - NSSDCA deliveries: ${nssdcaCount}\n`;
  if (dataReleaseCount > 0) report += `  - Data releases: ${dataReleaseCount}\n`;
  if (otherOpsCount > 0) report += `  - Other operational tasks: ${otherOpsCount}\n`;
}
report += `- **High-severity items:** ${issues.filter(i => i.labels.includes('s.high') || i.labels.includes('s.critical')).length}\n`;
report += `- **Breaking changes:** ${breakingChanges.length}\n`;
report += `- **Security issues resolved:** ${securityIssues.length}\n`;
report += `- **Core backbone issues resolved:** ${issues.filter(i => i.isCoreBackbone).length}\n`;

// Save report
writeFileSync(outputFile, report);
console.log('\n=== REPORT GENERATED ===');
console.log(`Saved to ${outputFile}`);
console.log(`\nIncluded ${issues.length} total issues:`);
console.log(`  - ${operationsIssues.length} operations tasks (shown as metrics)`);
console.log(`  - ${nonOperationsIssues.length} development/enhancement tasks (shown in detail)`);
console.log(`  - ${releases.length} product releases`);

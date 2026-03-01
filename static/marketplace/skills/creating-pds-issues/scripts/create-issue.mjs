#!/usr/bin/env node
/**
 * create-issue.mjs
 *
 * Helper script for creating GitHub issues in NASA-PDS repositories.
 * Formats issue body according to template structure and creates via gh CLI.
 * Optionally attaches the new issue as a sub-issue of a parent issue.
 *
 * Usage:
 *   node scripts/create-issue.mjs <type> <repo> <title> <data.json> [--parent <repo>#<number>]
 *
 * Arguments:
 *   type       Template type: bug, feature, task, vulnerability, theme
 *   repo       Repository name (without NASA-PDS/ prefix)
 *   title      Issue title
 *   data.json  JSON file with template field data
 *
 * Options:
 *   --parent <repo>#<number>  Attach as sub-issue of the specified parent
 *                             Example: --parent pds-swg#123
 *                             Example: --parent #45 (same repo as child)
 *
 * Examples:
 *   # Create standalone issue
 *   node scripts/create-issue.mjs bug pds-registry "Validator fails on nested tables" bug-data.json
 *
 *   # Create issue and attach as sub-issue of parent in same repo
 *   node scripts/create-issue.mjs task pds-registry "Implement API endpoint" task-data.json --parent #123
 *
 *   # Create issue and attach as sub-issue of parent in different repo
 *   node scripts/create-issue.mjs task pds-registry "Implement API endpoint" task-data.json --parent pds-swg#45
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const TEMPLATE_CONFIGS = {
  bug: {
    labels: 'bug,needs:triage',
    assignee: 'jordanpadams',
    formatBody: formatBugBody
  },
  feature: {
    labels: 'needs:triage,requirement',
    assignee: 'jordanpadams',
    formatBody: formatFeatureBody
  },
  task: {
    labels: 'task,i&t.skip',
    assignee: null,
    formatBody: formatTaskBody
  },
  vulnerability: {
    labels: 'security,bug,needs:triage',
    assignee: 'jordanpadams',
    formatBody: formatVulnerabilityBody
  },
  theme: {
    labels: 'theme,Epic,i&t.skip',
    assignee: null,
    formatBody: formatThemeBody
  }
};

/**
 * Format bug report body
 */
function formatBugBody(data) {
  return `## Checked for duplicates
${data.checkedDuplicates || "Yes - I've already checked"}

## 🐛 Describe the bug
${data.description}

## 🕵️ Expected behavior
${data.expectedBehavior}

## 📜 To Reproduce
${formatList(data.reproductionSteps)}

## 🖥 Environment Info
${formatList(data.environment)}

## 📚 Version of Software Used
${data.version || 'N/A'}

## 🩺 Test Data / Additional context
${data.testData || 'N/A'}

## 🦄 Related requirements
${data.relatedRequirements || 'N/A'}

---
## For Internal Dev Team To Complete

## ⚙️ Engineering Details
_To be filled by engineering team_

## 🎉 Integration & Test
_To be filled by engineering team_`;
}

/**
 * Format feature request body
 */
function formatFeatureBody(data) {
  return `## Checked for duplicates
${data.checkedDuplicates || "Yes - I've already checked"}

## 🧑‍🔬 User Persona(s)
${data.personas || 'N/A'}

## 💪 Motivation
...so that I can ${data.motivation}

## 📖 Additional Details
${data.additionalDetails || 'N/A'}

---
## For Internal Dev Team To Complete

## Acceptance Criteria
**Given** <!-- a condition -->
**When I perform** <!-- an action -->
**Then I expect** <!-- the result -->

## ⚙️ Engineering Details
_To be filled by engineering team_

## 🎉 I&T
_To be filled by engineering team_`;
}

/**
 * Format task body
 */
function formatTaskBody(data) {
  return `## Are you sure this is not a new requirement or bug?
${data.notRequirementOrBug || 'Yes'}

## Task Type
${data.taskType || 'Sub-task'}

## 💡 Description
${data.description}`;
}

/**
 * Format vulnerability body
 */
function formatVulnerabilityBody(data) {
  return `## Checked for duplicates
${data.checkedDuplicates || "Yes - I've already checked"}

## 🐛 Describe the vulnerability
${data.description}

## 🕵️ Expected behavior
${data.expectedBehavior}

## 📜 To Reproduce
${formatList(data.reproductionSteps)}

## 🖥 Environment Info
${formatList(data.environment)}

## 📚 Version of Software Used
${data.version || 'N/A'}

## 🩺 Test Data / Additional context
${data.testData || 'N/A'}

## 🦄 Related requirements
${data.relatedRequirements || 'N/A'}

---
## For Internal Dev Team To Complete

## ⚙️ Engineering Details
_To be filled by engineering team_`;
}

/**
 * Format release theme body
 */
function formatThemeBody(data) {
  return `## Are you sure this is not a new requirement or bug?
${data.notRequirementOrBug || 'Yes'}

## 💡 Description
${data.description}`;
}

/**
 * Format array as numbered or bulleted list
 */
function formatList(items) {
  if (typeof items === 'string') {
    return items;
  }

  if (!Array.isArray(items)) {
    return 'N/A';
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

const ORG = 'NASA-PDS';

/**
 * Get the node ID of an issue using GraphQL
 */
function getIssueNodeId(repo, number) {
  const query = `
    query {
      repository(owner: "${ORG}", name: "${repo}") {
        issue(number: ${number}) {
          id
          title
        }
      }
    }
  `;

  try {
    const result = execSync(`gh api graphql -f query='${query}'`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const data = JSON.parse(result);

    if (!data.data?.repository?.issue) {
      throw new Error(`Issue #${number} not found in ${ORG}/${repo}`);
    }

    return data.data.repository.issue;
  } catch (error) {
    throw new Error(`Failed to get issue ${ORG}/${repo}#${number}: ${error.message}`);
  }
}

/**
 * Attach a sub-issue to a parent issue using GraphQL mutation
 */
function addSubIssue(parentId, childId) {
  const mutation = `
    mutation {
      addSubIssue(input: {
        issueId: "${parentId}",
        subIssueId: "${childId}"
      }) {
        issue {
          title
        }
        subIssue {
          title
        }
      }
    }
  `;

  try {
    const result = execSync(`gh api graphql -f query='${mutation}'`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const data = JSON.parse(result);

    if (data.errors) {
      throw new Error(data.errors.map(e => e.message).join(', '));
    }

    return data.data.addSubIssue;
  } catch (error) {
    throw new Error(`Failed to attach sub-issue: ${error.message}`);
  }
}

/**
 * Parse parent reference string into repo and number
 * Formats: "#123", "repo#123", "NASA-PDS/repo#123"
 */
function parseParentRef(ref, defaultRepo) {
  // Remove any "NASA-PDS/" prefix
  ref = ref.replace(/^NASA-PDS\//i, '');

  // Match patterns: #123, repo#123
  const match = ref.match(/^(?:([^#]+))?#(\d+)$/);

  if (!match) {
    throw new Error(`Invalid parent reference: ${ref}. Expected format: #123 or repo#123`);
  }

  return {
    repo: match[1] || defaultRepo,
    number: parseInt(match[2])
  };
}

/**
 * Create GitHub issue
 */
function createIssue(type, repo, title, bodyData, parentRef = null) {
  const config = TEMPLATE_CONFIGS[type];

  if (!config) {
    throw new Error(`Invalid template type: ${type}`);
  }

  // Format body according to template
  const body = config.formatBody(bodyData);

  // Build gh command
  let command = `gh issue create --repo NASA-PDS/${repo}`;
  command += ` --title "${title.replace(/"/g, '\\"')}"`;
  command += ` --label "${config.labels}"`;

  if (config.assignee) {
    command += ` --assignee ${config.assignee}`;
  }

  // Write body to temp file to avoid command-line length limits
  const bodyFile = `/tmp/gh-issue-body-${Date.now()}.md`;
  writeFileSync(bodyFile, body, 'utf8');
  command += ` --body-file "${bodyFile}"`;

  console.log(`Creating ${type} issue in NASA-PDS/${repo}...`);
  console.log(`Title: ${title}`);
  console.log(`Labels: ${config.labels}`);

  if (parentRef) {
    const parent = parseParentRef(parentRef, repo);
    console.log(`Parent: NASA-PDS/${parent.repo}#${parent.number}`);
  }

  try {
    const result = execSync(command, { encoding: 'utf8' });
    const issueUrl = result.trim();
    console.log('\nIssue created successfully!');
    console.log(issueUrl);

    // Clean up temp file
    execSync(`rm "${bodyFile}"`);

    // If parent specified, attach as sub-issue
    if (parentRef) {
      const parent = parseParentRef(parentRef, repo);

      // Extract child issue number from URL
      const childNumber = parseInt(issueUrl.match(/\/issues\/(\d+)$/)?.[1]);
      if (!childNumber) {
        throw new Error('Could not extract issue number from created issue URL');
      }

      console.log('\nAttaching as sub-issue...');

      // Get parent node ID
      const parentIssue = getIssueNodeId(parent.repo, parent.number);
      console.log(`  Parent: "${parentIssue.title}"`);

      // Get child node ID
      const childIssue = getIssueNodeId(repo, childNumber);

      // Attach sub-issue
      const subIssueResult = addSubIssue(parentIssue.id, childIssue.id);
      console.log(`\nSub-issue relationship created:`);
      console.log(`  Parent: "${subIssueResult.issue.title}"`);
      console.log(`  └── Child: "${subIssueResult.subIssue.title}"`);
    }

    return issueUrl;
  } catch (error) {
    console.error('\nError creating issue:');
    console.error(error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
let parentRef = null;

// Check for --parent flag
const parentIdx = args.indexOf('--parent');
if (parentIdx !== -1) {
  parentRef = args[parentIdx + 1];
  if (!parentRef) {
    console.error('Error: --parent requires a value (e.g., --parent #123 or --parent repo#123)');
    process.exit(1);
  }
  // Remove --parent and its value from args
  args.splice(parentIdx, 2);
}

const [type, repo, title, dataFile] = args;

if (!type || !repo || !title || !dataFile) {
  console.error('Usage: node create-issue.mjs <type> <repo> <title> <data.json> [--parent <repo>#<number>]');
  console.error('Types: bug, feature, task, vulnerability, theme');
  console.error('');
  console.error('Examples:');
  console.error('  node create-issue.mjs bug pds-registry "Title" data.json');
  console.error('  node create-issue.mjs task pds-registry "Title" data.json --parent #123');
  console.error('  node create-issue.mjs task pds-registry "Title" data.json --parent pds-swg#45');
  process.exit(1);
}

// Load data
let bodyData;
try {
  bodyData = JSON.parse(readFileSync(dataFile, 'utf8'));
} catch (error) {
  console.error(`Error reading data file: ${error.message}`);
  process.exit(1);
}

// Import writeFileSync
import { writeFileSync } from 'fs';

// Create issue (and optionally attach as sub-issue)
createIssue(type, repo, title, bodyData, parentRef);

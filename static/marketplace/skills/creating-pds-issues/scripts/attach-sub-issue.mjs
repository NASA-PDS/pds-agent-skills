#!/usr/bin/env node
/**
 * attach-sub-issue.mjs
 *
 * Attaches a child issue as a sub-issue of a parent issue using GitHub's GraphQL API.
 * Works with cross-repository relationships (child and parent can be in different repos).
 *
 * Usage:
 *   node scripts/attach-sub-issue.mjs <parent-repo> <parent-number> <child-repo> <child-number>
 *
 * Arguments:
 *   parent-repo    Parent repository name (without NASA-PDS/ prefix)
 *   parent-number  Parent issue number
 *   child-repo     Child repository name (without NASA-PDS/ prefix)
 *   child-number   Child issue number
 *
 * Examples:
 *   # Same repo: attach issue #456 as sub-issue of #123 in pds-registry
 *   node scripts/attach-sub-issue.mjs pds-registry 123 pds-registry 456
 *
 *   # Cross-repo: attach pds-registry#456 as sub-issue of pds-swg#123
 *   node scripts/attach-sub-issue.mjs pds-swg 123 pds-registry 456
 */

import { execSync } from 'child_process';

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
          state
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

    return {
      id: data.data.repository.issue.id,
      title: data.data.repository.issue.title,
      state: data.data.repository.issue.state
    };
  } catch (error) {
    if (error.message.includes('not found')) {
      throw error;
    }
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
          id
          title
        }
        subIssue {
          id
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
    // Check for common error cases
    if (error.message.includes('already a sub-issue')) {
      throw new Error('This issue is already a sub-issue of the specified parent');
    }
    if (error.message.includes('cannot be its own')) {
      throw new Error('An issue cannot be a sub-issue of itself');
    }
    throw new Error(`Failed to attach sub-issue: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  const [parentRepo, parentNumber, childRepo, childNumber] = process.argv.slice(2);

  // Validate arguments
  if (!parentRepo || !parentNumber || !childRepo || !childNumber) {
    console.error('Usage: node attach-sub-issue.mjs <parent-repo> <parent-number> <child-repo> <child-number>');
    console.error('');
    console.error('Examples:');
    console.error('  node attach-sub-issue.mjs pds-registry 123 pds-registry 456');
    console.error('  node attach-sub-issue.mjs pds-swg 123 pds-registry 456');
    process.exit(1);
  }

  // Validate numbers
  if (isNaN(parseInt(parentNumber)) || isNaN(parseInt(childNumber))) {
    console.error('Error: Issue numbers must be integers');
    process.exit(1);
  }

  console.log(`Attaching ${ORG}/${childRepo}#${childNumber} as sub-issue of ${ORG}/${parentRepo}#${parentNumber}...`);
  console.log('');

  try {
    // Get parent issue info
    console.log(`Fetching parent issue ${ORG}/${parentRepo}#${parentNumber}...`);
    const parent = getIssueNodeId(parentRepo, parseInt(parentNumber));
    console.log(`  Found: "${parent.title}" (${parent.state})`);

    // Get child issue info
    console.log(`Fetching child issue ${ORG}/${childRepo}#${childNumber}...`);
    const child = getIssueNodeId(childRepo, parseInt(childNumber));
    console.log(`  Found: "${child.title}" (${child.state})`);

    // Attach sub-issue
    console.log('');
    console.log('Creating sub-issue relationship...');
    const result = addSubIssue(parent.id, child.id);

    console.log('');
    console.log('Success! Sub-issue relationship created:');
    console.log(`  Parent: "${result.issue.title}"`);
    console.log(`  └── Child: "${result.subIssue.title}"`);
    console.log('');
    console.log(`View parent: https://github.com/${ORG}/${parentRepo}/issues/${parentNumber}`);
    console.log(`View child:  https://github.com/${ORG}/${childRepo}/issues/${childNumber}`);

  } catch (error) {
    console.error('');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

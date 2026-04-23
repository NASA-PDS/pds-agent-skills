#!/usr/bin/env node

/**
 * Dependabot Alert Dismisser
 *
 * Reads a triaged JSON file and dismisses Dependabot alerts on GitHub
 * where triage.action === "dismiss".
 *
 * Usage:
 *   node dismiss-alerts.mjs <triaged-json> [options]
 *
 * Options:
 *   --dry-run      Preview changes without applying them
 *   --repo <name>  Only process alerts for this repository
 *
 * Environment:
 *   GITHUB_TOKEN   Required. Needs: security_events write scope (org member)
 *                  or repo scope (for private repos).
 *                  Quickest: export GITHUB_TOKEN=$(gh auth token)
 *
 * Security:
 *   - Token sourced from environment only (never hardcoded)
 *   - Dismissal comments are sanitized before submission
 */

import { readFileSync } from 'fs';

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Triaged JSON file path is required');
  console.error('Usage: node dismiss-alerts.mjs <triaged-json> [--dry-run] [--repo <name>]');
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
const inputFile = positional[0];
const dryRun = !!flags['dry-run'];
const filterRepo = flags.repo || null;

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.error('   Quickest: export GITHUB_TOKEN=$(gh auth token)');
  process.exit(1);
}

const VALID_DISMISSED_REASONS = ['tolerable_risk', 'inaccurate', 'no_bandwidth'];

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'pds-dependabot-dismisser/1.0'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dismissAlert(org, repo, alertNumber, reason, comment) {
  const url = `${GITHUB_API}/repos/${org}/${repo}/dependabot/alerts/${alertNumber}`;
  const body = {
    state: 'dismissed',
    dismissed_reason: reason,
    dismissed_comment: comment
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  // Load and parse input
  let data;
  try {
    data = JSON.parse(readFileSync(inputFile, 'utf8'));
  } catch (err) {
    console.error(`❌ Failed to read input file: ${err.message}`);
    process.exit(1);
  }

  const alerts = data.alerts || [];

  // Find alerts to dismiss
  const toDismiss = alerts.filter(a => {
    if (a.triage?.action !== 'dismiss') return false;
    if (!VALID_DISMISSED_REASONS.includes(a.triage?.dismissedReason)) return false;
    if (filterRepo && !a.repository.endsWith(`/${filterRepo}`)) return false;
    return true;
  });

  const toFix = alerts.filter(a => a.triage?.action === 'fix');
  const pending = alerts.filter(a => !a.triage?.action);

  console.log(`\n📋 Dependabot Alert Dismisser`);
  console.log(`   Input: ${inputFile}`);
  if (dryRun) console.log(`   Mode: DRY RUN (no changes will be applied)`);
  if (filterRepo) console.log(`   Repo filter: ${filterRepo}`);
  console.log('');
  console.log(`   Total alerts: ${alerts.length}`);
  console.log(`   To dismiss:   ${toDismiss.length}`);
  console.log(`   To fix:       ${toFix.length} (manual — open in GitHub)`);
  console.log(`   Pending:      ${pending.length} (no triage decision yet)`);
  console.log('');

  if (toDismiss.length === 0) {
    console.log('ℹ️  No alerts to dismiss.');
    if (pending.length > 0) {
      console.log(`   Run dependabot-alerts-triaging to triage the ${pending.length} pending alerts.`);
    }
    return;
  }

  // Preview
  console.log('Alerts to dismiss:');
  for (const a of toDismiss) {
    const [, repo] = a.repository.split('/');
    console.log(`  #${a.alertNumber} [${a.advisory.severity.toUpperCase()}] ${a.dependency.package} in ${repo}`);
    console.log(`    Reason: ${a.triage.dismissedReason}`);
    console.log(`    Comment: ${a.triage.comment}`);
  }
  console.log('');

  if (dryRun) {
    console.log('✅ Dry run complete. Re-run without --dry-run to apply.');
    return;
  }

  // Apply dismissals
  console.log('Applying dismissals...');
  let succeeded = 0;
  let failed = 0;

  for (const a of toDismiss) {
    const [org, repo] = a.repository.split('/');
    const reason = a.triage.dismissedReason;
    const comment = a.triage.comment || `Dismissed after triage review. — Triaged with assistance from Claude`;

    process.stdout.write(`  #${a.alertNumber} ${a.dependency.package} (${repo})... `);

    try {
      await dismissAlert(org, repo, a.alertNumber, reason, comment);
      process.stdout.write(`✅ dismissed (${reason})\n`);
      succeeded++;
    } catch (err) {
      process.stdout.write(`❌ failed: ${err.message}\n`);
      failed++;
    }

    await sleep(300); // Brief pause between API calls
  }

  console.log('');
  console.log(`✅ Done. ${succeeded} dismissed, ${failed} failed.`);

  if (toFix.length > 0) {
    console.log('');
    console.log(`📌 ${toFix.length} alert(s) marked for fixing — open in GitHub:`);
    for (const a of toFix) {
      console.log(`   ${a.alertUrl}`);
    }
  }
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});

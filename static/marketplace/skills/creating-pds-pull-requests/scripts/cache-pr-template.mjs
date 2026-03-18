#!/usr/bin/env node
/**
 * cache-pr-template.mjs
 *
 * Fetches and caches the NASA-PDS pull request template from the .github repository.
 * Template is stored locally to avoid repeated GitHub API calls.
 *
 * Usage:
 *   node scripts/cache-pr-template.mjs [--force]
 *
 * Options:
 *   --force    Force refresh even if cache is recent
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(__dirname, '../resources/templates');
const TIMESTAMP_FILE = join(CACHE_DIR, '.cache-timestamp');
const PR_TEMPLATE_FILE = join(CACHE_DIR, 'pull_request_template.md');
const CACHE_MAX_AGE_DAYS = 7;

/**
 * Check if cache is fresh (less than CACHE_MAX_AGE_DAYS old)
 */
function isCacheFresh() {
  if (!existsSync(TIMESTAMP_FILE) || !existsSync(PR_TEMPLATE_FILE)) {
    return false;
  }

  const timestamp = parseInt(readFileSync(TIMESTAMP_FILE, 'utf8'));
  const ageMs = Date.now() - timestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  return ageDays < CACHE_MAX_AGE_DAYS;
}

/**
 * Fetch PR template from GitHub
 */
function fetchPRTemplate() {
  console.log('Fetching PR template from NASA-PDS/.github...');

  try {
    const downloadUrl = execSync(
      `gh api repos/NASA-PDS/.github/contents/.github/pull_request_template.md --jq '.download_url'`,
      { encoding: 'utf8' }
    ).trim();

    const content = execSync(`curl -sL "${downloadUrl}"`, { encoding: 'utf8' });

    return content;
  } catch (error) {
    console.error(`Error fetching PR template:`, error.message);
    return null;
  }
}

/**
 * Main caching function
 */
function cachePRTemplate(force = false) {
  // Check if we need to refresh
  if (!force && isCacheFresh()) {
    console.log('PR template cache is fresh. Use --force to refresh.');
    console.log(`Cache location: ${PR_TEMPLATE_FILE}`);
    return;
  }

  console.log('Caching NASA-PDS pull request template...');

  // Create cache directory if it doesn't exist
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Fetch and cache PR template
  const content = fetchPRTemplate();

  if (content) {
    writeFileSync(PR_TEMPLATE_FILE, content, 'utf8');

    // Update timestamp
    writeFileSync(TIMESTAMP_FILE, Date.now().toString(), 'utf8');

    console.log('\n✅ Successfully cached PR template');
    console.log(`📍 Cache location: ${PR_TEMPLATE_FILE}`);
    console.log(`⏰ Cache will expire in ${CACHE_MAX_AGE_DAYS} days`);
  } else {
    console.error('\n❌ Failed to cache PR template');
    process.exit(1);
  }
}

/**
 * Get cached PR template content
 */
export function getCachedPRTemplate() {
  if (!existsSync(PR_TEMPLATE_FILE)) {
    throw new Error('PR template not cached. Run: node scripts/cache-pr-template.mjs');
  }

  return readFileSync(PR_TEMPLATE_FILE, 'utf8');
}

// Parse command-line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // Verify gh CLI is available
    execSync('gh --version', { stdio: 'ignore' });
    cachePRTemplate(force);
  } catch (error) {
    console.error('❌ Error: GitHub CLI (gh) is not installed or not authenticated.');
    console.error('📦 Install: https://cli.github.com/');
    console.error('🔐 Authenticate: gh auth login');
    process.exit(1);
  }
}

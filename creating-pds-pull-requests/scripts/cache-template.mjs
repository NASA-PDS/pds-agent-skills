#!/usr/bin/env node
/**
 * cache-template.mjs
 *
 * Fetches and caches the NASA-PDS pull request template from the .github repository.
 * Template is stored locally to avoid repeated GitHub API calls.
 *
 * Usage:
 *   node scripts/cache-template.mjs [--force]
 *
 * Environment:
 *   FORCE_TEMPLATE_REFRESH=true    Force refresh even if cache is recent
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
const TEMPLATE_FILE = join(CACHE_DIR, 'pull_request_template.md');
const CACHE_MAX_AGE_DAYS = 7;

const TEMPLATE_PATH = '.github/pull_request_template.md';

/**
 * Check if cache is fresh (less than CACHE_MAX_AGE_DAYS old)
 */
function isCacheFresh() {
  if (!existsSync(TIMESTAMP_FILE) || !existsSync(TEMPLATE_FILE)) {
    return false;
  }

  const timestamp = parseInt(readFileSync(TIMESTAMP_FILE, 'utf8'));
  const ageMs = Date.now() - timestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  return ageDays < CACHE_MAX_AGE_DAYS;
}

/**
 * Fetch the PR template from GitHub
 */
function fetchTemplate() {
  console.log(`Fetching ${TEMPLATE_PATH}...`);

  try {
    const downloadUrl = execSync(
      `gh api repos/NASA-PDS/.github/contents/${TEMPLATE_PATH} --jq '.download_url'`,
      { encoding: 'utf8' }
    ).trim();

    const content = execSync(`curl -sL "${downloadUrl}"`, { encoding: 'utf8' });

    return content;
  } catch (error) {
    console.error(`Error fetching template:`, error.message);
    return null;
  }
}

/**
 * Main caching function
 */
function cacheTemplate(force = false) {
  // Check if we need to refresh
  if (!force && isCacheFresh()) {
    console.log('Template cache is fresh. Use --force to refresh.');
    console.log(`Cache location: ${CACHE_DIR}`);
    return;
  }

  console.log('Caching NASA-PDS pull request template...');

  // Create cache directory if it doesn't exist
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Fetch and cache the template
  const content = fetchTemplate();

  if (content) {
    writeFileSync(TEMPLATE_FILE, content, 'utf8');

    // Update timestamp
    writeFileSync(TIMESTAMP_FILE, Date.now().toString(), 'utf8');

    console.log('\nSuccessfully cached pull request template');
    console.log(`Cache location: ${CACHE_DIR}`);
    console.log(`Cache will expire in ${CACHE_MAX_AGE_DAYS} days`);
  } else {
    console.error('Failed to cache template');
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const force = args.includes('--force') || process.env.FORCE_TEMPLATE_REFRESH === 'true';

// Run
try {
  // Verify gh CLI is available
  execSync('gh --version', { stdio: 'ignore' });
  cacheTemplate(force);
} catch (error) {
  console.error('Error: GitHub CLI (gh) is not installed or not authenticated.');
  console.error('Install: https://cli.github.com/');
  console.error('Authenticate: gh auth login');
  process.exit(1);
}

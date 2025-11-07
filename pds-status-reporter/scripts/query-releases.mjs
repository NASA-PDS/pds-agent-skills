#!/usr/bin/env node
/**
 * Query GitHub Releases for PDS Repositories
 *
 * Queries all active repositories (excluding ignored products and forked repos)
 * for releases within a specified date range.
 *
 * Usage: node query-releases.mjs <start-date> <end-date>
 * Example: node query-releases.mjs 2025-10-01 2025-11-06
 */

import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const [startDate, endDate] = process.argv.slice(2);
if (!startDate || !endDate) {
  console.error('Usage: node query-releases.mjs <start-date> <end-date>');
  console.error('Example: node query-releases.mjs 2025-10-01 2025-11-06');
  process.exit(1);
}

// Load the products mapping
const productsPath = join(__dirname, '../resources/pds-products.yaml');
const productsYaml = readFileSync(productsPath, 'utf8');

// Parse YAML manually (simple parser for our needs)
const lines = productsYaml.split('\n');
let currentProduct = null;
let inRepositories = false;
let inForkedRepos = false;
const products = {};
const forkedRepos = new Set();
let ignoreProduct = false;

for (const line of lines) {
  // Check for forked_repositories section
  if (line.match(/^forked_repositories:/)) {
    inForkedRepos = true;
    inRepositories = false;
    continue;
  }

  // Parse forked repos
  if (inForkedRepos && line.match(/^\s+-\s+(.+)$/)) {
    const repo = line.match(/^\s+-\s+(.+)$/)[1].trim();
    forkedRepos.add(repo);
    continue;
  }

  // Check for product name
  if (line.match(/^  ([a-z0-9_-]+):/)) {
    const productName = line.match(/^  ([a-z0-9_-]+):/)[1];
    currentProduct = productName;
    products[currentProduct] = { repos: [], workStream: null, ignore: false };
    inRepositories = false;
    inForkedRepos = false;
    ignoreProduct = false;
    continue;
  }

  // Check for ignore flag
  if (currentProduct && line.match(/^\s+ignore:\s*true/)) {
    products[currentProduct].ignore = true;
    ignoreProduct = true;
    continue;
  }

  // Check for work_stream
  if (currentProduct && line.match(/^\s+work_stream:\s*"?([^"]+)"?/)) {
    const workStream = line.match(/^\s+work_stream:\s*"?([^"]+)"?/)[1];
    products[currentProduct].workStream = workStream;
    continue;
  }

  // Check for repositories section
  if (currentProduct && line.match(/^\s+repositories:/)) {
    inRepositories = true;
    continue;
  }

  // Parse repository names
  if (inRepositories && line.match(/^\s+-\s+(.+)$/)) {
    const repo = line.match(/^\s+-\s+(.+)$/)[1].trim();
    if (!ignoreProduct) {
      products[currentProduct].repos.push(repo);
    }
  }
}

// Collect all unique repositories (excluding ignored products and forked repos)
const allRepos = new Set();
for (const [productName, product] of Object.entries(products)) {
  if (!product.ignore) {
    for (const repo of product.repos) {
      if (!forkedRepos.has(repo)) {
        allRepos.add(repo);
      }
    }
  }
}

console.log(`Querying ${allRepos.size} active repositories for releases (${startDate} to ${endDate})...`);

// Query releases for each repository
const releases = [];

let processed = 0;
for (const repo of allRepos) {
  processed++;
  if (processed % 10 === 0) {
    console.log(`  Processed ${processed}/${allRepos.size} repositories...`);
  }

  try {
    const { stdout } = await execAsync(`gh release list --repo NASA-PDS/${repo} --limit 100 --json tagName,name,publishedAt,url,isPrerelease 2>/dev/null`);
    const repoReleases = JSON.parse(stdout || '[]');

    // Filter by date
    const filteredReleases = repoReleases.filter(r => {
      return r.publishedAt >= startDate && r.publishedAt <= endDate + 'T23:59:59Z';
    });

    if (filteredReleases.length > 0) {
      console.log(`  ✓ Found ${filteredReleases.length} release(s) in ${repo}`);
      for (const release of filteredReleases) {
        releases.push({
          repo: `NASA-PDS/${repo}`,
          ...release
        });
      }
    }
  } catch (error) {
    // Skip repos without releases or that don't exist
    if (!error.message.includes('no releases found')) {
      // Uncomment for debugging: console.error(`  Warning: Could not query ${repo}: ${error.message}`);
    }
  }
}

console.log(`\n=== RELEASES SUMMARY ===`);
console.log(`Total releases found: ${releases.length}`);
if (releases.length > 0) {
  for (const release of releases) {
    console.log(`  - ${release.repo} ${release.tagName} (${release.publishedAt.split('T')[0]})`);
  }
}

// Save results
const outputPath = '/tmp/pds-releases.json';
writeFileSync(outputPath, JSON.stringify(releases, null, 2));
console.log(`\nReleases saved to ${outputPath}`);

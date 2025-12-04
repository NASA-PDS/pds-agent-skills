#!/usr/bin/env node
/**
 * detect-repo.mjs
 *
 * Detects if the current directory is a NASA-PDS repository.
 * Returns the repository name if detected, or null if not.
 *
 * Usage:
 *   node scripts/detect-repo.mjs
 *
 * Output (JSON):
 *   {"detected": true, "repo": "pds-registry", "org": "NASA-PDS"}
 *   {"detected": false}
 */

import { execSync } from 'child_process';

function detectRepo() {
  try {
    // Get the remote origin URL
    const remoteUrl = execSync('git remote get-url origin 2>/dev/null', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // Parse the URL to extract org and repo
    // Handles both HTTPS and SSH formats:
    // - https://github.com/NASA-PDS/pds-registry.git
    // - git@github.com:NASA-PDS/pds-registry.git

    let match;

    // Try HTTPS format
    match = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+?)(?:\.git)?$/);

    if (match) {
      const [, org, repo] = match;

      // Check if it's a NASA-PDS repository
      if (org === 'NASA-PDS') {
        return {
          detected: true,
          repo: repo,
          org: org,
          url: remoteUrl
        };
      } else {
        return {
          detected: false,
          reason: `Repository is from ${org}, not NASA-PDS`
        };
      }
    }

    return {
      detected: false,
      reason: 'Could not parse GitHub URL from remote origin'
    };
  } catch (error) {
    return {
      detected: false,
      reason: 'Not in a git repository or no remote origin configured'
    };
  }
}

// Run detection and output JSON
const result = detectRepo();
console.log(JSON.stringify(result, null, 2));

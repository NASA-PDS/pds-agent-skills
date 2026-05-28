#!/usr/bin/env node

/**
 * Detect current git context for PR creation
 * - Current repository (NASA-PDS org check)
 * - Current branch
 * - Base branch
 * - Commits ahead of base
 * - Uncommitted changes
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Execute command and return output, or null on error
 */
function exec(command, silent = true) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if we're in a git repository
 */
function isGitRepo() {
  return exec('git rev-parse --git-dir') !== null;
}

/**
 * Get remote URL for a remote name
 */
function getRemoteUrl(remoteName) {
  return exec(`git remote get-url ${remoteName} 2>/dev/null`);
}

/**
 * Parse NASA-PDS repo from remote URL
 */
function parseNasaPdsRepo(url) {
  if (!url) return null;

  // Match NASA-PDS/repo-name from various URL formats
  const patterns = [
    /github\.com[:/]NASA-PDS\/([^/\s.]+)/i,
    /NASA-PDS\/([^/\s.]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `NASA-PDS/${match[1].replace('.git', '')}`;
    }
  }

  return null;
}

/**
 * Detect NASA-PDS repository
 */
function detectRepository() {
  // Try origin first (common for forks and direct clones)
  let remoteUrl = getRemoteUrl('origin');
  let repo = parseNasaPdsRepo(remoteUrl);
  let remoteName = 'origin';

  // If origin is not NASA-PDS, try upstream (common for forks)
  if (!repo) {
    remoteUrl = getRemoteUrl('upstream');
    repo = parseNasaPdsRepo(remoteUrl);
    remoteName = 'upstream';
  }

  // Try all remotes if still not found
  if (!repo) {
    const remotes = exec('git remote') || '';
    for (const remote of remotes.split('\n')) {
      remoteUrl = getRemoteUrl(remote);
      repo = parseNasaPdsRepo(remoteUrl);
      if (repo) {
        remoteName = remote;
        break;
      }
    }
  }

  return { repo, remoteName, remoteUrl };
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  return exec('git branch --show-current');
}

/**
 * Detect base branch (main, master, or develop)
 */
function detectBaseBranch(remoteName) {
  const branches = exec(`git branch -r`) || '';

  // Priority order: main > master > develop
  const preferredBranches = ['main', 'master', 'develop'];

  for (const preferred of preferredBranches) {
    if (branches.includes(`${remoteName}/${preferred}`)) {
      return preferred;
    }
  }

  return 'main'; // Default fallback
}

/**
 * Count commits ahead of base
 */
function getCommitsAhead(base, remoteName) {
  const remote = `${remoteName}/${base}`;
  const count = exec(`git rev-list --count ${remote}..HEAD 2>/dev/null`);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Check for uncommitted changes
 */
function hasUncommittedChanges() {
  const status = exec('git status --porcelain');
  return status !== null && status.length > 0;
}

/**
 * Get list of changed files
 */
function getChangedFiles(base, remoteName) {
  const remote = `${remoteName}/${base}`;
  const files = exec(`git diff --name-only ${remote}..HEAD 2>/dev/null`);
  return files ? files.split('\n').filter(f => f) : [];
}

/**
 * Get commit messages for PR description
 */
function getCommitMessages(base, remoteName) {
  const remote = `${remoteName}/${base}`;
  const messages = exec(`git log ${remote}..HEAD --pretty=format:"- %s" --reverse 2>/dev/null`);
  return messages || '';
}

/**
 * Check if branch is pushed to remote
 */
function isBranchPushed(branch, remoteName) {
  const remoteBranches = exec('git branch -r') || '';
  return remoteBranches.includes(`${remoteName}/${branch}`);
}

/**
 * Check if current branch is a protected branch
 */
function isProtectedBranch(branch) {
  const protectedBranches = ['main', 'master', 'develop', 'production', 'release'];
  return protectedBranches.includes(branch.toLowerCase());
}

/**
 * Main detection function
 */
function detectContext() {
  // Check if in git repo
  if (!isGitRepo()) {
    return {
      error: 'Not in a git repository',
      inGitRepo: false
    };
  }

  // Detect repository
  const { repo, remoteName, remoteUrl } = detectRepository();

  if (!repo) {
    return {
      error: 'Not a NASA-PDS repository or no remote configured',
      inGitRepo: true,
      hasNasaPdsRemote: false,
      remoteUrl
    };
  }

  // Get current branch
  const currentBranch = getCurrentBranch();

  if (!currentBranch) {
    return {
      error: 'Unable to determine current branch (detached HEAD?)',
      inGitRepo: true,
      hasNasaPdsRemote: true,
      repo
    };
  }

  // Check if on protected branch
  if (isProtectedBranch(currentBranch)) {
    return {
      error: `Currently on protected branch '${currentBranch}'. Create a feature branch first.`,
      inGitRepo: true,
      hasNasaPdsRemote: true,
      repo,
      currentBranch,
      isProtectedBranch: true
    };
  }

  // Detect base branch
  const baseBranch = detectBaseBranch(remoteName);

  // Get commit and file info
  const commitsAhead = getCommitsAhead(baseBranch, remoteName);
  const uncommittedChanges = hasUncommittedChanges();
  const changedFiles = getChangedFiles(baseBranch, remoteName);
  const commitMessages = getCommitMessages(baseBranch, remoteName);
  const branchPushed = isBranchPushed(currentBranch, remoteName);

  // Determine readiness
  const warnings = [];

  if (commitsAhead === 0) {
    warnings.push('No commits ahead of base branch. Commit changes before creating PR.');
  }

  if (uncommittedChanges) {
    warnings.push('Uncommitted changes detected. Commit or stash before creating PR.');
  }

  if (!branchPushed) {
    warnings.push(`Branch '${currentBranch}' not pushed to remote. Will need to push first.`);
  }

  if (changedFiles.length > 50) {
    warnings.push(`Large PR: ${changedFiles.length} files changed. Consider splitting into smaller PRs.`);
  }

  if (commitsAhead > 20) {
    warnings.push(`Many commits: ${commitsAhead} commits. Consider squashing or splitting.`);
  }

  // Build result
  return {
    inGitRepo: true,
    hasNasaPdsRemote: true,
    repo,
    remoteName,
    remoteUrl,
    currentBranch,
    baseBranch,
    commitsAhead,
    uncommittedChanges,
    changedFiles: changedFiles.length,
    changedFilesList: changedFiles.slice(0, 10), // First 10 files
    commitMessages,
    branchPushed,
    isProtectedBranch: false,
    warnings,
    ready: warnings.length === 0 || (warnings.length === 1 && warnings[0].includes('not pushed'))
  };
}

// Run detection and output JSON
if (import.meta.url === `file://${process.argv[1]}`) {
  const context = detectContext();
  console.log(JSON.stringify(context, null, 2));

  // Exit with error code if not ready
  if (context.error || !context.ready) {
    process.exit(1);
  }
}

export { detectContext };

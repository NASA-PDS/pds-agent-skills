# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **pds-rdd-generator** skill (v3.0.0) - Generate Release Definition Documents (RDD) showing completed work grouped by parent tasks
  - Simple, focused RDD generation showing what was completed in a time period
  - Groups work by: Work Stream → Component → Parent Task → Items → "Other Improvements"
  - Automatic parent-child relationship detection from issue body text
  - Includes releases published during the period
  - Minimal filtering (only excludes invalid work like duplicates, wontfix)
  - Three simplified scripts: `query-releases.mjs`, `filter-and-group.mjs`, `generate-rdd.mjs`
  - Replaced complex pds-status-reporter skill (v2.1)
- **sonarcloud-security-audit** skill - Audit SonarCloud security issues for NASA PDS repositories
  - Scans all projects in nasa-pds organization for security vulnerabilities and hotspots
  - Exports to CSV with triage columns (severity, status, rule, component, line, URL)
  - Automatic pagination for large result sets (500 items per page)
  - Rate limiting and retry logic with exponential backoff
  - Priority suggestions based on severity (BLOCKER/CRITICAL highlighted)
  - Direct links to SonarCloud UI for each issue
  - Helper script: `fetch-security-issues.mjs` with comprehensive error handling
- **sonarcloud-security-triage** skill - Apply triage decisions to SonarCloud security issues
  - Reads CSV with triage decisions (Action, Resolution, Comment, Reviewer columns)
  - Bulk updates security hotspots (TO_REVIEW → REVIEWED with SAFE/FIXED resolution)
  - Bulk updates vulnerabilities (OPEN → confirm/falsepositive/wontfix/resolve)
  - Dry-run mode to preview changes before applying
  - Comprehensive error handling and progress tracking
  - Automatic retry logic with rate limiting (429 responses)
  - Detailed summary with success/failure counts
  - Helper script: `apply-triage.mjs` with idempotent operations
- **creating-pds-issues** skill - Creates GitHub issues in NASA-PDS repositories using official templates
  - 6 template types: Bug, I&T Bug, Feature Request, Task, Vulnerability, Release Theme
  - Auto-detection of current repository from git remote (origin → upstream fallback)
  - Security-first with comprehensive PII/credential sanitization guidance
  - Template caching (7-day refresh) to minimize GitHub API calls
  - Configurable assignee via `PDS_ISSUE_ASSIGNEE` environment variable

### Changed

- **BREAKING:** Refactored pds-status-reporter to pds-rdd-generator (v3.0.0)
  - Simplified from complex status reporting to focused RDD generation
  - Removed AI summarization, scoring rubrics, and executive summaries
  - Removed theme tracking and complex work stream analysis
  - New focus: Show completed work grouped by parent tasks
  - Scripts reduced from 10 to 3 for easier maintenance
  - Output format: Work Stream → Component → Parent Task → Items
- Updated README.md skills count badge from 5 to 6
- Updated SKILLS_CATALOG.md with new Security Triage skill
- Enhanced Security & Compliance use case with triage workflow
- Updated repository structure documentation to include sonarcloud-security-triage

### Removed

- pds-status-reporter AI scripts: `ai-curate-highlights.mjs`, `ai-summarize-themes.mjs`, `apply-curated-highlights.mjs`, `fetch-theme-comments.mjs`, `process-ai-summaries.mjs`
- Complex scoring and report generation: `score-issues.mjs`, `generate-report.mjs` (replaced with simplified versions)

## [1.0.0] - 2024-11-06

### Added

- **SKILLS_CATALOG.md** - Comprehensive browsable catalog of all available skills with:
  - Detailed descriptions and use cases for each skill
  - Organization by category, use case, and work stream
  - Status indicators for skill maturity
  - Quick install instructions
  - Shared resources documentation
- **MARKETPLACE_SETUP.md** - Complete guide for configuring repository as a discoverable skills marketplace
  - GitHub topics and discoverability configuration
  - Repository settings recommendations
  - Issue template examples
  - Promotion and maintenance strategies
- **Marketplace badges** in README.md:
  - Skills count badge
  - License badge
  - Claude Code compatibility badge
- **Skills catalog link** prominently featured in README.md
- **Skills overview table** in README.md for quick reference
- **generating-release-notes** skill - Generates structured GitHub release notes with breaking change detection, categorization, and upload
- **Shared resources** for cross-skill use:
  - `shared-resources/pds-labels.yaml` - Canonical PDS label definitions

### Changed

- Transformed repository into browsable skills marketplace
- Updated README.md with catalog-first approach and marketplace badging
- Reorganized available skills section for better discoverability

### Infrastructure

- Repository structure designed for Claude Code automatic skill discovery
- Support for both project-level (`.claude/skills/`) and personal (`~/.claude/skills/`) installations
- Git submodule support for easier updates

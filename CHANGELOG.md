# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **🆕 Plugin Marketplace** - Transformed repository into official Claude Code plugin marketplace
  - Created `.claude-plugin/marketplace.json` catalog for easy distribution
  - Added `plugin.json` manifests to all 4 plugins
  - Users can now install with `/plugin marketplace add NASA-PDS/pds-claude-skills`
  - Automatic version management and updates
  - Follows official Anthropic plugin marketplace specification
- **sonarcloud-security-audit** plugin - Audit SonarCloud security issues for NASA PDS repositories
  - Scans all projects in nasa-pds organization for security vulnerabilities and hotspots
  - Exports to CSV with triage columns (severity, status, rule, component, line, URL)
  - Automatic pagination for large result sets (500 items per page)
  - Rate limiting and retry logic with exponential backoff
  - Priority suggestions based on severity (BLOCKER/CRITICAL highlighted)
  - Direct links to SonarCloud UI for each issue
  - Helper script: `fetch-security-issues.mjs` with comprehensive error handling
- **sonarcloud-security-triage** plugin - Apply triage decisions to SonarCloud security issues
  - Reads CSV with triage decisions (Action, Resolution, Comment, Reviewer columns)
  - Bulk updates security hotspots (TO_REVIEW → REVIEWED with SAFE/FIXED resolution)
  - Bulk updates vulnerabilities (OPEN → confirm/falsepositive/wontfix/resolve)
  - Dry-run mode to preview changes before applying
  - Comprehensive error handling and progress tracking
  - Automatic retry logic with rate limiting (429 responses)
  - Detailed summary with success/failure counts
  - Helper script: `apply-triage.mjs` with idempotent operations
- **creating-pds-issues** plugin - Creates GitHub issues in NASA-PDS repositories using official templates
  - 6 template types: Bug, I&T Bug, Feature Request, Task, Vulnerability, Release Theme
  - Auto-detection of current repository from git remote (origin → upstream fallback)
  - Security-first with comprehensive PII/credential sanitization guidance
  - Template caching (7-day refresh) to minimize GitHub API calls
  - Configurable assignee via `PDS_ISSUE_ASSIGNEE` environment variable

### Changed

- **🔄 Installation Method** - Plugin marketplace is now the recommended installation method
  - Updated README.md with plugin marketplace installation as primary method
  - Manual installation (git clone/submodule) moved to "Alternative" section
  - Added plugin management commands documentation
- Updated README.md with plugin terminology (skills → plugins)
- Updated README.md table to show only 4 active production plugins
- Updated README.md badge to accurately reflect 4 active plugins
- Updated CLAUDE.md with all 4 active plugins and SonarCloud integration details
- Updated SKILLS_CATALOG.md with new Security Triage plugin
- Enhanced Security & Compliance use case with triage workflow
- Updated repository structure documentation to include sonarcloud-security-triage

### Removed

- **pds-status-reporter** and **pds-rdd-generator** skills moved to `backup/` directory (not production-ready)

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

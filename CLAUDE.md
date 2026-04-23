# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository is a Claude Code plugin marketplace (`pds-agent-skills`) for NASA's Planetary Data System (PDS). The marketplace distributes 3 plugins grouping 8 skills by workflow theme:
- **pds-github-skills**: Release notes generation + GitHub issue creation + pull request creation
- **sonarcloud-skills**: SonarCloud security export + triage + update
- **dependabot-skills**: Dependabot alert export + triage

Skills are reusable AI agents that perform specialized tasks within the Claude Code CLI environment. There are no build commands, tests, or compilation steps - this is a documentation and configuration repository.

## Skills Architecture

### What is a Skill?

Skills are defined by `SKILL.md` files with YAML frontmatter and detailed instructions. Structure:

```
skill-name/
├── SKILL.md              # Main skill definition with frontmatter and instructions
├── scripts/              # Optional: Node.js scripts for complex operations
├── resources/            # Optional: Configuration files (YAML/JSON)
└── additional files/     # Optional: Templates, documentation, references
```

**SKILL.md anatomy:**
```yaml
---
name: skill-name
description: Brief description triggering the skill
---
# Full instructions for Claude Code to execute the skill
```

### Plugin Architecture

**Marketplace:** `pds-agent-skills`
**Location:** All skills in `static/marketplace/skills/` directory

#### Plugin 1: pds-github-skills

GitHub workflow automation for NASA PDS

**1. generating-release-notes** - Generates structured GitHub release notes
- Categorizes PRs/issues by labels (Breaking → Highlights → New → Improvements → Fixes → Security → etc.)
- **Critical rule:** Breaking changes ALWAYS appear first with ⚠️ warning
- Requires GitHub CLI (`gh`) for optional upload to releases
- Label mapping: `generating-release-notes/label-mapping.md`

**2. creating-pds-issues** - Creates GitHub issues using NASA-PDS templates
- Supports 6 template types: Bug, I&T Bug, Feature, Task, Vulnerability, Release Theme
- Auto-detects repository from git remote (origin → upstream fallback)
- Security-first with PII/credential sanitization
- Template caching (7-day refresh) to minimize API calls
- Requires GitHub CLI (`gh`) and Node.js v18+ for caching scripts

**3. creating-pds-pull-requests** - Creates GitHub pull requests in NASA-PDS repositories
- Auto-detects current repository and branch from git context
- Intelligent base branch detection (main/master/develop)
- Uses cached NASA-PDS official PR template (7-day refresh)
- Auto-links to related issues with `Closes #123` syntax
- Supports reviewer/assignee assignment and label management
- Includes AI assistance disclosure (NASA-PDS requirement)
- Draft PR support for work-in-progress
- Breaking change detection and documentation requirements
- Security-first with PII/credential sanitization
- Helper scripts: `detect-context.mjs`, `cache-pr-template.mjs`
- Requires GitHub CLI (`gh`) and Node.js v18+

#### Plugin 2: sonarcloud-skills

SonarCloud security workflow automation for NASA PDS

**4. sonarcloud-security-exporting** - Exports SonarCloud security issues
- Fetches all vulnerabilities and security hotspots from nasa-pds organization
- Exports to CSV with triage columns (severity, status, rule, component, line, URL)
- Automatic pagination for large result sets (500 items per page)
- Rate limiting and retry logic with exponential backoff
- Requires SonarCloud API token and Node.js v18+
- Helper script: `scripts/fetch-security-issues.mjs`

**5. sonarcloud-security-triaging** - Analyzes security issues and suggests triage decisions
- Reads exported CSV and analyzes each security issue
- Examines code context around flagged lines
- Identifies false positive patterns (test fixtures, URIs, dev code)
- Suggests Action, Resolution, and Comment for each issue with reasoning
- Groups similar issues for bulk triage efficiency
- Generates triage recommendations CSV with confidence levels
- Helps distinguish true positives from false positives

**6. sonarcloud-security-updating** - Applies triage decisions to SonarCloud
- Reads CSV with triage decisions (Action, Resolution, Comment, Reviewer columns)
- Bulk updates security hotspots (TO_REVIEW → REVIEWED with SAFE/FIXED resolution)
- Bulk updates vulnerabilities (OPEN → confirm/falsepositive/wontfix/resolve)
- Dry-run mode to preview changes before applying
- Requires SonarCloud API token with admin permissions and Node.js v18+
- Helper script: `scripts/apply-triage.mjs`

**Note:** Additional experimental/deprecated skills may be found in `backup/` directory.

#### Plugin 3: dependabot-skills

GitHub Dependabot dependency vulnerability workflow automation for NASA PDS

**7. dependabot-alerts-exporting** - Exports GitHub Dependabot alerts
- Fetches all open dependency vulnerability alerts from nasa-pds organization via GitHub API
- Exports to JSON with CVE ID, CVSS score, affected package, version range, fix version, manifest path, and advisory URL
- Supports filtering by severity, state, ecosystem, and single repository
- Automatic pagination, rate limiting, and retry logic
- Requires `GITHUB_TOKEN` with `security_events` scope and Node.js v18+
- Helper script: `scripts/fetch-dependabot-alerts.mjs`

**8. dependabot-alerts-triaging** - Analyzes Dependabot alerts and suggests triage decisions
- Reads exported JSON and analyzes each CVE in PDS context
- Assesses exploitability: is the vulnerable code path reachable?
- Groups identical CVEs across multiple repos for bulk triage efficiency
- Recommends action: fix, tolerable_risk, inaccurate, no_bandwidth
- Creates GitHub issues in `NASA-PDS/outlaw-tracker` for confirmed HIGH/CRITICAL vulnerabilities
- Generates updated JSON with `triage` fields populated
- Tracks token usage in metrics

## Shared Resources

**static/marketplace/skills/shared-resources/pds-labels.yaml** - Canonical PDS GitHub label definitions
- Used by multiple skills for consistent label interpretation
- Defines semantics for priority, severity, type, status labels
- Centrally located for all marketplace plugins

## Key Workflows

### Adding a New Skill

1. Create directory: `static/marketplace/skills/<skill-name>/` (use gerund form: `generating-*`, `processing-*`, `creating-*`)
2. Create `SKILL.md` with:
   - YAML frontmatter (`name`, `description`)
   - Comprehensive instructions for autonomous execution
   - Input/output specifications
   - Style rules and edge cases
3. Add supporting resources as needed (scripts/, resources/, templates/)
4. Update `.claude-plugin/marketplace.json` to add the skill path to the appropriate plugin's `skills` array
5. Update README.md "Available Skills" section with table entry
6. Update SKILLS_CATALOG.md with detailed skill documentation
7. Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
8. Update this CLAUDE.md file to include the new skill in "Plugin Architecture"

### Creating a New Plugin Group

To create a new thematic plugin (e.g., "pds-infrastructure-skills"):

1. Add skills to `static/marketplace/skills/` as described above
2. Add a new plugin entry to `.claude-plugin/marketplace.json`:
   - Set `name` to the plugin identifier (e.g., "pds-infrastructure-skills")
   - Set `source` to `"./static/marketplace/"`
   - List skill paths in `skills` array (e.g., `["./skills/new-skill-1", "./skills/new-skill-2"]`)
3. Update all documentation to reference the new plugin

## PDS Context

### Label System Philosophy

PDS uses GitHub labels for categorization and prioritization:

**Type labels:**
- `backwards-incompatible` / `breaking-change` - Breaking changes (major version bump)
- `security` - Security vulnerabilities
- `requirement` - New feature user stories
- `enhancement` - Improvements to existing features
- `bug` - Bug fixes
- `theme` - Release Themes (planned stakeholder priorities)

**Priority labels (optional):**
- `p.must-have` / `p.should-have` / `p.could-have`

**Status labels (exclusion):**
- `duplicate` / `invalid` / `wontfix` / `icebox` - Excluded from reports

**Planning labels (NOT excluded):**
- `sprint-backlog` / `release-backlog` / `B##.#` (build tracking) / `i&t.*` (testing)

Complete definitions: `shared-resources/pds-labels.yaml`

### GitHub CLI Requirements

Skills use GitHub CLI (`gh`) for GitHub operations:
```bash
# Verify authentication
gh auth status

# Re-authenticate if needed
gh auth login

# Check rate limits (5000/hour when authenticated)
gh api rate_limit
```

### Work Streams

PDS organizes work into three streams:
1. **Core Data Services** - Registry, validation, data dictionaries
2. **Web Modernization** - Websites, design system, CMS
3. **Planetary Data Cloud** - Cloud migration, infrastructure

### SonarCloud Integration

PDS uses SonarCloud for code quality and security scanning:
- **Organization**: `nasa-pds`
- **API Authentication**: Requires `SONARCLOUD_TOKEN` environment variable
- **Token Generation**: https://sonarcloud.io/account/security
- **API Documentation**: https://sonarcloud.io/web-api
- **Permissions Needed**:
  - Read access for security audits
  - Administer Security Hotspots + Administer Issues for triage operations

## Documentation Standards

- **CHANGELOG.md**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- **Versioning**: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- **Skill descriptions**: Must be clear enough for Claude Code to auto-invoke based on user requests

## AI Session History

This repository tracks AI-assisted development sessions in `docs/history/`.

### Session Documentation

When Claude Code works on this repository, session summaries are automatically saved to:
- **Location**: `docs/history/YYYY-MM-DD-brief-description.md`
- **Purpose**: Track changes, decisions, and context over time
- **Format**: Includes task description, changes made, token usage, and next steps

This helps with:
- 🕐 Understanding project evolution over time
- 👥 Onboarding new team members
- 🔍 Finding when and why changes were made
- 💡 Learning from past approaches and solutions

### Viewing History

```bash
# List all AI sessions chronologically
ls -lt docs/history/

# View recent sessions
cat docs/history/2026-*.md

# Search for specific topics
grep -r "authentication" docs/history/
```

### Token Budget Awareness

Session histories include token usage to help monitor:
- Complexity of tasks undertaken
- Efficiency of approaches
- When to break large tasks into smaller sessions

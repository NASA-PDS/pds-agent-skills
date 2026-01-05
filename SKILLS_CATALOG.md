# PDS Claude Code Skills Catalog

**Browse all available skills for NASA Planetary Data System workflows**

This catalog provides an overview of all skills available in this repository. Each skill is automatically discovered by Claude Code when you install this repository.

---

## Table of Contents

- [Quick Install](#quick-install)
- [All Skills](#all-skills)
  - [Release Management](#release-management)
  - [Issue Management](#issue-management)
  - [Security Auditing](#security-auditing)
- [By Use Case](#by-use-case)
- [By Work Stream](#by-work-stream)
- [Skill Status](#skill-status)

---

## Quick Install

**Project-level (recommended for teams):**
```bash
cd your-project
mkdir -p .claude/skills
git submodule add https://github.com/NASA-PDS/pds-claude-skills.git .claude/skills/pds
```

**Personal (available everywhere):**
```bash
mkdir -p ~/.claude/skills
git clone https://github.com/NASA-PDS/pds-claude-skills.git ~/.claude/skills/pds
```

All skills become immediately available after installation. No additional setup required.

---

## All Skills

### Release Management

#### 📝 Generating Release Notes
**Skill Name:** `generating-release-notes`
**Location:** `generating-release-notes/`
**Status:** ✅ Production Ready

**What it does:**
Generates structured, user-friendly GitHub release notes from merged PRs and issues with automatic categorization, breaking change detection, and optional upload to GitHub releases.

**Use when:**
- Creating release notes for software releases
- Publishing new versions
- Documenting changes between releases
- Preparing changelog summaries
- Need consistent release note formatting

**Key Features:**
- ⚠️ Automatic breaking change detection (always displayed first)
- 🎯 Executive "Highlights" section for stakeholders
- 🏷️ Smart categorization (Breaking → New → Improvements → Fixes → Security)
- 🔗 Mandatory GitHub links for all changes
- 📤 Optional upload via GitHub CLI
- 🎨 PDS-specific label mapping

**Trigger Keywords:** "release notes", "changelog", "release", "version announcement", "generate release notes"

**Prerequisites:**
- GitHub CLI (`gh`) for upload functionality (optional)

**Example Usage:**
```
Generate release notes for NASA-PDS/doi-service version v1.6.0
```

[View Skill Documentation →](generating-release-notes/SKILL.md)

---

### Issue Management

#### 📝 Creating PDS Issues
**Skill Name:** `creating-pds-issues`
**Location:** `creating-pds-issues/`
**Status:** ✅ Production Ready

**What it does:**
Creates GitHub issues in NASA-PDS repositories using official organizational templates with automatic repository detection, interactive prompting, and comprehensive security sanitization.

**Use when:**
- Creating bug reports or feature requests
- Filing I&T (Integration & Test) bug reports
- Reporting security vulnerabilities
- Creating development tasks or sub-tasks
- Defining release themes (high-level epics)
- Need consistent issue formatting across NASA-PDS

**Key Features:**
- 📋 6 template types: Bug, I&T Bug, Feature, Task, Vulnerability, Release Theme
- 🔍 Auto-detects current repository from git remote
- 🔒 Security-first with PII/credential sanitization guidance
- 💾 Template caching (7-day refresh) to minimize API calls
- 👤 Configurable assignee (defaults to jordanpadams for triage)
- 📊 Automatic project assignment (NASA-PDS/6 portfolio backlog)
- ✅ Repository validation before issue creation

**Trigger Keywords:** "create issue", "file issue", "submit issue", "bug report", "feature request", "security vulnerability", "create PDS issue"

**Prerequisites:**
- GitHub CLI (`gh`) authenticated with write access
- Node.js v18+ for caching scripts

**Example Usage:**
```
Create a bug report for pds-registry about validation errors
File a feature request for the API to support batch operations
Report a security vulnerability in validate
```

[View Skill Documentation →](creating-pds-issues/SKILL.md)

---

### Issue Management

#### 🎫 Creating PDS Issues
**Skill Name:** `creating-pds-issues`
**Location:** `creating-pds-issues/`
**Status:** ✅ Production Ready

**What it does:**
Creates GitHub issues in NASA-PDS repositories using official organizational templates. Automatically detects the current repository, intelligently fills templates with clear and concise content, and ensures consistent issue formatting across the organization.

**Use when:**
- Filing bug reports in PDS repositories
- Proposing new features or enhancements
- Creating internal development tasks
- Reporting security vulnerabilities
- Planning release themes

**Key Features:**
- 🎯 Auto-detects current repository from git remote
- 📋 5 template types: bug reports, feature requests, tasks, vulnerabilities, release themes
- ✍️ Intelligent template filling with concise, clear content
- 🏷️ Automatic label and assignee configuration
- 📦 Local template caching to reduce API calls
- 🔐 Built-in validation and error handling

**Trigger Keywords:** "create issue", "file issue", "bug report", "feature request", "create task", "report vulnerability", "new issue"

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated
- Write access to target NASA-PDS repository

**Example Usage:**
```
Create a bug report for pds-registry about validation errors
File a feature request for the API to support batch operations
I need to create a security vulnerability issue
```

[View Skill Documentation →](creating-pds-issues/SKILL.md)

---

### Security Auditing

#### 🔒 SonarCloud Security Audit
**Skill Name:** `sonarcloud-security-audit`
**Location:** `sonarcloud-security-audit/`
**Status:** ✅ Production Ready

**What it does:**
Fetches all security vulnerabilities and security hotspots from SonarCloud for all repositories under the NASA PDS organization and exports them to a CSV file for security triage and remediation tracking.

**Use when:**
- Conducting security audits across PDS repositories
- Triaging security vulnerabilities
- Preparing compliance reports
- Tracking security technical debt
- Prioritizing security remediation efforts

**Key Features:**
- 🔍 Scans all projects in nasa-pds organization
- 🎯 Filters for security-specific issues only (vulnerabilities + hotspots)
- 📊 CSV export with triage columns (severity, status, rule, file, line)
- 🔗 Direct links to SonarCloud UI for each issue
- 📈 Automatic pagination for large result sets
- ⚡ Rate limiting and retry logic built-in
- 💡 Priority suggestions based on severity (BLOCKER/CRITICAL)

**Trigger Keywords:** "SonarCloud", "security audit", "vulnerability scan", "security issues", "security hotspots", "security report"

**Prerequisites:**
- SonarCloud API token with read access to nasa-pds organization
- Node.js v18+ for fetch API support

**Example Usage:**
```
Scan SonarCloud for all security issues in nasa-pds and export to CSV
Run a security audit of PDS repositories using SonarCloud
```

**Output Columns:**
- Project, Type, Severity, Status, Rule, Message, Component, Line, Created, URL

**Security Context:**
- **Vulnerabilities**: Confirmed security issues with assigned severity (BLOCKER → CRITICAL → MAJOR → MINOR → INFO)
- **Security Hotspots**: Security-sensitive code requiring manual review (no severity until assessed)

[View Skill Documentation →](sonarcloud-security-audit/SKILL.md)

#### 🔧 SonarCloud Security Triage
**Skill Name:** `sonarcloud-security-triage`
**Location:** `sonarcloud-security-triage/`
**Status:** ✅ Production Ready

**What it does:**
Applies triage decisions to SonarCloud security issues (vulnerabilities and hotspots) by reading a CSV file with review decisions and bulk-updating the statuses and comments in SonarCloud via the API.

**Use when:**
- Applying bulk triage decisions after security review
- Updating SonarCloud with remediation plans
- Marking false positives or accepted risks
- Closing out reviewed security hotspots
- Tracking security debt remediation

**Key Features:**
- 📝 Reads CSV with triage decisions (Action, Resolution, Comment columns)
- 🔄 Bulk updates via SonarCloud API
- 🎯 Supports both vulnerabilities and security hotspots
- ✅ Dry-run mode to preview changes before applying
- 📊 Detailed progress tracking and error reporting
- 🔁 Automatic retry logic with rate limiting
- 💾 Logs all successes and failures for audit trail

**Trigger Keywords:** "apply triage", "update SonarCloud", "bulk remediation", "triage decisions", "security review", "apply security reviews"

**Prerequisites:**
- SonarCloud API token with **Administer Security Hotspots** and **Administer Issues** permissions
- CSV file from sonarcloud-security-audit with added triage columns
- Node.js v18+ for fetch API support

**Example Usage:**
```
Apply my security triage decisions to SonarCloud
Update SonarCloud with the reviewed security issues from my CSV
Bulk update security hotspots with my triage decisions
```

**Workflow:**
1. Export issues → **sonarcloud-security-audit** skill
2. Review and add triage columns (Action, Resolution, Comment, Reviewer)
3. Apply decisions → **This skill** updates SonarCloud

**Triage Actions:**
- **Security Hotspots**: Action=`REVIEWED`, Resolution=`SAFE` or `FIXED`
- **Vulnerabilities**: Action=`confirm`, `falsepositive`, `wontfix`, or `resolve`

**Safety Features:**
- Dry-run mode (`--dry-run` flag) to preview all changes
- Per-issue error handling (failures don't stop the batch)
- Detailed error messages for troubleshooting
- Idempotent (safe to run multiple times)

[View Skill Documentation →](sonarcloud-security-triage/SKILL.md)

---

## By Use Case

### 🚀 Software Releases
- [Generating Release Notes](#-generating-release-notes) - Create structured release documentation

### 🎫 Issue Tracking
- [Creating PDS Issues](#-creating-pds-issues) - File bugs, features, tasks, vulnerabilities, and themes

### 🔒 Security & Compliance
- [SonarCloud Security Audit](#-sonarcloud-security-audit) - Security vulnerability scanning and export
- [SonarCloud Security Triage](#-sonarcloud-security-triage) - Bulk-apply triage decisions to security issues

### 📝 Documentation
- [Generating Release Notes](#-generating-release-notes) - Changelog generation

### 🐛 Issue Tracking
- [Creating PDS Issues](#-creating-pds-issues) - Bug reports, feature requests, vulnerabilities

---

## By Work Stream

### Cross-Functional
Skills applicable across all PDS work streams:
- [Generating Release Notes](#-generating-release-notes) - Any PDS repository release
- [Creating PDS Issues](#-creating-pds-issues) - Any NASA-PDS repository issue

---

## Skill Status

| Skill | Status | Last Updated | Version |
|-------|--------|--------------|---------|
| generating-release-notes | ✅ Production | 2024-11 | 1.0 |
| creating-pds-issues | ✅ Production | 2024-1 | 1.0 |
| sonarcloud-security-audit | ✅ Production | 2025-01 | 1.0 |
| sonarcloud-security-triage | ✅ Production | 2025-01 | 1.0 |

**Legend:**
- ✅ Production Ready - Stable and tested
- 🧪 Beta - Functional but may have rough edges
- 🚧 In Development - Not yet ready for use
- 📦 Archived - No longer maintained

---

## Shared Resources

These resources are available to all skills:

### 🏷️ PDS Labels (`shared-resources/pds-labels.yaml`)
Canonical definitions for GitHub labels used across PDS projects:
- Type labels (bug, enhancement, requirement, theme, etc.)
- Priority labels (must-have, should-have, could-have)
- Status labels (duplicate, invalid, wontfix, icebox)
- Planning labels (sprint-backlog, release-backlog, build tracking)

---

## Adding Your Own Skills

Want to contribute a new skill to this catalog? See [CLAUDE.md](CLAUDE.md) for developer guidance and [docs/MARKETPLACE_SETUP.md](docs/MARKETPLACE_SETUP.md) for marketplace configuration.

**Quick steps:**
1. Create `your-skill-name/SKILL.md` with YAML frontmatter
2. Use gerund form for naming (e.g., `processing-data`, not `data-processor`)
3. Write clear trigger descriptions
4. Test with sample inputs
5. Update this catalog with your new skill
6. Submit a pull request

---

## Need Help?

- 📖 [Main README](README.md) - Installation and getting started
- 🛠️ [CLAUDE.md](CLAUDE.md) - Developer guidance
- 📋 [CHANGELOG.md](CHANGELOG.md) - Version history
- 🐛 [Report an Issue](https://github.com/NASA-PDS/pds-claude-skills/issues)
- 📧 Contact PDS Engineering Node team

---

## License

Copyright (c) 2022 California Institute of Technology ("Caltech"). U.S. Government sponsorship acknowledged.

Licensed under the Apache License, Version 2.0. See [LICENSE.md](LICENSE.md) for details.

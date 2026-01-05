# PDS Claude Code Skills Catalog

**Browse all available skills for NASA Planetary Data System workflows**

This catalog provides an overview of all skills available in this repository. Each skill is automatically discovered by Claude Code when you install this repository.

---

## Table of Contents

- [Quick Install](#quick-install)
- [All Skills](#all-skills)
  - [Release Management](#release-management)
  - [Issue Management](#issue-management)
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

## By Use Case

### 🚀 Software Releases
- [Generating Release Notes](#-generating-release-notes) - Create structured release documentation

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
| creating-pds-issues | ✅ Production | 2024-12 | 1.0 |

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

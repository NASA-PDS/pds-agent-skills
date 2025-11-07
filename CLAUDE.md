# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains Claude Code skills for NASA's Planetary Data System (PDS). Skills are reusable AI agents that perform specialized tasks within the Claude Code CLI environment. There are no build commands, tests, or compilation steps - this is a documentation and configuration repository.

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

### Available Skills

**1. release-notes-generator/** - Generates structured GitHub release notes
- Categorizes PRs/issues by labels (Breaking → Highlights → New → Improvements → Fixes → Security → etc.)
- **Critical rule:** Breaking changes ALWAYS appear first with ⚠️ warning
- Requires GitHub CLI (`gh`) for optional upload to releases
- Label mapping: `release-notes-generator/label-mapping.md`

**2. pds-status-reporter/** - Creates monthly/quarterly/annual NASA PDS status reports
- Organizes by **Release Themes** (label:theme) - planned stakeholder priorities
- Queries GitHub Projects portfolio backlog (#6) for closed issues
- Scores using label-aware rubric (v2.1: base score=2, all work matters)
- Includes releases, breaking changes, operations metrics
- Requires GitHub CLI (`gh`) and Node.js v18+
- Uses three scripts:
  - `scripts/query-releases.mjs` - Query GitHub releases
  - `scripts/score-issues.mjs` - Score and filter issues
  - `scripts/generate-report.mjs` - Generate formatted report
- Configuration: `resources/pds-products.yaml` (product→repo→work stream mapping)
- See `scripts/README.md` for detailed workflow

## Shared Resources

**shared-resources/pds-labels.yaml** - Canonical PDS GitHub label definitions
- Used by multiple skills for consistent label interpretation
- Defines semantics for priority, severity, type, status labels

**pds-products.yaml schema** (used by pds-status-reporter):
```yaml
products:
  product-name:
    description: "Brief description"
    work_stream: "core-data-services" | "web-modernization" | "planetary-data-cloud"
    ignore: true/false  # If true, skip this product completely
    core_backbone: true/false  # If true, +2 scoring bonus (critical infrastructure)
    repositories:
      - repo-name-1
forked_repositories:
  - repo-name  # External dependencies to exclude
```

## Key Workflows

### Adding a New Skill

1. Create directory: `<skill-name>/`
2. Create `SKILL.md` with:
   - YAML frontmatter (`name`, `description`)
   - Comprehensive instructions for autonomous execution
   - Input/output specifications
   - Style rules and edge cases
3. Add supporting resources as needed (scripts/, resources/, templates/)
4. Update README.md "Available Skills" section
5. Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

### Testing PDS Status Reporter Scripts

```bash
# Full workflow
gh search issues --owner NASA-PDS --closed "2025-10-01..2025-11-06" \
  --limit 1000 --json number,title,url,closedAt,labels,repository \
  > /tmp/pds-closed-issues.json

cd pds-status-reporter
node scripts/query-releases.mjs 2025-10-01 2025-11-06
node scripts/score-issues.mjs /tmp/pds-closed-issues.json
node scripts/generate-report.mjs monthly 2025-10-01 2025-11-06 /tmp/report.md
```

### Updating Product Mappings

**Source of truth:** `pds-status-reporter/resources/pds-products.yaml`

When repositories change:
1. Edit `pds-products.yaml` (YAML is most token-efficient)
2. Add/remove repositories under appropriate product
3. Set `ignore: true` for archived/deprecated products
4. Mark `core_backbone: true` for critical infrastructure (reviewed quarterly)

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

Both skills use GitHub CLI (`gh`):
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

Products map to work streams via `pds-products.yaml`

## Documentation Standards

- **CHANGELOG.md**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- **Versioning**: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- **Skill descriptions**: Must be clear enough for Claude Code to auto-invoke based on user requests

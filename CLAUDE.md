# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains Claude Code skills for NASA's Planetary Data System (PDS). Skills are reusable AI agents that perform specialized tasks within the Claude Code CLI environment.

## Repository Structure

- `release-notes/` - Release notes generation skill
  - `SKILL.md` - Skill definition and prompt for generating GitHub release notes
  - `templates/` - Template files for release note formatting
  - `additional_resources/` - Supporting documentation including PDS label mapping

## Skills Architecture

### What is a Skill?

Skills in this repository are defined by `SKILL.md` files that contain:
1. **Frontmatter** (YAML format) with `name` and `description` fields
2. **Detailed instructions** for Claude Code on how to execute the skill
3. **Input/output specifications** defining expected parameters and results
4. **Style rules and algorithms** that govern skill behavior

### Release Notes Skill

Location: `release-notes/SKILL.md`

This skill generates structured, user-friendly GitHub release notes with:
- Automatic categorization of changes (Breaking Changes, New, Improvements, Fixes, Security, etc.)
- **Breaking changes detection and prominence** - any breaking changes MUST appear first with ⚠️ warning
- Executive summaries in "Highlights" section
- Mandatory GitHub links for all changes
- Optional upload to GitHub releases via `gh` CLI

**Key Inputs:**
- `repo` - GitHub org/repo (e.g., `NASA-PDS/doi-service`)
- `tag/version` - Release version (e.g., `v1.6.0`)
- `date` - Release date
- `changes` - Structured list of PRs/issues with labels, numbers, URLs
- `compare_url` - GitHub compare link
- `upload` (optional) - Boolean to upload via `gh` CLI

**Label Mapping:**
The skill uses PDS-specific GitHub labels to categorize changes. See `release-notes/additional_resources/label_mapping.md` for the complete mapping of PDS labels to release note sections.

**Critical Rules:**
1. Breaking changes ALWAYS appear first if present
2. Every bullet point MUST include a GitHub link
3. Highlights should be outcome-focused (3-6 bullets)
4. Section order is strict: Breaking → Highlights → New → Improvements → Fixes → Security → Deprecations → Compatibility → Upgrade notes → Known issues → Links

## Development Workflow

### Adding a New Skill

1. Create a new directory under the repository root: `<skill-name>/`
2. Add a `SKILL.md` file with:
   - YAML frontmatter containing `name` and `description`
   - Comprehensive instructions for Claude Code
   - Input/output specifications
   - Style rules and edge cases
3. Add supporting resources in subdirectories as needed (templates, additional_resources)

### Testing Skills

Skills are invoked within Claude Code sessions. Test by:
1. Providing sample inputs that match the skill's expected format
2. Verifying outputs follow the specified structure and style rules
3. Testing edge cases documented in the skill definition

### Documentation

- Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for version numbers
- The README.md is a template file - populate it with actual project information

## PDS Context

This repository is part of NASA's Planetary Data System (PDS) Engineering Node (EN). Skills are designed to support PDS development workflows, particularly around release management and GitHub operations.

### PDS Label System

PDS uses a comprehensive GitHub label system for issue/PR categorization:
- `backwards-incompatible` / `breaking-change` - Breaking changes requiring major version bump
- `security` - Security vulnerabilities or concerns
- `requirement` - New feature user stories
- `enhancement` - Improvements to existing features
- `bug` - Bug fixes
- `maintenance` - Internal maintenance (usually omitted from release notes)

Many other labels exist for planning, triage, and project tracking but are not included in user-facing release notes. See `release-notes/additional_resources/label_mapping.md` for the complete reference.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **pds-status-reporter** skill - Creates comprehensive NASA PDS program status reports (monthly/quarterly/annual)
- **Shared resources** for cross-skill use:
  - `shared-resources/pds-labels.yaml` - Canonical PDS label definitions
  - `pds-status-reporter/resources/pds-products.yaml` - Product-to-repository mappings

### Changed

- Transformed repository into browsable skills marketplace
- Updated README.md with catalog-first approach and marketplace badging
- Reorganized available skills section for better discoverability

### Infrastructure

- Repository structure designed for Claude Code automatic skill discovery
- Support for both project-level (`.claude/skills/`) and personal (`~/.claude/skills/`) installations
- Git submodule support for easier updates

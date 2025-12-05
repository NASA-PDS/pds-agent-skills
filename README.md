<hr>

<div align="center">

<h1 align="center">PDS Claude Code Skills</h1>

</div>

<pre align="center">Reusable AI agents for NASA Planetary Data System workflows in Claude Code</pre>

[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue)](https://nasa-ammos.github.io/slim/)
![Skills](https://img.shields.io/badge/skills-3-brightgreen)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-purple)](https://claude.ai/code)

This repository contains [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills) for NASA's Planetary Data System (PDS) Engineering Node. Skills are specialized AI agents that automate complex tasks within the [Claude Code CLI environment](https://claude.ai/code).

**🎯 [Browse Skills Catalog →](SKILLS_CATALOG.md)** - View all available skills with detailed descriptions and use cases

## Table of Contents

- [What are Claude Code Skills?](#what-are-claude-code-skills)
- [Available Skills](#available-skills)
- [Installation](#installation)
  - [Option 1: Project-Level Skills (Recommended for Teams)](#option-1-project-level-skills-recommended-for-teams)
  - [Option 2: Personal Skills (Available Across All Projects)](#option-2-personal-skills-available-across-all-projects)
  - [Option 3: Direct Git Reference](#option-3-direct-git-reference)
- [Using Skills](#using-skills)
- [Repository Structure](#repository-structure)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)
- [Support](#support)

## What are Claude Code Skills?

Claude Code skills are reusable prompts that enable Claude Code to perform specialized tasks autonomously. Each skill is defined by a `SKILL.md` file containing:

- Detailed instructions for task execution
- Input/output specifications
- Style rules and algorithms
- Edge case handling

Skills help automate repetitive or complex workflows, making development more efficient and consistent across the PDS organization.

## Available Skills

**📖 [View Full Skills Catalog →](SKILLS_CATALOG.md)** - Browse all skills with detailed descriptions, use cases, and examples

### Quick Overview

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| **[generating-release-notes](generating-release-notes/SKILL.md)** | Generate structured GitHub release notes with breaking changes, categorization, and upload | Software releases, changelogs, version announcements |
| **[pds-status-reporter](pds-status-reporter/SKILL.md)** | Create comprehensive PDS program status reports (monthly/quarterly/annual) | Stakeholder reports, program management, executive briefings |
| **[creating-pds-issues](creating-pds-issues/SKILL.md)** | Create GitHub issues using official NASA-PDS templates with security sanitization | Bug reports, feature requests, I&T bugs, security vulnerabilities |

**Total Skills:** 3 production-ready skills for PDS workflows

## Installation

### Prerequisites

- **Claude Code CLI**: Install from [claude.ai/code](https://claude.ai/code) or via Homebrew:
  ```bash
  brew install claude
  ```
- **Claude Desktop**: Download from [claude.ai/download](https://claude.ai/download) (skills work in projects mode)
- **For release notes upload**: [GitHub CLI (`gh`)](https://cli.github.com) installed and authenticated

Skills are automatically discovered by Claude Code - no manual activation required. Choose one of the installation methods below based on your needs.

### Option 1: Project-Level Skills (Recommended for Teams)

Project-level skills are shared with your team via version control and automatically available when team members pull changes.

**Install for a specific project:**

```bash
# Navigate to your project directory
cd your-project

# Create the skills directory
mkdir -p .claude/skills

# Clone this repository into the skills directory
git clone https://github.com/NASA-PDS/pds-claude-skills.git .claude/skills/pds

# Commit to version control
git add .claude/skills/pds
git commit -m "Add PDS Claude Code skills"
```

**Or add as a git submodule** (recommended for easier updates):

```bash
cd your-project
mkdir -p .claude/skills
git submodule add https://github.com/NASA-PDS/pds-claude-skills.git .claude/skills/pds
git commit -m "Add PDS Claude Code skills as submodule"
```

Team members can then pull the changes, and skills become immediately available:

```bash
git pull
git submodule update --init --recursive  # if using submodules
```

### Option 2: Personal Skills (Available Across All Projects)

Personal skills are available in all your projects, stored in your home directory.

**Install globally:**

```bash
# Create personal skills directory
mkdir -p ~/.claude/skills

# Clone this repository
git clone https://github.com/NASA-PDS/pds-claude-skills.git ~/.claude/skills/pds
```

**Update personal skills:**

```bash
cd ~/.claude/skills/pds
git pull
```

### Option 3: Direct Git Reference

If you prefer not to install locally, you can reference skills directly from this repository URL in conversations with Claude Code. However, local installation provides better performance and offline access.

## Using Skills

Once installed, skills are **automatically discovered** by Claude Code. You don't need to manually invoke them.

**How it works:**

1. **Open Claude Code** in your project directory (CLI) or start a project in Claude Desktop
2. **Describe your task** naturally - Claude will autonomously use relevant skills based on your request and the skill descriptions
3. **Provide necessary inputs** as described in each skill's documentation

**Example:**

```bash
# Claude will automatically use the release-notes skill
claude "Generate release notes for NASA-PDS/doi-service version v1.6.0"
```

Claude analyzes your request, identifies that the release-notes skill is relevant, and executes it autonomously.

See the [Skills Catalog](SKILLS_CATALOG.md) or individual skill documentation for detailed input specifications and examples.

## Adding a New Skill

See the [Skills Catalog](SKILLS_CATALOG.md) for examples and [CLAUDE.md](CLAUDE.md) for detailed development guidance.

**Quick steps:**
1. Create a new directory: `<skill-name>/` (use gerund form: `generating-*`, `processing-*`)
2. Add a `SKILL.md` file with YAML frontmatter and instructions
3. Test with sample inputs
4. Update [SKILLS_CATALOG.md](SKILLS_CATALOG.md) with your new skill
5. Submit a pull request

For marketplace configuration and GitHub setup, see [docs/MARKETPLACE_SETUP.md](docs/MARKETPLACE_SETUP.md).

## Repository Structure

```
pds-claude-skills/
├── generating-release-notes/   # Release notes generation skill
│   ├── SKILL.md                # Skill definition and instructions
│   ├── templates/              # Release note templates
│   └── resources/              # Supporting resources
├── pds-status-reporter/        # PDS status reporting skill
│   ├── SKILL.md                # Skill definition and instructions
│   ├── scripts/                # Node.js processing scripts
│   └── resources/              # Product mappings and config
├── shared-resources/           # Shared across all skills
│   └── pds-labels.yaml         # Canonical PDS label definitions
├── docs/                       # Marketplace documentation
│   ├── MARKETPLACE_SETUP.md    # GitHub configuration guide
│   ├── MARKETPLACE_COMPLETE.md # Transformation summary
│   └── PRODUCTS_README.md      # Product mapping documentation
├── SKILLS_CATALOG.md           # Browse all available skills
├── CLAUDE.md                   # Developer guidance for Claude Code
├── README.md                   # This file
└── CHANGELOG.md                # Project changelog
```

## Contributing

Contributions are welcome! When adding new skills:

1. Follow the skill structure outlined in [CLAUDE.md](CLAUDE.md)
2. Ensure comprehensive documentation in the `SKILL.md` file
3. Test your skill with various inputs and edge cases
4. Update the changelog following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
5. Submit a pull request with a clear description of the skill's purpose

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this project.

## License

Copyright (c) 2022 California Institute of Technology ("Caltech"). U.S. Government sponsorship acknowledged.

Licensed under the Apache License, Version 2.0. See [LICENSE.md](LICENSE.md) for details.

## Support

This repository is maintained by NASA's Planetary Data System Engineering Node.

For questions or issues:
- Open an issue in this repository
- Refer to [Claude Code documentation](https://docs.claude.com/en/docs/claude-code)
- Contact the PDS Engineering Node team

<hr>

<div align="center">

<h1 align="center">PDS Claude Code Plugin Marketplace</h1>

</div>

<pre align="center">Specialized AI workflow plugins for NASA Planetary Data System in Claude Code</pre>

[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue)](https://nasa-ammos.github.io/slim/)
![Plugins](https://img.shields.io/badge/plugins-2-blue)
![Skills](https://img.shields.io/badge/skills-4-brightgreen)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Marketplace-purple)](https://claude.ai/code)

This repository is a **Claude Code plugin marketplace** for NASA's Planetary Data System (PDS) Engineering Node. It distributes 2 thematic plugins grouping 4 specialized AI agents that automate complex workflows within the [Claude Code CLI environment](https://claude.ai/code).

**🔌 Plugins:** `pds-github-skills` (GitHub workflows) • `sonarcloud-skills` (Security workflows)

## Table of Contents

- [What are Claude Code Skills?](#what-are-claude-code-skills)
- [Available Plugins & Skills](#available-plugins--skills)
- [Installation](#installation)
  - [🆕 Recommended: Plugin Marketplace](#-recommended-plugin-marketplace-easy-updates--version-management)
  - [Alternative: Manual Installation (Legacy)](#alternative-manual-installation-legacy)
- [Using Plugins](#using-plugins)
- [Adding a New Skill](#adding-a-new-skill)
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

## Available Plugins & Skills

### 🔌 Plugin 1: pds-github-skills (GitHub Workflows)

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| **[generating-release-notes](static/marketplace/skills/generating-release-notes/SKILL.md)** | Generate structured GitHub release notes with breaking changes, categorization, and upload | Software releases, changelogs, version announcements |
| **[creating-pds-issues](static/marketplace/skills/creating-pds-issues/SKILL.md)** | Create GitHub issues using NASA-PDS organizational templates | Bug reports, feature requests, tasks, vulnerabilities, release themes |

### 🔒 Plugin 2: sonarcloud-skills (Security Workflows)

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| **[sonarcloud-security-audit](static/marketplace/skills/sonarcloud-security-audit/SKILL.md)** | Audit SonarCloud security issues for NASA PDS repositories and export to CSV | Security audits, vulnerability triage, compliance reporting |
| **[sonarcloud-security-triage](static/marketplace/skills/sonarcloud-security-triage/SKILL.md)** | Apply triage decisions to SonarCloud security issues by bulk-updating statuses and comments | Security triage, bulk remediation, compliance tracking |

**Total:** 2 plugins • 4 production-ready skills

## Installation

### Prerequisites

- **Claude Code CLI**: Install from [claude.ai/code](https://claude.ai/code) or via Homebrew:
  ```bash
  brew install claude
  ```
- **Claude Desktop**: Download from [claude.ai/download](https://claude.ai/download) (plugins work in projects mode)
- **For release notes upload**: [GitHub CLI (`gh`)](https://cli.github.com) installed and authenticated

### 🆕 Recommended: Plugin Marketplace (Easy Updates & Version Management)

The easiest way to install and manage PDS plugins with automatic updates and version control.

#### Option A: Public GitHub Repository

**Add the marketplace once:**
```bash
/plugin marketplace add NASA-PDS/pds-claude-skills
```

**Install individual plugins as needed:**
```bash
# List available plugins
/plugin list @pds-agent-skills

# Install GitHub workflow skills
/plugin install pds-github-skills@pds-agent-skills

# Install SonarCloud security skills
/plugin install sonarcloud-skills@pds-agent-skills

# Or install both
/plugin install pds-github-skills@pds-agent-skills sonarcloud-skills@pds-agent-skills
```

**Update to latest versions:**
```bash
/plugin marketplace update pds-agent-skills
/plugin update pds-github-skills@pds-agent-skills sonarcloud-skills@pds-agent-skills
```

#### Option B: Local/Internal Installation

For internal use, air-gapped environments, or testing before publishing:

**Clone the repository first:**
```bash
# Clone to a local directory
git clone https://github.com/NASA-PDS/pds-claude-skills.git ~/pds-plugins

# Or for internal use, clone from your internal git server
git clone https://git.your-org.com/pds/pds-claude-skills.git ~/pds-plugins
```

**Add the local marketplace:**
```bash
# Option 1: Use absolute path (recommended)
/plugin marketplace add /Users/yourname/pds-plugins

# Option 2: Add from parent directory
cd ~
/plugin marketplace add pds-plugins

# Option 3: Use tilde expansion
/plugin marketplace add ~/pds-plugins
```

**Important**: Run the `/plugin marketplace add` command from **outside** the marketplace directory, pointing to the directory that contains `.claude-plugin/`. Don't run it from inside the marketplace directory itself.

**Install plugins:**
```bash
# List available plugins (marketplace name will be auto-generated from path)
/plugin list @pds-plugins

# Install GitHub workflow skills
/plugin install pds-github-skills@pds-plugins

# Install SonarCloud security skills
/plugin install sonarcloud-skills@pds-plugins
```

**Update from local marketplace:**
```bash
# Pull latest changes first
cd ~/pds-plugins
git pull

# Then update the marketplace in Claude Code
/plugin marketplace update pds-plugins
/plugin update pds-github-skills@pds-plugins sonarcloud-skills@pds-plugins
```

#### Option C: Private Git Repository

For private organizational repositories:

```bash
# Add private repository with authentication
/plugin marketplace add https://git.your-org.com/pds/pds-claude-skills.git

# Or use SSH
/plugin marketplace add git@github.com:your-org/pds-claude-skills.git
```

Make sure you're authenticated with your git provider (e.g., `gh auth login` for GitHub).

**Benefits of Plugin Marketplace:**
- ✅ One command to add marketplace
- ✅ Automatic version management
- ✅ Easy updates with `/plugin marketplace update`
- ✅ Install only the plugins you need
- ✅ Works with public, private, or local repositories
- ✅ Official Anthropic plugin system

---

### Alternative: Manual Installation (Legacy)

For backwards compatibility or air-gapped environments, you can still manually install plugins.

#### Option 1: Project-Level Skills (Recommended for Teams)

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

#### Option 2: Personal Skills (Available Across All Projects)

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

#### Option 3: Direct Git Reference

**Deprecated**: Use the plugin marketplace method instead. Direct git references are kept for backwards compatibility only.

## Using Plugins

Once installed via the plugin marketplace, plugins are **automatically available** in Claude Code.

**How it works:**

1. **Install plugins** from the marketplace (see Installation above)
2. **Open Claude Code** in your project directory (CLI) or start a project in Claude Desktop
3. **Describe your task** naturally - Claude will autonomously use relevant plugins based on your request
4. **Provide necessary inputs** as described in each plugin's documentation

**Example:**

```bash
# Claude will automatically use the generating-release-notes skill
claude "Generate release notes for NASA-PDS/doi-service version v1.6.0"
```

**Managing Plugins:**

```bash
# List installed plugins
/plugin list

# List available plugins in marketplace
/plugin list @pds-agent-skills

# Update a specific plugin
/plugin update pds-github-skills@pds-agent-skills

# Uninstall a plugin
/plugin uninstall pds-github-skills@pds-agent-skills
```

See individual skill documentation (linked in table above) for detailed input specifications and examples.

**📚 For detailed installation scenarios** (local, private repos, air-gapped environments), see the [Plugin Marketplace Installation Guide](docs/PLUGIN_MARKETPLACE_GUIDE.md).

## Adding a New Skill

See [CLAUDE.md](CLAUDE.md) for comprehensive development guidance and the existing skills in `static/marketplace/skills/` for examples.

**Quick steps:**
1. Create a new directory: `static/marketplace/skills/<skill-name>/` (use gerund form: `generating-*`, `processing-*`)
2. Add a `SKILL.md` file with YAML frontmatter and instructions
3. Add supporting files (scripts, templates, resources) as needed
4. Update `.claude-plugin/marketplace.json` to add the skill to the appropriate plugin
5. Update [README.md](README.md) Available Plugins & Skills section
6. Update [CHANGELOG.md](CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
7. Test with sample inputs
8. Submit a pull request

**For new plugin groups:** See [CLAUDE.md](CLAUDE.md) section "Creating a New Plugin Group"
**For marketplace configuration:** See [docs/MARKETPLACE_SETUP.md](docs/MARKETPLACE_SETUP.md)

## Repository Structure

```
pds-claude-skills/
├── .claude-plugin/             # Plugin marketplace configuration
│   └── marketplace.json        # Marketplace catalog listing all plugins
├── static/                     # Static marketplace content
│   └── marketplace/            # Marketplace plugins and resources
│       └── skills/             # All plugin skills organized here
│           ├── generating-release-notes/    # Release notes generation
│           │   ├── .claude-plugin/plugin.json
│           │   ├── SKILL.md
│           │   ├── templates/
│           │   └── resources/
│           ├── creating-pds-issues/         # GitHub issue creation
│           │   ├── .claude-plugin/plugin.json
│           │   ├── SKILL.md
│           │   ├── scripts/
│           │   └── resources/
│           ├── sonarcloud-security-audit/   # Security audit
│           │   ├── .claude-plugin/plugin.json
│           │   ├── SKILL.md
│           │   └── scripts/
│           ├── sonarcloud-security-triage/  # Security triage
│           │   ├── .claude-plugin/plugin.json
│           │   ├── SKILL.md
│           │   └── scripts/
│           └── shared-resources/            # Shared across plugins
│               └── pds-labels.yaml
├── docs/                       # Documentation
│   ├── history/                # AI session histories
│   ├── MARKETPLACE_SETUP.md    # GitHub configuration guide
│   ├── PLUGIN_MARKETPLACE_GUIDE.md  # Comprehensive install guide
│   └── PRODUCTS_README.md      # Product mapping documentation
├── .github/                    # GitHub configuration
│   └── ISSUE_TEMPLATE/         # Issue templates
├── backup/                     # Deprecated/experimental skills
├── CLAUDE.md                   # Developer guidance for Claude Code
├── CONTRIBUTING.md             # Contribution guidelines
├── README.md                   # This file (marketplace overview)
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

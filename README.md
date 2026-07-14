<hr>

<div align="center">

<h1 align="center">PDS Claude Code Plugin Marketplace</h1>

</div>

<pre align="center">Specialized AI workflow plugins for NASA Planetary Data System in Claude Code</pre>

[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue)](https://nasa-ammos.github.io/slim/)
![Marketplace](https://img.shields.io/badge/marketplace-1-blue)
![Skills](https://img.shields.io/badge/skills-9-brightgreen)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Marketplace-purple)](https://claude.ai/code)

This repository is a **Claude Code plugin marketplace** for NASA's Planetary Data System (PDS) Engineering Node. It distributes 8 specialized AI agents that automate complex workflows within the [Claude Code CLI environment](https://claude.ai/code). Each skill is installed individually from the `@pds-agent-skills` marketplace.

**🔌 Marketplace:** `pds-agent-skills` — GitHub workflows • SonarCloud security • Dependabot security

## Table of Contents

- [What are Claude Code Skills?](#what-are-claude-code-skills)
- [Available Skills](#available-skills)
- [Installation](#installation)
  - [🆕 Recommended: Plugin Marketplace](#-recommended-plugin-marketplace-easy-updates--version-management)
  - [Alternative: Manual Installation (Legacy)](#alternative-manual-installation-legacy)
- [Troubleshooting](#troubleshooting)
- [Using Plugins](#using-plugins)
- [Adding a New Skill](#adding-a-new-skill)
- [Updating an Existing Skill](#updating-an-existing-skill)
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

### 🔌 GitHub Workflow Skills

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| **[generating-release-notes](static/marketplace/skills/generating-release-notes/SKILL.md)** | Generate structured GitHub release notes with breaking changes, categorization, and upload | Software releases, changelogs, version announcements |
| **[generating-accomplishments](static/marketplace/skills/generating-accomplishments/SKILL.md)** | Generate PDS accomplishment status reports from activity.json or live lasso-issues data, grouped by product team | Sprint reports, quarterly reports, annual accomplishments, status updates |
| **[creating-pds-issues](static/marketplace/skills/creating-pds-issues/SKILL.md)** | Create GitHub issues using NASA-PDS organizational templates | Bug reports, feature requests, tasks, vulnerabilities, release themes |
| **[creating-pds-pull-requests](static/marketplace/skills/creating-pds-pull-requests/SKILL.md)** | Create GitHub pull requests with auto-detection of repo/branch, issue linking, reviewer assignment, and label management | Opening PRs, submitting code changes, linking issues to PRs, draft PRs |

### 🔒 Security Workflow Skills

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| **[sonarcloud-security-exporting](static/marketplace/skills/sonarcloud-security-exporting/SKILL.md)** | Export SonarCloud security issues for NASA PDS repositories to CSV | Security audits, vulnerability reports, data export |
| **[sonarcloud-security-triaging](static/marketplace/skills/sonarcloud-security-triaging/SKILL.md)** | Analyze security issues and suggest triage decisions with code context and explanations | Security review, making triage decisions, identifying false positives |
| **[sonarcloud-security-updating](static/marketplace/skills/sonarcloud-security-updating/SKILL.md)** | Apply triage decisions to SonarCloud by bulk-updating security issue statuses and comments | Applying triage outcomes, bulk remediation, compliance tracking |
| **[dependabot-alerts-exporting](static/marketplace/skills/dependabot-alerts-exporting/SKILL.md)** | Export GitHub Dependabot dependency vulnerability alerts for NASA PDS repositories to JSON | Dependency audits, CVE exports, vulnerability reports |
| **[dependabot-alerts-triaging](static/marketplace/skills/dependabot-alerts-triaging/SKILL.md)** | Analyze Dependabot alerts and suggest triage decisions with exploitability assessment | CVE triage, dependency review, identifying false positives |

**Total:** 9 production-ready skills in the `@pds-agent-skills` marketplace

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
/plugin marketplace add NASA-PDS/pds-agent-skills
```

**Install individual skills as needed:**
```bash
# List available skills
/plugin list @pds-agent-skills

# GitHub workflow skills
/plugin install generating-release-notes@pds-agent-skills
/plugin install creating-pds-issues@pds-agent-skills
/plugin install creating-pds-pull-requests@pds-agent-skills

# Security skills (SonarCloud + Dependabot)
/plugin install sonarcloud-security-exporting@pds-agent-skills
/plugin install sonarcloud-security-triaging@pds-agent-skills
/plugin install sonarcloud-security-updating@pds-agent-skills
/plugin install dependabot-alerts-exporting@pds-agent-skills
/plugin install dependabot-alerts-triaging@pds-agent-skills

# Or install all 9 skills at once
/plugin install generating-release-notes@pds-agent-skills generating-accomplishments@pds-agent-skills creating-pds-issues@pds-agent-skills creating-pds-pull-requests@pds-agent-skills sonarcloud-security-exporting@pds-agent-skills sonarcloud-security-triaging@pds-agent-skills sonarcloud-security-updating@pds-agent-skills dependabot-alerts-exporting@pds-agent-skills dependabot-alerts-triaging@pds-agent-skills
```

**Update to latest versions:**
```bash
/plugin marketplace update pds-agent-skills
/plugin update generating-release-notes@pds-agent-skills generating-accomplishments@pds-agent-skills creating-pds-issues@pds-agent-skills creating-pds-pull-requests@pds-agent-skills sonarcloud-security-exporting@pds-agent-skills sonarcloud-security-triaging@pds-agent-skills sonarcloud-security-updating@pds-agent-skills dependabot-alerts-exporting@pds-agent-skills dependabot-alerts-triaging@pds-agent-skills
```

#### Option B: Local/Internal Installation

For internal use, air-gapped environments, or testing before publishing:

**Clone the repository first:**
```bash
# Clone to a local directory
git clone https://github.com/NASA-PDS/pds-agent-skills.git ~/pds-plugins

# Or for internal use, clone from your internal git server
git clone https://git.your-org.com/pds/pds-agent-skills.git ~/pds-plugins
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

**Install skills:**
```bash
# List available skills (marketplace name will be auto-generated from path)
/plugin list @pds-plugins

# Install individual skills (same names, different marketplace suffix)
/plugin install generating-release-notes@pds-plugins
/plugin install sonarcloud-security-triaging@pds-plugins
# ... repeat for each skill as needed
```

**Update from local marketplace:**
```bash
# Pull latest changes first
cd ~/pds-plugins
git pull

# Then update the marketplace in Claude Code
/plugin marketplace update pds-plugins
/plugin update generating-release-notes@pds-plugins creating-pds-issues@pds-plugins # ... etc
```

#### Option C: Private Git Repository

For private organizational repositories:

```bash
# Add private repository with authentication
/plugin marketplace add https://git.your-org.com/pds/pds-agent-skills.git

# Or use SSH
/plugin marketplace add git@github.com:your-org/pds-agent-skills.git
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
git clone https://github.com/NASA-PDS/pds-agent-skills.git .claude/skills/pds

# Commit to version control
git add .claude/skills/pds
git commit -m "Add PDS Claude Code skills"
```

**Or add as a git submodule** (recommended for easier updates):

```bash
cd your-project
mkdir -p .claude/skills
git submodule add https://github.com/NASA-PDS/pds-agent-skills.git .claude/skills/pds
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
git clone https://github.com/NASA-PDS/pds-agent-skills.git ~/.claude/skills/pds
```

**Update personal skills:**

```bash
cd ~/.claude/skills/pds
git pull
```

#### Option 3: Direct Git Reference

**Deprecated**: Use the plugin marketplace method instead. Direct git references are kept for backwards compatibility only.

## Troubleshooting

### Issue: "Failed to load marketplace" or "Invalid schema" Error

**Symptoms:**
```bash
/plugin install generating-release-notes@pds-agent-skills
⎿  Failed to load marketplace "claude-plugins-official" from source (github): Failed to parse
   marketplace file at .../claude-plugins-official/.claude-plugin/marketplace.json: Invalid schema
```

**Cause:** The official Claude plugins marketplace (`claude-plugins-official`) may have a corrupted or outdated schema that prevents plugin installation.

**Solution 1: Remove and re-add the official marketplace**

```bash
# Remove the corrupted marketplace
/plugin marketplace remove claude-plugins-official

# Try to re-add it (if this fails, proceed to Solution 2)
/plugin marketplace add anthropics/claude-plugins-official
```

**Solution 2: Install skills without the official marketplace**

The PDS skills can be installed independently without the official marketplace:

```bash
# Remove the corrupted marketplace
/plugin marketplace remove claude-plugins-official

# Install PDS skills directly (example — repeat for each skill)
/plugin install generating-release-notes@pds-agent-skills
/plugin install sonarcloud-security-triaging@pds-agent-skills
```

**Solution 3: Manually clean up the marketplace directory**

If the above solutions don't work:

```bash
# Remove the corrupted marketplace directory
rm -rf ~/.claude/plugins/marketplaces/claude-plugins-official

# Update your PDS marketplace
/plugin marketplace update pds-agent-skills

# Install PDS skills (example — repeat for each skill)
/plugin install generating-release-notes@pds-agent-skills
/plugin install sonarcloud-security-triaging@pds-agent-skills
```

### Issue: Skill Not Found

**Symptoms:**
```bash
/plugin install generating-release-notes@pds-agent-skills
Error: Plugin not found
```

**Solution:** Ensure the marketplace is added and updated:

```bash
# Add the marketplace if not already added
/plugin marketplace add NASA-PDS/pds-agent-skills

# Update the marketplace to fetch latest skill catalog
/plugin marketplace update pds-agent-skills

# List available skills to verify
/plugin list @pds-agent-skills

# Install the skill
/plugin install generating-release-notes@pds-agent-skills
```

### Issue: Marketplace Name Mismatch

**Problem:** When adding from GitHub, the marketplace name is `pds-agent-skills` (derived from the repository name), not `pds-claude-skills`.

**Solution:** Always use `pds-agent-skills` as the marketplace identifier:

```bash
# Correct
/plugin install generating-release-notes@pds-agent-skills

# Incorrect (will fail)
/plugin install generating-release-notes@pds-claude-skills
```

### Verify Installation

To confirm skills are installed correctly:

```bash
# Check installed skills
/plugin list

# Should show each installed skill, e.g.:
# ✓ generating-release-notes@pds-agent-skills
# ✓ creating-pds-issues@pds-agent-skills
# ✓ sonarcloud-security-triaging@pds-agent-skills
# ...

# View installation details
cat ~/.claude/plugins/installed_plugins.json
```

### Getting Help

If issues persist:
1. Check Claude Code version: `claude --version` (requires v1.0.0+)
2. Review Claude Code logs: `~/.claude/logs/`
3. Open an issue in this repository with error details
4. Contact PDS Engineering Node team

## Using Plugins

Once installed via the plugin marketplace, plugins are **automatically available** in Claude Code.

**How it works:**

1. **Install plugins** from the marketplace (see Installation above)
2. **Open Claude Code** in your project directory (CLI) or start a project in Claude Desktop
3. **Describe your task** naturally — Claude will autonomously use relevant plugins based on your request
4. **Provide necessary inputs** as described in each plugin's documentation

### pds-agent-skills examples

```bash
# Generate release notes for a specific version
claude "Generate release notes for NASA-PDS/doi-service version v1.6.0"

# Create a GitHub issue from a template
claude "Create a bug report issue in NASA-PDS/registry"

# Open a pull request for the current branch
claude "Create a PR for this branch, closes issue #42"
```

### security-skills examples

The SonarCloud skills follow a three-step pipeline: **export → triage → update**.

**Export all security issues for NASA PDS:**
```
Export all SonarCloud security issues for nasa-pds to JSON in ~/security-audit
```

**Triage the exported issues:**
```
Help me triage the SonarCloud issues in ~/security-audit/sonarcloud-security-issues-20260418.json
```

**Apply approved decisions to SonarCloud:**
```
Apply the triage decisions from ~/security-audit/sonarcloud-security-triaged-20260418.json — dry run first
```

**Run the full pipeline in one session:**
```
Do a complete SonarCloud security audit and triage for NASA PDS.
Export all issues to JSON, triage them repository by repository, then apply approved decisions.
Save everything to ~/pds-security-audit.
```

> **Prerequisites for security-skills:** Node.js v18+. SonarCloud skills require `SONARCLOUD_TOKEN`; Dependabot skills require `GITHUB_TOKEN` with `security_events` scope. See the [SonarCloud Skills Guide](docs/SECURITY_SKILLS_GUIDE.md) for setup instructions and a full list of example prompts.

### Managing Skills

```bash
# List installed skills
/plugin list

# List available skills in marketplace
/plugin list @pds-agent-skills

# Update a specific skill
/plugin update sonarcloud-security-triaging@pds-agent-skills

# Uninstall a skill
/plugin uninstall sonarcloud-security-triaging@pds-agent-skills
```

**📚 Detailed guides:**
- [SonarCloud Skills Guide](docs/SECURITY_SKILLS_GUIDE.md) — installation, example prompts, full workflow, troubleshooting
- [Plugin Marketplace Installation Guide](docs/PLUGIN_MARKETPLACE_GUIDE.md) — local, private repo, and air-gapped install scenarios

## Adding a New Skill

This repository is **registry-driven**: contributors edit one source-of-truth file (`static/data/registry.json`), and the Claude Code plugin manifest (`.claude-plugin/marketplace.json`) is regenerated from it by the build. **Do not edit `marketplace.json` by hand** — it is a build artifact, and a CI check rejects any drift.

See [CLAUDE.md](CLAUDE.md) for deeper development guidance, and the existing skills under `static/marketplace/skills/` for examples.

**Quick steps:**

1. **Create the skill folder** — `static/marketplace/skills/<skill-name>/` (use gerund form: `generating-*`, `processing-*`, `creating-*`).
2. **Add `SKILL.md`** with YAML frontmatter (`name`, `description`) and the full instructions. Include any supporting `scripts/`, `resources/`, or `templates/` as needed.
3. **Add an entry** to the `skills` array in `static/data/registry.json`:

   ```json
   {
     "name": "<skill-name>",
     "displayName": "Human Readable Name",
     "description": "What it does and when to use it",
     "category": "development-workflow",
     "tags": ["github", "automation", "pds"],
     "example": "An example request a user might make",
     "lastUpdated": "YYYY-MM-DD"
   }
   ```

   Author only the semantic fields above. The build derives `type`, `skill_file_url`, and `zip_file_path` automatically — do not write them by hand. Optional passthrough fields: `dependencies`, `version`, `author`, `homepage`, `repository`, `license`. Categories are defined in the same file under `metadata.categoryIcons`; add a new `"<category>": "<emoji>"` entry there to introduce a category.
4. **Regenerate the manifest:**

   ```bash
   npm run prebuild
   ```

   This runs `src/conf/generate-marketplace.js`, which writes `.claude-plugin/marketplace.json` from the registry. The `registry-check` CI workflow fails if the committed manifest drifts out of sync.
5. **Update [CHANGELOG.md](CHANGELOG.md)** following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
6. **Test locally** — `npm run start` (dev server) or `npm run build && npm run serve` (production preview).
7. **Commit both** `static/data/registry.json` and `.claude-plugin/marketplace.json`, then submit a pull request.

**For marketplace configuration:** See [docs/MARKETPLACE_SETUP.md](docs/MARKETPLACE_SETUP.md).

## Updating an Existing Skill

The same registry-driven flow applies — edit `static/data/registry.json` (and the skill files), then regenerate.

**Change a skill's behavior** — edit files under `static/marketplace/skills/<skill-name>/` (its `SKILL.md`, scripts, templates, resources). No further metadata work is needed unless the change affects how the skill is described.

**Change how the skill appears in the catalog** — edit that skill's entry in `static/data/registry.json`:

- `displayName` — human-readable name shown on the catalog card
- `description` — short summary shown in the card and used for skill discovery
- `category` — where the skill appears in the category tree (e.g. `development-workflow`, `security`)
- `tags` — filter pills on the card
- `example` — example user request shown beneath the install instructions
- `dependencies`, `version`, `author`, `homepage`, `repository`, `license` — optional metadata

**Bump the timestamp** — whenever a skill changes in any meaningful way, set its `lastUpdated` to today's date in `YYYY-MM-DD` format (e.g. `"2026-05-22"`). The catalog sorts and labels skills by this field, so an accurate timestamp keeps the marketplace's "what changed recently" view truthful.

**Regenerate the manifest:**

```bash
npm run prebuild
```

**Remove a skill** — delete its folder under `static/marketplace/skills/` and its entry from `static/data/registry.json`, then run `npm run prebuild`.

Update [CHANGELOG.md](CHANGELOG.md) and commit both `static/data/registry.json` and the updated `.claude-plugin/marketplace.json`.

## Repository Structure

```
pds-agent-skills/
├── .claude-plugin/
│   └── marketplace.json        # Claude Code plugin manifest — GENERATED from static/data/registry.json
├── static/
│   ├── data/
│   │   └── registry.json       # Hand-authored SOURCE OF TRUTH (marketplace identity + all skills)
│   ├── img/                    # Logo, favicon, hero images
│   └── marketplace/
│       └── skills/             # All skill content (one folder per skill)
│           ├── creating-pds-issues/
│           │   ├── SKILL.md
│           │   ├── scripts/
│           │   └── resources/
│           ├── creating-pds-pull-requests/
│           │   ├── SKILL.md
│           │   └── scripts/
│           ├── generating-release-notes/
│           │   ├── SKILL.md
│           │   ├── templates/
│           │   └── resources/
│           ├── dependabot-alerts-exporting/
│           │   ├── SKILL.md
│           │   └── scripts/
│           ├── dependabot-alerts-triaging/
│           │   ├── SKILL.md
│           │   └── scripts/
│           ├── sonarcloud-security-exporting/
│           │   ├── SKILL.md
│           │   └── scripts/
│           ├── sonarcloud-security-triaging/
│           │   └── SKILL.md
│           ├── sonarcloud-security-updating/
│           │   ├── SKILL.md
│           │   └── scripts/
│           └── shared-resources/
│               └── pds-labels.yaml
├── src/
│   ├── conf/
│   │   └── generate-marketplace.js  # Generates marketplace.json from registry.json
│   ├── components/             # Marketplace website (React/Docusaurus)
│   ├── pages/                  # Website pages
│   └── css/                    # Styles
├── docs/
│   ├── about/                  # Marketplace "About" page (Docusaurus)
│   ├── contribute/             # "Contribute" docs (Docusaurus)
│   ├── faq/                    # FAQ (Docusaurus)
│   ├── history/                # AI session histories
│   ├── MARKETPLACE_SETUP.md    # GitHub configuration guide
│   ├── PLUGIN_MARKETPLACE_GUIDE.md  # Comprehensive install guide
│   ├── SECURITY_SKILLS_GUIDE.md     # Security skills usage guide
│   └── PRODUCTS_README.md      # Product mapping documentation
├── .github/
│   ├── CODEOWNERS
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── workflows/              # CI — secrets-detection, registry-check, Pages deploy
├── scripts/
│   └── detect_secrets_baseline.sh
├── docusaurus.config.js        # Marketplace website configuration
├── package.json                # Node dependencies for the website
├── sidebars.js                 # Website docs sidebar layout
├── CLAUDE.md                   # Developer guidance for Claude Code
├── CONTRIBUTING.md             # Contribution guidelines
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

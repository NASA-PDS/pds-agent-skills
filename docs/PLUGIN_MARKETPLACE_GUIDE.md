# Plugin Marketplace Installation Guide

This guide covers all installation methods for the PDS Claude Code Plugin Marketplace, including public, private, and local/internal deployment scenarios.

## Table of Contents

- [Quick Start (Public GitHub)](#quick-start-public-github)
- [Local/Internal Installation](#localinternal-installation)
- [Private Repository Installation](#private-repository-installation)
- [Enterprise/Air-Gapped Installation](#enterpriseair-gapped-installation)
- [Team Configuration](#team-configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start (Public GitHub)

For the standard case when the repository is publicly available on GitHub:

```bash
# Add marketplace
/plugin marketplace add NASA-PDS/pds-claude-skills

# List available plugins
/plugin list @pds

# Install plugins
/plugin install generating-release-notes@pds
/plugin install creating-pds-issues@pds
/plugin install sonarcloud-security-audit@pds
/plugin install sonarcloud-security-triage@pds

# Update marketplace and plugins
/plugin marketplace update pds
/plugin update generating-release-notes@pds
```

---

## Local/Internal Installation

### Use Case
- Testing before publishing
- Internal/proprietary plugins
- Air-gapped environments
- Development and testing

### Method 1: Clone + Add Local Path

```bash
# Clone repository to local directory
git clone https://github.com/NASA-PDS/pds-claude-skills.git ~/pds-plugins

# Add local marketplace (from OUTSIDE the directory)
/plugin marketplace add ~/pds-plugins

# Or use full absolute path
/plugin marketplace add /Users/yourname/pds-plugins
```

**Important**: Run `/plugin marketplace add` from **outside** the marketplace directory. Don't `cd` into it first.

**Marketplace name**: Claude Code auto-generates a name from the directory path (e.g., `pds-plugins`)

**Install plugins:**
```bash
# List available
/plugin list @pds-plugins

# Install
/plugin install generating-release-notes@pds-plugins
/plugin install creating-pds-issues@pds-plugins
```

**Update local marketplace:**
```bash
# Pull latest changes
cd ~/pds-plugins
git pull origin main

# Refresh marketplace in Claude Code
/plugin marketplace update pds-plugins

# Update individual plugins
/plugin update generating-release-notes@pds-plugins
```

### Method 2: Relative Path (Project-Specific)

For project-specific plugin configurations:

```bash
# From your project directory
cd /path/to/your-project

# Clone plugins to project directory
git clone https://github.com/NASA-PDS/pds-claude-skills.git .claude/pds-plugins

# Add marketplace (use absolute path, not relative)
cd .claude/pds-plugins
/plugin marketplace add $(pwd)

# Install plugins
/plugin install generating-release-notes@pds-plugins
```

**Benefits:**
- ✅ Project-isolated plugin versions
- ✅ Team members get same versions
- ✅ Commit `.claude/pds-plugins/` to version control

**Add to .gitignore (optional):**
```gitignore
# If you want each team member to manage their own
.claude/pds-plugins/
```

---

## Private Repository Installation

### Use Case
- Proprietary/internal plugins
- Organization-specific tools
- Private GitHub/GitLab/Bitbucket repos

### GitHub Private Repository

```bash
# Authenticate with GitHub first
gh auth login

# Add private marketplace
/plugin marketplace add your-org/pds-claude-skills

# Or use full URL
/plugin marketplace add https://github.com/your-org/pds-claude-skills.git

# Or use SSH
/plugin marketplace add git@github.com:your-org/pds-claude-skills.git
```

**For automatic updates**, set GitHub token:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
# Or add to ~/.bashrc or ~/.zshrc
```

### GitLab Private Repository

```bash
# Authenticate with GitLab
gl auth login

# Add marketplace
/plugin marketplace add https://gitlab.com/your-org/pds-claude-skills.git

# Set token for auto-updates
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

### Bitbucket Private Repository

```bash
# Add marketplace
/plugin marketplace add https://bitbucket.org/your-org/pds-claude-skills.git

# Set token for auto-updates
export BITBUCKET_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

### Self-Hosted Git Server

```bash
# Add marketplace from internal git server
/plugin marketplace add https://git.your-company.com/pds/pds-claude-skills.git

# Or use SSH
/plugin marketplace add git@git.your-company.com:pds/pds-claude-skills.git
```

Make sure your git credentials are configured (SSH keys or credential helper).

---

## Enterprise/Air-Gapped Installation

### Scenario: No Internet Access

**Step 1: Transfer repository to air-gapped environment**
```bash
# On internet-connected machine
git clone --mirror https://github.com/NASA-PDS/pds-claude-skills.git pds-plugins.git
tar -czf pds-plugins.tar.gz pds-plugins.git

# Transfer pds-plugins.tar.gz to air-gapped machine via approved method
```

**Step 2: Set up on air-gapped machine**
```bash
# Extract
tar -xzf pds-plugins.tar.gz
git clone pds-plugins.git ~/pds-plugins

# Add local marketplace
/plugin marketplace add ~/pds-plugins

# Install plugins
/plugin list @pds-plugins
/plugin install generating-release-notes@pds-plugins
```

**Step 3: Update process**
```bash
# Periodically transfer updated repository
# Extract to same location
# Claude Code will detect changes

/plugin marketplace update pds-plugins
```

---

## Team Configuration

### Require Marketplace for Team

Add to project's `.claude/settings.json` to prompt team members automatically:

```json
{
  "extraKnownMarketplaces": {
    "pds": {
      "source": {
        "source": "github",
        "repo": "NASA-PDS/pds-claude-skills"
      }
    }
  },
  "enabledPlugins": {
    "generating-release-notes@pds": true,
    "creating-pds-issues@pds": true
  }
}
```

**For local/internal:**
```json
{
  "extraKnownMarketplaces": {
    "pds-plugins": {
      "source": {
        "source": "url",
        "url": "https://git.your-org.com/pds/pds-claude-skills.git"
      }
    }
  }
}
```

### Restrict to Approved Marketplaces Only

For organizations requiring strict control, use managed settings:

```json
{
  "strictKnownMarketplaces": [
    {
      "source": "github",
      "repo": "NASA-PDS/pds-claude-skills"
    },
    {
      "source": "url",
      "url": "https://git.your-company.com/approved-plugins.git"
    }
  ]
}
```

This prevents users from adding unauthorized marketplaces.

---

## Troubleshooting

### "Marketplace not found" or "Marketplace file not found"

**Cause**: Path is incorrect or relative paths not resolving properly

**Solution**:
```bash
# Verify marketplace.json exists
ls -la ~/pds-plugins/.claude-plugin/marketplace.json

# Always use absolute paths (not relative paths like '.')
/plugin marketplace add /Users/yourname/pds-plugins

# Or use $(pwd) to get absolute path
cd ~/pds-plugins
/plugin marketplace add $(pwd)

# For git URLs, verify you have access
git clone https://github.com/NASA-PDS/pds-claude-skills.git test-clone
```

**Known Issues**:
- Relative paths like `.` or `./` don't work correctly with `/plugin marketplace add`
- Must run command from **outside** the marketplace directory (don't cd into it first)
- Always use absolute paths or reference the directory from its parent

### "Authentication failed" (Private Repos)

**Solution**:
```bash
# Verify git authentication works
git clone https://github.com/your-org/pds-claude-skills.git test-clone

# For GitHub
gh auth status
gh auth login

# Set token for auto-updates
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### "Plugin installation failed"

**Cause**: Plugin source path doesn't exist

**Solution**:
```bash
# Verify marketplace structure
cd ~/pds-plugins
ls -la generating-release-notes/SKILL.md
ls -la .claude-plugin/marketplace.json

# Validate marketplace
claude plugin validate .
```

### Relative paths don't work

**Cause**: Using URL-based marketplace (not git-based)

**Solution**: Use git URL instead of direct marketplace.json URL:
```bash
# ❌ Don't use
/plugin marketplace add https://example.com/marketplace.json

# ✅ Use git URL
/plugin marketplace add https://github.com/your-org/repo.git
```

### Updates not working

**Cause**: Marketplace source hasn't changed

**Solution**:
```bash
# For local marketplaces, pull first
cd ~/pds-plugins
git pull

# Then update marketplace
/plugin marketplace update pds-plugins

# Check installed version
/plugin list
```

---

## Comparison: Installation Methods

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **GitHub Public** | Open source, public distribution | Easy, automatic updates | Requires internet |
| **Local Path** | Development, testing, air-gapped | No internet needed | Manual git pull for updates |
| **Private Git** | Internal/proprietary tools | Secure, version controlled | Requires authentication |
| **Manual (git clone)** | Legacy, simple setup | No dependencies | No plugin management features |

---

## Next Steps

After installation:
1. **Verify plugins**: `/plugin list`
2. **Test a plugin**: Try generating release notes or creating an issue
3. **Configure project**: Add marketplace to `.claude/settings.json`
4. **Share with team**: Document installation method for your team

## Support

- **Documentation**: See [CLAUDE.md](../CLAUDE.md) for developer guidance
- **Issues**: Report problems at https://github.com/NASA-PDS/pds-claude-skills/issues
- **Plugin Docs**: https://code.claude.com/docs/en/plugin-marketplaces

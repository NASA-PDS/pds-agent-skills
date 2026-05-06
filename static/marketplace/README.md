# PDS Plugin Marketplace

This directory contains all plugins distributed through the PDS Claude Code Plugin Marketplace (`pds-agent-skills`).

## Plugin Structure

The marketplace contains **2 plugins** organized by theme:

### 1. pds-agent-skills
GitHub workflow automation for NASA PDS
- **generating-release-notes** - Generate structured GitHub release notes
- **creating-pds-issues** - Create issues using PDS organizational templates
- **creating-pds-pull-requests** - Create pull requests with auto-detection and issue linking

### 2. security-skills
Security vulnerability workflow automation for NASA PDS (SonarCloud + Dependabot)
- **sonarcloud-security-exporting** - Export SonarCloud security issues to CSV/JSON
- **sonarcloud-security-triaging** - Analyze SonarCloud issues and suggest triage decisions
- **sonarcloud-security-updating** - Apply triage decisions back to SonarCloud in bulk
- **dependabot-alerts-exporting** - Export GitHub Dependabot vulnerability alerts to JSON
- **dependabot-alerts-triaging** - Analyze Dependabot CVEs and suggest triage decisions

## Directory Structure

```
marketplace/
└── skills/                    # All skills organized by plugin
    ├── generating-release-notes/          # pds-agent-skills
    │   ├── SKILL.md
    │   └── ...
    ├── creating-pds-issues/               # pds-agent-skills
    │   ├── SKILL.md
    │   └── ...
    ├── creating-pds-pull-requests/        # pds-agent-skills
    │   ├── SKILL.md
    │   └── ...
    ├── sonarcloud-security-exporting/     # security-skills
    │   ├── SKILL.md
    │   └── scripts/
    ├── sonarcloud-security-triaging/      # security-skills
    │   ├── SKILL.md
    │   └── scripts/
    ├── sonarcloud-security-updating/      # security-skills
    │   ├── SKILL.md
    │   └── scripts/
    ├── dependabot-alerts-exporting/       # security-skills
    │   ├── SKILL.md
    │   └── scripts/
    ├── dependabot-alerts-triaging/        # security-skills
    │   ├── SKILL.md
    │   └── scripts/
    └── shared-resources/                  # Shared across all plugins
        └── pds-labels.yaml
```

## How Plugins Reference Skills

Both plugins point to the same `source: ./static/marketplace/` directory but specify different skill subsets:

**pds-agent-skills:**
```json
{
  "skills": [
    "./skills/generating-release-notes",
    "./skills/creating-pds-issues",
    "./skills/creating-pds-pull-requests"
  ]
}
```

**security-skills:**
```json
{
  "skills": [
    "./skills/sonarcloud-security-exporting",
    "./skills/sonarcloud-security-triaging",
    "./skills/sonarcloud-security-updating",
    "./skills/dependabot-alerts-exporting",
    "./skills/dependabot-alerts-triaging"
  ]
}
```

## Future Extensions

This structure is designed to accommodate future plugin types:
- `agents/` - Specialized AI agents (future)
- `hooks/` - Event handlers (future)
- `commands/` - Custom commands (future)

## Adding New Skills

When adding a new skill to an existing plugin:

1. Create a new directory under `skills/` with your skill name
2. Create `SKILL.md` with skill definition
3. Update `/.claude-plugin/marketplace.json` to add the skill path to the appropriate plugin's `skills` array
4. Update documentation (README.md, CLAUDE.md)

## Creating New Plugins

To create a new thematic plugin group:

1. Add skill directories under `skills/` as described above
2. Add a new plugin entry to `/.claude-plugin/marketplace.json` with:
   - Unique plugin `name`
   - Same `source: ./static/marketplace/`
   - List of skill paths in `skills` array
3. Update documentation

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

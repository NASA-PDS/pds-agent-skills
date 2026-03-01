# PDS Plugin Marketplace

This directory contains all plugins distributed through the PDS Claude Code Plugin Marketplace (`pds-agent-skills`).

## Plugin Structure

The marketplace contains **2 plugins** organized by theme:

### 1. pds-github-skills
GitHub workflow automation for NASA PDS
- **generating-release-notes** - Generate structured GitHub release notes
- **creating-pds-issues** - Create issues using PDS organizational templates

### 2. sonarcloud-skills
SonarCloud security workflow automation for NASA PDS
- **sonarcloud-security-audit** - Audit security issues and export to CSV
- **sonarcloud-security-triage** - Apply triage decisions in bulk

## Directory Structure

```
marketplace/
├── .claude-plugin/            # (Could contain unified plugin manifest, currently in individual skills)
└── skills/                    # All skills organized by plugin
    ├── generating-release-notes/      # pds-github-skills
    │   ├── .claude-plugin/plugin.json
    │   ├── SKILL.md
    │   └── ...
    ├── creating-pds-issues/           # pds-github-skills
    │   ├── .claude-plugin/plugin.json
    │   ├── SKILL.md
    │   └── ...
    ├── sonarcloud-security-audit/     # sonarcloud-skills
    │   ├── .claude-plugin/plugin.json
    │   ├── SKILL.md
    │   └── ...
    ├── sonarcloud-security-triage/    # sonarcloud-skills
    │   ├── .claude-plugin/plugin.json
    │   ├── SKILL.md
    │   └── ...
    └── shared-resources/              # Shared across all plugins
        └── pds-labels.yaml
```

## How Plugins Reference Skills

Both plugins point to the same `source: ./static/marketplace/` directory but specify different skill subsets:

**pds-github-skills:**
```json
{
  "skills": [
    "./skills/generating-release-notes",
    "./skills/creating-pds-issues"
  ]
}
```

**sonarcloud-skills:**
```json
{
  "skills": [
    "./skills/sonarcloud-security-audit",
    "./skills/sonarcloud-security-triage"
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
2. Add `.claude-plugin/plugin.json` manifest (optional, for skill metadata)
3. Create `SKILL.md` with skill definition
4. Update `/.claude-plugin/marketplace.json` to add the skill path to the appropriate plugin's `skills` array
5. Update documentation (README.md, SKILLS_CATALOG.md, CLAUDE.md)

## Creating New Plugins

To create a new thematic plugin group:

1. Add skill directories under `skills/` as described above
2. Add a new plugin entry to `/.claude-plugin/marketplace.json` with:
   - Unique plugin `name`
   - Same `source: ./static/marketplace/`
   - List of skill paths in `skills` array
3. Update documentation

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

---
sidebar_position: 1
---

# Contribute a Skill

Want to share your expertise? Here's how to contribute a skill, agent, or
MCP server to the PDS Agent Marketplace.

## Quick Start

**3 simple steps:**

1. **Create an issue** to discuss your idea
2. **Build your contribution** — add the content and a registry entry
3. **Submit a pull request** — we'll review and help you merge it

---

## Step 1: Create an Issue

Before coding, discuss your idea by opening an issue on the project's GitHub
repository. This helps the community provide early feedback and avoid duplicate
work.

---

## Step 2: Build Your Contribution

### Add the content folder

Create your skill under `static/marketplace/`:

```
static/marketplace/skills/your-skill-name/
├── SKILL.md      # Main documentation (required)
├── scripts/      # Automation scripts (optional)
└── assets/       # Templates, configs, docs (optional)
```

Agents go under `static/marketplace/agents/`, MCP servers under
`static/marketplace/mcp-servers/`.

### Add a registry entry — the source of truth

This framework is **registry-driven**. You hand-author
**`static/data/registry.json`**, and the Claude Code plugin manifest
(`.claude-plugin/marketplace.json`) is **generated from it** by the build. You
never edit `marketplace.json` directly.

Add an entry to the `skills` array (or `agents` / `mcp`) in
`static/data/registry.json`:

```json
{
  "name": "your-skill-name",
  "displayName": "Your Skill Display Name",
  "description": "What it does and when to use it",
  "category": "documentation",
  "tags": ["readme", "documentation", "templates"],
  "example": "Generate a README for this project",
  "lastUpdated": "2026-01-01"
}
```

**You only author the semantic fields.** The build derives the rest:

| Field | Who sets it |
| --- | --- |
| `name`, `displayName`, `description`, `category`, `tags`, `example`, `lastUpdated` | **You** (hand-authored) |
| `dependencies`, `version`, `author`, `homepage`, `repository`, `license` | **You** (optional) |
| `type`, `skill_file_url`, `zip_file_path` | **Build** (derived — do not write them) |

For an **external** MCP server, hand-author a `source` object and/or
`npm_package`, and set `"external_only": true`.

### Regenerate the marketplace manifest

After editing `registry.json`, run:

```bash
npm run prebuild
```

This regenerates `.claude-plugin/marketplace.json` from your registry. Commit
**both** `registry.json` and `marketplace.json` in your pull request — CI checks
that they are in sync.

---

## Step 3: Submit Your Pull Request

1. Fork the repository and clone your fork
2. Work on the `main` branch
3. Push your changes and open a pull request
4. Link related issues and provide a demo link
5. Mark "Ready for review" when complete

**We'll check for:**
- ✅ Clear purpose and documentation
- ✅ A valid registry entry
- ✅ `registry.json` and `marketplace.json` in sync
- ✅ Works with multiple AI tools

---

## Tips for Success

**Do:**
- ✅ Start with a small, focused contribution
- ✅ Get early feedback via issues
- ✅ Run `npm run prebuild` and commit the regenerated manifest
- ✅ Write clear documentation

**Don't:**
- ❌ Edit `.claude-plugin/marketplace.json` by hand
- ❌ Submit large PRs without discussion
- ❌ Duplicate existing solutions
- ❌ Hand-write the derived fields (`type`, `skill_file_url`, `zip_file_path`)

---

**Questions?** Ask in the project's GitHub Discussions or open an issue.

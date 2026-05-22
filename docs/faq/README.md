# Frequently Asked Questions (FAQ)

> _Common questions about the PDS Agent Marketplace and how to get started._

---

### Q: What is the PDS Agent Marketplace?

It is a catalog of AI **skills** that automate common software-engineering
workflows for the [NASA Planetary Data System](https://pds.nasa.gov/). Each skill
teaches an AI coding agent how to perform a PDS-standard task — creating issues
and pull requests, generating release notes, or triaging security findings.

---

### Q: What do I need to use these skills?

An _agentic_ AI coding tool — one that can read/write files and run commands:

- **Claude Code** — command-line AI agent by Anthropic
- **Cursor**, **Windsurf**, **Aider**, and other assistants with skill / MCP support

Browse the [PDS Agent Marketplace catalog](/), open a skill, and click **Install** for instructions.

---

### Q: What skills are available?

The marketplace currently provides eight skills in two categories:

**🔧 Development workflow**
- **Create PDS Issues** — file issues in NASA-PDS repositories using
  organizational templates
- **Create PDS Pull Requests** — open PRs with issue linking, reviewers, and labels
- **Generate Release Notes** — build release notes from merged PRs and issues

**🔒 Security**
- **Export / Triage Dependabot Alerts** — pull dependency vulnerability alerts
  and suggest dismiss/fix/escalate decisions
- **Export / Triage / Update SonarCloud Security Issues** — manage SonarCloud
  vulnerabilities and hotspots end to end

---

### Q: How do I install a skill into Claude Code?

From the marketplace, open a skill and use the **Install** panel. Once the
marketplace is added, skills install with:

```
/plugin install <skill-name>@pds-agent-marketplace
```

---

### Q: How do I contribute a new skill?

Add a skill folder under `static/marketplace/skills/`, add an entry to
`static/data/registry.json`, and run `npm run prebuild`. See
[Contribute a Skill to the PDS Agent Marketplace](/docs/contribute/submit-best-practice)
for the full walkthrough, and the project `README.md` for the quick reference.

---

### Q: Where do these skills come from?

The skills are adapted from the open-source
[NASA-PDS/pds-agent-skills](https://github.com/NASA-PDS/pds-agent-skills)
repository. This marketplace site is built on the open-source
[slim-framework](https://github.com/NASA-AMMOS/slim-framework).

---

### Q: Is this an official PDS data interface?

No. This marketplace automates **software-engineering workflows** for teams that
build and maintain PDS software. To search or download planetary science data,
use [pds.nasa.gov](https://pds.nasa.gov/).

---

## Still have questions?

Open an issue or start a discussion on the project's GitHub repository.

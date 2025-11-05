<hr>

<div align="center">

<h1 align="center">PDS Claude Code Skills</h1>

</div>

<pre align="center">Reusable AI agents for NASA Planetary Data System workflows in Claude Code</pre>

[![SLIM](https://img.shields.io/badge/Best%20Practices%20from-SLIM-blue)](https://nasa-ammos.github.io/slim/)

This repository contains [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills) for NASA's Planetary Data System (PDS) Engineering Node. Skills are specialized AI agents that automate complex tasks within the [Claude Code CLI environment](https://claude.ai/code).

## What are Claude Code Skills?

Claude Code skills are reusable prompts that enable Claude Code to perform specialized tasks autonomously. Each skill is defined by a `SKILL.md` file containing:

- Detailed instructions for task execution
- Input/output specifications
- Style rules and algorithms
- Edge case handling

Skills help automate repetitive or complex workflows, making development more efficient and consistent across the PDS organization.

## Available Skills

### 📝 Release Notes Generator

**Location:** `release-notes/`

Generates structured, user-friendly GitHub release notes from PR/issue data with:

- Automatic categorization (Breaking Changes, New Features, Improvements, Fixes, Security)
- Prominent breaking changes warnings (⚠️)
- Executive summaries in "Highlights" section
- Mandatory GitHub links for all changes
- PDS-specific label mapping
- Optional upload to GitHub releases via `gh` CLI

**Use cases:**
- Creating release notes for PDS software releases
- Generating changelog summaries from GitHub data
- Ensuring consistent release note formatting across PDS projects

See [release-notes/SKILL.md](release-notes/SKILL.md) for detailed documentation.

## Getting Started

### Prerequisites

- [Claude Code CLI](https://claude.ai/code) installed and configured
- For release notes upload functionality: [GitHub CLI (`gh`)](https://cli.github.com) installed and authenticated

### Using Skills

1. Open Claude Code in your project directory
2. Reference the skill by name or provide the necessary inputs as described in each skill's documentation
3. Claude Code will execute the skill autonomously based on the instructions in the `SKILL.md` file

### Adding a New Skill

1. Create a new directory: `<skill-name>/`
2. Add a `SKILL.md` file with:
   ```yaml
   ---
   name: skill-name
   description: Brief description of what the skill does
   ---
   ```
3. Add comprehensive instructions, input/output specs, and style rules
4. Include supporting resources in subdirectories (templates, additional_resources, etc.)
5. Update this README with your new skill in the "Available Skills" section
6. Test thoroughly with sample inputs

See [CLAUDE.md](CLAUDE.md) for detailed development guidance.

## Repository Structure

```
pds-claude-skills/
├── release-notes/          # Release notes generation skill
│   ├── SKILL.md           # Skill definition and instructions
│   ├── templates/         # Release note templates
│   └── additional_resources/  # PDS label mapping and docs
├── CLAUDE.md              # Developer guidance for Claude Code
├── README.md              # This file
└── CHANGELOG.md           # Project changelog
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

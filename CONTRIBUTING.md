# Contributing to PDS Claude Code Skills

Thank you for your interest in contributing to the PDS Claude Code Skills marketplace! This document provides guidelines for contributing new skills, reporting bugs, and improving existing skills.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Contributing a New Skill](#contributing-a-new-skill)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows NASA's open source code of conduct. By participating, you are expected to uphold professional and respectful behavior in all interactions.

## How Can I Contribute?

### 🆕 Contributing a New Skill

The best way to contribute is by adding new skills that help automate PDS workflows! Before creating a new skill:

1. **Check existing skills** in [README.md](README.md#available-plugins--skills) to avoid duplication
2. **Open an issue** using the "New Skill Request" template to discuss your idea
3. **Get feedback** from maintainers before investing significant development time

### 🐛 Reporting Bugs

Found a bug in an existing skill? Please:

1. **Check existing issues** to see if it's already reported
2. **Open a new issue** using the "Bug Report" template
3. **Include details**:
   - Which skill is affected
   - Steps to reproduce the bug
   - Expected vs. actual behavior
   - Claude Code version and environment info

### 💡 Suggesting Enhancements

Have an idea to improve an existing skill?

1. **Open an issue** describing the enhancement
2. **Explain the use case** - why would this be valuable?
3. **Consider backwards compatibility** - will existing users be affected?

## Contributing a New Skill

### Skill Development Process

1. **Plan Your Skill**
   - Define the problem it solves
   - Identify trigger keywords and user prompts
   - Sketch the workflow and required tools
   - Review [CLAUDE.md](CLAUDE.md) for architectural guidance

2. **Create the Skill Directory**
   ```bash
   # Use gerund form (action + -ing) in the marketplace skills directory
   mkdir -p static/marketplace/skills/<action>-<object>
   # Examples: generating-reports, validating-data, deploying-services
   ```

3. **Write SKILL.md**
   ```yaml
   ---
   name: your-skill-name
   description: Brief description that triggers the skill (1-2 sentences)
   ---
   # Your Skill Name

   ## Purpose
   Clear explanation of what this skill does and when to use it.

   ## Prerequisites
   List required tools, API tokens, or setup steps.

   ## Execution Steps
   Step-by-step instructions for Claude Code to autonomously execute this skill.

   ## Examples
   Show example user prompts and expected outputs.
   ```

4. **Add Supporting Files** (if needed)
   - `scripts/` - Node.js scripts for complex operations
   - `resources/` - YAML/JSON configuration files
   - `templates/` - Output templates or examples

5. **Test Your Skill**
   - Install locally: `mkdir -p .claude/skills && ln -s $(pwd) .claude/skills/test`
   - Test with various user prompts
   - Verify error handling and edge cases
   - Ensure it works autonomously without manual intervention

6. **Update Documentation**
   - Add skill path to `.claude-plugin/marketplace.json` in the appropriate plugin's `skills` array
   - Add row to [README.md](README.md) "Available Plugins & Skills" section
   - Update [CLAUDE.md](CLAUDE.md) "Plugin Architecture" section
   - Add entry to [CHANGELOG.md](CHANGELOG.md) under "Unreleased"

### Skill Quality Standards

Your skill should:
- ✅ **Be autonomous** - Execute without requiring manual steps
- ✅ **Handle errors gracefully** - Provide clear error messages
- ✅ **Be well-documented** - Clear prerequisites and execution steps
- ✅ **Follow naming conventions** - Use gerund form (action + -ing)
- ✅ **Include examples** - Show typical user prompts
- ✅ **Be tested** - Verify it works in various scenarios
- ✅ **Be PDS-relevant** - Solve a real NASA PDS workflow problem

### Skills to Avoid

Don't create skills that:
- ❌ Duplicate existing skills
- ❌ Are too generic (not PDS-specific)
- ❌ Require extensive manual configuration
- ❌ Have security implications (credential exposure, destructive operations)
- ❌ Are better suited as general Claude Code features

## Development Guidelines

### Skill Naming Conventions

- **Directory name**: `<verb>-<noun>` in gerund form
  - ✅ `generating-release-notes`
  - ✅ `creating-pds-issues`
  - ❌ `release-notes-generator` (noun form)

- **Skill name (YAML)**: Match directory name exactly
- **Description**: 1-2 sentences, focus on trigger keywords

### File Organization

```
your-skill-name/
├── SKILL.md              # Required: Main skill definition
├── README.md             # Optional: Extended documentation
├── scripts/              # Optional: Helper scripts
│   ├── main-script.mjs   # Primary executable
│   └── README.md         # Script documentation
├── resources/            # Optional: Config files
│   └── config.yaml
└── templates/            # Optional: Output templates
    └── template.md
```

### Node.js Scripts

If your skill includes Node.js scripts:
- Use ES modules (`.mjs` extension)
- Target Node.js v18 or higher
- Include clear error messages
- Document environment variables
- Use standard libraries when possible (avoid heavy dependencies)

### Documentation Style

- Use clear, imperative language ("Execute X", "Check Y")
- Include code examples with syntax highlighting
- Provide complete commands (not partial snippets)
- Reference official documentation for external tools
- Keep instructions concise but comprehensive

## Pull Request Process

1. **Fork the repository** and create a feature branch
   ```bash
   git checkout -b feature/your-skill-name
   ```

2. **Make your changes** following the guidelines above

3. **Test thoroughly** - Verify your skill works as expected

4. **Commit with clear messages**
   ```bash
   git commit -m "Add <skill-name> skill for <purpose>

   - Brief description of what the skill does
   - Key features or capabilities
   - Related to #<issue-number> if applicable"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-skill-name
   ```
   - Use a clear PR title: "Add [skill-name] skill"
   - Fill out the PR template completely
   - Reference any related issues

6. **Respond to feedback** - Maintainers may request changes

7. **Merge** - Once approved, a maintainer will merge your PR

### PR Review Criteria

Maintainers will check:
- ✅ Skill follows naming conventions
- ✅ SKILL.md is clear and complete
- ✅ Documentation is updated (marketplace.json, README.md, CLAUDE.md, CHANGELOG.md)
- ✅ Skill is added to appropriate plugin group or new plugin created if needed
- ✅ Skill solves a real PDS workflow problem
- ✅ Code is clean and well-commented (if scripts included)
- ✅ No security concerns or credential exposure

## Getting Help

- **Questions about skill development?** Review [CLAUDE.md](CLAUDE.md)
- **Need examples?** Browse existing skills in [README.md](README.md#available-plugins--skills) or `static/marketplace/skills/` directory
- **Stuck on implementation?** Open an issue with the "help wanted" label
- **Want to discuss ideas?** Tag maintainers in an issue

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0, matching the project's license.

## Recognition

All contributors are recognized in our release notes and commit history. Thank you for helping make PDS workflows more efficient! 🚀

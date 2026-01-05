# Marketplace Setup Guide

This guide helps you configure this repository as a discoverable Claude Code skills marketplace on GitHub.

## GitHub Topics (for Discoverability)

Add these topics to your GitHub repository to make it discoverable:

### Required Topics
- `claude-code` - Primary discovery topic
- `claude-skills` - Skills marketplace indicator
- `ai-agents` - General AI tooling category
- `pds` - NASA Planetary Data System specific

### Recommended Topics
- `github-api` - For GitHub integration (release notes, issues)
- `nasa` - Government/space organization
- `planetary-science` - Domain-specific
- `automation` - Workflow automation
- `developer-tools` - Developer productivity

### How to Add Topics

**Via GitHub Web UI:**
1. Go to your repository: https://github.com/NASA-PDS/pds-claude-skills
2. Click the ⚙️ gear icon next to "About" (top right)
3. Add topics in the "Topics" field
4. Click "Save changes"

**Via GitHub CLI:**
```bash
gh repo edit NASA-PDS/pds-claude-skills \
  --add-topic claude-code \
  --add-topic claude-skills \
  --add-topic ai-agents \
  --add-topic pds \
  --add-topic github-api \
  --add-topic nasa \
  --add-topic planetary-science \
  --add-topic automation \
  --add-topic developer-tools
```

## Repository Description

Update your repository description to help with search:

**Recommended Description:**
```
Claude Code skills marketplace for NASA PDS workflows - automated release notes, GitHub issue creation, and more
```

**Via GitHub CLI:**
```bash
gh repo edit NASA-PDS/pds-claude-skills \
  --description "Claude Code skills marketplace for NASA PDS workflows - automated release notes, GitHub issue creation, and more"
```

## Repository Settings

### About Section
Add these to your repository "About" section:
- **Website:** https://pds.nasa.gov (or your docs site)
- **Topics:** See above
- **Description:** See above

### Social Preview
Create a social preview image (1280x640px) showing:
- Repository name
- "Claude Code Skills Marketplace"
- Number of skills available
- NASA PDS branding

Upload via: Settings → General → Social preview

## GitHub Repository Features

Enable these features for better marketplace experience:

### Issues
- ✅ Enable Issues for skill requests and bug reports
- Add issue templates (see `.github/ISSUE_TEMPLATE/` recommendations below)

### Discussions (Optional)
- Enable Discussions for community Q&A
- Categories: General, Skill Ideas, Help, Show and Tell

### Projects (Optional)
- Create a "Skills Roadmap" project board
- Track planned skills and feature requests

### Wiki (Optional)
- Enable Wiki for extended documentation
- Pages: Getting Started, Skill Development Guide, FAQ

## Recommended GitHub Templates

### `.github/ISSUE_TEMPLATE/new_skill.yml`
```yaml
name: 🆕 New Skill Request
description: Suggest a new skill for the PDS Claude Code Skills marketplace
title: "[Skill Request]: "
labels: ["enhancement", "skill-request"]
body:
  - type: input
    id: skill-name
    attributes:
      label: Skill Name
      description: Proposed name (use gerund form, e.g., "generating-validation-reports")
      placeholder: "generating-..."
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Description
      description: What should this skill do? When should it be invoked?
      placeholder: "This skill should..."
    validations:
      required: true

  - type: textarea
    id: use-cases
    attributes:
      label: Use Cases
      description: Specific scenarios where this skill would be useful
      placeholder: "- Use case 1\n- Use case 2"
    validations:
      required: true
```

### `.github/ISSUE_TEMPLATE/bug_report.yml`
```yaml
name: 🐛 Bug Report
description: Report a bug with an existing skill
title: "[Bug]: "
labels: ["bug"]
body:
  - type: dropdown
    id: skill
    attributes:
      label: Which skill?
      options:
        - generating-release-notes
        - creating-pds-issues
    validations:
      required: true

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Describe the bug
    validations:
      required: true
```

## Discoverability Checklist

- [ ] GitHub topics added
- [ ] Repository description updated
- [ ] README.md has catalog link
- [ ] SKILLS_CATALOG.md created and complete
- [ ] Badges added to README (skills count, license, compatibility)
- [ ] Issue templates created
- [ ] CONTRIBUTING.md exists (or created)
- [ ] CHANGELOG.md updated with marketplace transformation
- [ ] Social preview image created and uploaded
- [ ] Repository starred by team members (increases visibility)

## Promoting Your Marketplace

### Internal (NASA PDS)
1. Share in PDS Engineering Node Slack
2. Add to internal documentation
3. Include in onboarding materials
4. Demo in team meetings

### External (Open Source Community)
1. Blog post on PDS website
2. Tweet/social media announcement
3. Post in Claude Code Discord/community forums
4. Add to awesome-claude-code lists (if they exist)
5. Present at conferences (ESIP, AGU, etc.)

## Maintenance

### Regular Updates
- Update skills count badge when adding new skills
- Keep SKILLS_CATALOG.md in sync with skill additions/removals
- Update CHANGELOG.md with version history
- Review and respond to issues/PRs promptly

### Analytics
Track marketplace success with:
- GitHub stars
- Repository clones (GitHub Insights → Traffic)
- Issue/discussion activity
- PR contributions from community

## Future Enhancements

Consider these for v2.0:

- **GitHub Pages Site** - Interactive skill browser with search/filter
- **GitHub Actions** - Automated skill validation and testing
- **Skill Templates** - Cookiecutter/scaffolding for new skills
- **Version Management** - Skill versioning and compatibility matrix
- **Usage Analytics** - Track which skills are most used (opt-in)
- **Skill Dependencies** - Define inter-skill dependencies

---

**Questions?** Open an issue or contact the PDS Engineering Node team.

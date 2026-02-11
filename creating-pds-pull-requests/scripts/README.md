# Creating PDS Pull Requests - Scripts

Helper scripts for the `creating-pds-pull-requests` skill.

## Scripts

### cache-template.mjs

Fetches and caches the NASA-PDS pull request template from the `.github` repository.

**Usage:**
```bash
node scripts/cache-template.mjs [--force]
```

**Environment Variables:**
- `FORCE_TEMPLATE_REFRESH=true` - Force refresh even if cache is recent

**Options:**
- `--force` - Force refresh even if cache is recent (< 7 days old)

**What it does:**
- Fetches the PR template from NASA-PDS/.github repository
- Stores it locally in `resources/templates/`
- Creates a timestamp file to track cache age
- Template is cached for 7 days to reduce GitHub API calls

**Output:**
Template is saved to:
- `resources/templates/pull_request_template.md`
- `resources/templates/.cache-timestamp`

---

## Prerequisites

All scripts require:
- **Node.js v18+**
- **GitHub CLI (`gh`)** installed and authenticated

Verify prerequisites:
```bash
node --version
gh --version
gh auth status
```

## Development

These scripts are designed to be used by the `creating-pds-pull-requests` skill, but can also be run independently for testing or automation purposes.

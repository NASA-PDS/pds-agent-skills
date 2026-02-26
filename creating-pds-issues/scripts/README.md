# Creating PDS Issues - Scripts

Helper scripts for the `creating-pds-issues` skill.

## Scripts

### cache-templates.mjs

Fetches and caches NASA-PDS issue templates from the `.github` repository.

**Usage:**
```bash
node scripts/cache-templates.mjs [--force]
```

**Options:**
- `--force` - Force refresh even if cache is recent (< 7 days old)

**What it does:**
- Fetches all issue templates from NASA-PDS/.github repository
- Stores them locally in `resources/templates/`
- Creates a timestamp file to track cache age
- Templates are cached for 7 days to reduce GitHub API calls

**Output:**
Templates are saved to:
- `resources/templates/-bug_report.yml`
- `resources/templates/i-t-bug-report.yml`
- `resources/templates/-feature_request.yml`
- `resources/templates/-vulnerability-issue.yml`
- `resources/templates/task.yml`
- `resources/templates/release-theme.yml`
- `resources/templates/config.yml`
- `resources/templates/.cache-timestamp`

---

### detect-repo.mjs

Detects if the current directory is a NASA-PDS repository.

**Usage:**
```bash
node scripts/detect-repo.mjs
```

**Output (JSON):**
```json
{
  "detected": true,
  "repo": "pds-registry",
  "org": "NASA-PDS",
  "url": "https://github.com/NASA-PDS/pds-registry.git",
  "remote": "origin"
}
```

For forked repositories:
```json
{
  "detected": true,
  "repo": "pds-registry",
  "org": "NASA-PDS",
  "url": "https://github.com/NASA-PDS/pds-registry.git",
  "remote": "upstream",
  "note": "Detected from upstream (origin is a fork)"
}
```

Or if not in a NASA-PDS repo:
```json
{
  "detected": false,
  "reason": "Not in a git repository"
}
```

**What it does:**
- Checks `git remote get-url origin` first
- Falls back to `git remote get-url upstream` if origin doesn't exist
- If origin is a personal fork, checks upstream for NASA-PDS repository
- Parses the URL to extract organization and repository name
- Validates that the organization is `NASA-PDS`
- Handles both HTTPS and SSH remote URLs

---

### create-issue.mjs

Helper script for creating GitHub issues with formatted templates. Optionally attaches the new issue as a sub-issue of a parent.

**Usage:**
```bash
node scripts/create-issue.mjs <type> <repo> <title> <data.json> [--parent <repo>#<number>]
```

**Arguments:**
- `type` - Template type: `bug`, `feature`, `task`, `vulnerability`, `theme`
- `repo` - Repository name (without `NASA-PDS/` prefix)
- `title` - Issue title
- `data.json` - JSON file containing template field data

**Options:**
- `--parent <repo>#<number>` - Attach as sub-issue of the specified parent
  - `--parent #123` - Parent in the same repo as the child
  - `--parent pds-swg#45` - Parent in a different repo (cross-repository)

**Examples:**

Create standalone issue:
```bash
node scripts/create-issue.mjs bug pds-registry "Validator fails on nested tables" bug-data.json
```

Create issue and attach as sub-issue (same repo):
```bash
node scripts/create-issue.mjs task pds-registry "Implement API endpoint" task-data.json --parent #123
```

Create issue and attach as sub-issue (cross-repo):
```bash
node scripts/create-issue.mjs task pds-registry "Implement API endpoint" task-data.json --parent pds-swg#45
```

**Data File Format:**

For bug reports (`bug-data.json`):
```json
{
  "description": "When validating a PDS4 label with nested tables...",
  "expectedBehavior": "Validator should successfully validate...",
  "reproductionSteps": [
    "Create PDS4 label with 3 nested tables",
    "Run: validate my-label.xml",
    "Observe error"
  ],
  "environment": [
    "Version: v1.2.3",
    "OS: macOS 13.0"
  ],
  "version": "v1.2.3",
  "testData": "See attached label file",
  "relatedRequirements": "#123"
}
```

For feature requests:
```json
{
  "personas": "Data Engineer, Node Operator",
  "motivation": "validate labels in CI/CD pipelines without manual intervention",
  "additionalDetails": "This would reduce deployment time from hours to minutes"
}
```

For tasks:
```json
{
  "taskType": "Sub-task",
  "description": "Refactor the validation module to use the new API"
}
```

**What it does:**
- Formats the issue body according to the template structure
- Applies appropriate labels and assignees
- Creates the issue via GitHub CLI (`gh issue create`)
- If `--parent` is specified, attaches the new issue as a sub-issue of the parent using GraphQL
- Returns the issue URL

---

### attach-sub-issue.mjs

Attaches a child issue as a sub-issue of a parent issue using GitHub's GraphQL API.

**Usage:**
```bash
node scripts/attach-sub-issue.mjs <parent-repo> <parent-number> <child-repo> <child-number>
```

**Arguments:**
- `parent-repo` - Parent repository name (without `NASA-PDS/` prefix)
- `parent-number` - Parent issue number
- `child-repo` - Child repository name (without `NASA-PDS/` prefix)
- `child-number` - Child issue number

**Examples:**

Same repository (attach #456 as sub-issue of #123 in pds-registry):
```bash
node scripts/attach-sub-issue.mjs pds-registry 123 pds-registry 456
```

Cross-repository (attach pds-registry#456 as sub-issue of pds-swg#123):
```bash
node scripts/attach-sub-issue.mjs pds-swg 123 pds-registry 456
```

**Output:**
```
Attaching NASA-PDS/pds-registry#456 as sub-issue of NASA-PDS/pds-swg#123...

Fetching parent issue NASA-PDS/pds-swg#123...
  Found: "Registry Modernization Theme" (OPEN)
Fetching child issue NASA-PDS/pds-registry#456...
  Found: "Implement new API endpoint" (OPEN)

Creating sub-issue relationship...

Success! Sub-issue relationship created:
  Parent: "Registry Modernization Theme"
  └── Child: "Implement new API endpoint"

View parent: https://github.com/NASA-PDS/pds-swg/issues/123
View child:  https://github.com/NASA-PDS/pds-registry/issues/456
```

**What it does:**
- Fetches both parent and child issue node IDs via GraphQL
- Creates a sub-issue relationship using the `addSubIssue` mutation
- Works with cross-repository relationships (parent and child can be in different repos)
- Provides clear error messages for common failure cases

**Error handling:**
- Issue not found: Displays which issue could not be found
- Already a sub-issue: Informs user if relationship already exists
- Self-reference: Prevents an issue from being a sub-issue of itself

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

These scripts are designed to be used by the `creating-pds-issues` skill, but can also be run independently for testing or automation purposes.

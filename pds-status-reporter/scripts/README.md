# PDS Status Reporter Scripts

This directory contains Node.js scripts that power the PDS Status Reporter skill.

## Scripts Overview

### 1. `query-releases.mjs`
Queries GitHub for releases across all active PDS repositories within a date range.

**Usage:**
```bash
node query-releases.mjs <start-date> <end-date>
```

**Example:**
```bash
node query-releases.mjs 2025-10-01 2025-11-06
```

**Output:** `/tmp/pds-releases.json`

**What it does:**
- Parses `pds-products.yaml` to get list of repositories
- Excludes ignored products (`ignore: true`) and forked repositories
- Queries each repository with `gh release list`
- Filters releases by date range
- Saves results to JSON

---

### 2. `score-issues.mjs`
Scores and filters closed issues based on label-aware rubric, and links issues to Release Themes.

**Usage:**
```bash
node score-issues.mjs <issues-json-file>
```

**Example:**
```bash
node score-issues.mjs /tmp/pds-closed-issues.json
```

**Output:** `/tmp/pds-scored-issues.json`

**What it does:**
- Loads closed issues from GitHub search
- Parses `pds-products.yaml` to map repos → products → work streams
- Respects `ignore: true` flag (excludes atlas, node-products, archived repos)
- Applies v2.1 scoring philosophy: "Release Themes drive organization"
  - Base score: 2 for all issues (not 0)
  - Type bonuses: bug=+3, enhancement=+2, requirement=+2, **theme=+3** (increased from +1)
  - Priority/severity bonuses: optional (not required)
  - Core backbone bonus: +2
  - Planetary Data Cloud bonus: +2
- **Identifies Release Themes** (issues with label:theme)
- **Links issues to themes** by detecting references in title/body:
  - Parent-child relationships: "Parent: #123", "Subtask of #456" (checked FIRST)
  - Direct references: "Addresses #123", "Part of #456"
  - Task associations: "Task for #123", "Related to #456"
- Minimal exclusions: only duplicate, invalid, wontfix, icebox, needs.triage, needs.more-info
- Identifies operations tasks (nssdca-delivery, data-release)
- Sorts by score (highest first)

---

### 3. `generate-report.mjs`
Generates formatted Markdown status report from scored issues and releases, organized by Release Themes.

**Usage:**
```bash
node generate-report.mjs <timeframe> <start-date> <end-date> [output-file]
```

**Example:**
```bash
node generate-report.mjs monthly 2025-10-01 2025-11-06 /tmp/report.md
```

**Output:** Specified file (default: `/tmp/pds-status-report.md`)

**What it does:**
- Loads scored issues and releases
- **Organizes by Release Themes first** (NEW in v2.1):
  - Groups issues by their linked Release Theme
  - Shows each theme with its related completed work
  - Separates unthemed work into "Other Significant Work" section
- Separates operations tasks (shown as metrics) from development work (shown in detail)
- Generates executive summary (top 6 bullets, **Release Themes featured first**)
- Creates work stream highlights (top 6 per work stream, **unthemed work only**)
- Adds product deep-dives (5/7/10 items per product for monthly/quarterly/annual)
- Formats operations as: "27 NSSDCA deliveries, 62 data releases, 28 other operational tasks"
- Includes impacts & risks section
- Adds key metrics summary (including Release Theme statistics)

---

## Workflow

The typical workflow for generating a status report:

```bash
# 1. Get closed issues from GitHub (include 'body' for parent-child theme detection)
gh search issues --owner NASA-PDS --closed "2025-10-01..2025-11-06" \
  --limit 1000 --json number,title,body,url,closedAt,labels,repository \
  > /tmp/pds-closed-issues.json

# 2. Query releases
node query-releases.mjs 2025-10-01 2025-11-06

# 3. Score and filter issues
node score-issues.mjs /tmp/pds-closed-issues.json

# 4. Generate report
node generate-report.mjs monthly 2025-10-01 2025-11-06 report.md
```

---

## Dependencies

- **Node.js v18+** (ESM modules)
- **GitHub CLI (`gh`)** - Authenticated with NASA-PDS access
- **Resources files:**
  - `../resources/pds-products.yaml` - Product to repository mapping with integrated core_backbone flags

---

## Configuration Files

### `pds-products.yaml`
Single source of truth for product configuration. Maps products to repositories, work streams, and infrastructure flags.

**Key features:**
- `ignore: true` - Completely excludes product and all its repositories
- `work_stream` - Maps to core-data-services, web-modernization, or planetary-data-cloud
- `core_backbone: true` - Marks critical infrastructure repositories that receive +2 scoring bonus
- `core_backbone_justification` - Documents why a product is considered critical infrastructure
- `forked_repositories` - List of external dependencies to exclude

**Example:**
```yaml
products:
  registry-tools:
    work_stream: core-data-services
    core_backbone: true
    core_backbone_justification: "Core data storage, search, and retrieval infrastructure"
    repositories:
      - registry
      - registry-api
```

**Note:** As of v2.1, core backbone designation is integrated into pds-products.yaml. The separate `core_backbone.yaml` file is deprecated.

---

## Scoring Philosophy (v2.1)

**"Release Themes drive organization; all completed work matters"**

- **Release Themes first:** Issues with label:theme receive +3 bonus (was +1) and drive report structure
- **Base score:** All issues start with 2 points
- **Priority/severity labels:** Optional bonuses (not required for inclusion)
- **Minimal exclusions:** Only truly invalid work (duplicate, wontfix, icebox)
- **Planning metadata NOT excluded:** sprint-backlog, B##.#, i&t.* labels
- **Operations aggregation:** NASA-PDS/operations shown as metrics
- **Planetary Data Cloud boost:** +2 bonus for critical infrastructure
- **Automatic theme linking:** Issues linked to parent themes via reference detection

**Result:** Reports organized by planned stakeholder priorities (Release Themes), with comprehensive visibility of all program activity.

---

## Troubleshooting

### Script fails with "Cannot find module"
- Ensure Node.js v18+ is installed
- Scripts use ESM `.mjs` extension
- Check that resource files exist in `../resources/`

### No releases found
- Verify `gh` CLI is authenticated: `gh auth status`
- Check date range format: YYYY-MM-DD
- Some repos may not use GitHub releases (check tags instead)

### Too few/many issues in report
- Review scoring in `score-issues.mjs`
- Check exclusion criteria
- Verify `ignore: true` products are correctly configured

### Operations tasks not aggregated
- Check that `product === 'operations'` in scored issues
- Verify `nssdca-delivery` and `data-release` labels are present
- Review operations logic in `generate-report.mjs`

---

## Version History

- **v2.1** - Release Theme-centric organization
  - Reports organized by Release Themes (label:theme) first
  - Theme scoring boost: +3 (was +1)
  - Automatic theme linking via reference detection
  - Configuration consolidation: Merged core_backbone.yaml into pds-products.yaml
- **v2.0** - Philosophy shift: "All completed work matters"
- **v1.1** - Added releases tracking
- **v1.0** - Initial release with label-based scoring

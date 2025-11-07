---
name: "pds-status-reporting"
description: "Generates Monthly, Quarterly, and Annual status reports for NASA PDS across Overall Program, Core Data Services, Web Modernization, and Planetary Data Cloud—featuring GitHub releases and prioritizing issues by labels. Tailored to executive and technical audiences. Use when creating NASA PDS status reports, program reports, or when the user requests monthly, quarterly, or annual reporting for PDS projects. Invokes when mentions include: PDS status, program management reports, stakeholder reports, GitHub releases summaries, or executive briefings."
---

# PDS Status Reporter

This Skill produces stakeholder-ready **Monthly**, **Quarterly**, or **Annual** status reports for the NASA Planetary Data System (PDS). It covers the **Overall Program** and three primary work streams:
1) **Core Data Services (CDS)**
2) **Web Modernization**
3) **Planetary Data Cloud (PDC) Migration**

Reports are **organized by Release Themes** (label:theme) - planned, stakeholder-agreed priorities tracked in Build Projects (B*). These themes represent high-level goals and epics that drive program planning. Reports combine **executive highlights** and **targeted technical deep-dives**, using **Release Themes**, **GitHub Releases**, and **closed Issues** from the selected timeframe. Data is sourced from GitHub Projects (portfolio backlog + B* build projects) and repository releases, ensuring comprehensive coverage of both delivered features (releases) and development activity (issues). Items are prioritized by **Release Themes first**, then by **priority**, **severity**, and **backwards-incompatible** labels, with **releases always prominently featured** as major milestones.

---

## Quick Start

To generate a status report:

1. **Ensure prerequisites**: Run `gh auth status` to verify GitHub CLI is authenticated
2. **Invoke the skill**: "Use pds-status-reporting to create a monthly report for October 2024"
3. **Provide dates when prompted**: start=2024-10-01, end=2024-10-31
4. **Choose audience focus** (or skip for balanced report): governance, big projects, breaking changes, etc.

The skill will query GitHub for closed issues and releases, score them using label-aware rubric (v2.1: "Release Themes drive organization"), identify Release Themes and link related work, and generate a formatted Markdown report with Executive Summary, Release Themes, Other Significant Work, Releases, and Product Deep-Dives.

**Technical workflow:**
```bash
# 1. Query closed issues (include 'body' field for parent-child theme detection)
gh search issues --owner NASA-PDS --closed "2025-10-01..2025-11-06" --limit 1000 \
  --json number,title,body,url,closedAt,labels,repository > /tmp/pds-closed-issues.json

# 2. Query releases (uses scripts/query-releases.mjs)
node scripts/query-releases.mjs 2025-10-01 2025-11-06

# 3. Score issues (uses scripts/score-issues.mjs)
node scripts/score-issues.mjs /tmp/pds-closed-issues.json

# 4. Generate report (uses scripts/generate-report.mjs)
node scripts/generate-report.mjs monthly 2025-10-01 2025-11-06 report.md
```

**Scripts documentation:** See `./scripts/README.md` for detailed information about each script.

---

## Inputs

Provide these inputs when invoking the Skill (Claude will ask if missing):

- `timeframe`: one of `monthly`, `quarterly`, `annual`
- `start_date`, `end_date`: ISO dates bounding the reporting window (YYYY-MM-DD format)
- `audience` (optional): If not specified, Claude will ask what focus you want (governance, big projects, impacts, breaking changes, etc.). Defaults to `mixed` (balanced approach) if no preference given
- `github_orgs`: list of GitHub organizations to search (defaults to `["NASA-PDS"]`)
- `repo_maps`: Path to the product-to-repository mapping file in YAML format (e.g., `pds-products.yaml`)
  - **Preferred format:** YAML (most token-efficient, ~50% fewer tokens than other formats)
  - Default location: `resources/pds-products.yaml`

> Tip: You can attach the mapping file to the chat or reference it from this Skill folder under `resources/`.

---

## Repo Map Schema (YAML)

The Skill uses `pds-products.yaml` for product-to-repository mapping. This format is most token-efficient and machine-readable.

### Schema Structure

```yaml
version: "2.0"
updated: "2025-11-06"

products:
  <product-name>:
    description: "Brief description of the product"
    github_project_name: "Name in GitHub Projects" # optional
    work_stream: "core-data-services" | "planetary-data-cloud" | "web-modernization"
    ignore: true/false  # optional - if true, completely skip this product and ALL its repositories
    core_backbone: true/false  # optional - if true, repositories receive +2 scoring bonus (critical infrastructure)
    core_backbone_justification: "Rationale for core backbone designation" # optional, for documentation
    repositories:
      - repo-name-1
      - repo-name-2

forked_repositories:
  - repo-name  # repos to ignore (external dependencies, forks)
```

### Example

```yaml
version: "2.0"
updated: "2025-11-06"

products:
  registry-tools:
    description: "PDS Registry backend services and data loading tools"
    github_project_name: "Registry Tools"
    work_stream: core-data-services
    core_backbone: true
    core_backbone_justification: "Core data storage, search, and retrieval infrastructure"
    repositories:
      - registry
      - registry-api
      - registry-sweepers
      - harvest

  validate:
    description: "PDS4 data product validation tools"
    work_stream: core-data-services
    repositories:
      - validate

forked_repositories:
  - opensearch-java
  - FFmpeg
```

See `resources/pds-products.yaml` for the complete NASA-PDS mapping.

---

## Label Semantics & Scoring Rubric

**Philosophy:** All completed work matters. Items are ranked using label-aware scoring where priority/severity labels are optional bonuses, not requirements.

**Quick reference:**
- Base score: All issues start with +2 points
- Type: `bug=+3`, `enhancement=+2`, `requirement=+2`, `security=+6`, `backwards-incompatible=+8` ⚠️
- Priority (optional): `p.must-have=+3`, `p.should-have=+2`, `p.could-have=+1`
- Severity (optional): `s.critical=+4`, `s.high=+2`, `s.medium=+1`
- Bonuses: Core backbone repos (+2), Planetary Data Cloud work (+2)
- Releases: Automatic 10+ (always prominently featured)

**Minimal exclusions (only truly invalid work):**
- Status: `duplicate`, `invalid`, `wontfix`, `icebox`
- Incomplete: `needs.triage`, `needs.more-info`
- Dependency updates (unless backwards-incompatible)

**NOT excluded (these are just planning metadata):**
- Backlog labels: `sprint-backlog`, `release-backlog`, `product-backlog`
- Build tracking: `B##.#` pattern (B16, B17, etc.)
- Test workflow: `i&t.*` labels
- Other needs: `needs.requirement`, `needs.scheduling`, etc.

**Operations handling:**
- NASA-PDS/operations tasks aggregated as metrics (not individual listings)
- Shown as: "27 NSSDCA deliveries, 62 data releases, 28 other operational tasks"

**Complete rubric:** See `./label-scoring-rubric.md` for full scoring formula, tie-breakers, and examples.

**Label definitions:** See `../shared-resources/pds-labels.yaml` for canonical PDS label semantics.

---

## What the Skill Does (Algorithm)

1. **Parse repo map** (`pds-products.yaml`) to build product→work_stream→repos mapping:
   - Drop all repositories listed in `forked_repositories` (external dependencies, forks)
   - **Completely exclude** any product marked with `ignore: true` - ALL repositories under that product are skipped from status reports
   - Examples of ignored products: dependencies, node-products, archived_repositories

2. **Query GitHub Projects** to get all closed issues and understand context:
   - **Portfolio backlog** (Project #6): Primary source for ALL closed issues in date range
   - **Build-specific projects** (B*, e.g., B16, B17): Used for roadmap/theme context and 6-month planning increments
   - All significant work is tracked as issues (requirement: issue filed before PR, except dependabot)
   - This approach is efficient and complete - no need to scan 143 repos individually

3. **Collect closed issues and releases** within `[start_date, end_date]`:
   - **Issues:** Query portfolio backlog for closed issues
     - Use GitHub Projects API to filter by closed date
     - Map issues back to repos using issue URLs
     - Look for linked issues to detect cross-repo impacts
     - Note: We focus on issues (outcomes), not PRs (implementation details)
   - **Releases:** Query all active repositories for published releases
     - Use `gh release list` for each repository in pds-products.yaml
     - Capture: version/tag, publish date, release notes/description
     - **Releases are always prominently featured** as major milestones

4. **Normalize & score** items using labels and rubric above:
   - **All issues start with base score of 2** (all completed work matters)
   - **Apply label bonuses** (type, priority, severity, bonuses)
   - **Release Themes (label:theme)** receive **+3 bonus** (was +1) - these are planned priorities
   - **Exclude only truly invalid work** (duplicate, wontfix, icebox, needs.triage, needs.more-info)
   - **Keep planning metadata** (sprint-backlog, B##.#, i&t.* labels don't exclude)
   - **Skip dependency updates** UNLESS backwards-incompatible (e.g., Java 17, Python 3.12)
   - **Releases:** Automatically treat as high-priority items (equivalent score: 10+)
     - Major releases (x.0.0) given highest priority
     - Minor/patch releases also featured but with context

5. **Identify Release Themes and link related work** (NEW in v2.1):
   - **Release Themes:** Issues with `label:theme` are identified as planned stakeholder priorities
   - **Theme linking:** Other issues are linked to themes by detecting references in title/body:
     - **Parent-child relationships:** "Parent: #123", "Subtask of #456", "Child of #789", "Epic: #123"
     - **Direct references:** "Addresses #123", "Part of #456", "Closes #789"
     - **Task associations:** "Task for #123", "Related to #456"
   - Parent-child patterns are checked FIRST (most explicit relationship)
   - Creates theme groups showing each theme with its related completed work
   - **Unthemed work:** Issues not linked to any theme are grouped separately

6. **Separate operations tasks from development work**:
   - **Operations tasks** (NASA-PDS/operations): Aggregate as metrics
     - Count NSSDCA deliveries (`nssdca-delivery` label or in title)
     - Count data releases (`data-release` label)
     - Count other operational tasks
     - Display as summary: "27 NSSDCA deliveries, 62 data releases, 28 other operational tasks"
   - **Development tasks**: Show individual items ranked by score

7. **Group & select tops** per product and theme:
   - **Per Release Theme**: Show theme with up to monthly=5, quarterly=7, annual=10 related items
   - **Per product** (for unthemed work): monthly=5, quarterly=7, annual=10 items
   - **Executive Summary**: max 6 bullets (program-level, **Release Themes featured first**)
   - **Work-Stream Highlights**: max 6 bullets per work stream for **unthemed work** only (operations shown as 1 summary line)

8. **Synthesize Executive Summary** by identifying:
   - **Release Themes** (always feature first - planned stakeholder priorities with progress)
   - **Operations metrics** (NSSDCA deliveries, data releases, other ops tasks)
   - **Releases** (always include - these are major deliverables)
   - **Breaking changes** (always include if present)
   - Themes across work streams (security, migration, etc.)
   - Items affecting multiple products/repos
   - Major milestones and achievements
   - Risks or blockers

9. **Render outputs** in Markdown using the template below.

---

## Output Template (Markdown)

```md
# PDS {Monthly|Quarterly|Annual} Status — {Start}–{End}

## Executive Summary (max 6 bullets)
- <Program-level outcomes: Release Themes progress, releases, breaking changes, cross-cutting impacts, risks>
- **Lead with Release Themes** (planned stakeholder priorities)
- Include operations metrics, releases, breaking changes

## Release Themes
The following Release Themes were active during this period, representing planned stakeholder priorities:

### <Theme Title>
**Theme:** [owner/repo#123](url) | **Work Stream:** <work-stream-name>

**Related work completed (N items):**
- <Issue 1 linked to this theme>
- <Issue 2 linked to this theme>
- <Sub-task or requirement 3>

### <Another Theme Title>
...

## Other Significant Work
The following work was completed but not tied to a specific Release Theme:

### Work-Stream Highlights

### Core Data Services (max 6 bullets)
- <Top UNTHEMED items from scored products, cite owner/repo#123 with label context>
### Web Modernization (max 6 bullets)
- <Top UNTHEMED items>
### Planetary Data Cloud (max 6 bullets)
- <Top UNTHEMED items>

## Releases

### <Product Name> <version>
**Released:** <date> | **Repo:** owner/repo

- <Key features and improvements from this release>
- <Notable bug fixes>
- **[Release Notes](link)** | **[Download](link)**

## Product Deep-Dives
### <Product Name>
- <Up to 5/7/10 bullets (monthly/quarterly/annual) linking specific PRs/issues>
- Focus on outcomes and impact, technical details as reference
- **Note:** If product had a release, highlight it first

## Impacts & Risks
- <Cross-cutting concerns: interoperability, platform, FinOps, migration readiness>
- <Breaking changes requiring coordination>

## Key Metrics
- **Total issues closed:** N
- **Release Themes tracked:** N
- **Issues tied to Release Themes:** N
- **Issues not tied to themes:** N
- **Releases:** X products released (list: product@version)
- **Closed issues** by work stream
- **High-severity bugs** fixed
- **Breaking changes** introduced
- **Core backbone issues** resolved
```

---

## Configuration

### Environment
- `GITHUB_TOKEN` (required): a token with `repo:read` scope for private repos, or `public_repo` for public only. Used by `gh` CLI.
- `gh` CLI (required): GitHub CLI must be installed and authenticated. Test with `gh auth status`.
- `http_proxy` / `https_proxy` (optional): set if your environment requires egress via proxy.

### Preferences (optional block in your request)
```json
{
  "audience": "mixed",
  "per_product_limits": { "monthly": 5, "quarterly": 7, "annual": 10 },
  "exec_summary_limit": 6,
  "work_stream_highlight_limit": 6
}
```

### Error Handling
When encountering errors, the Skill will:
- **Warn** and **ask user** how to proceed for:
  - Missing or invalid `GITHUB_TOKEN`
  - GitHub API rate limits hit mid-execution
  - Repos in pds-products.yaml that don't exist or are inaccessible
- Provide clear error context and suggested remediation

---

## GitHub CLI Commands Reference

The Skill uses `gh` CLI and GitHub Projects API for all GitHub interactions.

**Key commands:**
- `gh auth status` - Verify authentication
- `gh project list --org NASA-PDS` - List organization projects
- `gh api graphql` - Query portfolio backlog (Project #6) for closed issues
- `gh release list --repo <repo>` - Query releases for repositories

**Complete reference:** See `./github-cli-reference.md` for all commands, GraphQL queries, and best practices.

**Primary approach:** Query portfolio backlog project (#6) for all closed issues, then query each active repository for releases.

---

## Usage

**Ask Claude:**
```
Use the PDS Status Reporter Skill to create a {monthly|quarterly|annual} report.
Time window: {YYYY-MM-DD}..{YYYY-MM-DD}.
Audience: {optional - Claude will ask for focus if not specified}.
Repo map: resources/pds-products.yaml
GitHub orgs: NASA-PDS.
```

The skill will use the YAML repo map to organize issues by product and work stream, then fetch, score, and render the report.

---

## Installation

1. Create a folder, e.g., `pds-status-reporter/` and place this `SKILL.md` inside.
2. Add `resources/` folder with:
   - `pds-products.yaml` - Product-to-repository mapping with integrated core_backbone flags
3. Add `scripts/` folder with:
   - `query-releases.mjs` - Query GitHub releases
   - `score-issues.mjs` - Score and filter issues
   - `generate-report.mjs` - Generate formatted report
4. Ensure `../shared-resources/pds-labels.yaml` is accessible (shared across skills)
5. Zip the folder.
6. In Claude: **Settings → Capabilities → Skills → Upload Skill**, choose the ZIP.
7. Toggle **PDS Status Reporter** on.
8. In a chat or Claude Code, invoke as shown in **Usage** above.

**Note:** This skill references shared resources from `../shared-resources/`. In the pds-claude-skills repository, this is handled automatically.

---

## Troubleshooting

### GitHub Authentication Issues
**Symptom:** `gh` commands fail with authentication errors
**Solution:**
1. Check auth status: `gh auth status`
2. Re-authenticate: `gh auth login`
3. Verify token has `repo:read` scope (or `public_repo` for public repos only)

### GitHub API Rate Limits
**Symptom:** Errors mentioning rate limits or 403 responses
**Solution:**
1. Check current limits: `gh api rate_limit`
2. Authenticated users get 5,000 requests/hour
3. If hit, the Skill will warn and ask how to proceed (wait, skip repos, or abort)

### Missing or Inaccessible Repositories
**Symptom:** 404 errors or "not found" messages for specific repos
**Solution:**
1. Verify repo name spelling in pds-products.yaml
2. Check if repo was renamed, archived, or moved
3. The Skill will warn and ask whether to skip or abort

### Empty Results
**Symptom:** No issues or releases found in date range
**Solution:**
1. Verify date range format (YYYY-MM-DD)
2. Check if repos had activity during that period
3. Verify `gh` search syntax is correct
4. For releases: Some repos may not use GitHub releases (check tags instead)

### Quarterly Core Backbone Review
**When:** Every quarter (check `resources/pds-products.yaml` header for next review date)
**Action:** Review and update `core_backbone: true` flags in pds-products.yaml to reflect current architecture
**Note:** Core backbone designation gives repositories a +2 scoring bonus, so ensure only critical infrastructure is marked

---

## Safety & Privacy

- Reads Issues only; no write actions.
- **Respects exclusions** from `pds-products.yaml`:
  - Products marked `ignore: true` are completely skipped (all repositories under that product)
  - Repositories listed in `forked_repositories` are excluded
- Do not include secrets in repo maps or prompts; use `GITHUB_TOKEN` via settings or environment.

---

## Changelog

- **2.1.0** — Release Theme-centric organization
  - **Primary Change**: Reports now organized by Release Themes (label:theme) first, then other significant work
  - **Theme scoring boost**: `theme` label score increased from +1 to +3 (planned stakeholder priorities)
  - **Automatic theme linking**: Issues are automatically linked to parent Release Themes via reference detection:
    - **Parent-child relationships**: "Parent: #123", "Subtask of #456", "Child of #789", "Epic: #123" (checked FIRST)
    - **Direct references**: "Addresses #123", "Part of #456", "Closes #789"
    - **Task associations**: "Task for #123", "Related to #456"
  - **Query enhancement**: GitHub issue queries now include `body` field to detect parent-child relationships
  - **New report structure**:
    - Executive Summary → Release Themes (NEW) → Other Significant Work → Releases → Product Deep-Dives → Impacts & Risks → Key Metrics
    - "Other Significant Work" section only shows items NOT tied to Release Themes
  - **Enhanced metrics**: Added tracking for Release Themes count, issues linked to themes, and unthemed issues
  - **Stakeholder alignment**: Release Themes represent planned, agreed-upon highest priorities from Build Projects
  - **Configuration consolidation**: Consolidated `core_backbone.yaml` into `pds-products.yaml` using `core_backbone: true` flag
  - **Version update**: pds-products.yaml now at v2.0
- **2.0.0** — Major philosophy shift: "All completed work matters"
  - **Scoring changes**: All issues start with base score of 2 (was 0); priority/severity labels now optional bonuses (was required)
  - **Minimal exclusions**: Only exclude truly invalid work (duplicate, wontfix, icebox); keep planning metadata (sprint-backlog, B##.#, i&t.* labels)
  - **Ignore flag fixed**: Properly respects `ignore: true` in pds-products.yaml (e.g., atlas, node-products, archived repos now excluded)
  - **Operations aggregation**: NASA-PDS/operations tasks shown as metrics ("27 NSSDCA deliveries, 62 data releases") instead of individual listings
  - **Planetary Data Cloud boost**: +2 bonus for PDC work stream to ensure visibility of critical infrastructure work
  - **Result**: ~6x more issues included in reports (222 vs 37), better representing all program activity
- **1.1.0** — Added GitHub releases tracking and prominent featuring in reports. Releases are now always included as major milestones alongside issue tracking.
- **1.0.0** — Initial release with label-aware prioritization, three work streams, and product deep-dives.

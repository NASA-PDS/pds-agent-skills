# Label Semantics & Scoring Rubric

Items are ranked using label-aware scoring to prioritize issues for status reports. **Philosophy: All completed work matters**. Priority and severity labels are optional bonuses, not requirements for inclusion.

## Label Basics

Almost every issue in NASA-PDS will have at least one of:
- `theme` - **Release Theme**: High-level planned initiative or epic agreed upon with stakeholders as highest priority
- `requirement` - Specific requirement or feature request
- `bug` - Defect or issue to fix
- `enhancement` - Improvement to existing functionality
- `task` - Sub-task for larger themes/requirements/bugs

**Release Themes** (`label:theme`) are tracked in Build Projects (B*) and represent planned, stakeholder-agreed goals. Reports organize work by Release Themes first, then show other significant work separately.

**Label Reference:** See `../shared-resources/pds-labels.yaml` for the canonical PDS label definitions, including descriptions, categories, and scores.

## Scoring Formula

**Base Score:** All issues start with **+2 points** (recognizing all work matters)

### Type Modifiers
- `bug` = **+3** (defect fix)
- `enhancement` = **+2** (improvement)
- `requirement` = **+2** (new feature)
- `theme` = **+3** (Release Theme - planned stakeholder priority, drives report organization)
- `task` = **+1** (sub-task)
- `security` = **+6** (security vulnerability or fix)
- `backwards-incompatible` = **+8** (breaking change, always feature prominently with ⚠️)

### Priority Labels (Optional Bonuses)
- `p.must-have` = **+3** (critical, required)
- `p.should-have` = **+2** (important)
- `p.could-have` = **+1** (nice to have)
- `p.wont-have` = **-2** (deprioritized)

### Severity Labels (Optional Bonuses)
- `s.critical` = **+4** (system down, data loss)
- `s.high` = **+2** (major impact)
- `s.medium` = **+1** (moderate impact)
- `s.low` = **0** (minor impact)

### Repository Bonuses
- **Core backbone bonus** = **+2** if repo is in core backbone (see `resources/core_backbone.yaml`)
- **Planetary Data Cloud bonus** = **+2** for planetary-data-cloud work stream (critical infrastructure)

### Special Rules
- **Dependency updates**: Skip entirely **UNLESS** backwards-incompatible
  - Examples to include: Java 17 upgrade, Python 3.12 upgrade (breaking changes)
  - Examples to skip: Minor library updates, patch version bumps
- **Releases**: Automatically treated as high-priority (equivalent score: 10+)
  - Major releases (x.0.0) given highest priority
  - Minor/patch releases also featured but with context

## Exclusion Criteria

**IMPORTANT:** We use MINIMAL exclusions. Most labels are planning/workflow metadata and do NOT exclude issues from reports.

### What WE DO EXCLUDE:
- `duplicate` - Duplicate issue
- `invalid` - Invalid issue
- `wontfix` - Won't be fixed
- `icebox` - Deferred indefinitely
- `needs.triage` - Not yet triaged (shouldn't be closed)
- `needs.more-info` - Incomplete (shouldn't be closed)
- **Dependency updates** (unless backwards-incompatible)

### What WE DO NOT EXCLUDE:
- `sprint-backlog`, `release-backlog`, `product-backlog` - Just planning labels
- `B##.#` pattern (e.g., B16, B17) - Just build tracking labels
- `i&t.*` (e.g., i&t.skip, i&t.done) - Just testing workflow labels
- `needs.requirement`, `needs.scheduling`, `needs.dependency`, `needs.receivable` - Work can still be valid

**Rationale:** These labels are internal planning and workflow metadata. If an issue was closed, the work was completed and should be reported, regardless of which sprint/build/testing workflow it was part of.

## Missing Labels

If labels are missing:
- **Issue still included** - Base score of 2 means all work is reported
- Skill may infer priority/severity from text patterns ("critical bug", "urgent")
- **Never assume** `backwards-incompatible` unless explicitly labeled
- Unlabeled items appear in reports but ranked lower (score = 2)

## Operations Tasks

NASA-PDS/operations issues receive special handling:
- **Aggregated as metrics** rather than individual listings
- Counted by type:
  - `nssdca-delivery` label or `[nssdca-delivery]` in title
  - `data-release` label
  - Other operational tasks
- Shown as summary: "27 NSSDCA deliveries, 62 data releases, 28 other operational tasks"

## Tie-Breakers

When items have the same score, apply these tie-breakers in order:

1. **Cross-repo impact**: Changes affecting more than one repository
   - Detected via linked issues or multiple repos within a product
2. **Roadmap alignment**: Items linked to active builds in GitHub Projects
   - Look for B* build projects (B16, B17, etc.)
3. **Community engagement**: Issues with more discussion
   - Number of comments, reactions, participants

## Example Scoring

**Example 1: Critical Bug Fix**
- Base: 2
- Labels: `bug`, `s.critical`, `p.must-have`
- Score: 2 + 3 (bug) + 4 (critical) + 3 (must-have) = **12 points**

**Example 2: Backwards-Incompatible Change**
- Base: 2
- Labels: `enhancement`, `backwards-incompatible`, `p.should-have`
- Score: 2 + 2 (enhancement) + 8 (breaking) + 2 (should-have) = **14 points**
- Display: ⚠️ indicator in report

**Example 3: Security Fix in Core Backbone**
- Base: 2
- Labels: `security`, `bug`, `s.high` in core backbone repo
- Score: 2 + 6 (security) + 3 (bug) + 2 (high) + 2 (backbone) = **15 points**

**Example 4: Enhancement Without Priority Labels**
- Base: 2
- Labels: `enhancement` only
- Score: 2 + 2 (enhancement) = **4 points**
- **Still included in report** (this is a key change!)

**Example 5: Major Release**
- Type: Release (not an issue)
- Score: **10+ (automatic)** - always prominently featured
- Major releases (x.0.0) given highest priority

**Example 6: Planetary Data Cloud Infrastructure**
- Base: 2
- Labels: `enhancement`, in planetary-data-cloud work stream
- Score: 2 + 2 (enhancement) + 2 (PDC bonus) = **6 points**
- PDC work gets visibility boost

**Example 7: Operations Task (aggregated)**
- Base: 2
- Labels: `nssdca-delivery`, `data-release`
- **Not scored individually** - counted in operations metrics
- Shown as: "27 NSSDCA deliveries" in summary

**Example 8: Release Theme (Epic)**
- Base: 2
- Labels: `theme`, `p.must-have`
- Score: 2 + 3 (theme) + 3 (must-have) = **8 points**
- **Drives report organization** - becomes a primary section with related work grouped underneath

## Changes from Previous Versions

**v2.1 Changes:**
- **Release Themes prioritization** - `theme` label score increased from +1 to +3
- **Theme-centric organization** - Reports now organize by Release Themes first, then other work
- **Enhanced theme linking** - Issues are automatically linked to their parent Release Themes via:
  - Parent-child relationships: "Parent: #123", "Subtask of #456" (checked FIRST)
  - Direct references: "Addresses #123", "Part of #456"
  - Task associations: "Task for #123", "Related to #456"
- **Query enhancement** - GitHub queries now include `body` field for parent detection
- **Stakeholder alignment** - Release Themes represent planned, stakeholder-agreed priorities

**v2.0 Changes:**
- **Base score increased** from 0 to 2 (all work matters)
- **Priority labels now optional** (was effectively required)
- **Minimal exclusions** - removed sprint-backlog, B##.#, i&t.* from exclusion list
- **Planetary Data Cloud boost** - added +2 bonus for PDC work
- **Operations aggregation** - special handling for ops metrics
- **Philosophy shift** - from "filter to important" to "include all completed work"

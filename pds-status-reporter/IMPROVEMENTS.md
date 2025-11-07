# PDS Status Reporter v2.0 - Improvement Summary

## Overview

The skill has been upgraded to **v2.0** with a major philosophy shift and several critical bug fixes. The core principle is now: **"All completed work matters"**.

---

## Critical Issues Fixed

### 1. ✅ Ignore Flag Now Works
**Problem:** The `atlas` repository (marked `ignore: true` in `node-products`) was incorrectly included in reports.

**Root cause:** The scoring script didn't parse the `ignore: true` flag from `pds-products.yaml`.

**Fix:**
- All scripts now properly parse and respect `ignore: true`
- 36 repositories now correctly excluded:
  - node-products: atlas, img-msn-int, kdp, ppi-reviews, etc.
  - archived_repositories: pds-github-util, pds-doi-legacy, etc.
  - forked_repositories: FFmpeg, opensearch-java, etc.

**Verification:** `cat /tmp/pds-scored-issues.json | jq '[.[] | select(.repo == "atlas")] | length'` → **0**

---

### 2. ✅ Priority Labels No Longer Required
**Problem:** Only 37 of 235 issues included in reports - effectively required priority labels for inclusion.

**Philosophy shift:** "All completed work matters" - priority/severity are optional bonuses, not requirements.

**Changes:**
- **Base score:** All issues now start with **+2 points** (was 0)
- **Type scores increased:**
  - `bug`: +3 (was +2)
  - `enhancement`: +2 (was +1)
  - `requirement`: +2 (was +1)
  - `security`: +6 (was +5)
  - `backwards-incompatible`: +8 (was +6)
- **Priority scores reduced:** +3/+2/+1 (was +5/+3/+2)
- **Severity scores reduced:** +4/+2/+1 (was +5/+3/+1)

**Result:** **222 issues included** (was 37) - **6x increase** in coverage

---

### 3. ✅ Minimal Exclusions
**Problem:** Too many issues filtered out due to planning/workflow metadata.

**Changes removed from exclusions:**
- ❌ `sprint-backlog`, `release-backlog`, `product-backlog` - Just planning labels
- ❌ `B##.#` pattern (B16, B17, etc.) - Just build tracking labels
- ❌ `i&t.*` labels (i&t.skip, i&t.done, etc.) - Just workflow labels
- ❌ Other `needs.*` labels - Can still represent valid closed work

**Only exclude truly invalid work:**
- ✅ `duplicate`, `invalid`, `wontfix`, `icebox`
- ✅ `needs.triage`, `needs.more-info` (shouldn't be closed)
- ✅ Dependency updates (unless backwards-incompatible)

**Rationale:** If an issue was closed, the work was completed and should be reported, regardless of which sprint/build it was part of.

---

### 4. ✅ Operations Tasks Aggregated
**Problem:** 117 individual NASA-PDS/operations tickets cluttered the report with repetitive entries.

**Solution:** Operations tasks now shown as summary metrics:
- ✅ "27 NSSDCA deliveries"
- ✅ "62 data releases"
- ✅ "28 other operational tasks"

**Implementation:**
- Operations issues detected by `product === 'operations'`
- Counted by labels: `nssdca-delivery`, `data-release`
- Shown in dedicated "operations" section in Product Deep-Dives
- Individual tickets not listed (reduces noise, improves clarity)

---

### 5. ✅ Planetary Data Cloud Work Highlighted
**Problem:** Important PDC infrastructure work underrepresented.

**Solution:** Added **+2 bonus** for `planetary-data-cloud` work stream.

**Result:**
- **17 PDC issues** included (was 9)
- PDC work properly showcased alongside core-data-services and web-modernization
- Critical cloud platform engineering now visible

---

### 6. ✅ Web Modernization Now Visible
**Problem:** No web modernization activity shown (was filtered out by aggressive scoring).

**Solution:** Less aggressive filtering + base score of 2.

**Result:** **21 web modernization issues** included (was 0)

---

## Before vs After Comparison

| Metric | v1.0 | v2.0 | Change |
|--------|------|------|--------|
| **Issues included** | 37 | 222 | +500% |
| **Atlas excluded** | ❌ No | ✅ Yes | **FIXED** |
| **Operations** | Individual (117 tickets) | Aggregated metrics | **Improved** |
| **PDC representation** | 9 issues | 17 issues | +89% |
| **Web Modernization** | 0 issues | 21 issues | **NEW!** |
| **Breaking changes** | 0 shown | 5 shown | **Found!** |
| **Security issues** | 0 shown | 1 shown | **Found!** |
| **Base score** | 0 (required labels) | 2 (all work matters) | **Philosophy shift** |

---

## Files Updated

### Production Scripts Created
```
scripts/
├── README.md                   # Comprehensive usage documentation
├── query-releases.mjs          # Query GitHub releases (executable)
├── score-issues.mjs            # Score and filter issues (executable)
└── generate-report.mjs         # Generate formatted report (executable)
```

### Documentation Updated
- **SKILL.md**: Updated Quick Start, algorithm, scoring rubric, changelog
- **label-scoring-rubric.md**: Complete rewrite with v2.0 philosophy, examples, operations handling
- **github-cli-reference.md**: No changes (already comprehensive)

### Resources
- **pds-products.yaml**: No changes (already correct)
- **core_backbone.yaml**: No changes (already correct)

---

## New Workflow

```bash
# 1. Query closed issues from GitHub
gh search issues --owner NASA-PDS --closed "2025-10-01..2025-11-06" --limit 1000 \
  --json number,title,url,closedAt,labels,repository > /tmp/pds-closed-issues.json

# 2. Query releases
node scripts/query-releases.mjs 2025-10-01 2025-11-06

# 3. Score and filter issues (v2.0 logic)
node scripts/score-issues.mjs /tmp/pds-closed-issues.json

# 4. Generate report
node scripts/generate-report.mjs monthly 2025-10-01 2025-11-06 report.md
```

---

## Testing Results

Using October 1 - November 6, 2025 data:

```
=== FILTERING SUMMARY ===
Total issues in date range: 235
Excluded - Ignored repositories: 6 (atlas, etc.) ← FIXED!
Excluded - Invalid/duplicate/wontfix: 7
Excluded - Dependency updates: 0
Included in report: 222 ← Up from 37!

=== WORK STREAM BREAKDOWN ===
core-data-services: 184 issues
web-modernization: 21 issues ← Up from 0!
planetary-data-cloud: 17 issues ← Up from 9!

=== KEY METRICS ===
Breaking changes: 5 ← Found (was 0)
Security issues: 1 ← Found (was 0)
Core backbone issues: 37
Operations tasks: 117
  - NSSDCA deliveries: 27
  - Data releases: 62
```

**Verification:** Atlas repository properly excluded (0 issues in scored results)

---

## Philosophy Change

### v1.0: "Filter to Important"
- Required priority labels
- Aggressive exclusions
- Only 37 issues included
- Operations tickets cluttered report
- Atlas incorrectly included

### v2.0: "All Completed Work Matters"
- Base score of 2 for all work
- Priority/severity = optional bonuses
- Minimal exclusions (only invalid work)
- 222 issues included
- Operations aggregated as metrics
- Ignore flag properly respected

---

## Benefits

1. **Comprehensive Coverage**: 6x more issues = better visibility into all program activity
2. **Accurate Representation**: Breaking changes, security issues, and PDC work now visible
3. **Cleaner Reports**: Operations shown as metrics, not 117 individual tickets
4. **Correct Filtering**: Ignored repositories (atlas, etc.) properly excluded
5. **Better UX**: All work streams represented (web-modernization added)
6. **Flexible**: Can still identify high-priority items via scoring, but doesn't exclude lower-priority completed work

---

## Scripts Documentation

See `scripts/README.md` for:
- Detailed usage for each script
- Configuration file documentation
- Troubleshooting guide
- Scoring philosophy explanation
- Version history

---

## Changelog Entry

Added to SKILL.md:

```markdown
## Changelog

- **2.0.0** — Major philosophy shift: "All completed work matters"
  - **Scoring changes**: All issues start with base score of 2 (was 0);
    priority/severity labels now optional bonuses (was required)
  - **Minimal exclusions**: Only exclude truly invalid work (duplicate, wontfix, icebox);
    keep planning metadata (sprint-backlog, B##.#, i&t.* labels)
  - **Ignore flag fixed**: Properly respects `ignore: true` in pds-products.yaml
    (e.g., atlas, node-products, archived repos now excluded)
  - **Operations aggregation**: NASA-PDS/operations tasks shown as metrics
    ("27 NSSDCA deliveries, 62 data releases") instead of individual listings
  - **Planetary Data Cloud boost**: +2 bonus for PDC work stream to ensure
    visibility of critical infrastructure work
  - **Result**: ~6x more issues included in reports (222 vs 37),
    better representing all program activity
```

---

## v2.1 - Configuration Consolidation (2025-11-06)

### Issue: Maintaining Two Separate YAML Files Was Brittle

**Problem:** `core_backbone.yaml` and `pds-products.yaml` were separate files that needed to be kept in sync manually.

**Solution:** Consolidated into single `pds-products.yaml` file:
- Added `core_backbone: true` flag to product definitions
- Added `core_backbone_justification` field for documentation
- Updated `score-issues.mjs` to parse core_backbone from pds-products.yaml
- Deprecated `core_backbone.yaml` file

**Products marked as core_backbone:**
- registry-tools (17 repos)
- search-api (4 repos)
- peppi (1 repo)
- cloud-platform-engineering (8 repos)
- cloud-operations (3 repos)

**Benefits:**
1. **Single source of truth** - All product configuration in one place
2. **Reduced maintenance burden** - No need to sync two files
3. **Better documentation** - Justification explains why products are critical
4. **Version tracking** - pds-products.yaml now at v2.0 with quarterly review reminder

---

## Recommendation

The skill is now **production-ready** with v2.1 improvements. When invoked by Claude, it will:

1. Properly exclude ignored repositories (atlas, archived, forked)
2. Include all completed work (not just high-priority)
3. Show operations as meaningful metrics
4. Highlight breaking changes and security issues
5. Represent all work streams fairly
6. Use single consolidated configuration file (pds-products.yaml)

**No user action required** - the skill will automatically use the improved scripts when invoked.

---
name: release-notes
description: Generate clear, skimmable GitHub release notes with **⚠️ Breaking Changes prominently displayed FIRST** (if any exist), followed by Highlights and detailed categorized sections. **Every listed change must include a link** to the originating issue or pull request. Can optionally upload the generated notes directly to a GitHub release using the gh CLI.
---

# User-Friendly Release Notes (with Executive Summary + Links)

## Inputs
- **repo**: GitHub org/repo (e.g., `NASA-PDS/doi-service`)
- **tag/version**: e.g., `v1.6.0`
- **date**: ISO or human date (e.g., `2025-11-05`)
- **changes**: structured list of merged PRs/issues (title, labels, number, URL, author)
  - Each item SHOULD have: `title`, `labels[]`, `number`, `html_url`, and OPTIONAL `area`, `component`, `breaking`, `deprecation`, `security`, `runtime_requirements`, `upgrade_steps`, `impact`, `perf_metrics`.
- **compare_url**: GitHub compare link for "Full changelog".
- **upload (optional)**: boolean, if `true` upload the generated notes to GitHub release using `gh` CLI.
- **compat_matrix (optional)**: component/version/requirements table for multi-component releases.
- **known_issues (optional)**: items with link + workaround.
- **docs_links (optional)**: docs, migration guide, artifacts, support channel.

## Prerequisites
- For upload functionality: GitHub CLI (`gh`) must be installed and authenticated
  - Install: `brew install gh` (macOS) or see https://cli.github.com
  - Authenticate: `gh auth login`
  - Verify: `gh auth status`

## Output
- Markdown formatted **Release Notes** with sections in this order (omit empties):
  1) **⚠️ Breaking Changes** (ALWAYS FIRST if present; bold; clear impact statement + required migration steps; link)
  2) **Highlights** (3–6 bullets, outcome-focused, each bullet ends with a link)
  3) **New**
  4) **Improvements**
  5) **Fixes**
  6) **Security**
  7) **Deprecations**
  8) **Compatibility** (runtimes; optional matrix)
  9) **Upgrade notes** (step-by-step)
  10) **Known issues**
  11) **Links** (docs, migration, artifacts, **Full changelog**)
- All bullets MUST include a GitHub link to the source PR/issue (or docs).
- **CRITICAL**: If ANY breaking changes exist, they MUST appear as the first section with prominent warning emoji (⚠️)
- If `upload: true`, upload the generated notes to the GitHub release using `gh release create` (if release doesn't exist) or `gh release edit` (if it exists).

## Style Rules
- **Breaking changes come FIRST.** If any exist, they are the absolute first section with ⚠️ emoji.
- **Breaking change format**: State what changed, who is affected, what breaks, and how to fix. Always bold the title.
- **Start with users.** Highlights = outcomes/benefits, not implementation.
- **One idea per bullet**, ≤ ~15 words if possible, link at the end.
- **Label the audience** where useful: *Data providers*, *API consumers*, *Admins*.
- **Numbers beat adjectives** (e.g., "~25% faster ingestion").
- Use code fences for commands/config in Upgrade notes.
- Prefer present tense: "Adds…", "Fixes…", "Improves…".
- No empty sections; consistent order across releases.

## Label → Section Mapping
- `breaking-change`, `backwards-incompatible`, `breaking` → ⚠️ Breaking Changes (HIGHEST PRIORITY)
- Titles starting with "BREAKING:", "Breaking Change:", etc. → ⚠️ Breaking Changes
- `feature`, `enhancement`, `requirement` → New
- `improvement`, `perf`, `refactor(user-visible)` → Improvements
- `bug`, `fix` → Fixes
- `security` → Security
- `deprecation` → Deprecations
- `docs` → (link under **Links** unless user-visible)
- Unlabeled but user-visible → Improvements (fallback)

## Algorithm (what to do with inputs)
1. **FIRST: Detect Breaking Changes** (CRITICAL - do this before anything else)
   - Scan ALL changes for labels: `breaking-change`, `backwards-incompatible`, `breaking`
   - Scan ALL PR/issue titles for patterns: "BREAKING:", "Breaking Change:", "[BREAKING]"
   - If ANY found, create "⚠️ Breaking Changes" as the FIRST section
   - For each breaking change: describe impact, affected users, what breaks, migration steps
   - Bold the change title and include clear "How to migrate:" instructions
2. **Categorize** all remaining changes by labels → sections.
3. **Detect Security/Deprecations** regardless of other labels; promote to dedicated sections.
4. **Assemble Highlights**
   - Pick 3–6 biggest user-visible changes across ALL sections (including breaking changes)
   - Write benefit-first bullets; append the canonical PR/issue link.
   - NOTE: Breaking changes already have their own section, so Highlights is a summary
5. **Synthesize Upgrade notes**
   - Collect `upgrade_steps` from inputs or PR descriptions; format 1–n steps.
   - Include commands/config diffs if provided.
   - Breaking changes should reference migration steps already documented in Breaking Changes section
6. **Add Compatibility**
   - Include "Requires: Java 17+, Python 3.12" or a table if `compat_matrix` exists.
   - Highlight any compatibility breaks here as well
7. **Known issues** (if any): symptom → workaround → link.
8. **Links**: Docs, migration guide, artifacts, support, and **Full changelog** (compare_url).
9. **Validate link coverage**: every bullet ends with at least one `https://github.com/...` link.
10. **Upload (if requested)**:
    - Check if GitHub CLI (`gh`) is installed and authenticated
    - Check if the release already exists: `gh release view <tag> --repo <repo>`
    - If release exists: `gh release edit <tag> --notes-file <file> --repo <repo>`
    - If release doesn't exist: `gh release create <tag> --notes-file <file> --repo <repo>`
    - Confirm upload success and provide the release URL

## Edge Cases
- **Breaking changes detection**:
  - Even if not labeled, infer breaking changes from title patterns or PR/issue descriptions
  - Check for terms like "removed", "deprecated API", "incompatible", "requires migration"
  - Major version bumps (e.g., v1.x → v2.0) often indicate breaking changes
  - If uncertain whether a change is breaking, err on the side of caution and flag it
- If a change has multiple links, keep one canonical link (the merged PR).
- For multi-repo rollups, create a top-level Highlights + table of component versions; link out to each component's release.
- If input lacks labels, infer from title (e.g., starts with `fix:` → Fixes, `BREAKING:` → Breaking Changes).
- If no user action required, add **"No action needed."** to Upgrade notes.
- **Upload edge cases**:
  - If `gh` is not installed or not authenticated, display error and provide setup instructions
  - If release exists but is a draft, edit the draft instead of creating new release
  - If upload fails, save notes locally and provide manual upload command
  - Always show the user what command will be executed before running it

## Example (abbreviated)
**Input changes (3 items):**
- title: "BREAKING: Remove deprecated API v1 endpoints"
  labels: [breaking-change, api]
  number: 99
  html_url: https://github.com/ORG/REPO/pull/99
  impact: "API consumers using v1 endpoints"
- title: "Add dataset-level filters to Registry API"
  labels: [feature, api]
  number: 123
  html_url: https://github.com/ORG/REPO/pull/123
  impact: "API consumers"
- title: "Fix: validation crash on missing schema"
  labels: [bug, validation]
  number: 456
  html_url: https://github.com/ORG/REPO/pull/456

**Output excerpt:**
```md
## ⚠️ Breaking Changes
- **API v1 endpoints removed** — All applications using `/api/v1/*` endpoints will break.
  **How to migrate:**
  1) Update base URL from `/api/v1/` to `/api/v2/`
  2) Review API v2 documentation for parameter changes
  3) Test with new endpoints before deploying
  ([#99](https://github.com/ORG/REPO/pull/99))

## Highlights
- API v1 deprecated endpoints removed; migrate to v2 for continued support ([#99](https://github.com/ORG/REPO/pull/99))
- Query datasets faster with new API filters for large catalogs ([#123](https://github.com/ORG/REPO/pull/123))

## New
- Registry API: dataset-level filters for complex queries ([#123](https://github.com/ORG/REPO/pull/123))

## Fixes
- Validation: no longer crashes on missing schema ([#456](https://github.com/ORG/REPO/pull/456))

## Links
- **Full changelog:** https://github.com/ORG/REPO/compare/v1.5.0...v1.6.0
```

## Additional Resources
- [label_mapping.md](./additional_resources/label_mapping.md)
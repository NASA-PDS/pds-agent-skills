---
name: creating-pds-pull-requests
description: Create pull requests in NASA-PDS repositories using the appropriate PR template. Use when user requests to create, submit, or open a pull request.
---

# Creating PDS Pull Requests Skill

This skill creates pull requests in NASA-PDS repositories using the appropriate PR template. It first checks for a repository-specific template, then falls back to the organization default.

## Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- Node.js v18+ (for template caching script)
- User must have push access to the target branch
- Current working directory should be within a git repository
- Changes should already be committed and ready for PR

## Workflow

### 1. Verify Repository State

**Check Git Status:**

```bash
# Verify we're in a git repo and get current branch
git rev-parse --abbrev-ref HEAD

# Check if branch has upstream tracking
git status -sb
```

**Validate Branch:**
- Confirm the current branch is not `main` or `master` (these are typically protected)
- If on main/master, ask user which branch to create the PR from

**Check for Unpushed Commits:**

```bash
# Check if branch exists on remote and if there are unpushed commits
git log @{u}..HEAD --oneline 2>/dev/null || echo "Branch not yet pushed"
```

If there are unpushed commits or the branch doesn't exist on remote, push first:

```bash
git push -u origin HEAD
```

### 2. Locate PR Template

**Priority Order:**

1. **Local repository template** - Check these locations in order:
   - `.github/pull_request_template.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `docs/pull_request_template.md`
   - `pull_request_template.md`

2. **Cached organization template** - If no local template found, use the cached NASA-PDS organization template from:
   `creating-pds-pull-requests/resources/templates/pull_request_template.md`

**Template Detection:**

```bash
# Check for local templates
for template in .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE.md docs/pull_request_template.md pull_request_template.md; do
  if [ -f "$template" ]; then
    echo "Found: $template"
    break
  fi
done
```

If no local template is found, use the cached organization template. If the cache doesn't exist or is stale, run the caching script first:

```bash
cd creating-pds-pull-requests
node scripts/cache-template.mjs
```

### 3. Gather PR Information

**Analyze Changes:**

```bash
# Get the base branch (usually main)
git remote show origin | grep "HEAD branch" | cut -d: -f2 | xargs

# Show commits that will be in the PR
git log origin/main..HEAD --oneline

# Show files changed
git diff origin/main..HEAD --stat
```

**Collect from User:**

Using the template sections, gather:

- **PR Title** - Should be user-friendly as it will appear in release notes
  - Good: "Add batch validation support for PDS4 labels"
  - Bad: "Fix #123" or "Update files"

- **Summary** - Brief description of what changed and why

- **Test Data and/or Report** - One of:
  - Reference to regression tests in the code
  - Test data and outputs attached
  - Manual testing steps performed

- **Related Issues** - GitHub issues this PR addresses:
  - Use `Fixes #123` to auto-close issues on merge
  - Use `Refs #123` for related but not fixed issues

### 4. Fill the Template

**NASA-PDS PR Template Structure:**

The template is cached in `resources/templates/pull_request_template.md`. Key sections:

```markdown
## Summary
[Brief summary of changes]

## Test Data and/or Report
[Test information - regression tests, test data, or manual testing]

## Related Issues
[Links to issues using Fixes/Refs syntax]

## Reviewer Checklist
[Checklist items - leave unchecked for reviewers]
```

**Content Guidelines:**

- Be clear and specific, but concise
- Do not fill in the reviewer checklist items - those are for reviewers
- If no related issues exist, note "N/A" or ask user if they need to create an issue first
- Sanitize any sensitive information (paths, credentials, internal hostnames)

### 5. Create the Pull Request

**Using GitHub CLI:**

```bash
gh pr create \
  --title "<user-friendly title>" \
  --body "<filled-template-body>" \
  --base main
```

**Optional Flags:**

- `--draft` - Create as draft PR if not ready for review
- `--reviewer <username>` - Request specific reviewers
- `--assignee <username>` - Assign the PR
- `--label <label>` - Add labels

**Handling Heredoc for Body:**

Use a heredoc for multi-line body content:

```bash
gh pr create --title "Add batch validation support" --body "$(cat <<'EOF'
## Summary
Added support for batch validation of multiple PDS4 labels in a single command.

## Test Data and/or Report
- Added unit tests in `test_batch_validation.py`
- Integration test covers 100+ label batch scenario

## Related Issues
Fixes #456

## Reviewer Checklist
[Checklist items here - leave unchecked]
EOF
)"
```

### 6. Confirm Success

After creating the PR:

1. Display the PR URL to the user
2. Show the PR number
3. Remind user about:
   - Monitoring CI checks (SonarCloud, tests, etc.)
   - Addressing any automated review comments
   - The reviewer checklist that reviewers will complete

## Template Caching

The PR template is cached locally in `resources/templates/` to avoid repeated GitHub API calls. The caching script should:

1. Fetch the latest PR template from NASA-PDS/.github
2. Store it in `resources/templates/pull_request_template.md`
3. Update a timestamp file to track last cache update

Cache the template on first use or if cache is older than 7 days.

**Forcing Cache Refresh:**

If the template has been updated in NASA-PDS/.github and you need to refresh immediately:

```bash
# Option 1: Delete cache directory and re-run caching script
rm -rf creating-pds-pull-requests/resources/templates/
cd creating-pds-pull-requests
node scripts/cache-template.mjs

# Option 2: Delete timestamp file to trigger automatic refresh
rm creating-pds-pull-requests/resources/templates/.cache-timestamp
# Next skill invocation will automatically refresh template

# Option 3: Use --force flag or environment variable
node scripts/cache-template.mjs --force
# or
FORCE_TEMPLATE_REFRESH=true node scripts/cache-template.mjs
```

## Error Handling

- **Not in a git repo:** Display error and ask user to navigate to a repository
- **No commits to create PR:** Inform user there are no changes between their branch and main
- **Branch already has PR:** Display existing PR URL using `gh pr view`
- **Push permission denied:** Suggest checking repository permissions or creating a fork
- **gh not authenticated:** Prompt user to run `gh auth login`

## Example Invocations

**User:** "Create a PR for my changes"
- Check branch state, find template, gather info, create PR

**User:** "Open a pull request that fixes issue #123"
- Auto-populate "Related Issues" with "Fixes #123", gather other details

**User:** "Submit a draft PR for review"
- Create PR with `--draft` flag

**User:** "Create a PR and assign it to @reviewer"
- Create PR with `--assignee` and optionally `--reviewer` flags

## Security Considerations

- **Never include credentials, API keys, or tokens** in PR descriptions
- **Sanitize file paths** that might reveal internal infrastructure
- **Remove PII** from any error messages or logs included in the description
- If uncertain whether information is sensitive, **ask the user before including it**

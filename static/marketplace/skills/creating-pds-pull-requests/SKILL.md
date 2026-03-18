---
name: creating-pds-pull-requests
description: Create GitHub pull requests in NASA-PDS repositories with auto-detection of repo/branch, issue linking, reviewer assignment, and label management. Use when user requests to create, open, or submit a pull request, PR, or merge request in PDS repositories.
---

# Creating PDS Pull Requests Skill

This skill creates GitHub pull requests in NASA-PDS repositories with intelligent defaults, automatic issue linking, and consistent formatting following PDS conventions.

## Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- User must have write access to the target NASA-PDS repository
- Must be in a git repository with uncommitted changes or a branch ready to push

## Workflow

### 1. Detect Current Context

**Auto-detect Repository and Branch:**

```bash
# Get current repository
git remote get-url origin 2>/dev/null || git remote get-url upstream 2>/dev/null

# Get current branch
git branch --show-current

# Check if branch has commits ahead of base
git rev-list --count origin/main..HEAD 2>/dev/null || git rev-list --count upstream/main..HEAD 2>/dev/null
```

**Edge Cases:**
- **Forks**: If `origin` is a fork (personal namespace), use `upstream` for the base repository
- **Non-NASA-PDS repos**: If no NASA-PDS remote found, ask user for target repository
- **No commits**: If current branch has no commits ahead, ask user if they want to commit changes first
- **Uncommitted changes**: If there are uncommitted changes, offer to commit them before creating PR
- **Main/master branch**: Warn if user is on main/master and suggest creating a feature branch

**Determine Base Branch:**

```bash
# Check common base branch names
git branch -r | grep -E 'origin/(main|master|develop)' | head -1
```

Default to `main`, but ask user to confirm if uncertain.

### 2. Gather PR Information

**Determine PR Type:**

Use the AskUserQuestion tool to ask what type of PR this is:

- **Feature** - New functionality or enhancements (label: `enhancement`)
- **Bug Fix** - Fixes for defects or issues (label: `bug`)
- **Hotfix** - Urgent fixes for production issues (label: `bug`, `p.must-have`)
- **Refactor** - Code improvements without behavior changes (label: `refactor`)
- **Documentation** - Documentation updates only (label: `documentation`)
- **Chore** - Maintenance tasks, dependency updates (label: `chore`)

**Gather Required Information:**

Ask the user for:

1. **PR Title** (if not auto-generated from commits)
   - Format: Brief, descriptive, present tense
   - Examples:
     - "Add batch processing support for DOI registration"
     - "Fix memory leak in registry sweeper"
     - "Update deployment documentation for Kubernetes"

2. **Related Issues** (strongly recommended)
   - Search for related issues if user provides keywords:
   ```bash
   gh issue list --repo NASA-PDS/<repo> --search "<keywords>" --limit 10
   ```
   - Support multiple formats:
     - `#123` (current repo)
     - `NASA-PDS/repo#456` (cross-repo)
     - `https://github.com/NASA-PDS/repo/issues/789`
   - Multiple issues: `Closes #123, Closes #456`

3. **Description** (what changed and why)
   - Auto-generate from commits if possible:
   ```bash
   git log origin/main..HEAD --pretty=format:"- %s" --reverse
   ```
   - Ask user to provide context or motivation if needed

4. **Reviewers** (optional but recommended)
   - Suggest from recent commit authors:
   ```bash
   gh api repos/NASA-PDS/<repo>/contributors --jq '.[].login' | head -10
   ```
   - Common PDS reviewers: Check `.github/CODEOWNERS` if exists

5. **Breaking Changes** (critical to identify)
   - Ask: "Does this PR introduce any breaking changes?"
   - If yes, require detailed explanation and migration guide

### 3. Build PR Body

**Use Cached NASA-PDS PR Template:**

Use the cached official NASA-PDS PR template from `resources/templates/pull_request_template.md`. If the template is not cached, run the caching script first:

```bash
cd creating-pds-pull-requests
node scripts/cache-pr-template.mjs
```

The cached template includes:
- 🗒️ Summary section with AI assistance disclosure
- ⚙️ Test data and/or report section
- ♻️ Related issues section with autolink examples
- 🤓 Reviewer checklist (documentation, security, testing, maintenance)

**Template Refresh:**
- Templates are cached for 7 days to minimize API calls
- Force refresh: `node scripts/cache-pr-template.mjs --force`
- Cache location: `resources/templates/pull_request_template.md`

**Fill Template Sections:**

1. **PR Title** (not in body, but critical)
   - Must be "user-friendly" for Release Notes
   - Examples: https://github.com/NASA-PDS/nasa-pds.github.io/wiki/Issue-Tracking#pull-request-titles
   - Format: Brief, descriptive, present tense
   - Good: "Add batch processing for DOI registration"
   - Bad: "Fixed stuff", "Update code"

2. **🗒️ Summary Section**
   - Brief description of changes if not clear from commits
   - Use commit messages if they're descriptive:
   ```bash
   git log origin/<base-branch>..HEAD --pretty=format:"- %s" --reverse
   ```

3. **🤖 AI Assistance Disclosure** (REQUIRED)
   - Check appropriate box based on user's development process
   - Estimate percentage of AI-influenced code
   - Be transparent about AI usage

4. **⚙️ Test Data and/or Report** (REQUIRED)
   - If automated tests: Reference test documentation or test PR
   - If manual tests: Show procedure and output
   - If not tested: Explain rationale

5. **♻️ Related Issues**
   - Use `Fixes #123` or `Resolves #456` for auto-close on merge
   - Cross-repo: `Fixes NASA-PDS/repo#789`
   - Related but not closing: `Refs #101`

6. **🤓 Reviewer Checklist**
   - Leave unchecked - reviewers will verify
   - Ensure all items are addressed in PR content

**Customize Based on PR Type:**
- **Bug fix**: In Summary, include what was broken and what was fixed
- **Feature**: In Summary, include motivation and use cases
- **Breaking change**: In Summary, include clear warning and migration guide
- **Documentation**: In Test section, note that docs were reviewed/tested
- **Hotfix**: In Summary, include severity and urgency justification

**Security and Privacy - CRITICAL:**
- Sanitize all file paths, usernames, email addresses
- Remove API keys, tokens, passwords, internal URLs
- Replace sensitive hostnames with placeholders
- If uncertain, ASK USER before including information

### 4. Create the Pull Request

**Push Branch (if needed):**

```bash
# Check if branch is pushed
git branch -r | grep "origin/$(git branch --show-current)"

# If not pushed, push with upstream tracking
git push -u origin $(git branch --show-current)
```

**Create PR with gh CLI:**

```bash
# Save PR body to temporary file
cat > /tmp/pr-body.md << 'EOF'
<PR body content here>
EOF

# Create PR
gh pr create \
  --repo NASA-PDS/<repo> \
  --base <base-branch> \
  --head <head-branch> \
  --title "<PR title>" \
  --body-file /tmp/pr-body.md \
  --label "<label1>,<label2>" \
  --reviewer "<reviewer1>,<reviewer2>" \
  --assignee "@me"

# Clean up
rm /tmp/pr-body.md
```

**Labels to Apply:**

Based on PR type:
- Feature: `enhancement`, `requirement`
- Bug Fix: `bug`
- Hotfix: `bug`, `p.must-have`, `hotfix`
- Breaking Change: `breaking-change`, `backwards-incompatible`
- Documentation: `documentation`
- Refactor: `refactor`
- Security: `security`

**Additional Labels (conditional):**
- If closes issue: inherit labels from linked issue
- If work-in-progress: `wip` or create as draft PR
- If needs discussion: `question`, `discussion`

### 5. Post-Creation Actions

**Verify Creation:**

```bash
# Get PR URL and number
gh pr view --repo NASA-PDS/<repo> --json number,url,title

# Display to user
echo "✅ Pull request created successfully!"
echo "📍 URL: <pr-url>"
echo "🔢 Number: #<pr-number>"
```

**Link to Issues (if not auto-linked):**

If using `Closes #123` syntax in PR body, GitHub auto-links. Otherwise, manually link:

```bash
# Add comment linking to issue
gh pr comment <pr-number> --repo NASA-PDS/<repo> --body "Related to #<issue-number>"
```

**Draft PR Option:**

If user indicates work-in-progress:

```bash
gh pr create --draft <other-options>
```

**Mark as Ready:**

```bash
gh pr ready <pr-number> --repo NASA-PDS/<repo>
```

## Edge Cases and Best Practices

### Branch Name Conventions

Encourage semantic branch names:
- `feature/<short-description>` - New features
- `bugfix/<issue-number>-<short-description>` - Bug fixes
- `hotfix/<short-description>` - Urgent fixes
- `refactor/<component>` - Refactoring work
- `docs/<topic>` - Documentation updates

If branch name doesn't follow convention, suggest renaming:

```bash
git branch -m <old-name> <new-branch-name>
git push origin -u <new-branch-name>
git push origin --delete <old-name>
```

### Commit Message Quality

If recent commits have poor messages, suggest amending:

```bash
# View recent commits
git log origin/main..HEAD --oneline

# Interactive rebase to improve messages
git rebase -i origin/main
```

### Handling Conflicts

Before creating PR, check for conflicts:

```bash
# Fetch latest from base branch
git fetch origin <base-branch>

# Check for conflicts
git merge-base --is-ancestor origin/<base-branch> HEAD || echo "May have conflicts"

# Suggest rebasing if behind
git log HEAD..origin/<base-branch> --oneline | wc -l
```

If conflicts likely, suggest rebasing first:

```bash
git fetch origin <base-branch>
git rebase origin/<base-branch>
git push --force-with-lease origin $(git branch --show-current)
```

### Large PRs

If PR has many commits or changed files:

```bash
# Count commits
git rev-list --count origin/<base-branch>..HEAD

# Count changed files
git diff --name-only origin/<base-branch>..HEAD | wc -l
```

If > 20 files or > 10 commits, suggest:
- Breaking into smaller PRs
- Adding detailed description
- Requesting multiple reviewers

### Cross-Repository PRs

For changes affecting multiple PDS repositories:
1. Create PR in each repository
2. Cross-reference PRs in descriptions
3. Use same branch name for consistency
4. Coordinate merge order if dependencies exist

### Template Caching

Check if PR template exists in repo:

```bash
# Check for PR template
gh api repos/NASA-PDS/<repo>/contents/.github/PULL_REQUEST_TEMPLATE.md 2>/dev/null
```

If found, use it. Otherwise, use the standard PDS template above.

## Examples

### Example 1: Simple Bug Fix

```
User: "Create a PR to fix the validation error I just committed"

Actions:
1. Detect repo: NASA-PDS/validate
2. Detect branch: bugfix/123-validation-error
3. Auto-generate title from commit: "Fix NullPointerException in TableValidator"
4. Search for related issue: #123
5. Create PR with bug fix template, linking to #123
6. Apply labels: bug
7. Assign to user
```

### Example 2: Feature with Breaking Changes

```
User: "Open a PR for the new authentication API"

Actions:
1. Detect repo: NASA-PDS/registry-api
2. Detect branch: feature/oauth-authentication
3. Ask for title: "Add OAuth 2.0 authentication support"
4. Ask about breaking changes: "Yes - removes basic auth"
5. Request migration guide from user
6. Create PR with breaking change warnings
7. Apply labels: enhancement, breaking-change, backwards-incompatible
8. Request reviewers
```

### Example 3: Draft PR for WIP

```
User: "Create a draft PR for my work so far"

Actions:
1. Detect current state
2. Ask: "This will be a draft PR - work in progress?"
3. Create draft PR with --draft flag
4. Add label: wip
5. Note: "Mark as ready when complete using: gh pr ready <number>"
```

## Validation Checklist

Before creating PR, verify:
- ✅ Branch is pushed to remote
- ✅ Branch is ahead of base branch
- ✅ No uncommitted changes (or user confirmed to leave them)
- ✅ PR title is descriptive and follows conventions
- ✅ Related issues are linked properly
- ✅ Labels are appropriate for change type
- ✅ No sensitive information in PR description
- ✅ Breaking changes are clearly documented (if applicable)

## Common Issues and Solutions

**Issue: "gh: command not found"**
Solution: Install GitHub CLI: `brew install gh` (macOS) or see https://cli.github.com

**Issue: "gh: not authenticated"**
Solution: Run `gh auth login` and follow prompts

**Issue: "Permission denied"**
Solution: User needs write access to repository - check org membership

**Issue: "No commits ahead of base"**
Solution: User needs to commit changes first - offer to help with commit

**Issue: "Branch already has a PR"**
Solution: Ask if user wants to update existing PR or create new branch

**Issue: "Conflicts with base branch"**
Solution: Suggest rebasing: `git rebase origin/<base-branch>`

---

**Note:** This skill focuses on creating PRs. For generating release notes from merged PRs, use the `generating-release-notes` skill. For creating issues, use the `creating-pds-issues` skill.

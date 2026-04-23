# SonarCloud Skills User Guide

This guide explains how to install and use the `sonarcloud-skills` plugin to audit, triage, and update security issues for NASA PDS repositories.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [The Three-Step Workflow](#the-three-step-workflow)
- [Step 1: Export Security Issues](#step-1-export-security-issues)
- [Step 2: Triage Security Issues](#step-2-triage-security-issues)
- [Step 3: Apply Triage Decisions](#step-3-apply-triage-decisions)
- [Example Prompts](#example-prompts)
- [Tips for Effective Triage Sessions](#tips-for-effective-triage-sessions)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `sonarcloud-skills` plugin provides three skills that work together as a pipeline:

| Step | Skill | What It Does |
|------|-------|-------------|
| 1 | `sonarcloud-security-exporting` | Fetches all vulnerabilities and security hotspots from SonarCloud and saves them to a file |
| 2 | `sonarcloud-security-triaging` | Analyzes each issue, reads code context, and recommends a triage decision (safe/false positive/won't fix/needs fixing) |
| 3 | `sonarcloud-security-updating` | Applies your approved triage decisions back to SonarCloud via the API |

You can run all three in one session, or use them independently depending on your workflow.

---

## Prerequisites

Before using these skills you need:

### 1. Claude Code CLI

```bash
brew install claude
# or download from https://claude.ai/code
```

### 2. Node.js v18 or higher

```bash
node --version  # should print v18.x.x or higher
```

### 3. SonarCloud API Token

The skills authenticate with SonarCloud via a personal access token.

**Generate a token:**
1. Log in to [sonarcloud.io](https://sonarcloud.io)
2. Go to **My Account → Security** (or visit https://sonarcloud.io/account/security)
3. Under **Generate Tokens**, give it a name (e.g., `claude-code-pds`) and click **Generate**
4. Copy the token — it won't be shown again

**Set the token in your environment:**
```bash
export SONARCLOUD_TOKEN=your_token_here
```

To persist it across terminal sessions, add this to your `~/.zshrc` or `~/.bash_profile`:
```bash
echo 'export SONARCLOUD_TOKEN=your_token_here' >> ~/.zshrc
source ~/.zshrc
```

**Token permissions required:**
- **Read access** (for exporting and triaging)
- **Administer Security Hotspots** + **Administer Issues** (for applying triage decisions)

If you're only auditing and not applying changes, a read-only token is sufficient.

---

## Installation

### Install the plugin (one time)

```bash
# Add the PDS marketplace
/plugin marketplace add NASA-PDS/pds-agent-skills

# Install the SonarCloud plugin
/plugin install sonarcloud-skills@pds-agent-skills
```

### Verify installation

```bash
/plugin list
# Should show: ✓ sonarcloud-skills@pds-agent-skills
```

### Update to latest version

```bash
/plugin marketplace update pds-agent-skills
/plugin update sonarcloud-skills@pds-agent-skills
```

---

## The Three-Step Workflow

```
┌─────────────────────────────┐
│  1. EXPORT                  │
│  Fetch all issues from      │
│  SonarCloud → JSON/CSV file │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  2. TRIAGE                  │
│  Claude analyzes code       │
│  context + recommends       │
│  action for each issue      │
└──────────────┬──────────────┘
               │ (you review & approve)
               ▼
┌─────────────────────────────┐
│  3. UPDATE                  │
│  Apply approved decisions   │
│  to SonarCloud via API      │
└─────────────────────────────┘
```

**Recommended format: JSON** — richer data (includes code snippets and rule details), faster triage, no need to clone repositories. Use CSV only if you need spreadsheet review.

---

## Step 1: Export Security Issues

### What this does
Connects to the SonarCloud API, fetches all open vulnerabilities and security hotspots for all NASA PDS repositories, and saves them to a file.

### Example prompts

```
Export all SonarCloud security issues for NASA PDS to a JSON file in my home directory
```

```
Run a SonarCloud security audit for nasa-pds and save the results to ~/security-audit
```

```
Fetch the SonarCloud vulnerabilities and hotspots for all PDS repos — I want the JSON format so we can do AI-assisted triage
```

```
Export SonarCloud issues for just the registry project to /tmp
```

### What to expect
- Claude will ask where to save the output file
- The export can take **5–15 minutes** for the full nasa-pds organization (80+ repositories)
- It will show progress as it fetches each project
- When done, you'll see a summary: `Found X vulnerabilities and Y security hotspots across Z projects`
- Output file: `sonarcloud-security-issues-YYYYMMDD.json`

### Output directory note
Claude will always ask you where to save files. You can choose the current directory, `/tmp`, or a custom path. Files are **never** saved inside the plugin directory itself.

---

## Step 2: Triage Security Issues

### What this does
Reads the exported file, analyzes the code context and security rule for each issue, and recommends whether each is a true positive, false positive, or won't-fix. Claude presents recommendations one repository at a time and **waits for your approval** before proceeding.

### Example prompts

```
Help me triage the SonarCloud security issues in ~/security-audit/sonarcloud-security-issues-20260418.json
```

```
Analyze the SonarCloud issues in /tmp/sonarcloud-export.json and suggest triage decisions
```

```
Let's work through the SonarCloud security issues together — start with the registry project
```

```
Triage the SonarCloud issues, focusing on CRITICAL and BLOCKER vulnerabilities first
```

### What to expect

For each issue (or group of related issues), Claude will present:

```
## NASA-PDS_registry (5 issues)

**Issue: HTTP protocol usage (javascript:S3330)**
- Location: src/utils/namespace.js, line 45
- Rule: Using http protocol is insecure
- Count: 3 related issues

Code context:
  export const NAMESPACES = {
    core: "http://pds.nasa.gov/ns/2010/metadata/core",   ← flagged
    disp: "http://pds.nasa.gov/ns/2010/metadata/display"
  };

Analysis: This is a namespace URI identifier (XML namespace constant),
not an HTTP network connection. No HTTP client libraries are imported.

My recommendation:
- Action: REVIEWED
- Resolution: SAFE
- Comment: "Namespace URI constant, not an HTTP request. — Triaged with assistance from Claude"

How would you like to proceed?
1. Accept recommendation (mark as SAFE)
2. Keep open for manual review
3. Different approach?
```

You review each recommendation and respond with your decision. Claude will not apply any changes to SonarCloud during this step — it only generates a triage file.

### Output
A triaged JSON file: `sonarcloud-security-triaged-YYYYMMDD.json`

This file has the same structure as the export, with each issue's `triage` field populated with the approved decision.

### Metrics tracking
For multi-repository sessions, Claude automatically maintains two tracking files:
- `sonarcloud-triage-metrics.json` — structured data (progress, counts, token usage)
- `TRIAGE_METRICS.md` — human-readable dashboard showing completion percentage and decisions

---

## Step 3: Apply Triage Decisions

### What this does
Reads the triaged file and calls the SonarCloud API to update each issue's status, resolution, and comment. Supports a dry-run mode to preview changes before applying them.

### Example prompts

```
Apply the triage decisions in ~/security-audit/sonarcloud-security-triaged-20260418.json to SonarCloud
```

```
Do a dry run first to preview what changes will be made, then apply if it looks correct
```

```
Update SonarCloud with the decisions from the triage file — dry run first please
```

### What to expect

**Dry run (always recommended first):**
```
[DRY RUN] Would update hotspot AZPV1fTprahIrD-njDRb:
  Project: NASA-PDS_doi-ui
  Action: Change status to REVIEWED (SAFE)
  Comment: "Namespace URI constant, not an HTTP request. — Triaged with assistance from Claude"

Summary: 47 updates would be applied (0 errors)
```

**Live run:**
```
[1/47] ✅ Hotspot AZPV1fTprahIrD-njDRb → REVIEWED (SAFE)
[2/47] ✅ Hotspot AZnP1S0b_yFrdYV3Iu6e → REVIEWED (SAFE)
...

Summary:
  ✅ Successfully updated: 46
  ❌ Failed: 1
  ⏭️  Skipped: 0
```

After updating, Claude will suggest you verify a few issues in the SonarCloud UI to confirm the changes look correct.

---

## Example Prompts

### Full pipeline in one session

```
Let's do a complete SonarCloud security audit and triage for NASA PDS.
First export all issues to JSON, then let's triage them together repository by repository,
then apply the approved decisions. Save everything to ~/pds-security-audit.
```

### Focused audit on one project

```
Export and triage just the SonarCloud security issues for NASA-PDS_registry.
Save the output to /tmp.
```

### Resume a triage session

```
I already have a SonarCloud export at ~/security-audit/issues.json.
Let's continue triaging — I want to focus on the hotspots in the cloud-tools project.
```

### Manual triage via spreadsheet (CSV workflow)

```
Export SonarCloud security issues to CSV so I can review them in a spreadsheet.
Save to ~/Desktop/sonarcloud-audit.csv
```

After reviewing in your spreadsheet and adding Action/Resolution/Comment columns:

```
Apply the triage decisions from ~/Desktop/sonarcloud-triage.csv to SonarCloud.
Do a dry run first.
```

---

## Tips for Effective Triage Sessions

**1. Use JSON format (not CSV)**
JSON includes code snippets and rule details — Claude can analyze issues without cloning any repositories. This makes triage ~90% faster.

**2. Triage repository by repository**
Ask Claude to focus on one project at a time. This gives better code context and makes it easier to spot bulk patterns.

**3. Let Claude group similar issues**
Many false positives are duplicates of the same rule across similar files. Claude will identify these and suggest one bulk action.

**4. Always dry-run before applying**
The update step is irreversible (SonarCloud status changes can't be undone in bulk). Always preview first.

**5. Watch for HIGH confidence recommendations**
Claude assigns confidence levels. `HIGH` confidence false positives (e.g., URI literals flagged as HTTP) are safe to accept. `LOW` or `MEDIUM` confidence issues deserve a closer look.

**6. Track sessions with metrics**
For large audits spanning multiple sessions, the metrics files let you pick up where you left off and report progress to stakeholders.

---

## Troubleshooting

### "SONARCLOUD_TOKEN is not set"
Set the environment variable in your terminal session:
```bash
export SONARCLOUD_TOKEN=your_token_here
```

### "401 Unauthorized"
Your token has expired or is invalid. Regenerate at https://sonarcloud.io/account/security

### "403 Forbidden" during updates
Your token doesn't have write permissions. Regenerate a token and enable:
- **Administer Security Hotspots**
- **Administer Issues**

### Export takes too long or times out
The full nasa-pds organization has 80+ repositories. For testing, ask Claude to export a single project:
```
Export SonarCloud issues for just NASA-PDS_registry to /tmp
```

### "No issues found"
Either:
- The project has no open security issues (good news!)
- The project hasn't been analyzed in SonarCloud yet
- Check: https://sonarcloud.io/organizations/nasa-pds/projects

### Triage file shows all `"triage": null`
The export file hasn't been through the triage step yet. Run the triaging skill on it first, then apply.

---

## Related Resources

- [Plugin Marketplace Installation Guide](PLUGIN_MARKETPLACE_GUIDE.md) — detailed install scenarios
- [SonarCloud API documentation](https://sonarcloud.io/web-api)
- [SonarCloud token setup](https://sonarcloud.io/account/security)
- [NASA PDS SonarCloud organization](https://sonarcloud.io/organizations/nasa-pds/projects)

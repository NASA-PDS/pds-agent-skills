---
name: dependabot-alerts-triaging
description: Analyze GitHub Dependabot dependency vulnerability alerts and suggest triage decisions (dismiss/fix/escalate) with explanations. Use when the user needs help reviewing Dependabot alerts, deciding whether dependencies are exploitable, or bulk-triaging CVEs across NASA PDS repositories.
---

# Dependabot Alerts Triaging Skill

This skill helps you make informed triage decisions on GitHub Dependabot dependency vulnerability alerts by analyzing each CVE in the context of how the affected package is actually used in NASA-PDS code.

## Prerequisites

- JSON export from `dependabot-alerts-exporting` skill
- `gh` CLI authenticated (for creating outlaw-tracker issues)
- Optional: local clones of affected repositories (for deeper code analysis)

## Workflow Position

```
1. dependabot-alerts-exporting  → Export alerts to JSON
2. dependabot-alerts-triaging   → THIS SKILL: Analyze & suggest decisions
3. (Manual or scripted)         → Dismiss alerts via GitHub UI or API
```

## What This Skill Does

For each Dependabot alert, this skill:
1. **Explains the CVE** — what vulnerability class, what attack vector, what impact
2. **Assesses exploitability** — is the vulnerable code path actually reachable in PDS?
3. **Checks for a fix** — is a patched version available? Is it a breaking upgrade?
4. **Recommends an action** — fix, dismiss with reason, or escalate to outlaw-tracker
5. **Groups similar alerts** — bulk-triage identical CVEs across multiple repos

## Triage Actions

| Action | When to Use | GitHub API Value |
|--------|-------------|-----------------|
| **Fix** | Patched version available, upgrade is straightforward | Keep open, open outlaw-tracker issue |
| **Tolerable risk** | Real CVE but attack vector not applicable to PDS (e.g., server-side RCE in a CLI tool) | `tolerable_risk` |
| **Not used** | Vulnerable code path is never called in PDS code | `inaccurate` |
| **Inaccurate** | CVE doesn't actually affect this package version or usage | `inaccurate` |
| **No bandwidth** | Real issue, low severity, deprioritized for now | `no_bandwidth` |

## Workflow

### Step 1: Load the Export

Ask the user for the path to the JSON file from `dependabot-alerts-exporting`:

```
What is the path to your Dependabot alerts JSON file?
```

Parse the file and show a summary:

```
Loaded 127 alerts across 18 repositories
  CRITICAL: 3
  HIGH: 24
  MEDIUM: 61
  LOW: 39

Recommend starting with CRITICAL and HIGH (27 alerts).
Proceed? [yes / no / custom filter]
```

### Step 2: Prioritize by Severity

Always start with CRITICAL, then HIGH. Within each severity, group by CVE ID — the same vulnerability often appears in multiple repos and can be bulk-triaged.

```bash
# Show unique CVEs at critical/high severity
jq '[.alerts[] | select(.advisory.severity == "critical" or .advisory.severity == "high")] 
    | group_by(.advisory.cveId) 
    | map({cve: .[0].advisory.cveId, count: length, repos: map(.repository), summary: .[0].advisory.summary})' \
    alerts.json
```

### Step 3: Analyze Each Alert (or CVE Group)

For each alert or CVE group, present:

```
─────────────────────────────────────────────
CVE-2021-23337 — Command Injection in lodash
Severity: HIGH (CVSS 7.2)
Affected repos: nasa-pds/registry, nasa-pds/harvest (2 repos, 2 alerts)
Package: lodash < 4.17.21 → fix: 4.17.21
CWE: CWE-77 (Command Injection)
Advisory: https://github.com/advisories/GHSA-35jh-r3h4-6jhm

WHAT IS IT:
lodash's template() function passes user-supplied strings to Function() constructor,
enabling arbitrary code execution if untrusted input reaches template().

EXPLOITABILITY IN PDS:
- Is lodash.template() called with user input? [check repo if available]
- If lodash is only used for _.merge(), _.cloneDeep(), etc. → not exploitable via this CVE
- Patched version (4.17.21) is available and likely not a breaking change

RECOMMENDATION:
  Action: fix
  Reason: Patched version available. Upgrade is non-breaking (patch release).
  Comment: "CVE-2021-23337 affects lodash.template() with untrusted input.
            Upgrade to 4.17.21. — Triaged with assistance from Claude"
  Confidence: HIGH
  → Create outlaw-tracker issue: YES (HIGH severity, fixable)
─────────────────────────────────────────────

How would you like to proceed?
1. Accept recommendation (fix, create outlaw-tracker issue)
2. Dismiss as tolerable_risk
3. Dismiss as not_used (we don't use lodash.template with user input)
4. Skip for now
```

### Step 4: Common False Positive Patterns

Use these patterns to identify alerts that are likely safe to dismiss:

**Not used (inaccurate)**
- The vulnerable function/method is never called in PDS code
- The package is a transitive dependency of a dev-only tool (e.g., jest, webpack)
- The package is listed in `devDependencies` and not bundled into production artifacts

**Tolerable risk**
- The CVE requires network access, but the tool only runs locally (CLI tools, validators)
- The CVE requires authenticated access, and PDS services require authentication
- The CVE affects a server-side component but the package is used client-side only
- CVSS score is inflated (e.g., network-accessible vector but PDS usage is local-only)

**Inaccurate**
- The CVE was fixed in a version older than what's actually installed (version confusion)
- The advisory was later withdrawn or revised

**Test/dev dependencies (lower priority)**
- Package only appears in `devDependencies`, `test`, or `requirements-dev.txt`
- Not present in production Docker image or deployed artifact

### Step 5: For True Positives — Create outlaw-tracker Issues

For any alert where the recommended action is **fix** or that represents a genuine HIGH/CRITICAL risk, create a GitHub issue in the private `NASA-PDS/outlaw-tracker` repository:

```bash
gh issue create \
  --repo NASA-PDS/outlaw-tracker \
  --title "CVE-YYYY-NNNNN: <package> vulnerability in <repo>" \
  --label "security" \
  --body-file /tmp/dependabot_issue_body.md
```

Issue body should include:
- CVE ID and GHSA ID
- Affected repository and manifest path
- Affected package, vulnerable version range, and patched version
- CVSS score and severity
- Brief description of the vulnerability and attack vector
- Whether it is exploitable in the PDS context
- Recommended fix (upgrade command if applicable)
- Link to the GitHub Dependabot alert
- Link to the GitHub advisory

Record the created issue URL in the `triage.githubIssueUrl` field of the alert JSON.

**Comment signature:** All dismissal comments must end with:
```
— Triaged with assistance from Claude
```

### Step 6: Update the Triage JSON

After each decision, populate the `triage` field:

```json
{
  "triage": {
    "action": "dismiss",
    "dismissedReason": "not_used",
    "comment": "lodash is used only for _.merge() and _.cloneDeep() in this repo. The vulnerable template() function is never called with user input. — Triaged with assistance from Claude",
    "githubIssueUrl": null,
    "reviewer": "jordanpadams",
    "triageDate": "2026-04-23T...",
    "confidence": "high"
  }
}
```

Valid `dismissedReason` values (GitHub API):
- `tolerable_risk` — Real risk, acceptable for PDS context
- `inaccurate` — CVE doesn't apply (not_used, version mismatch, withdrawn)
- `no_bandwidth` — Real issue, low priority, deferred

### Step 7: Track Metrics

Maintain a `dependabot-triage-metrics.json` file:

```json
{
  "triageSession": {
    "startDate": "2026-04-23T...",
    "organization": "nasa-pds",
    "totalAlertsExported": 127,
    "totalAlertsTriage d": 27,
    "alertsRemaining": 100,
    "tokenUsage": {
      "total": 0,
      "notes": "Track cumulative token usage across the triage session"
    }
  },
  "remediationSummary": {
    "fix": 4,
    "tolerable_risk": 10,
    "inaccurate": 8,
    "no_bandwidth": 3,
    "pending": 102,
    "outlaw_tracker_issues_created": 4
  },
  "cveGroups": [
    {
      "cveId": "CVE-2021-23337",
      "package": "lodash",
      "affectedRepos": ["nasa-pds/registry", "nasa-pds/harvest"],
      "severity": "high",
      "action": "fix",
      "outlaw_tracker_url": "https://github.com/NASA-PDS/outlaw-tracker/issues/42"
    }
  ]
}
```

Update token usage after each repository batch using the Claude Code token counter.

## Output Format

Always produce:

1. **Summary** — "Triaged 27 alerts: 4 fix, 18 dismiss, 5 pending"
2. **Updated JSON** — Input JSON with `triage` fields populated
3. **Metrics file** — `dependabot-triage-metrics.json`
4. **outlaw-tracker issues** — Created for all fix/escalate decisions

## Notes

- **Group by CVE first** — the same CVE across 10 repos = one triage decision, not ten
- **Dev dependencies are lower priority** — triage production dependencies first
- **Patched version available = strong signal to fix** — upgrade effort is usually low
- **When unsure** — recommend human review rather than dismissing; false negatives (missed real vulnerabilities) are worse than false positives
- **Bulk dismiss** — after human approval, you can apply decisions using the GitHub API:
  ```bash
  gh api --method PATCH /repos/NASA-PDS/{repo}/dependabot/alerts/{number} \
    -f state=dismissed \
    -f dismissed_reason=tolerable_risk \
    -f dismissed_comment="..."
  ```

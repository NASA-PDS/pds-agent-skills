---
name: dependabot-alerts-exporting
description: Export GitHub Dependabot dependency vulnerability alerts for NASA PDS repositories to JSON. Use when the user requests to export, fetch, or download Dependabot alerts, dependency vulnerability data, or CVE reports for PDS projects.
---

# Dependabot Alerts Exporting Skill

This skill fetches all Dependabot dependency vulnerability alerts from GitHub for repositories under the NASA PDS organization and exports them to JSON for triage.

Dependabot alerts surface known CVEs in third-party package dependencies — these are generally more critical than static analysis findings because they represent exploitable vulnerabilities in widely-known packages, often with public proof-of-concept exploits.

## Prerequisites

- Node.js v18 or higher
- `GITHUB_TOKEN` environment variable with `security_events` scope
  - Org members: token needs `security_events` scope
  - Org admins: token needs `read:org` + `repo` scopes
  - Quickest approach: `export GITHUB_TOKEN=$(gh auth token)`

## Workflow Position

```
1. dependabot-alerts-exporting  → THIS SKILL: Export alerts to JSON
2. dependabot-alerts-triaging   → Analyze & suggest triage decisions
3. (Manual)                     → Dismiss alerts via GitHub UI or API
```

## Execution Steps

### Step 0: Confirm Output Directory

Before writing any files, ask the user where to save output:

```
Where should I save the export files?
  1. Current directory: <show $PWD>
  2. /tmp
  3. Custom path
```

Store the choice as `OUTPUT_DIR`. Never write output files inside the skill's own directory.

### Step 1: Check for GitHub Token

```bash
echo "${GITHUB_TOKEN:+set}" || echo "not set"
```

If not set, guide the user:
- "A GitHub token is required to access Dependabot alerts."
- "Quickest option: `export GITHUB_TOKEN=$(gh auth token)`"
- "Or generate a token at: https://github.com/settings/tokens"
- "Required scopes: `security_events` (for org members) or `read:org` + `repo` (for admins)"

### Step 2: Run the Fetch Script

```bash
cd <skill-directory>
node scripts/fetch-dependabot-alerts.mjs nasa-pds "$OUTPUT_DIR/dependabot-alerts-nasa-pds-$(date +%Y%m%d).json"
```

**Options:**

| Flag | Description | Example |
|------|-------------|---------|
| `--severity` | Filter by severity (comma-separated) | `--severity critical,high` |
| `--state` | Alert state (default: open) | `--state open` |
| `--repo` | Single repository only | `--repo validate` |
| `--ecosystem` | Package ecosystem | `--ecosystem npm` |

**Common invocations:**

```bash
# All open alerts (default)
node scripts/fetch-dependabot-alerts.mjs nasa-pds output.json

# Critical and high only
node scripts/fetch-dependabot-alerts.mjs nasa-pds output.json --severity critical,high

# Single repo
node scripts/fetch-dependabot-alerts.mjs nasa-pds output.json --repo registry

# Already-dismissed alerts (for audit)
node scripts/fetch-dependabot-alerts.mjs nasa-pds output.json --state dismissed
```

### Step 3: Review Export Summary

After the script completes, show the user the summary:

```
✅ Export complete!
   Total alerts: <N>
   By severity:
     CRITICAL: <N>
     HIGH: <N>
     MEDIUM: <N>
     LOW: <N>
   Output: <path>
```

If 0 alerts: confirm whether Dependabot is enabled for the org. Org admins can enable it at:
https://github.com/organizations/nasa-pds/settings/security_analysis

### Step 4: Offer Next Steps

```
Export complete. Next steps:
1. Run dependabot-alerts-triaging to analyze these alerts and get triage recommendations
2. Review high/critical alerts manually at: https://github.com/orgs/nasa-pds/security/dependabot
```

## Output Format

The JSON output contains:

```json
{
  "exportMetadata": {
    "exportDate": "2026-04-23T...",
    "organization": "nasa-pds",
    "stateFilter": "open",
    "severityFilter": null,
    "ecosystemFilter": null,
    "totalRepositoriesScanned": 62,
    "repositoriesSkipped": 14,
    "totalAlerts": 127
  },
  "summary": {
    "bySeverity": { "critical": 3, "high": 24, "medium": 61, "low": 39 },
    "byEcosystem": { "npm": 45, "pip": 38, "maven": 30, "gradle": 14 },
    "byRepository": [
      { "repository": "registry", "totalAlerts": 12, "bySeverity": { "high": 4, "medium": 8 } }
    ]
  },
  "alerts": [
    {
      "alertNumber": 42,
      "alertUrl": "https://github.com/NASA-PDS/registry/security/dependabot/42",
      "repository": "nasa-pds/registry",
      "state": "open",
      "dependency": {
        "package": "lodash",
        "ecosystem": "npm",
        "manifestPath": "package.json",
        "scope": "runtime"
      },
      "vulnerability": {
        "vulnerableVersionRange": "< 4.17.21",
        "firstPatchedVersion": "4.17.21"
      },
      "advisory": {
        "ghsaId": "GHSA-35jh-r3h4-6jhm",
        "cveId": "CVE-2021-23337",
        "summary": "Command Injection in lodash",
        "severity": "high",
        "cvssScore": 7.2,
        "cwes": [{ "cweId": "CWE-77", "name": "Improper Neutralization of Special Elements used in a Command" }],
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2021-23337"],
        "advisoryUrl": "https://github.com/advisories/GHSA-35jh-r3h4-6jhm"
      },
      "triage": {
        "action": null,
        "dismissedReason": null,
        "comment": null,
        "githubIssueUrl": null,
        "reviewer": null,
        "triageDate": null,
        "confidence": null
      }
    }
  ]
}
```

## Troubleshooting

**"Resource not accessible by integration" (403)**
- Token lacks `security_events` scope
- Run: `export GITHUB_TOKEN=$(gh auth token)` (gh CLI token has the right scopes if you're an org member)

**"Dependabot alerts are not enabled for this repository" (404)**
- Dependabot is not enabled for that repo — script skips it automatically

**Very slow export**
- Use `--severity critical,high` to skip medium/low
- Use `--repo <name>` to scan a single repository

**0 alerts returned**
- Dependabot may not be enabled org-wide: https://github.com/organizations/nasa-pds/settings/security_analysis
- Your token may not have access to private repos

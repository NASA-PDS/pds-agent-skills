---
name: dependabot-alerts-triaging
description: Analyze GitHub Dependabot dependency vulnerability alerts and suggest triage decisions (dismiss/fix/escalate) with explanations. Use when the user needs help reviewing Dependabot alerts, deciding whether dependencies are exploitable, or triaging CVEs across NASA PDS repositories.
---

# Dependabot Alerts Triaging Skill

This skill helps you make informed triage decisions on GitHub Dependabot dependency vulnerability alerts by analyzing each CVE — **one at a time** — in the context of how the affected package is actually used in NASA-PDS code. You review and approve every decision before anything is recorded or applied.

## Prerequisites

- JSON export from `dependabot-alerts-exporting` skill
- `gh` CLI authenticated (for creating outlaw-tracker issues)
- Optional: local clones of affected repositories (for deeper code analysis)

## Workflow Position

```
1. dependabot-alerts-exporting  → Export alerts to JSON
2. dependabot-alerts-triaging   → THIS SKILL: Analyze & decide one by one
3. dismiss-alerts.mjs           → Apply dismissal decisions to GitHub
```

## Triage Actions

| Action | When to Use | GitHub API Value |
|--------|-------------|-----------------|
| **fix** | Patched version available; upgrade is feasible | Keep open, create outlaw-tracker issue |
| **tolerable_risk** | Real CVE but attack vector doesn't apply to PDS usage | `tolerable_risk` |
| **inaccurate** | CVE doesn't affect this package/version, or vulnerable function is never called | `inaccurate` |
| **no_bandwidth** | Real issue, acceptable risk for now, defer to backlog | `no_bandwidth` |

## Workflow

### Step 1: Load the Export

Ask the user for the path to their Dependabot alerts JSON file. Parse it and show a brief summary:

```
Loaded 5 alerts for nasa-pds/registry-legacy-solr
  HIGH:   1
  MEDIUM: 3
  LOW:    1

I'll go through each one individually, starting with the highest severity.
Ready? [yes]
```

Wait for the user to confirm before starting.

### Step 2: Order the Queue

Sort alerts: CRITICAL → HIGH → MEDIUM → LOW. Within the same severity, sort by CVSS score descending.

If the same CVE appears in multiple repos, note it when presenting the first instance ("This CVE also affects 2 other repos — after you decide here, I can apply the same decision to those"). Present each repo's alert individually — never assume the same decision applies without the user confirming.

### Step 3: Triage Each Alert — One at a Time

Present **one alert** using this format, then stop and wait:

```
Alert #1/5 — nasa-pds/registry-legacy-solr — Alert #33
────────────────────────────────────────────────────────
Package:   lxml (pip)
Severity:  HIGH — CVSS 7.5
CVE:       CVE-2026-41066
Advisory:  https://github.com/advisories/GHSA-xxxx-xxxx-xxxx
Alert URL: https://github.com/NASA-PDS/registry-legacy-solr/security/dependabot/33

Vulnerable: < 6.1.0 | Fixed: 6.1.0
Manifest:   src/main/resources/requirements.txt (runtime)

WHAT IS IT:
lxml's iterparse() and ETCompatXMLParser() use a default libxml2 configuration
that allows XML External Entity (XXE) processing. If untrusted XML is passed to
these functions, an attacker can read arbitrary local files or trigger SSRF.

WHAT I FOUND IN THE REPO:
[Search the repo for lxml imports and usages. Report specifically:
 - Which functions are called (parse, iterparse, fromstring, etc.)
 - Whether the input comes from user-supplied data or internal sources
 - E.g.: "lxml.etree.parse() is called on PDS4 labels in src/harvest/xml_parser.py.
          Labels are submitted by external users — XXE is reachable."]

EXPLOITABILITY:
[Based on the code findings, assess whether the vulnerable API is reachable
 with attacker-controlled input. Be specific.
 E.g.: "HIGH — external XML is parsed without disabling entity resolution."]

MY RECOMMENDATION:
  Action:     fix
  Reason:     Patch available (6.1.0). Runtime dep. Likely reachable with external XML.
  Comment:    "CVE-2026-41066: lxml XXE via iterparse(). Upgrade to >=6.1.0.
               — Triaged with assistance from Claude"
  Confidence: medium (awaiting code confirmation)
  outlaw-tracker: YES

Do you want to:
1. ✅ Fix — keep open + create outlaw-tracker issue
2. 🟡 Dismiss — tolerable_risk (attack vector not applicable to PDS)
3. 🟡 Dismiss — inaccurate (vulnerable function not used / CVE doesn't apply)
4. 🟡 Dismiss — no_bandwidth (real issue, defer)
5. 🔍 Investigate more first
6. ⏭️  Skip for now
```

**Do not present the next alert until the user responds to this one.**

If the user picks option 5 (investigate more), search the repository using available tools:
- Look for imports and usages of the flagged package/function
- Check if the dep appears in test/dev scope only
- Check the manifest for version pinning and transitive dep chains
- Report findings clearly, then re-present options 1–6.

### Step 4: Record the Decision

After the user responds, immediately update the `triage` field for that alert in the working JSON and confirm:

```
✅ Recorded: dismiss (inaccurate) — lxml is only used via lxml.etree.fromstring() on
   internally-generated XML, not user input. Vulnerable iterparse() is never called.

Progress: 1/5 done — 4 remaining
```

Fill the triage object:

```json
{
  "triage": {
    "action": "dismiss",
    "dismissedReason": "inaccurate",
    "comment": "lxml.iterparse() is never called in this repo. Only fromstring() is used on internally-generated XML. — Triaged with assistance from Claude",
    "githubIssueUrl": null,
    "reviewer": "jordanpadams",
    "triageDate": "2026-04-23T15:30:00Z",
    "confidence": "high"
  }
}
```

Valid `dismissedReason` values (GitHub API):
- `tolerable_risk` — Risk is real but acceptable in PDS context
- `inaccurate` — CVE doesn't apply (wrong function, version confusion, not used)
- `no_bandwidth` — Real issue, low priority, deferred

### Step 5: Create outlaw-tracker Issue (When action = fix)

When the user approves **fix**, immediately create a GitHub issue before moving to the next alert. Write the body to `/tmp/dependabot_issue_body.md` using the Write tool, then:

```bash
gh issue create \
  --repo NASA-PDS/outlaw-tracker \
  --title "CVE-YYYY-NNNNN: <package> vulnerability in NASA-PDS/<repo>" \
  --label "security" \
  --body-file /tmp/dependabot_issue_body.md
```

Issue body must include:
- CVE ID and GHSA ID
- Affected repository and manifest path
- Affected package, vulnerable version range, and patched version
- CVSS score and severity
- Brief description of the vulnerability and attack vector
- Exploitability assessment from the code investigation
- Recommended fix command (e.g., `pip install "lxml>=6.1.0"`)
- Link to the Dependabot alert
- Link to the GitHub advisory

Record the returned issue URL in `triage.githubIssueUrl`. Confirm the issue was created, then immediately advance to the next alert.

**All comments must end with:**
```
— Triaged with assistance from Claude
```

### Step 6: Advance to the Next Alert

After recording a decision (and creating any outlaw-tracker issue), present the next alert using the same Step 3 format. Repeat until all alerts are done or the user says stop.

### Step 7: Session Summary and Save

When all alerts are triaged (or the user types "done"/"save"), show a summary and write the updated JSON:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Triage Complete — nasa-pds/registry-legacy-solr
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total:          5
  fix:            2  → outlaw-tracker issues: #42, #43
  tolerable_risk: 1
  inaccurate:     1
  no_bandwidth:   1
  skipped:        0

Saved: dependabot-registry-legacy-solr-triaged.json

Next — apply dismissals:
  node scripts/dismiss-alerts.mjs dependabot-registry-legacy-solr-triaged.json --dry-run
```

Write the updated JSON appending `-triaged` before `.json` (e.g., `dependabot-alerts.json` → `dependabot-alerts-triaged.json`).

### Step 8: Apply Dismissals

Offer to run the dismissal script after saving:

```bash
# Preview first
node scripts/dismiss-alerts.mjs dependabot-alerts-triaged.json --dry-run

# Apply
node scripts/dismiss-alerts.mjs dependabot-alerts-triaged.json
```

The script PATCHes each alert where `triage.action === "dismiss"` via the GitHub API with the recorded `dismissedReason` and `comment`. Requires `GITHUB_TOKEN` (same as the export step).

## Common False Positive Patterns

**inaccurate — not used**
- The vulnerable function/method is never imported or called in the codebase
- The package is a transitive dep of a dev-only tool (jest, webpack, sphinx)
- The package appears only in `devDependencies` / `requirements-dev.txt`, not in the production artifact

**tolerable_risk**
- CVE requires network exposure but the tool only runs locally (CLI validators, data pipeline tools)
- CVE requires unauthenticated access but PDS services require auth
- CVSS inflated — network-accessible vector described in advisory doesn't match PDS deployment model
- No patch available and the code is EOL legacy with no active maintainer

**inaccurate — version or advisory mismatch**
- Advisory later withdrawn or revised
- Fix already backported to the installed version

**no_bandwidth**
- Real vulnerability, no patch available, EOL library (e.g., commons-lang 2.x)
- Low CVSS, low exploitability, lower priority than other active work

## Notes

- **One at a time, always** — never present multiple alerts at once; wait for the user to respond to each
- **Investigate before guessing** — use available tools to read the code; a specific finding beats a generic assessment
- **"legacy" repo names are a signal** — `no_bandwidth` and `tolerable_risk` are more likely appropriate; call this out explicitly
- **Same CVE, multiple repos** — mention cross-repo impact, but confirm the decision per repo unless the user says "apply to all"
- **When unsure** — say so and recommend human review; a missed real vulnerability is worse than over-caution

---
name: sonarcloud-security-triaging
description: Analyze SonarCloud security issues and suggest triage decisions (SAFE/FIXED/wontfix/falsepositive) with explanations. Use when the user needs help reviewing security issues, making triage decisions, or understanding whether security hotspots/vulnerabilities are true positives.
---

# SonarCloud Security Triaging Skill

This skill helps you make informed triage decisions on SonarCloud security issues by analyzing the code context, understanding the security rule, and suggesting appropriate actions with explanations.

## Prerequisites

- **JSON file from `sonarcloud-security-exporting` skill (RECOMMENDED)** - includes code snippets and rule details
  - Or CSV file (legacy format, requires repo access for code context)
- Git repositories cloned locally (optional for JSON, required for CSV)

## What This Skill Does

This skill **helps you decide** what to do with each security issue by:

1. **Analyzing code context**: Reads the actual code around the flagged line
2. **Understanding the rule**: Explains what the SonarCloud rule is checking for
3. **Identifying false positives**: Recognizes common false positive patterns
4. **Suggesting actions**: Recommends Action, Resolution, and Comment for each issue
5. **Explaining rationale**: Provides reasoning for each recommendation

## Workflow Position

```
1. sonarcloud-security-exporting  → Export issues to JSON (preferred) or CSV
2. sonarcloud-security-triaging   → THIS SKILL: Analyze & suggest decisions
3. sonarcloud-security-updating   → Apply decisions back to SonarCloud
```

## Input Format

This skill supports two input formats:

### JSON (Recommended)
- **Pros**: Code snippets included, rule details embedded, no repo cloning needed
- **Cons**: Larger file size
- **Use when**: You want fast, automated analysis without manual repo access

### CSV (Legacy)
- **Pros**: Smaller file size, spreadsheet-friendly
- **Cons**: Requires cloning repos to fetch code context, no rule details
- **Use when**: You prefer spreadsheet review or have limited bandwidth

## Workflow Comparison

### JSON Workflow (Fast, Automated)
```
1. Export: sonarcloud-security-exporting --format json
   → issues.json (with code snippets + rule details)
   
2. Triage: sonarcloud-security-triaging issues.json
   → issues-triaged.json (triage fields populated)
   No repo cloning needed! ✅
   
3. Update: sonarcloud-security-updating issues-triaged.json
   → Applied to SonarCloud
```

**Time savings:** ~90% faster than CSV workflow (no repo cloning, no manual context lookup)

### CSV Workflow (Manual, Flexible)
```
1. Export: sonarcloud-security-exporting
   → issues.csv
   
2. Triage: sonarcloud-security-triaging issues.csv
   - Clone repos for each project
   - Manually fetch code context
   - Look up rule details
   → issues-triaged.csv (triage columns added)
   
3. Update: sonarcloud-security-updating issues-triaged.csv
   → Applied to SonarCloud
```

**Best for:** Human review in spreadsheets, custom filtering

## Execution Steps

### Step 1: Load the Input File

Detect format and load the file:

#### JSON Format (Recommended)
```bash
# User provides the JSON path
cat sonarcloud-security-issues-2026-04-16.json
```

Parse the JSON and access:
- `exportMetadata`: metadata about the export
- `issues[]`: array of security issues with embedded code snippets and rule details

#### CSV Format (Legacy)
```bash
# User provides the CSV path
cat sonarcloud-security-issues-2026-04-16.csv
```

Parse the CSV and identify issues to triage (typically focus on OPEN/TO_REVIEW status).

**Auto-detection:** Determine format by file extension or content inspection.

### Step 2: Analyze Each Issue

For each security issue, perform these analyses:

#### A. Read the Code Context

**For JSON input (preferred):**
Code snippets are already embedded in the issue object:
```json
"location": {
  "codeSnippet": {
    "before": ["// context before", "export const NAMESPACES = {"],
    "flagged": "  core: \"http://pds.nasa.gov/ns/...\",",
    "after": ["  disp: \"http://...\",", "};"]
  }
}
```

Use this embedded context for analysis - **no repo cloning needed**.

**For CSV input (legacy):**
Clone repos and fetch code manually:
```bash
# Clone the repository if not already local
gh repo clone NASA-PDS/<project-name>

# Read the file around the flagged line (±10 lines)
cd <project-name>
git checkout main  # or appropriate branch
head -n <line+10> <component> | tail -n 20
```

#### B. Understand the Security Rule

**For JSON input (preferred):**
Rule details are already embedded:
```json
"rule": {
  "key": "javascript:S3330",
  "name": "Using HTTP protocol is insecure",
  "description": "Using HTTP instead of HTTPS leaves data vulnerable...",
  "cwe": ["CWE-319"],
  "owaspTop10": ["A02:2021"]
}
```

Use this embedded information for analysis.

**For CSV input (legacy):**
Based on the Rule ID (e.g., `java:S4426`, `javascript:S5527`), you'll need to explain:
- What vulnerability the rule detects
- Why it's a security concern
- Common false positive scenarios

**Common SonarCloud Rules:**

| Rule ID | Description | Common False Positives |
|---------|-------------|------------------------|
| `*:S4426` | Weak cryptographic algorithm | Test fixtures, non-security contexts |
| `*:S5527` | Disabled CSRF protection | Internal APIs, non-browser clients |
| `*:S2092` | Cookie without secure flags | Development/test code, non-auth cookies |
| `*:S3330` | HTTP protocol usage | URIs (not URLs), documentation strings |
| `python:S5131` | CORS policy too permissive | Internal services, dev environments |
| `javascript:S6105` | Unvalidated redirect | Static redirects, allowlist validation |

#### C. Classify the Issue

Determine if the issue is:

**True Positive (Needs Fixing)**
- Actual security vulnerability in production code
- → Action: Keep OPEN (for vulnerabilities) or REVIEWED+FIXED (for hotspots after fix)
- → Resolution: (varies)
- → Comment: "Confirmed security issue. Needs remediation. — Triaged with assistance from Claude"
- → **Create GitHub issue** in `NASA-PDS/outlaw-tracker` (private repo for tracking security vulnerabilities):
  ```bash
  gh issue create --repo NASA-PDS/outlaw-tracker \
    --title "<brief description of vulnerability>" \
    --label "security" \
    --body "..."
  ```
  Issue body should include: affected repository, SonarCloud rule, file/line, severity, and a link to the SonarCloud issue. Record the created issue URL in the triage metrics and in the SonarCloud comment.

**False Positive (Safe)**
- Code is secure but flagged incorrectly
- Examples: URI strings (not URLs), test fixtures, mocked data
- → Action: REVIEWED (hotspots) or `falsepositive` (vulnerabilities)
- → Resolution: SAFE (hotspots only)
- → Comment: Explain why it's safe (e.g., "This is a URI literal, not a URL. — Triaged with assistance from Claude")

**Won't Fix (Low Priority)**
- Real issue but acceptable risk or scheduled for later
- → Action: REVIEWED (hotspots) or `wontfix` (vulnerabilities)
- → Resolution: SAFE or ACKNOWLEDGED (hotspots)
- → Comment: Explain reasoning (e.g., "Low risk. Scheduled for Q3 sprint. — Triaged with assistance from Claude")

**Already Fixed**
- Issue was resolved but not marked in SonarCloud
- → Action: REVIEWED (hotspots) or `resolve` (vulnerabilities)
- → Resolution: FIXED (hotspots)
- → Comment: "Issue resolved in commit <sha>. — Triaged with assistance from Claude"

### Step 3: Generate Triage Recommendations

For each issue analyzed, output a structured recommendation:

```
Issue: <Project> - <Rule> at <Component>:<Line>
Status: <Current Status>

CODE CONTEXT:
<relevant code snippet>

RULE EXPLANATION:
<what this rule checks and why>

ANALYSIS:
<your assessment of whether this is a true positive>

RECOMMENDATION:
Action: <REVIEWED/falsepositive/wontfix/resolve>
Resolution: <SAFE/FIXED> (if hotspot)
Comment: "<explanation for the triage decision> — Triaged with assistance from Claude"

REASONING:
<why you recommend this action>
```

### Step 4: Batch Similar Issues

Identify groups of identical issues (same Rule + same file pattern) and suggest bulk triage:

```
BULK RECOMMENDATION:
Found 47 instances of javascript:S3330 (HTTP protocol) in test fixtures
All in: src/__tests__/**/*.test.js

Suggested bulk action:
- Action: falsepositive
- Comment: "Test fixture URIs, not actual HTTP connections. — Triaged with assistance from Claude"

This will save time vs. triaging each individually.
```

### Step 5: Output Triage Recommendations

Generate output with triage decisions in the same format as input:

#### JSON Output (Recommended)

For JSON input, populate the `triage` field in each issue:

```json
{
  "key": "AZnP1S0b_yFrdYV3Iu6e",
  "project": "NASA-PDS_doi-ui",
  "type": "SECURITY_HOTSPOT",
  "rule": { ... },
  "location": { ... },
  "triage": {
    "action": "REVIEWED",
    "resolution": "SAFE",
    "comment": "This is a namespace URI identifier (XML namespace), not an HTTP connection. The string is used for metadata identification, not network requests. — Triaged with assistance from Claude",
    "reviewer": "claude-code",
    "confidence": "HIGH",
    "reasoning": {
      "codeAnalysis": "Variable name 'NAMESPACES' and constant context indicates this is a namespace identifier",
      "patternMatch": "URI_LITERAL_NAMESPACE",
      "falsePositiveIndicators": [
        "No HTTP client library imported",
        "String is in namespace constant object",
        "No fetch/axios/request calls in file"
      ]
    },
    "suggestedActions": [
      {
        "priority": 1,
        "action": "none",
        "description": "No code changes needed - this is safe"
      }
    ],
    "analyzedAt": "2026-04-16T15:45:00Z"
  }
}
```

Save as `sonarcloud-security-triaged-{timestamp}.json`

**Benefits:**
- Full traceability of decisions
- Structured reasoning for audits
- Can be directly fed to `sonarcloud-security-updating` skill
- Confidence levels help prioritize human review

#### CSV Output (Legacy)

For CSV input, generate a new CSV with 4 additional triage columns:

```csv
Project,Type,Severity,Status,Rule,Message,Component,Line,Created,URL,Action,Resolution,Comment,Reviewer
NASA-PDS_doi-ui,SECURITY_HOTSPOT,,TO_REVIEW,javascript:S3330,Using http protocol...,src/utils/uri.js,45,2025-01-15T10:30:00Z,https://sonarcloud.io/...,REVIEWED,SAFE,"Namespace URI, not HTTP connection. — Triaged with assistance from Claude",claude-code
NASA-PDS_data-upload,VULNERABILITY,MAJOR,OPEN,python:S7608,Add ExpectedBucketOwner...,src/s3sync.py,134,2025-10-10T20:33:50+0000,https://sonarcloud.io/...,wontfix,,"Low risk. Scheduled for Q3 2026 sprint. — Triaged with assistance from Claude",claude-code
```

Save as `sonarcloud-security-triaged-{timestamp}.csv`

### Step 5a: Present Recommendations for User Review (REQUIRED)

**IMPORTANT:** Before applying any triage decisions to SonarCloud, you MUST present your recommendations to the user for review and approval.

**Presentation format:**
```markdown
## <Repository Name> Security Issues (<count> issues)

**Issue: <Brief description>**
- **Location:** <file path>, lines <range>
- **Rule:** <rule name and ID>
- **Count:** <number of related issues>

**Code context:**
<relevant code snippet>

**Analysis:**
<your assessment - true positive, false positive, or needs remediation>

**My recommendation:**
- **Action:** <REVIEWED/falsepositive/wontfix/resolve>
- **Resolution:** <SAFE/FIXED> (if hotspot)
- **GitHub Issue:** <If true positive: link to issue created in NASA-PDS/outlaw-tracker>
- **Comment:** "<explanation> — Triaged with assistance from Claude"

**How would you like to proceed?**
1. <Recommended option with reasoning>
2. <Alternative option>
3. Different approach?
```

**Wait for user approval before proceeding to apply triage decisions.**

Only after the user explicitly approves should you:
1. Apply the triage decisions to SonarCloud via API
2. Update metrics files
3. Continue to next repository

**Comment signature:** All SonarCloud triage comments must end with:
```
— Triaged with assistance from Claude
```

This signature:
- Provides transparency about AI-assisted triage
- Follows similar pattern to code commit signatures
- Helps auditors understand the triage process
- Acknowledges human oversight in the decision

## Analysis Strategies

### Strategy 1: Start with High Severity

Prioritize BLOCKER and CRITICAL vulnerabilities:

**JSON:**
```bash
# Filter for high severity
jq '.issues[] | select(.severity == "BLOCKER" or .severity == "CRITICAL")' issues.json
```

**CSV:**
```bash
# Filter CSV for high severity
grep -E "BLOCKER|CRITICAL" sonarcloud-security-issues.csv
```

### Strategy 2: Group by Rule

Analyze all instances of the same rule together to identify patterns:

**JSON:**
```bash
# Count by rule
jq '.issues | group_by(.rule.key) | map({rule: .[0].rule.key, count: length}) | sort_by(.count) | reverse' issues.json
```

**CSV:**
```bash
# Group by Rule column
awk -F',' '{print $5}' sonarcloud-security-issues.csv | sort | uniq -c | sort -rn
```

### Strategy 3: Focus on Specific Projects

Triage one repository at a time for context continuity:

**JSON:**
```bash
# Filter for specific project
jq '.issues[] | select(.project == "NASA-PDS_registry")' issues.json
```

**CSV:**
```bash
# Filter for specific project
grep "NASA-PDS_registry" sonarcloud-security-issues.csv
```

### Strategy 4: Check Git Blame

See who wrote the flagged code (may inform whether it's intentional):
```bash
git blame -L <line>,<line> <file>
```

### Strategy 5: Search for Patterns

Look for repeated false positive patterns:

**JSON:**
```bash
# Find all HTTP protocol issues in test files
jq '.issues[] | select(.rule.key == "javascript:S3330") | select(.location.component | contains("test"))' issues.json
```

**CSV:**
```bash
# Find all HTTP protocol issues in test files
grep "S3330" sonarcloud-security-issues.csv | grep -E "test|spec|__tests__"
```

## Common False Positive Patterns

### Pattern: URI Literals (Not URLs)
```javascript
// Flagged by S3330 (HTTP protocol) but SAFE
const resourceUri = "http://pds.nasa.gov/ns/2010/metadata/core";  // Just a namespace URI
```
→ **Action**: REVIEWED, **Resolution**: SAFE, **Comment**: "Namespace URI, not a URL. — Triaged with assistance from Claude"

### Pattern: Test Fixtures
```python
# Flagged by S4426 (weak crypto) but SAFE
def test_legacy_hash():
    return hashlib.md5(b"test").hexdigest()  # Just for testing
```
→ **Action**: falsepositive, **Comment**: "Test fixture only, not production code. — Triaged with assistance from Claude"

### Pattern: Internal Services
```javascript
// Flagged by S5527 (CSRF disabled) but SAFE
app.use(csrf({ ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST'] }));  // Internal API
```
→ **Action**: REVIEWED, **Resolution**: SAFE, **Comment**: "Internal API with other authentication. — Triaged with assistance from Claude"

### Pattern: Development/Example Code
```yaml
# Flagged by S6437 (hardcoded secret) but SAFE
api_key: "example-key-replace-me"  # Placeholder in example config
```
→ **Action**: falsepositive, **Comment**: "Example configuration placeholder. — Triaged with assistance from Claude"

## Interactive Mode

If the user wants to triage issues interactively, analyze one at a time and ask:

```
Issue #1/127: NASA-PDS_registry - java:S2092
File: src/auth/SessionCookie.java:23
Rule: Cookie should have HttpOnly flag

CODE:
Cookie session = new Cookie("SESSIONID", sessionId);
session.setSecure(true);
// Missing: session.setHttpOnly(true);

This is a TRUE POSITIVE - the cookie is missing HttpOnly protection.

Do you want to:
1. Keep OPEN for fixing
2. Mark as wontfix (with reason)
3. Skip for now
```

### Step 6: Track Metrics

For organization-wide triage sessions, track progress and remediation decisions using two files:

#### Create Metrics Files at Start

**sonarcloud-triage-metrics.json** - Structured data for programmatic access:
```json
{
  "triageSession": {
    "startDate": "2026-04-16T22:44:00Z",
    "organization": "nasa-pds",
    "totalRepositoriesScanned": 62,
    "totalIssuesIdentified": 71,
    "totalVulnerabilities": 12,
    "totalHotspots": 59,
    "repositoriesSkipped": ["NASA-PDS_repo1", "NASA-PDS_repo2"],
    "repositoriesTriaged": 1,
    "issuesTriaged": 6,
    "issuesRemaining": 65,
    "tokenUsage": {
      "total": 0,
      "notes": "Track cumulative token usage across the entire triage session"
    }
  },
  "remediationSummary": {
    "REVIEWED_SAFE": 6,
    "REVIEWED_FIXED": 0,
    "REVIEWED_ACKNOWLEDGED": 0,
    "WONTFIX": 0,
    "FALSE_POSITIVE": 0,
    "githubIssuesCreated": 1,
    "leftOpen": 0
  },
  "repositoryDetails": [
    {
      "repository": "NASA-PDS_pds-tf-modules",
      "triagedDate": "2026-04-16T23:00:00Z",
      "totalIssues": 6,
      "vulnerabilities": 0,
      "hotspots": 6,
      "triageDecisions": {
        "REVIEWED_SAFE_githubActions": 5,
        "REVIEWED_SAFE_s3Logging": 1
      },
      "issuesCreated": [
        {
          "issueNumber": 39,
          "url": "https://github.com/NASA-PDS/pds-tf-modules/issues/39",
          "title": "S3 bucket module missing access logging configuration",
          "relatedHotspots": ["AZaxQZ_XJCJ5OvULFRGU"]
        }
      ],
      "breakdown": [
        {
          "issueType": "GitHub Actions - Full SHA hash dependencies",
          "count": 5,
          "resolution": "REVIEWED/SAFE",
          "rationale": "Using trusted GitHub Actions from known sources. Low risk with version tags."
        },
        {
          "issueType": "S3 bucket logging",
          "count": 1,
          "resolution": "REVIEWED/SAFE",
          "rationale": "Tracked in issue #39 for future remediation"
        }
      ]
    }
  ]
}
```

**TRIAGE_METRICS.md** - Human-readable dashboard:
```markdown
# SonarCloud Security Triage Metrics

**Session Date:** 2026-04-16  
**Organization:** nasa-pds  
**Status:** In Progress

---

## 📊 Overall Statistics

| Metric | Count |
|--------|-------|
| **Total Repositories Scanned** | 62 |
| **Total Open Issues Found** | 71 |
| ├─ Vulnerabilities (OPEN) | 12 |
| └─ Security Hotspots (TO_REVIEW) | 59 |
| **Repositories with Issues** | 19 |
| **Repositories Skipped** | 3 |
| **Repositories Triaged** | 1 |
| **Issues Triaged** | 6 |
| **Issues Remaining** | 65 |
| **Token Usage** | 0 |

---

## 🎯 Remediation Summary

| Resolution Type | Count | % |
|----------------|-------|---|
| **REVIEWED/SAFE** | 6 | 100% |
| **REVIEWED/FIXED** | 0 | 0% |
| **WONTFIX** | 0 | 0% |
| **FALSE_POSITIVE** | 0 | 0% |
| **GitHub Issues Created** | 1 | - |
| **Left Open** | 0 | 0% |

---

## 📁 Repository Details

### ✅ NASA-PDS_pds-tf-modules
**Date:** 2026-04-16  
**Issues:** 6 (0V + 6H)  
**Status:** Complete

| Issue Type | Count | Resolution | Rationale |
|------------|-------|------------|-----------|
| GitHub Actions SHA dependencies | 5 | REVIEWED/SAFE | Using trusted GitHub Actions from known sources. Low risk with version tags. |
| S3 bucket logging | 1 | REVIEWED/SAFE | Tracked in issue #39 for per-bucket evaluation |

**GitHub Issues Created:**
- [#39 - S3 bucket module missing access logging configuration](https://github.com/NASA-PDS/pds-tf-modules/issues/39)

**SonarCloud Hotspots:**
- ✅ AZvn2L03kbtONb-kp7ej (GitHub Actions)
- ✅ AZvn2L2UkbtONb-kp7ek (GitHub Actions)
- ✅ AZaxQZ_XJCJ5OvULFRGU (S3 logging → Issue #39)

---

## 📋 Remaining Queue

| Repository | Issues | V | H |
|------------|--------|---|---|
| registry-sweepers | 5 | 0 | 5 |
| cloud-tools | 5 | 0 | 5 |
| registry-legacy-solr | 2 | 2 | 0 |
...

---

_Last Updated: 2026-04-16T23:00:00Z_
```

#### Update Metrics After Each Repository

After triaging each repository:
1. Update `repositoriesTriaged` count
2. Update `issuesTriaged` count
3. Update `issuesRemaining` count
4. Add new entry to `repositoryDetails[]` array
5. Update remediation summary counts
6. Add repository section to TRIAGE_METRICS.md
7. Update progress bar and statistics
8. **Update token usage**: Add cumulative token usage to `triageSession.tokenUsage.total` field (check Claude Code UI or logs for token count after each repository triage)

#### Metrics Benefits

- **Progress tracking**: Shows completion percentage (e.g., "6/71 issues, 8.5% complete")
- **Decision patterns**: Tracks how issues are being resolved (SAFE vs FIXED vs wontfix)
- **GitHub integration**: Links triage decisions to created issues
- **Audit trail**: Documents rationale for each decision category
- **Session persistence**: Can resume triage sessions across multiple days
- **Token usage tracking**: Records AI processing cost/complexity for budgeting and efficiency analysis

## Output Format

Always provide:
1. **Summary stats**: "Analyzed 127 issues: 34 true positives, 68 false positives, 25 won't fix"
2. **Triage file**: JSON with populated triage fields or CSV with Action/Resolution/Comment columns filled
3. **Metrics files**: sonarcloud-triage-metrics.json and TRIAGE_METRICS.md (for org-wide sessions)
4. **High-priority list**: Issues that need immediate attention
5. **Bulk opportunities**: Groups of similar issues for bulk triage

## Notes

- **Confidence levels**: Indicate how confident you are in each recommendation (High/Medium/Low)
- **When unsure**: Recommend human review and explain what context is needed
- **Breaking changes**: Flag any fixes that might break existing functionality
- **Documentation**: For true positives, suggest remediation approaches from SonarCloud docs
- **Git context**: Include commit history if relevant (e.g., "Introduced in commit abc123")

## Tips for Effective Triaging

1. **Start broad**: Group by rule, then analyze patterns before individual issues
2. **Use code context**: Always read surrounding code, not just the flagged line
3. **Check git history**: Recent changes may indicate temporary code or work-in-progress
4. **Consider environment**: Dev/test code has different risk profile than production
5. **Document reasoning**: Future reviewers need to understand why you marked it safe
6. **When in doubt**: Recommend human review rather than marking safe incorrectly

## Example Session

```
User: "Help me triage the SonarCloud security issues"
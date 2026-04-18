---
name: sonarcloud-security-exporting
description: Export SonarCloud security issues (vulnerabilities and hotspots) for NASA PDS repositories to CSV or JSON. Use when the user requests to export, download, or fetch SonarCloud security data, vulnerability reports, or security issue lists for PDS projects.
---

# SonarCloud Security Exporting Skill

This skill fetches all security-related issues (vulnerabilities and security hotspots) from SonarCloud for all repositories under the NASA PDS organization and exports them to CSV or JSON format for security triage.

**Formats:**
- **CSV** (default): Flat format for spreadsheet review
- **JSON**: Rich format with code snippets, rule details, and metadata for AI-assisted triage

## Prerequisites

- Node.js v18 or higher
- SonarCloud API token with read access to nasa-pds organization

## How It Works

1. **Authenticate**: Uses SonarCloud API token (from `SONARCLOUD_TOKEN` environment variable or prompts user)
2. **Fetch Projects**: Queries `/api/projects/search?organization=nasa-pds` to get all repositories
3. **Query Vulnerabilities**: For each project, calls `/api/issues/search` with `types=VULNERABILITY`
4. **Query Hotspots**: For each project, calls `/api/hotspots/search`
5. **Enrich Data** (JSON only): Fetches rule details, code snippets, and metadata
6. **Export**: Combines results into CSV or JSON format

## Execution Steps

### Step 0: Confirm Output Directory

Before writing any files, ask the user where to save output:

```
Where should I save the export files?
  1. Current directory: <show $PWD>
  2. /tmp
  3. Custom path (enter below)
```

Use their choice as the output directory for all files written in this session. Store it as `OUTPUT_DIR`.

**Important:** Never write output files inside the skill's own directory (the directory containing this SKILL.md).

### Step 1: Check for API Token

Check if `SONARCLOUD_TOKEN` environment variable is set:

```bash
env | grep SONARCLOUD_TOKEN
```

If not set, prompt the user:
- "A SonarCloud API token is required to access the NASA PDS organization."
- "You can generate a token at: https://sonarcloud.io/account/security"
- "Please set the SONARCLOUD_TOKEN environment variable or provide it when prompted."

### Step 2: Run the Fetch Script

Execute the main script:

#### CSV Export (Default)
```bash
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/sonarcloud-security-issues-$(date +%Y%m%d).csv"
```

#### JSON Export (Rich Format)
```bash
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/sonarcloud-security-issues-$(date +%Y%m%d).json" --format json
```

Where `<skill-dir>` is the absolute path to the directory containing this SKILL.md.

**Parameters:**
- `nasa-pds` (required): Organization key
- `output-file` (optional): Output file path
  - CSV default: `sonarcloud-security-issues-{timestamp}.csv`
  - JSON default: `sonarcloud-security-issues-{timestamp}.json`
- `--format` (optional): Output format (`csv` or `json`, default: `csv`)
- `--include-snippets` (optional, JSON only): Fetch code snippets (slower but richer data)
- `--include-rules` (optional, JSON only): Fetch full rule details (adds ~2-3 minutes)

The script handles:
- Pagination for large result sets (SonarCloud API returns max 500 items per page)
- Rate limiting (429 responses)
- Authentication errors (401)
- Network failures with retry logic

### Step 3: Review Output

After successful execution:
1. Display count summary: `Found X vulnerabilities and Y security hotspots across Z projects`
2. Show output file path and format
3. Provide format-specific insights:

**CSV Format:**
- Sort by severity (BLOCKER/CRITICAL first)
- Filter by status (focus on OPEN/CONFIRMED)
- Group by rule for bulk remediation
- Import into spreadsheet tools for manual review

**JSON Format:**
- Issues enriched with rule details and code context
- Ready for programmatic analysis or AI-assisted triage
- Use with `sonarcloud-security-triaging` skill for automated analysis
- Query with jq for filtering: `jq '.issues[] | select(.severity == "CRITICAL")' output.json`

## Output Formats

### CSV Output Format (Default)

Flat format for spreadsheet tools:

```csv
Project,Type,Severity,Status,Rule,Message,Component,Line,Created,URL
pds-api,VULNERABILITY,CRITICAL,OPEN,java:S4426,Use a secure cipher...,src/main/Security.java,45,2025-01-15T10:30:00Z,https://sonarcloud.io/...
pds-registry,SECURITY_HOTSPOT,,TO_REVIEW,java:S2092,Cookie should be HttpOnly,src/auth/Cookie.java,23,2025-01-10T09:15:00Z,https://sonarcloud.io/...
```

**CSV Columns:**
- **Project**: Repository/project key
- **Type**: `VULNERABILITY` or `SECURITY_HOTSPOT`
- **Severity**: `BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`, `INFO` (vulnerabilities only)
- **Status**: `OPEN`, `CONFIRMED`, `RESOLVED`, `REOPENED`, `CLOSED`
- **Rule**: SonarCloud rule ID (e.g., `javascript:S4426`)
- **Message**: Issue description
- **Component**: File path
- **Line**: Line number (if applicable)
- **Created**: ISO 8601 timestamp
- **URL**: Direct link to issue in SonarCloud UI

### JSON Output Format (Rich Data)

Structured format for AI-assisted triage with full context:

```json
{
  "exportMetadata": {
    "timestamp": "2026-04-16T10:30:00Z",
    "organization": "nasa-pds",
    "totalIssues": 4647,
    "totalVulnerabilities": 234,
    "totalHotspots": 4413,
    "totalProjects": 89,
    "schemaVersion": "1.0.0",
    "exportedBy": "claude-code",
    "format": "json"
  },
  "issues": [
    {
      "key": "AZnP1S0b_yFrdYV3Iu6e",
      "project": "NASA-PDS_doi-ui",
      "type": "SECURITY_HOTSPOT",
      "severity": null,
      "status": "TO_REVIEW",
      "rule": {
        "key": "javascript:S3330",
        "name": "HTTP protocol usage detected",
        "description": "Using HTTP instead of HTTPS leaves data vulnerable to interception. Always use HTTPS for external connections.",
        "category": "INSECURE_COMMUNICATION",
        "tags": ["cert", "cwe", "owasp"],
        "cwe": ["CWE-319"],
        "owaspTop10": ["A02:2021"],
        "securityCategory": "others"
      },
      "location": {
        "component": "src/utils/uri.js",
        "line": 119,
        "startOffset": 25,
        "endOffset": 65,
        "textRange": {
          "startLine": 119,
          "endLine": 119,
          "startColumn": 25,
          "endColumn": 65
        },
        "codeSnippet": {
          "before": [
            "// Metadata namespace identifiers",
            "export const NAMESPACES = {"
          ],
          "flagged": "  core: \"http://pds.nasa.gov/ns/2010/metadata/core\",",
          "after": [
            "  disp: \"http://pds.nasa.gov/ns/2010/metadata/display\"",
            "};"
          ]
        }
      },
      "message": "Using http protocol is insecure. Use https instead.",
      "created": "2025-01-15T10:30:00Z",
      "updated": "2025-01-20T14:22:00Z",
      "author": "jordan@jpl.nasa.gov",
      "effort": "5min",
      "url": "https://sonarcloud.io/project/security_hotspots?id=NASA-PDS_doi-ui&hotspots=AZnP1S0b_yFrdYV3Iu6e",
      "flows": [],
      "triage": null
    }
  ]
}
```

**JSON Schema:**

**Top-level fields:**
- `exportMetadata`: Export metadata (timestamp, counts, schema version)
- `issues`: Array of security issues

**Issue object:**
- `key`: Unique SonarCloud issue identifier
- `project`: Repository/project key
- `type`: `VULNERABILITY` or `SECURITY_HOTSPOT`
- `severity`: Severity level (null for hotspots)
- `status`: Current status
- `rule`: Full rule details (key, name, description, CWE, OWASP)
- `location`: Code location with optional snippet
  - `component`: File path
  - `line`: Line number
  - `codeSnippet`: Surrounding code (before/flagged/after)
- `message`: Issue description
- `created`: ISO 8601 creation timestamp
- `updated`: ISO 8601 last update timestamp
- `author`: Email of code author
- `effort`: Estimated remediation effort
- `url`: Direct link to SonarCloud UI
- `flows`: Data flow paths (for vulnerabilities with data flow)
- `triage`: Triage decision (filled by sonarcloud-security-triaging skill)

## Error Handling

### Authentication Failures (401)
- Verify token is valid and not expired
- Check token has read permissions for nasa-pds organization
- Regenerate token at https://sonarcloud.io/account/security

### Rate Limiting (429)
- Script automatically waits 60 seconds before retrying
- Reduce concurrent requests if persistent

### No Results
- Verify organization key is correct (`nasa-pds`)
- Check if projects exist: https://sonarcloud.io/organizations/nasa-pds/projects
- Confirm projects have been analyzed (no analysis = no issues)

## Which Format Should I Use?

### Use CSV When:
- ✅ Manual triage in spreadsheet tools (Excel, Google Sheets)
- ✅ Sharing with non-technical stakeholders
- ✅ Quick overview of all issues
- ✅ Importing into Jira or other tracking systems
- ✅ Backward compatibility with existing workflows

### Use JSON When:
- ✅ AI-assisted triage with `sonarcloud-security-triaging` skill
- ✅ Programmatic analysis with scripts/tools
- ✅ Need code context for decision-making
- ✅ Want full rule details and remediation guidance
- ✅ Building automated triage pipelines
- ✅ Version control of triage decisions (JSON diffs are cleaner)

**Recommendation:** Use JSON for initial export, then generate CSV views as needed. JSON is the richer format and can always be converted to CSV, but not vice versa.

## Advanced Options

### Command-Line Flags

```bash
# Export only high-severity vulnerabilities
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/output.json" \
  --format json \
  --severity BLOCKER,CRITICAL

# Export only open/confirmed issues
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/output.json" \
  --format json \
  --status OPEN,CONFIRMED

# Export issues created after specific date
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/output.json" \
  --format json \
  --created-after 2025-01-01

# Export specific project only
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/output.json" \
  --format json \
  --project NASA-PDS_registry

# Skip code snippets for faster export
node <skill-dir>/scripts/fetch-security-issues.mjs nasa-pds "$OUTPUT_DIR/output.json" \
  --format json \
  --no-snippets
```

### Converting Between Formats

**JSON to CSV:**
```bash
# Generate CSV from JSON (use $OUTPUT_DIR paths from Step 0)
jq -r '.issues[] | [.project, .type, .severity, .status, .rule.key, .message, .location.component, .location.line, .created, .url] | @csv' "$OUTPUT_DIR/output.json" > "$OUTPUT_DIR/output.csv"
```

**CSV to JSON (limited, loses rich data):**
```bash
# Not recommended - use native JSON export instead
# CSV lacks code context, rule details, etc.
```

## SonarCloud API Reference

### CSV Export Endpoints

- **Projects Search**: `GET /api/projects/search?organization={org}`
- **Issues Search**: `GET /api/issues/search?organization={org}&componentKeys={project}&types=VULNERABILITY`
- **Hotspots Search**: `GET /api/hotspots/search?organization={org}&projectKey={project}`

### JSON Export Additional Endpoints

For enriched JSON export, these additional endpoints are called:

- **Rule Details**: `GET /api/rules/show?key={ruleKey}`
  - Returns: rule name, description, remediation, CWE, OWASP mappings
- **Source Code**: `GET /api/sources/lines?key={componentKey}&from={startLine}&to={endLine}`
  - Returns: code snippets with context (before/after flagged line)
- **Issue Details**: `GET /api/issues/search?issues={issueKey}&additionalFields=flows`
  - Returns: data flow paths for vulnerabilities

**Headers:**
All requests require: `Authorization: Bearer {token}`

**Base URL:** `https://sonarcloud.io/api`

**Rate Limits:**
- Authenticated: ~200 requests per minute
- JSON export with snippets/rules makes 3-5x more API calls than CSV
- For large organizations, JSON export may take 10-15 minutes

## Troubleshooting

**"Organization not found"**
- Verify organization key: `nasa-pds` (case-sensitive)
- Check access permissions

**Empty Output**
- Projects may not have security issues (good news!)
- Verify projects are analyzed in SonarCloud
- Check if token has correct organization scope

**JSON Parse Errors**
- Verify output file is valid JSON
- Check if export completed successfully (may have been interrupted)
- Re-run export if corrupted

**Timeout errors**
- NASA PDS has many repositories; script may take 5-10 minutes
- Monitor progress output to track completion

## Notes

- Security hotspots do NOT have severity levels (they require manual review to determine if they're actual vulnerabilities)
- The `Status` field for hotspots uses different values: `TO_REVIEW`, `REVIEWED`, `ACKNOWLEDGED`
- URLs link directly to SonarCloud UI for detailed analysis and remediation guidance
- **CSV format**: Best for spreadsheet tools, Jira, or manual review
- **JSON format**: Best for AI-assisted triage, programmatic analysis, or automated workflows
- JSON export includes empty `triage` field which is populated by `sonarcloud-security-triaging` skill

## Integration with Other Skills

### Recommended Workflow

**For AI-Assisted Triage:**
```bash
# 1. Export with rich JSON format
sonarcloud-security-exporting → output.json

# 2. Analyze and suggest triage decisions
sonarcloud-security-triaging → output-triaged.json

# 3. Review and apply decisions
sonarcloud-security-updating → updates SonarCloud
```

**For Manual Triage:**
```bash
# 1. Export to CSV
sonarcloud-security-exporting → output.csv

# 2. Review in spreadsheet, add triage columns
# (Action, Resolution, Comment, Reviewer)

# 3. Apply decisions
sonarcloud-security-updating → updates SonarCloud
```

### JSON Triage Field

The JSON export includes a `triage` field (initially `null`) that the `sonarcloud-security-triaging` skill fills:

```json
{
  "triage": {
    "action": "REVIEWED",
    "resolution": "SAFE",
    "comment": "This is a namespace URI, not an HTTP connection",
    "reviewer": "claude-code",
    "confidence": "HIGH",
    "reasoning": { ... },
    "analyzedAt": "2026-04-16T15:45:00Z"
  }
}
```

This enables full traceability of triage decisions within a single file.

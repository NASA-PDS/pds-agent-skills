# SonarCloud Export Examples

This directory contains example output files demonstrating the JSON export format.

## Files

### `sonarcloud-export-example.json`

A realistic example showing the JSON schema with 5 security issues across 2 NASA PDS projects:

1. **HTTP Protocol in URI** (SECURITY_HOTSPOT)
   - Project: NASA-PDS_doi-ui
   - False positive candidate: Namespace URI, not actual HTTP connection

2. **Missing S3 Bucket Owner Parameter** (VULNERABILITY - MAJOR)
   - Project: NASA-PDS_data-upload
   - True positive: Should add ExpectedBucketOwner for security

3. **Cookie Missing HttpOnly Flag** (SECURITY_HOTSPOT)
   - Project: NASA-PDS_registry
   - True positive: Cookie needs HttpOnly flag

4. **Weak Cryptography (MD5)** (VULNERABILITY - CRITICAL)
   - Project: NASA-PDS_registry
   - True positive: MD5 used in production code, needs upgrade to SHA-256+

5. **Permissive CORS Policy** (SECURITY_HOTSPOT)
   - Project: NASA-PDS_doi-ui
   - Context-dependent: May be acceptable for public API

## Schema Features Demonstrated

- **Export metadata**: timestamp, organization, counts, schema version
- **Rich rule details**: name, description, CWE, OWASP mappings
- **Code snippets**: before/flagged/after lines
- **Text ranges**: precise location of flagged code
- **Data flows**: for vulnerabilities showing how data flows through code
- **Empty triage field**: ready for `sonarcloud-security-triaging` skill to populate

## Usage

### View in Browser
```bash
# Pretty-print JSON
cat sonarcloud-export-example.json | jq '.'

# View just the issues
cat sonarcloud-export-example.json | jq '.issues[]'

# Filter by severity
cat sonarcloud-export-example.json | jq '.issues[] | select(.severity == "CRITICAL")'
```

### Use with Triaging Skill

This example file can be used to test the `sonarcloud-security-triaging` skill:

```bash
# Claude Code will analyze the issues and suggest triage decisions
# It will fill the empty "triage" fields with recommendations
```

### Expected Triage Results

After running through the triaging skill, you should see:

1. **HTTP Protocol** → `REVIEWED/SAFE` (namespace URI, not connection)
2. **S3 Bucket Owner** → `wontfix` or keep `OPEN` (low risk, schedule for later)
3. **Cookie HttpOnly** → Keep `TO_REVIEW` or `REVIEWED/FIXED` (after fixing)
4. **MD5 Hashing** → Keep `OPEN` (critical issue, needs immediate fix)
5. **CORS Policy** → `REVIEWED/SAFE` or `REVIEWED/FIXED` (depends on API purpose)

## Differences from CSV Export

CSV export contains the same issues but without:
- Code snippets
- Rule descriptions
- CWE/OWASP mappings
- Data flow information
- Structured metadata

CSV is better for spreadsheet review; JSON is better for programmatic analysis.

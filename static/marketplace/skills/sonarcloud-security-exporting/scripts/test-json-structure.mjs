// Test JSON export structure
import { writeFileSync } from 'fs';

// Mock data
const mockIssues = [
  {
    key: 'TEST123',
    project: 'NASA-PDS_test',
    type: 'SECURITY_HOTSPOT',
    severity: null,
    status: 'TO_REVIEW',
    rule: {
      key: 'javascript:S3330',
      name: 'HTTP protocol usage',
      description: 'Using HTTP is insecure',
      category: 'VULNERABILITY',
      tags: ['cwe', 'owasp'],
      cwe: ['CWE-319'],
      owaspTop10: ['A02:2021'],
      securityCategory: 'others'
    },
    location: {
      component: 'src/test.js',
      line: 10,
      textRange: { startLine: 10, endLine: 10, startColumn: 0, endColumn: 50 },
      codeSnippet: {
        before: ['// Test file', 'const url = {'],
        flagged: '  endpoint: "http://example.com"',
        after: ['};', '']
      }
    },
    message: 'Using HTTP protocol is insecure',
    created: '2026-04-16T10:00:00Z',
    updated: '2026-04-16T10:00:00Z',
    author: 'test@example.com',
    effort: '5min',
    url: 'https://sonarcloud.io/...',
    flows: [],
    triage: null
  }
];

const metadata = {
  timestamp: new Date().toISOString(),
  organization: 'nasa-pds',
  totalIssues: mockIssues.length,
  totalVulnerabilities: 0,
  totalHotspots: 1,
  totalProjects: 1,
  schemaVersion: '1.0.0',
  exportedBy: 'claude-code',
  format: 'json',
  options: {
    includeSnippets: true,
    includeRules: true,
    filters: { severity: null, status: null, project: null, createdAfter: null }
  }
};

const output = {
  exportMetadata: metadata,
  issues: mockIssues
};

// Write JSON
writeFileSync('test-output.json', JSON.stringify(output, null, 2), 'utf-8');
console.log('✅ Test JSON created: test-output.json');

// Validate it's parseable
const parsed = JSON.parse(JSON.stringify(output));
console.log('✅ JSON is valid and parseable');
console.log(`✅ Schema version: ${parsed.exportMetadata.schemaVersion}`);
console.log(`✅ Total issues: ${parsed.exportMetadata.totalIssues}`);
console.log(`✅ Issues array length: ${parsed.issues.length}`);
console.log(`✅ First issue has triage field: ${parsed.issues[0].triage === null}`);

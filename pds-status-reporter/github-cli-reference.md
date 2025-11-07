# GitHub CLI Commands Reference

The skill uses `gh` CLI and GitHub Projects API for all GitHub interactions.

## Authentication & Setup

```bash
# Check authentication
gh auth status

# Re-authenticate if needed
gh auth login

# Check API rate limits
gh api rate_limit
```

## GitHub Projects

```bash
# List all projects in NASA-PDS org
gh project list --org NASA-PDS --format json

# View portfolio backlog (Project #6) - primary source for all closed issues
gh project view 6 --org NASA-PDS --format json
```

## Query Project Items (GraphQL)

The primary approach is to query the portfolio backlog project (#6) to get all closed issues, rather than scanning each of the 143 repos individually.

```bash
# Get items from a project (requires GraphQL via gh api)
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        items(first: 100) {
          nodes {
            content {
              ... on Issue {
                number
                title
                url
                closedAt
                labels(first: 20) { nodes { name } }
                repository { nameWithOwner }
              }
            }
          }
        }
      }
    }
  }
' -f org=NASA-PDS -F number=6
```

## Issue Operations

```bash
# Get issue details including linked issues
gh issue view 123 --repo NASA-PDS/registry --json number,title,body,labels,closedAt,url,comments,timelineItems

# Search for closed issues in specific repo (fallback if needed)
gh issue list --repo NASA-PDS/registry --search "closed:2024-10-01..2024-10-31" --json number,title,body,labels,closedAt,url --limit 1000

# Search across NASA-PDS org (primary method)
# IMPORTANT: Include 'body' field to detect parent-child theme relationships
gh search issues --owner NASA-PDS --closed "2024-10-01..2024-10-31" --limit 1000 \
  --json number,title,body,url,closedAt,labels,repository
```

## Release Operations

For releases, query each active repository (excluding ignored products from pds-products.yaml).

```bash
# Query releases for a repository
gh release list --repo NASA-PDS/registry --limit 100 --json tagName,name,publishedAt,url,isPrerelease

# Filter releases by date (using jq)
gh release list --repo NASA-PDS/registry --json tagName,name,publishedAt,url,isPrerelease --limit 100 | \
  jq '[.[] | select(.publishedAt >= "2024-10-01" and .publishedAt <= "2024-10-31")]'

# Get release details including body/notes
gh release view v2.0.0 --repo NASA-PDS/registry --json tagName,name,publishedAt,body,url
```

## Best Practices

- **Authentication**: Always verify `gh auth status` before running commands
- **Rate Limits**: Monitor with `gh api rate_limit` - authenticated users get 5,000 requests/hour
- **Efficiency**: Use portfolio backlog project (#6) for issues, individual repos for releases
- **Error Handling**: Catch 404s for missing/renamed repos, 403s for rate limits

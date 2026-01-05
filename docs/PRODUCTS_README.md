# PDS Product-to-Repository Mapping

This directory contains configuration files that map NASA-PDS repositories to product categories.

## Files

### Source Files
- **`pds-products.yaml`** - Primary source of truth (YAML format, human-readable and easily edited)
- **`pds-products.json`** - JSON version for programmatic access (auto-generated from YAML)
- **`pds-products.md`** - Markdown documentation for Claude skills and human reference (auto-generated from YAML)

### Workflow

```
pds-products.yaml (SOURCE OF TRUTH)
         ↓
         ↓ (convert)
         ↓
    ┌────┴────┐
    ↓         ↓
.json       .md
(tools)   (docs/Claude)
```

## Usage

### For Claude Skills

Claude skills can reference the markdown documentation directly:

```markdown
When categorizing repositories, refer to `/pds-products.md` for the mapping of repositories to product categories.
```

### For Python Scripts

```python
import yaml

# Load YAML (recommended)
with open('pds-products.yaml', 'r') as f:
    products = yaml.safe_load(f)

# Access product repositories
doi_repos = products['products']['doi-service']['repositories']
print(doi_repos)
# Output: ['doi-service', 'doi-ui', 'pds-doi-legacy']

# Find which product a repo belongs to
def find_product_for_repo(repo_name):
    for product, data in products['products'].items():
        if repo_name in data['repositories']:
            return product
    return None

product = find_product_for_repo('validate')
print(f'validate belongs to: {product}')
# Output: validate belongs to: validate
```

### For JavaScript/Node.js

```javascript
const fs = require('fs');

// Load JSON
const products = JSON.parse(fs.readFileSync('pds-products.json', 'utf8'));

// Access product repositories
const doiRepos = products.products['doi-service'].repositories;
console.log(doiRepos);

// Find which product a repo belongs to
function findProductForRepo(repoName) {
  for (const [product, data] of Object.entries(products.products)) {
    if (data.repositories.includes(repoName)) {
      return product;
    }
  }
  return null;
}

const product = findProductForRepo('validate');
console.log(`validate belongs to: ${product}`);
```

### For Shell Scripts

```bash
# Using yq (YAML processor)
yq '.products.doi-service.repositories[]' pds-products.yaml

# Using jq (JSON processor)
jq -r '.products."doi-service".repositories[]' pds-products.json

# Get all product names
jq -r '.products | keys[]' pds-products.json
```

## Maintaining the Files

### 1. Edit the YAML Source

**ALWAYS** edit `pds-products.yaml` as your source of truth. This file is:
- Human-readable
- Easy to edit
- Supports comments
- Version controlled

### 2. Regenerate JSON and Markdown

After editing the YAML file, regenerate the other formats:

```bash
# Regenerate JSON
python3 -c "
import yaml
import json

with open('pds-products.yaml', 'r') as f:
    data = yaml.safe_load(f)

with open('pds-products.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✓ Generated pds-products.json')
"

# Regenerate Markdown (requires custom script or manual update)
# TODO: Create a script to auto-generate markdown from YAML
```

### 3. Validation

Add validation to ensure consistency:

```python
import yaml

with open('pds-products.yaml', 'r') as f:
    data = yaml.safe_load(f)

# Check for duplicate repositories across products
all_repos = []
duplicates = []

for product, info in data['products'].items():
    for repo in info['repositories']:
        if repo in all_repos:
            duplicates.append(repo)
        all_repos.append(repo)

if duplicates:
    print(f"⚠️  Duplicate repositories found: {duplicates}")
else:
    print("✓ No duplicate repositories")

# Check that all repos are accounted for
# (requires fetching from GitHub as ground truth)
```

## Product Categories

The following product categories are currently defined:

1. **Deep Archive** - OAIS utilities for deep archive
2. **DevOps** - CI/CD, automation, templates
3. **DOI Service** - Digital Object Identifier management
4. **PDS4 Information Model** - Data dictionaries and ontology
5. **PDS4 Viewer** - Data visualization tools
6. **peppi** - Python client library
7. **Registry Tools** - Registry backend and data loading
8. **Search API** - Search API and clients
9. **Validate** - Data validation tools
10. **Web Analytics** - Analytics and monitoring
11. **Web Content** - Website CMS and content
12. **Web Design** - WDS design system
13. **Web Dev** - Web development tools
14. **Cloud Platform Engineering** - Cloud infrastructure
15. **Nucleus** - Workflow platform
16. **Data Upload Manager** - Data upload interface
17. **Cloud Operations** - Cloud ops and auth
18. **Operations** - PDS EN operations
19. **System Engineering** - System-level docs and requirements
20. **Integration and Testing** - I&T infrastructure
21. **System Tools** - Utilities and libraries
22. **Dependencies** - External deps and forks

## Adding a New Repository

When a new repository is created:

1. Determine which product category it belongs to
2. Edit `pds-products.yaml` and add the repository to the appropriate product's `repositories` list
3. Regenerate JSON and markdown files
4. Commit all three files together
5. Update the statistics section in the markdown if needed

## Recategorizing Repositories

If a repository should move to a different product:

1. Edit `pds-products.yaml`
2. Remove the repository from the old product's list
3. Add it to the new product's list
4. Regenerate JSON and markdown files
5. Document the change in the commit message

## Automation Ideas

Consider adding GitHub Actions workflows to:

1. **Auto-validate** - Check for duplicates and consistency on PR
2. **Auto-generate** - Regenerate JSON/MD when YAML changes
3. **Auto-sync** - Periodically check GitHub for new repos and create an issue if unmapped repos are found
4. **Schema validation** - Ensure YAML follows the expected structure

## Questions or Issues?

If you have questions about which product a repository should belong to, or if you notice inconsistencies:

1. Check the repository's description and purpose
2. Look at the GitHub Projects board for guidance
3. Ask in the PDS Engineering Node Slack
4. Open an issue in this repository

## Schema

The YAML schema is:

```yaml
version: string           # Semantic version of this mapping file
updated: date            # Last update date (YYYY-MM-DD)

products:
  <product-key>:         # Kebab-case product identifier
    description: string  # Brief description
    repositories:        # List of repo names (without org prefix)
      - repo-name-1
      - repo-name-2

archived_repositories:   # List of archived repos
  - repo-name

forked_repositories:     # List of forked repos
  - repo-name
```

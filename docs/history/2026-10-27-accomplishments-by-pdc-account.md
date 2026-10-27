# Accomplishments report grouped by PDC account

**Date:** 2026-10-27

## Task

Update the `generating-accomplishments` skill so its output is grouped by the three PDC accounts used in the HQ bi-weekly report (Platform Engineering, Node Support, CloudOps) instead of by work stream, and run it for 2026-10-16 to 2026-10-23.

## Findings

- `pds-activity` has no work-stream filter; it collects every non-ignored org repo. The gap was in the skill's grouping, which ignored `work_area`.
- `work_area` in `pds-products.yaml` uses the org issue field values (`PDC Platform Engineering`, `PDC Node Support`, `PDC Cloud Operations`, `PDS Cybersecurity`, ...), not the report names.
- The skill copy of `pds-products.yaml` was behind `NASA-PDS/.github` main: `pdc-tenant-infra` belongs to `cloud-platform-engineering`, and `pdc-node-support` lists `pdscloud-node-support`.
- `activity.json` carries no Work Area. Parent-theme Work Area is read from the org issue field with `gh api graphql` (`issueFieldValues`), the same query the `.github` automation uses.

## Changes

- `pds-products.yaml` synced with `NASA-PDS/.github` main.
- `SKILL.md`: account assignment (product `work_area`, then parent theme `work_area`, else Unassigned), per-account At a Glance columns, new report structure, Cybersecurity as its own account, edge cases.
- `static/data/registry.json`: updated the skill entry; added the missing `terraform-conventions` entry so the generator keeps the plugin.
- `.claude-plugin/marketplace.json`: regenerated with `node src/conf/generate-marketplace.js`.
- `README.md`, `CLAUDE.md`, `CHANGELOG.md` updated.

## Run result (2026-10-16 to 2026-10-23)

Only Platform Engineering had activity (`pdc-tf-modules`, `pdc-cds-infra`). Node Support, CloudOps, Cybersecurity and Unassigned were empty. Shared-repo items (`portal-infra`, `data-upload-manager`, `registry`) resolved to Core Data Services through their parent themes and were listed as cloud-adjacent work.

## Next steps

- Confirm the cloud/AWS judgment for the cloud-adjacent section with the report owner.
- Decide whether `planetary-data-cloud` issues about node onboarding should be forced to Node Support.
- Move observability to CloudOps in the upstream yaml when it enters operations; the skill picks it up on the next sync.

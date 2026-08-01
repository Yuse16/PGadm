# Traceability Map

Maps each requirement rule → source pack → responsible agent → history file → code module → test file → release.

## Legend

| Column | Description |
|--------|-------------|
| Rule | Requirement identifier (e.g., INV‑001) |
| Pack | Source documentation pack |
| Agent | Responsible AI agent |
| History | File in `docs/packs/*/CHANGELOG.md` or similar |
| Code | Source code module (future) |
| Tests | Test file (future) |
| Release | First release version (future) |

## Rules

| Rule | Description | Pack | Agent | History | Code | Tests | Release |
|------|-------------|------|-------|---------|------|-------|---------|
| *Traceability will be populated incrementally as requirements are refined and code is written.* | | | | | | | |

## Phase 1B.2 Implementation

- **Status**: **COMPLETED AND INTEGRATED** — merged into `develop` via PR #5 (merge commit `05872c9`); closed by `docs/f1b-PG-ORG-002-close-phase` (PR #6).
- **Scope**: Organization structure (branches and warehouses) — Phase 1B.2 feature branch `feature/f1b-PG-ORG-002-organization-branches-warehouses`.
- **History**: `docs/orchestration/handoffs/` (F1B2_DECISION_MATRIX.md, NIGHT_WORKLOG_F1B2*.md, REPORT_F1B2_*.md, HANDOFF_F1B2_DRAFT_V2.md, HANDOFF_003_F1B_PG_ORG_002...) and root `DECISION_LOG.md` (D021–D033).
- **Code**: `src/features/organization/` (domain/application/infrastructure) + `src/app/admin/organization/`. Data source: `DemoOrganizationRepository` (default, `ORGANIZATION_DATA_SOURCE=demo`) + `SupabaseOrganizationRepository` (anon, reserved for Phase 1B.3).
- **Tests**: `supabase/tests/test_organization_structure.sql` (66), `supabase/tests/ci_verify.sql` (41) + `src/tests/features/organization/` (TS/React) → **119/119 SQL, 111/111 app**.
- **Data model**: `supabase/migrations/00000000000002_organization_structure.sql` (priority semantics: 1 = highest, ascending).
- Rule-to-code mapping will be completed as requirement rules are stabilized (see Implementation Notes below).

## Implementation Notes

1. Each rule follows the format `{DOMAIN}-{NNN}` where DOMAIN is a 3‑letter prefix:
   - GOV – Governance
   - PWA – PWA Requirements
   - TEC – Tech Stack
   - INV – Inventory
   - SAL – Sales
   - CRM – Customer Relationship
   - LAY – Layout
   - COM – Commercialization
   - FUL – Fulfillment
   - MEE – Meetings
   - SUP – Supply / Suppliers
   - AI – AI Features
   - RPT – Reporting
   - ATH – Authentication
   - SEC – Security
   - QA – Quality Assurance
   - DEP – Deployment
   - DOC – Documentation
   - AUD – Audit
   - UX – User Experience
   - MLT – Multitenancy
   - L10N – Localization
2. The `History` column links to the pack's own changelog or decision log.
3. The `Code`, `Tests`, and `Release` columns will be filled in during development phases.

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

## Phase 1C Implementation

- **Status**: **COMPLETED AND PUSHED** — feature branch `feature/f1c-PG-CATALOG-004-product-master` (HEAD `9a7b4b8`, 17 commits); sin PR, sin merge; pendiente revisión humana + integración a `develop`.
- **Scope**: Catálogo Maestro de Productos (1C.1 decisiones → 1C.2 migración/seed → 1C.3 dominio/use cases/UI → 1C.4 permisos/seguridad → 1C.5 auditoría + cierre).
- **History**: `docs/orchestration/handoffs/` (F1C_KICKOFF_CONTRACT, F1C_SCOPE_MATRIX, F1C_DATA_MODEL_PROPOSAL, F1C_RLS_PERMISSION_MATRIX, F1C_TEST_PLAN, F1C_IMPLEMENTATION_SLICES, F1C2_DATABASE_HANDOFF, HANDOFF_004_F1C_PG_CATALOG_004_PRODUCT_MASTER) y `DECISION_LOG.md` (D-C01…D-C22).
- **Code**: `src/features/catalog/` (domain/application/infrastructure/server/components) + `src/app/admin/catalog/`. Data source: `CATALOG_DATA_SOURCE=demo` (default) | `supabase`, sin fallback silencioso (D031/D-C22).
- **Tests**: `supabase/tests/test_product_master.sql` (78) + `test_catalog_audit.sql` (32) + suites previas ajustadas → **550/550 SQL**; `src/tests/features/catalog/` → **294/294 app** (39 archivos).
- **Data model**: `supabase/migrations/00000000000008_product_master.sql` (schema `_catalog` + 7 tablas) y `00000000000009_catalog_audit.sql` (`_audit.catalog_events`).
- Rule-to-code mapping will be completed as requirement rules are stabilized (see Implementation Notes below).

## Phase 1D Implementation

- **Status**: **1D COMPLETED** (1D.1 APROBADO + 1D.2 + 1D.3 + 1D.4 + 1D.5) — feature branch `feature/f1d-PG-INVENTORY-005-inventory` (base `ee761b1` HEAD 1C; HEAD `6427d23`); sin PR, sin merge; pendiente revisión humana + integración a `develop`.
- **Scope**: Productos e inventario (Fase 2) — kickoff D-I01…D-I14 APPROVED (2026-08-06, `9bc1de3`); 1D.2 migración/seed/verificación DB; 1D.3 dominio/use cases/repositorios; 1D.4 permisos/seguridad; 1D.5 integración port 1C.5 con stock real + alertas D-I13 + cierre 1D.
- **History**: `docs/orchestration/handoffs/` (F1D_KICKOFF_CONTRACT, F1D_DATA_MODEL_PROPOSAL, F1D_RLS_PERMISSION_MATRIX, F1D_TEST_PLAN, F1D_IMPLEMENTATION_SLICES) y `DECISION_LOG.md` (D-I01…D-I14).
- **Code**: `src/types/database.ts` regenerado con las 5 tablas + `_audit.inventory_events` (338 líneas); `src/features/inventory/` (domain/application/infrastructure/server). Port de integración de 1C.5 (`CatalogIntegrationRepository`) poblado con stock real en 1D.5 (`InventoryCatalogIntegrationRepository` + `getProductIntegrationSummary`), wiring en `src/app/admin/catalog/products/[id]/page.tsx`; alertas `computeInventoryAlerts` (D-I13).
- **Tests**: `supabase/tests/test_inventory_stock.sql` (88) + suites ajustadas a 15 permisos / 35 role_permissions → **638/638 SQL** (10 archivos); **388/388 app** (48 archivos); `e2e:auth` 14/14; `e2e:identity` 39/39.
- **Data model**: `supabase/migrations/00000000000010_inventory_snapshots.sql` (5 tablas org-scoped + `_audit.inventory_events`; permisos `inventory.*` en `supabase/seed.sql`).
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

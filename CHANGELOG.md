# Changelog

## 0.8.0 (2026-08-06) — Phase 1D.3 inventory domain, use cases & repositories

- **Feat(backend):** `src/features/inventory/` completo (1D.3) — dominio, application e infrastructure:
  - `domain/`: errores tipados (`InventoryError` → NotFound/Validation/Data/Permission + `RepositoryConfigurationError`), `InventoryActor` con `requirePermission` previo a escrituras, 4 permisos `inventory.*`, 5 entidades, puerto auditoría `_audit.inventory_events`, contrato `InventoryRepository` org-scoped (D-C07) y catálogo de referencias variante/almacén (D-C08); `column_mapping` `{required, optional}` igualando el jsonb del seed (D-I07)
  - `application/`: guards desde `IdentitySession` (RLS-scoped), `approveImport` (línea base IA-12/13, duplicados IA-8, `computeChanges` 6 tipos IA-14/15/16/18), observaciones (IA-20/21/22), plantillas (sin DELETE), historial no destructivo (IA-17), auditoría append-only (IA-35)
  - `infrastructure/`: demo repos sembrados con fixtures 1D.2 (+ `{seed:false}` para baseline), Supabase repos contra migración 010 (RLS-scoped, D09/T09), referencia Supabase reutiliza catálogo 1C + `warehouses`, `INVENTORY_DATA_SOURCE=demo` default (D-I12/D031, sin fallback)
- **Tests:** 68 nuevos (import 23, observaciones 11, plantillas 14, historial/guards 7, demo repo 7, selección 6) → **362/362 vitest**
- **Gates:** lint ✅ · typecheck ✅ · **362/362 vitest** (45 archivos) ✅ · build ✅ · `git diff --check` limpio ✅ · sin secretos ✅
- **Commits:** `e28dfb5` feat(inventory) + `bffb2d2` test(inventory); sin PR, sin merge
- **Pendiente:** 1D.4 (permisos/seguridad server + context/actions inventario); revisión humana 1C+1D, PR a `develop` y merge; flips data source = ops

## 0.7.0 (2026-08-06) — Phase 1D.2 inventory database

- **D-I01…D-I14 APPROVED** (2026-08-06) tras revisión humana: 5 tablas con nombres plurales, item = `variant_id`, snapshot por `warehouse_id`, observaciones con `evidence_url` texto (D-C17), roles existentes, vínculo almacenes vía `external_source`+`external_id`; defaults de 6 preguntas abiertas confirmados (`9bc1de3`)
- **Feat(db):** migración `00000000000010_inventory_snapshots.sql` — `inventory_snapshots` (por warehouse, `report_date` de fuente, `is_baseline`, `source`), `inventory_snapshot_items` (variant_id, ≥0), `inventory_changes` (STORED `difference`, 6 `change_type`), `inventory_observations` (6 tipos, evidence_url, created_by), `import_templates` (jsonb column_mapping/warehouse_rules); `_audit.inventory_events` append-only; FK compuestas org-scoped; `UNIQUE(organization_id,id)`; 13 políticas RLS + 2 eventos, authenticated only, sin DELETE, revokes public/anon/service_role
- **Seed:** permisos `inventory.read/import/approve/observe` (15 total) + role_permissions (35; admin +4, manager +4, cashier +2, operator +2) + fixtures PGM `90000000-…` (2 snapshots, 5 items con variante 053 ausente, 3 changes, 2 observaciones, 1 plantilla)
- **Tests:** `test_inventory_stock.sql` pgTAP plan(88); `test_identity_rbac_rls.sql` y `test_organization_rls.sql` ajustados a 15/35; `e2e-identity.mjs` con permisos `inventory.*`
- **Gates:** `db:lint` ✅ · **638/638 pgTAP** (10 archivos) ✅ · `db:verify` ALL CHECKS PASSED ✅ · `db:types` regenerado ✅ · lint/typecheck/**294/294 vitest**/build ✅ · `e2e:auth` 14/14 ✅ · `e2e:identity` 39/39 ✅ · `git diff --check` limpio ✅ · sin secretos ✅
- **Commits:** `ce42a56` feat(inventory) + `9e1bdf0` test(inventory) + docs (cierre); sin PR, sin merge
- **Pendiente:** 1D.3 (dominio/use cases/repositorios inventario, port 1C.5); revisión humana 1C+1D, PR a `develop` y merge; flips data source = ops

## 0.6.0 (2026-08-06) — Phase 1D inventory kickoff (propuesta)

- Docs: `F1D_KICKOFF_CONTRACT.md` — kickoff contract de Fase 2 (Productos e inventario) en rama `feature/f1d-PG-INVENTORY-005-inventory` (base `ee761b1`, HEAD 1C)
- Propone D-I01…D-I14 (modelo snapshots/cambios/observaciones, snapshot auditable con fecha de fuente, historial no destructivo, existencia reportada tienda/CEDIS, ausente ≠ stock cero, observaciones sin mutar stock oficial, mapeo por plantilla, vínculo a warehouses 1B.2, conversión solo con factores confirmados, permisos `inventory.*`, fuente Excel→cubo + adaptadores, `INVENTORY_DATA_SOURCE=demo` sin fallback, alertas, diferidos layout/ventas/comercialización/IA)
- Estado: **PENDIENTE de revisión humana**; sin migración, código ni UI
- Docs-only: 1 commit (`5f41ded`); AGENT_STATE actualizado; `git diff --check` limpio
- Paquete documental 1D.1: `F1D_DATA_MODEL_PROPOSAL.md` (5 tablas candidatas + 6 preguntas abiertas), `F1D_RLS_PERMISSION_MATRIX.md` (`inventory.read/import/approve/observe`), `F1D_TEST_PLAN.md` (IA-1…IA-37), `F1D_IMPLEMENTATION_SLICES.md` (1D.1…1D.5) — commit `b6cbbf7`

## 0.5.0 (2026-08-06) — Phase 1C completed (Catálogo Maestro de Productos)

- **Fase 1C.1–1C.5 COMPLETED AND PUSHED** en `feature/f1c-PG-CATALOG-004-product-master` (17 commits, HEAD `9a7b4b8`); sin PR, sin merge
- Feat(db): migración 008 `product_master` — schema `_catalog`, 7 tablas org-scoped, FK compuestas, `UNIQUE(organization_id,id)` inline en categorías, índices funcionales `upper(trim(...))`, 21 políticas RLS allowlist, 4 funciones de enforcement SECURITY INVOKER, sin DELETE; seed con permisos `catalog.*` (5) + `role_permissions` (23)
- Feat(db): migración 009 `catalog_audit` — `_audit.catalog_events` append-only con RLS select/insert, grants==políticas, revokes a public/anon/service_role; esquema `_audit` expuesto en `config.toml`
- Feat(backend): `src/features/catalog/` domain + application (use cases create/update/archive/restore/query) + infrastructure (demo/supabase, `repository-selection` con `CATALOG_DATA_SOURCE=demo` default, sin fallback)
- Feat(ui): `/admin/catalog` server-rendered (`force-dynamic`) — dashboard, productos, variantes, categorías, marcas, unidades, líneas; forms con server actions; guards `catalog.*`
- Feat(1C.5): auditoría persistida en `_audit.catalog_events` (19 call-sites en 7 módulos), timeline de historial en detalle de producto (máx. 30, es-MX), placeholders de integración inventario/compras/precios ("Sin integración de inventario")
- Tests: app **294/294** (39 archivos) · SQL **550/550** (9 archivos) · `db:verify` ALL CHECKS PASSED · lint/typecheck/build PASS · `git diff --check` clean · sin secretos
- Docs: HANDOFF_004_F1C_PG_CATALOG_004_PRODUCT_MASTER (cierre 1C), DECISION_LOG (D-C18…D-C22), AGENT_STATE, TRACEABILITY
- Pendiente: fase "1D" no definida en docs (requiere decisión humana); flip `CATALOG_DATA_SOURCE=supabase` es decisión de ops; merge/PR pendiente

## 0.4.1 (2026-08-01) — Phase 1B.2 integrated

- **PR #5 MERGED** into `develop` (merge commit `05872c9`), 12 commits (`1feaf20`…`9bc24e1`)
- Feat(org): `DemoOrganizationRepository` explícito (fixtures = seed) etiquetado "Datos demo locales"; selección determinista vía `ORGANIZATION_DATA_SOURCE=demo` (default); modo `supabase` falla ruidoso — nunca fallback silencioso
- Fix(org): `priority` = 1 es la prioridad más alta y se ordena `ascending` (comentario SQL migración 002 corregido, dominio y repos alineados)
- Security: sin `service_role` (demo repo standalone + selección sin fallback; verificado por `feature-security.test.ts`)
- Reviews: seis áreas en PASS (Arquitectura, BD, Backend, Frontend, Seguridad, QA)
- Validación manual: `/admin/organization` HTTP 200 con seed completo; modo `supabase` falla ruidoso
- Tests: app **111/111** (17 archivos) · SQL **119/119** · `db:verify` ALL CHECKS PASSED · lint/typecheck/build PASS
- Doc close: AGENT_STATE.md, CHANGELOG, DECISION_LOG (D031–D033), TRACEABILITY, HANDOFF_003 (cierre Fase 1B.2)

## 0.4.0 (2026-08-01)

- Feat(db): migration 002 `organization_structure` — organizations, branches, warehouses, branch_warehouse_relations; composite FKs, uniques, CHECKs, triggers, minimal PG15-safe revokes
- Feat(db): idempotent demo seed (PGM, NOG, SAL, NOG-01, SAL-01)
- Feat(core): organization domain (entities, validators, errors), application (getOrganizationStructure, listBranches), infrastructure (mappers + SupabaseOrganizationRepository, anon client)
- Feat(admin): `/admin/organization` overview with branch cards, warehouses, source tags, empty/error states, loading skeleton
- Test(db): `test_organization_structure.sql` pgTAP plan(66) + `ci_verify.sql` pgTAP plan(41) + base 12 → 119/119; `scripts/verify-db.mjs` rewritten (10 checks, exit ≠ 0)
- Ci(db): `db-validate` job installs pgTAP into the PostgreSQL 15 service and runs the 119 pgTAP assertions via `pg_prove`
- Test(org): TypeScript/React coverage extendida hasta 111/111 total (75 org + 36 baseline)
- Fix: local Supabase config for CLI v2.111.0 (`project_id` top-level, `[api]` schemas/search path, removed obsolete sections)
- Fix: `src/types/database.ts` now generated by `db:types` (deterministic, in sync)
- Security: no service_role in code, explicit column selection (no `select("*")`), no secrets, repo isolation review
- Docs: F1B2 decisions/worklogs/reports/handoffs, F1B3 planning drafts, AGENT_STATE.md, TRACEABILITY.md
- Baseline audit: 3 high prod (postcss/sharp via next) — no non-breaking fix available

## 0.3.1 (2026-07-30)

- Fix: Migration 001 — removed `create extension with schema extensions` (inexistent schema in standard PostgreSQL)
- Fix: pgTAP tests — corrected `plan(10)` → `plan(12)` and replaced always-pass `isnt_superuser` with real privilege assertion
- Fix: `scripts/verify-db.mjs` — corrected `await import()` inside non-async function (Node 24 syntax error)
- Fix: pgTAP tests — corrected `is()` call syntax for `is_uuid` validation
- Docs: NIGHT_WORKLOG, REPORT, overnight session artifacts
- Docs: AGENT_STATE.md updated with overnight review summary

## 0.3.0 (2026-07-29)

- Supabase local infrastructure: `config.toml`, migrations, seed, tests, README
- Migration 001: `_core` and `_audit` schemas, pgcrypto, `updated_at()` trigger, UUID validation function
- TypeScript Supabase boundaries: `client.ts`, `server.ts`, `config.ts`, `types.ts`
- Environment validation: `src/schemas/env.ts` with safe missing-var handling
- Database types: `src/types/database.ts` (placeholder for auto-generation)
- 19 new TypeScript tests (env validation, client/server separation, config)
- CI workflow extended with `db-validate` job (PostgreSQL service, migration apply, SQL verification)
- Scripts: `db:start`, `db:stop`, `db:status`, `db:reset`, `db:lint`, `db:test`, `db:types`, `db:verify`
- `.env.example` reorganized with classifications (public, private, optional, obligatory)
- Security: client/server env separation, no secrets in code, public schema locked
- Docs: ARCHITECTURE.md, SECURITY.md, TESTING.md updated with Supabase content
- Blocking: Docker Desktop not installed — `npm run db:*` commands requiring Docker cannot execute locally

## 0.2.0 (2026-07-29)

- Next.js 16 application scaffolded (App Router, TypeScript, Tailwind v4, ESLint)
- Modular src/ structure: app, components/ui, components/layout, features, lib, services, schemas, permissions, events, hooks, types, tests
- Application shell: layout with header/footer, home page, health check page, 404, error boundary, loading state
- Responsive design, PWA manifest (placeholder), metadata, viewport config
- Test infrastructure: vitest + @testing-library/react + jsdom
- 10 tests across 3 files (health check, home page, utils)
- CI workflow: `.github/workflows/pr-validation.yml` (lint, typecheck, test, build)
- Scripts: dev, build, start, lint, typecheck, test, test:watch, validate

## 0.1.0 (2026-07-29)

- Repository initialized from `PGadm` GitHub remote
- 26 documentation packs (00–25) consolidated from source
- 18 agent definitions imported to `docs/orchestration/agents/`
- Phase execution plans (00–12) staged
- Workflow, prompt, and template documents staged
- Root configuration files created (gitignore, gitattributes, editorconfig, env.example)
- INDEX.md and TRACEABILITY.md written
- Stub ARCHITECTURE.md, SECURITY.md, TESTING.md created

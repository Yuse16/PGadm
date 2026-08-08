# Decision Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 001 | Clone to new `PGadm` folder | Preserve source `PG DOC` untouched | 2026-07-29 |
| 002 | Skip HANDOFF (1).md | Contains duplicate REPOSITORY_BOOTSTRAP.md content; original HANDOFF.md kept in templates | 2026-07-29 |
| 003 | Source packs 00-02 from `plomeria_garcia_pwa_docs_v0.1` | No standalone pack folders for 00-02; only subfolder exists | 2026-07-29 |
| 004 | Directory structure: `docs/packs/NN-name/` | Matches standard pack numbering with descriptive names | 2026-07-29 |
| 005 | 4 separate commits for push | Granular history for packs, agents, config, and index | 2026-07-29 |
| 006 | Next.js 16 + App Router + Tailwind v4 | create-next-app generated stack, stable with Node 24 | 2026-07-29 |
| 007 | vitest + testing-library for tests | Fast, modern test runner compatible with Next.js 16 | 2026-07-29 |
| 008 | npm as package manager | pnpm not available; npm 11 ships with Node 24 | 2026-07-29 |
| 009 | Worktree at `../PGadm-worktrees/core-app-foundation` | Isolated feature development without affecting main checkout | 2026-07-29 |
| 010 | No external services connected yet | Supabase, Vercel, Intelisis, OpenRouter deferred to later phases | 2026-07-29 |
| 011 | `_core` schema for internal functions | Keeps technical objects separate from domain schemas; prevents accidental API exposure | 2026-07-29 |
| 012 | `_audit` schema prepared early | Reserved to avoid permission reshuffling when audit tables are created in Phase 10+ | 2026-07-29 |
| 013 | pgcrypto via `create extension` for UUIDs | Architecture pack mandates UUID PKs; pgcrypto is the standard PostgreSQL extension | 2026-07-29 |
| 014 | `_core.updated_at()` trigger function | Single reusable trigger for all tables needing `updated_at`; avoids repetition | 2026-07-29 |
| 015 | `@supabase/supabase-js` only as dependency | No Supabase UI libs, auth helpers, or storage yet — only client/server boundary | 2026-07-29 |
| 016 | `zod` as devDependency only | Available for future env/schema validation; not used in runtime yet | 2026-07-29 |
| 017 | Auth disabled in local Supabase config | No auth module exists yet; enabling would create unused tables and confuse state | 2026-07-29 |
| 018 | Seed file empty for Phase 1B.1 | No business entities exist yet; seed data belongs in their respective phase branches | 2026-07-29 |
| 019 | DB CI uses direct PostgreSQL service (not Supabase) | Simpler, faster, no Docker-in-Docker overhead; Supabase-specific features not needed yet | 2026-07-29 |
| 020 | pgTAP tests deferred for CI; simple SQL used instead | pgTAP requires extension installation; standard SQL verification is sufficient for Phase 1B.1 | 2026-07-29 |
| 021 | `project_id = "organization-foundation"` top-level in `config.toml` | Required by Supabase CLI v2.111.0; obsolete `[project]` section removed | 2026-08-01 |
| 022 | Migration 002: organizations, branches, warehouses, branch_warehouse_relations | Core org model with composite FKs, uniques, CHECKs, triggers, minimal PG15-safe revokes | 2026-08-01 |
| 023 | Idempotent demo seed (PGM, NOG, SAL, NOG-01, SAL-01) | Deterministic fixtures for dev and UI; codes "pending validation" used as external_id | 2026-08-01 |
| 024 | `src/types/database.ts` generated via `db:types` | DB is single source of truth; replaces manual contract; verified deterministic | 2026-08-01 |
| 025 | `ci_verify.sql` converted to pgTAP `plan(41)` | Plain SQL emitted no plan and pg_prove exited 1; real TAP assertions now count (30 structural + 11 behavioral) | 2026-08-01 |
| 026 | `test_organization_structure.sql` rebuilt as pgTAP `plan(66)` | Incident: file emptied by invalid PowerShell `-replace`; rebuilt verbatim and validated against real local DB | 2026-08-01 |
| 027 | `scripts/verify-db.mjs` with 10 checks and exit ≠ 0 on failure | Runs real `db reset` + `db test` + deterministic types; hard gate for CI/local | 2026-08-01 |
| 028 | Repository uses normal anon client, no `service_role` | Principle of least privilege; service-role isolation review completed (F1B2_SERVICE_ROLE_REVIEW.md) | 2026-08-01 |
| 029 | `/admin/organization` server component with `force-dynamic` | Reads seed/demo data safely, empty/error states, no client secrets | 2026-08-01 |
| 030 | No auth, roles, permissions, functional RLS, or inventory in Phase 1B.2 | Out of scope; deferred to Phase 1B.3 (identity, sessions, RBAC — drafts ready) | 2026-08-01 |
| 031 | `DemoOrganizationRepository` explícito + `ORGANIZATION_DATA_SOURCE=demo` (default) | Anon no puede leer tablas owner-only hasta 1B.3 (auth+grants+RLS); selección determinista explícita, nunca fallback silencioso tras un fallo | 2026-08-01 |
| 032 | Semántica de `priority`: 1 = mayor prioridad, orden `ascending` | Unifica comentario SQL, repositorio, dominio y fixtures; 1 evaluado antes que 2; cubierto por `priority-semantics.test.ts` | 2026-08-01 |
| 033 | PR #5 merged vía merge commit `05872c9`; Fase 1B.2 COMPLETED AND INTEGRATED | Merge commit (no squash/rebase/force); 12 commits integrados en develop; cierre documental en PR #6 | 2026-08-01 |
| D-C01 | Categorías jerárquicas, máx. 3 niveles; la base impide profundidad >3, self-parent y ciclos | Función privada `_catalog.enforce_category_tree()` (SECURITY INVOKER, `search_path=''`); lógica de catálogo fuera de `_access` | APPROVED · 2026-08-04 |
| D-C02 | `products` y `product_variants` como tablas separadas | El producto base no tiene SKU/barcode; la presentación vendible es la variante | APPROVED · 2026-08-04 |
| D-C03 | SKU pertenece a `product_variants` | Toda presentación vendible con SKU/barcode distinto es una variante | APPROVED · 2026-08-04 |
| D-C04 | Múltiples códigos de barras por variante (`product_barcodes`) | 1 primario por variante; sin barcode primario a nivel producto | APPROVED · 2026-08-04 |
| D-C05 | Unidad base vs. venta separadas + factor único | `base_unit_id`, `sale_unit_id`, `base_units_per_sale_unit numeric CHECK (>0)`; tabla general de conversiones diferida | APPROVED · 2026-08-04 |
| D-C06 | Precio de referencia único por variante | `reference_price numeric(14,4)` asociado a `sale_unit_id`; sustituye las 3 columnas unit/box/m²; listas de precios diferidas | APPROVED · 2026-08-04 |
| D-C07 | Catálogo por organización | Todas las tablas de 1C org-scoped; sin catálogo global compartido | APPROVED · 2026-08-04 |
| D-C08 | Cruces entre orgs impedidos en la base | RLS `_access.current_organization_ids()` + FK compuestas `(organization_id, id)`; `UNIQUE(organization_id, id)` en tablas padre | APPROVED · 2026-08-04 |
| D-C09 | Permisos `catalog.read/create/update/archive/manage` | `manage` es administrativo y no sustituye silenciosamente a los demás; `archive` independiente de `update` | APPROVED · 2026-08-04 |
| D-C10 | Auditoría append-only de mutaciones de catálogo | `_audit.catalog_events` (create/update/archive) con actor `_access.current_user_id()` en 1C.5 | APPROVED · 2026-08-04 |
| D-C11 | `external_id` normalizado, case-insensitive y único por org | Índice funcional `(organization_id, upper(trim(external_id)))` parcial; regla "no descripción como ID"; sin sync real | APPROVED · 2026-08-04 |
| D-C12 | Unicidades case-insensitive con índices funcionales `upper(trim(...))` + `CHECK trim(valor) <> ''` | `code`, `sku`, `barcode`, nombres y descripciones obligatorias sin espacios en blanco vacíos | APPROVED · 2026-08-04 |
| D-C13 | Ciclo de vida de producto | Se crea `inactive`; activo requiere ≥1 variante activa; no puede desactivarse/descontinuarse la última variante activa con producto activo | APPROVED · 2026-08-04 |
| D-C14 | Descontinuados conservan fila; sin DELETE físico | `status='discontinued'`; baja lógica; `catalog.archive` controla la transición; `catalog.manage` restaura | APPROVED · 2026-08-04 |
| D-C15 | Visibilidad por sucursal diferida | En 1C el catálogo es org-wide; `product_branch_visibility` en fase posterior | APPROVED · 2026-08-04 |
| D-C16 | Sustitutos/relacionados diferidos | `product_relations` en fase comercial | APPROVED · 2026-08-04 |
| D-C17 | Imágenes y fichas técnicas diferidas | Requiere Supabase Storage (deshabilitado) | APPROVED · 2026-08-04 |
| D-C18 | Auditoría persistida en `_audit.catalog_events` (implementación de D-C10) | Append-only, actor `_access.current_user_id()`, FK a profiles/organizations, RLS allowlist select/insert solo `authenticated`, grants==políticas, revokes a public/anon/service_role | IMPLEMENTED · 2026-08-06 |
| D-C19 | Esquema `_audit` expuesto en `supabase/config.toml [api] schemas` | PostgREST necesita el esquema en la API para que el cliente anon RLS-scoped del servidor lea/escriba `catalog_events`; acceso limitado por grants+RLS, nunca service_role | IMPLEMENTED · 2026-08-06 |
| D-C20 | Port de auditoría = `record()` + `listEvents(filter)` | El timeline de historial (P6) requiere consulta filtrada por org/tipo/entidad con límite; Noop mantiene filtro/orden/límite para demo y tests | IMPLEMENTED · 2026-08-06 |
| D-C21 | Puntos de integración con un solo `CatalogIntegrationRepository.getIntegrationSummary()` | Inventario/compras/precios fuera de alcance en 1C.5; contrato estable + `NoopCatalogIntegrationRepository` para ambas fuentes; UI muestra "Sin integración de inventario" | IMPLEMENTED · 2026-08-06 |
| D-C22 | `CATALOG_DATA_SOURCE` extiende D031 a catálogo: `demo` default \| `supabase`; sin fallback silencioso | Selección determinista; error tipado `RepositoryConfigurationError` sin configuración; demo y supabase explícitos | IMPLEMENTED · 2026-08-06 |
| D-I01 | Modelo de 5 tablas org-scoped (nombres plurales, consistencia repo): `inventory_snapshots`, `inventory_snapshot_items`, `inventory_changes`, `inventory_observations`, `import_templates`; snapshot = fotografía lógica, change = diferencia, observation = conteo/nota física; referencia a producto vía `variant_id` | `23-contracts/29_INVENTORY_SCHEMA.md`, `10-arch/16_INVENTORY_DATA_MODEL.md`, `05-inventory/31_DATA_MODEL.md` | APPROVED · 2026-08-06 |
| D-I02 | Aprobar importación crea snapshot + eventos de auditoría (patrón `_audit` 1C.5 → `_audit.inventory_events`); el snapshot conserva la fecha exacta de la fuente (`report_date` NOT NULL) | `23-contracts/14_INVENTORY_ENDPOINTS.md`, `43_INVENTORY_LAYOUT_EVENTS.md`, `21-migration/21_INVENTORY_INITIAL_LOAD.md` | APPROVED · 2026-08-06 |
| D-I03 | Guardar solo cambios entre snapshots (`inventory_changes` append-only); el historial nunca se borra al cargar un nuevo Excel | `05-inventory/16_CHANGE_DETECTION.md`, `17_INVENTORY_HISTORY.md` | APPROVED · 2026-08-06 |
| D-I04 | Stock presentado como "Existencia reportada" con fecha; tienda y CEDIS separados (snapshot por `warehouse_id`); sin causa de movimiento (no se atribuye sin cubo) | `24-master-index/10_INVENTORY_CONSOLIDATED_RULES.md`, `05-inventory/09_STOCK_MODEL.md`, `18_MOVEMENT_INFERENCE.md` | APPROVED · 2026-08-06 |
| D-I05 | Producto ausente del archivo → `change_type='missing_product'`, sin stock cero automático; requiere revisión (ausente ≠ stock cero) | `05-inventory/26_DUPLICATES_AND_MISSING.md` | APPROVED · 2026-08-06 |
| D-I06 | Observaciones manuales no mutan el stock oficial; se registran con actor (`created_by`), fecha, cantidad, evidencia (URL texto; Storage diferido por D-C17) y comentario | `05-inventory/24_MANUAL_ADJUSTMENTS.md`, `02_SOURCE_PRIORITY.md` | APPROVED · 2026-08-06 |
| D-I07 | Mapeo de columnas por plantilla por tipo de archivo (`import_templates.column_mapping` jsonb); requeridos: código, descripción, almacén, existencia; sin import silencioso si falta un requerido | `05-inventory/14_COLUMN_MAPPING.md`, `25_DATA_VALIDATION.md` | APPROVED · 2026-08-06 |
| D-I08 | Almacenes detectados en el archivo se vinculan a `warehouses` de 1B.2 vía `external_source` + `external_id` (NOG-01 ↔ `116NOG-PGM`, SAL-01 ↔ `106SAL-PGM`); snapshot cubre un almacén por vez | `05-inventory/06_STORE_WAREHOUSE_SELECTION.md`, migración 002 | APPROVED · 2026-08-06 |
| D-I09 | Conversión de unidades solo con factores confirmados; mostrar unidad original + comercial; `product_units_conversion` queda diferida (no se confirman factores en 1D) | `05-inventory/11_UNITS_AND_CONVERSIONS.md`, `F1C_DATA_MODEL_PROPOSAL.md` §4 (D-C05) | APPROVED · 2026-08-06 |
| D-I10 | Permisos `inventory.*` (`read/import/approve/observe`) mapeados a los roles existentes (administrator/manager/cashier/operator) según la matriz aprobada; sin roles nuevos en 1D | `05-inventory/30_PERMISSIONS.md`, `F1B3_RBAC_MATRIX_DRAFT.md` (`inventory.import`) | APPROVED · 2026-08-06 |
| D-I11 | Fuente inicial = Excel conectado al cubo; Intelisis como referencia oficial (valor nunca reemplazado); adaptadores de data source para swap futuro sin rehacer módulos | `05-inventory/00/02/28`, `01_INTELISIS_ENVIRONMENT.md` | APPROVED · 2026-08-06 |
| D-I12 | `INVENTORY_DATA_SOURCE` = `demo` default \| `supabase`, sin fallback silencioso (extiende D031/D-C22) | patrón 1C.3/`repository-selection` | APPROVED · 2026-08-06 |
| D-I13 | Alertas iniciales (tienda en cero con CEDIS con stock, stock bajo, exhibido sin stock, remate sin stock, nuevo con alto stock, diferencia entre cargas, ausente) con umbrales configurables por uso real | `05-inventory/19_STOCK_ALERTS.md` | APPROVED · 2026-08-06 |
| D-I14 | Relación con layout/ventas/comercialización/CEDIS/IA diferida: inventario expone snapshots, cambios y observaciones con fecha para que esos módulos los consuman; el port de integración de 1C.5 se puebla con stock real (1D.5) | `05-inventory/20/21/22/23/29`, `F1C_KICKOFF_CONTRACT.md` criterio 7 | APPROVED · 2026-08-06 |

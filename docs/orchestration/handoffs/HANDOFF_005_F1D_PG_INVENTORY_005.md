# Handoff — Inventario (Fase 1D.1–1D.5)

**Status: COMPLETED** (17 commits en rama; sin PR, sin merge; HEAD `4aee75b`)

## Feature
`feature/f1d-PG-INVENTORY-005-inventory`

## Agent
Orquestador → Arquitectura, Base de datos, Backend, Frontend/UX, QA, Seguridad, Documentación

## Base
- `develop` `0674e9f` (merge PR #8, cierre documental 1B.3) → rama 1C HEAD `9a7b4b8` → base de 1D: `ee761b1` (cierre documental 1C, `HANDOFF_004`)
- Worktree: `C:\Users\GVTASNOG\Documents\PGadm-worktrees\inventory-snapshots`

## Commit Hashes (17)
```
5f41ded docs(inventory): define Phase 1D inventory kickoff contract
5540068 docs(inventory): record Phase 1D kickoff in agent state and changelog
009ddd2 docs(inventory): add Phase 1D documentation pack (model, RLS, test plan, slices)
9bc1de3 docs(inventory): register Phase 1D kickoff approval (D-I01...D-I14)
ce42a56 feat(inventory): add inventory snapshots database foundation (1D.2)
9e1bdf0 test(inventory): validate inventory snapshot database rules (1D.2)
5cb5332 docs(inventory): record Phase 1D.2 database handoff (1D.2)
e28dfb5 feat(inventory): domain, application and infrastructure for 1D.3
bffb2d2 test(inventory): use-case, guard, demo and selection suites for 1D.3
e43cb5c docs(inventory): record Phase 1D.3 handoff
e2b812a test(inventory): feature security suite for 1D.4
fd92642 docs(inventory): record Phase 1D.4 handoff
afced82 feat(inventory): populate 1C.5 integration port with real stock and add stock alerts (1D.5)
6427d23 test(inventory): stock alerts (D-I13) and real-stock 1C.5 integration summary (1D.5)
dd48992 test(inventory): remove unused import in integration summary suite
57ae21e docs(inventory): close Phase 1D (1D.5 integration + alerts + handoff)
4aee75b docs(inventory): pin Phase 1D.5 closure commits to final HEAD
```

## Worktree
`C:\Users\GVTASNOG\Documents\PGadm-worktrees\inventory-snapshots` (conservado)

## State
- **1D.1 (aprobado):** D-I01…D-I14 APPROVED 2026-08-06 (`9bc1de3`); paquete documental
  (`F1D_KICKOFF_CONTRACT`, `F1D_DATA_MODEL_PROPOSAL`, `F1D_RLS_PERMISSION_MATRIX`,
  `F1D_TEST_PLAN`, `F1D_IMPLEMENTATION_SLICES`).
- **1D.2 (DB):** migración `00000000000010_inventory_snapshots.sql` — 5 tablas org-scoped
  (`inventory_snapshots` por `warehouse_id` con `report_date` de fuente e `is_baseline`;
  `inventory_snapshot_items` por `variant_id`; `inventory_changes` con `difference` STORED y
  6 `change_type`; `inventory_observations` con `evidence_url` texto; `import_templates` con
  `column_mapping`/`warehouse_rules` jsonb), `_audit.inventory_events` append-only, FK
  compuestas org-scoped, `UNIQUE(organization_id, id)`, 13 políticas RLS allowlist solo
  `authenticated`, sin DELETE, revokes `public`/`anon`/`service_role`. Seed: permisos
  `inventory.read/import/approve/observe` (15 total, 35 role_permissions) + fixtures PGM
  `90000000-…` (2 snapshots, 5 items con variante 053 ausente, 3 changes, 2 observaciones,
  1 plantilla).
- **1D.3 (backend):** `src/features/inventory/` espejo del patrón `catalog` — domain (errores
  tipados, `InventoryActor` con `requirePermission`, 4 permisos `inventory.*`, 5 entidades,
  port agregado `InventoryRepository` 21 métodos, port `InventoryAuditRepository`, referencia
  variante/almacén), application (guards RLS-scoped, `approveImport` línea base IA-12/13 +
  duplicados IA-8 + `computeChanges` 6 tipos IA-14/15/16/18, observaciones IA-20/21/22 que
  nunca mutan stock IA-21, plantillas sin DELETE IA-34, historial IA-17), infrastructure
  (`demo` in-memory sembrado con fixtures 1D.2 + `{seed:false}`, `supabase` RLS-scoped contra
  migración 010, `repository-selection` con `INVENTORY_DATA_SOURCE=demo` default | `supabase`,
  sin fallback silencioso D-I12/D031).
- **1D.4 (permissions/security):** permisos `inventory.*` verificados vía
  `current_user_permissions()` (test_identity_rbac_rls plan 140: 15/35); `feature-security.test.ts`
  (6 tests) — IA-29 sin admin/`service_role`, demo standalone, selección determinista sin
  fallback, guards reutilizan `requirePermission`, toda escritura pasa por `actor.requirePermission`;
  aislamiento por org y deny-by-default en pgTAP.
- **1D.5 (integración + alertas + cierre):** el port 1C.5 `CatalogIntegrationRepository` deja de
  ser Noop — `InventoryCatalogIntegrationRepository` (inventory infra) agrega la existencia
  reportada del snapshot más reciente por almacén (`latestSnapshotPerWarehouse`, determinista por
  `report_date`/`imported_at`/id); `current_stock` real, `reserved_stock` null (ventas, D-I14),
  `available_stock = current_stock`, mensaje `"Existencia reportada al {report_date}"` (D-I04);
  compras/pricing sin integración. Helper server `getProductIntegrationSummary(variantIds)` con
  `inventory.read` org-scoped; wiring en `src/app/admin/catalog/products/[id]/page.tsx` (el detalle
  de producto muestra stock real). Alertas D-I13: `computeInventoryAlerts` (application) — 5 tipos
  computables (`load_difference`, `absent_from_file` ausente ≠ stock cero D-I05, `zeroed_stock`,
  `low_stock`, `high_new_stock`) con umbrales configurables (`InventoryAlertThresholds`:
  lowStock/highNewStock/difference, defaults conservadores), orden determinista; tienda/CEDIS,
  exhibido, comercialización y remate diferidos (D-I14: dependen de layout/ventas).

## Cross-Reviews (áreas, rama 1D)
| Área | Veredicto |
|------|-----------|
| Arquitectura | PASS (espejo patrón 1C: demo+supabase, port agregado, guards identity) |
| Base de datos | PASS (migración 010, 638/638 pgTAP, `db:lint` limpio) |
| Backend | PASS (use cases IA-1…IA-37, determinismo, org-scoped D-C07) |
| Frontend | PASS (producto con stock real sin cambios de UI; timeline/historial intactos) |
| Seguridad | PASS (zero service_role, RLS allowlist, IA-29) |
| QA | PASS (388/388 vitest + 638/638 pgTAP + gates) |

## Final Validation (rama, HEAD `4aee75b`)
```
db:test: 638/638 (10 archivos)  Result: PASS
db:lint: sin errores de schema
db:verify: ALL CHECKS PASSED (reset + migraciones 001–010 + seed + types en sync)
npm test: 48 archivos, 388/388 PASS
npm run lint: PASS · npm run typecheck: PASS · npm run build: PASS (16 rutas)
git diff --check: clean · sin secretos
```

## Decisiones de Fase 1D (registradas en `DECISION_LOG.md`, D-I01…D-I14 APPROVED)
| Decisión | Opción | Razón |
|----------|--------|-------|
| Snapshot por `warehouse_id` + `report_date` de fuente (D-I02/D-I04) | `inventory_snapshots` por almacén, fecha exacta de la fuente | "Existencia reportada" con fecha; tienda y CEDIS separados; sin causa de movimiento |
| Item = `variant_id`; solo cambios entre snapshots (D-I01/D-I03) | `inventory_changes` append-only, `difference` STORED | Historial nunca se borra al cargar nuevo Excel |
| Ausente ≠ stock cero (D-I05) | `change_type='missing_product'` | Requiere revisión; no se asume stock cero automático |
| Observaciones sin mutar stock oficial (D-I06) | `inventory_observations` con actor/fecha/evidencia texto | D-C17; Storage diferido |
| Plantillas + column_mapping jsonb (D-I07) | `import_templates`, requeridos código/descripción/almacén/existencia | Sin import silencioso si falta requerido |
| Vínculo almacenes 1B.2 (D-I08) | `external_source` + `external_id` (NOG-01 ↔ `116NOG-PGM`, SAL-01 ↔ `106SAL-PGM`) | Snapshot cubre un almacén por vez |
| Conversión de unidades (D-I09) | Diferida; mostrar unidad original + comercial | Factores no confirmados en 1D |
| Permisos `inventory.*` (D-I10) | 4 permisos → roles existentes, sin roles nuevos | Matriz aprobada |
| `INVENTORY_DATA_SOURCE` (D-I12) | `demo` default \| `supabase`, error tipado sin config | Sin fallback silencioso (D031/D-C22) |
| Alertas iniciales (D-I13) | `computeInventoryAlerts`, umbrales configurables | 5 tipos computables en 1D; resto diferido (D-I14) |
| Integración port 1C.5 (D-I14) | `InventoryCatalogIntegrationRepository` + `getProductIntegrationSummary` | Stock real en el detalle de producto; consumido por layout/ventas/CEDIS/IA |

## Blockers
| Blocker | Impact |
|---------|--------|
| `npm audit` 4 high prod (postcss/sharp via next) | Baseline de fase de seguridad (igual que 1B/1C); requiere upgrade mayor |
| Layout/ventas/comercialización/CEDIS/IA diferidos (D-I14) | Consumen snapshots/cambios/observaciones en sus fases; fuera de alcance 1D |
| Alerta tienda-en-cero-con-CEDIS y exhibido/comercialización/remate | Requieren tipo de almacén/layout/ventas; documentadas como diferidas (D-I13/D-I14) |

## Open Items / Next Phase
1. **Revisión humana + PR a `develop` + merge**: los 17 commits de 1D están en la rama (sin
   push, sin PR, sin merge por metodología). La rama 1C (`9a7b4b8`) también está pendiente de
   revisión/merge; al fusionar conviene hacerlo en orden 1C → 1D (1D depende del port 1C.5 y de
   migración 010 sobre 008/009).
2. **Handoff de la siguiente fase**: Fase 3 — Layout (roadmap `17-roadmap/02_PROJECT_PHASES.md`):
   plano estructurado, editor, muebles, posiciones, M1, stock en layout. La fase consume los
   snapshots/cambios/observaciones que 1D expone (D-I14). Debe definirse con kickoff contract y
   aprobación humana (metodología: no inventar fases; NO se crea en este cierre).
3. **Flips de fuente de datos**: `ORGANIZATION_DATA_SOURCE`/`CATALOG_DATA_SOURCE`/
   `INVENTORY_DATA_SOURCE` siguen default `demo`; el cambio a `supabase` es decisión de ops.

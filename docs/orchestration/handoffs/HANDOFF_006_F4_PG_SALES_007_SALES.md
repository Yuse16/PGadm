# Handoff — Cierre de F3 (Layout) y Fase 4 (Ventas y cotizaciones)

**Status: F3 COMPLETED AND INTEGRATED** (7 commits; **PR #12 MERGED** merge commit `5617831` → `develop` `5617831`)

## Fase cerrada

**F3 — Layout** · `feature/f3-PG-LAYOUT-006-layout` · subfases 3.1→3.6 COMPLETADAS.

## Agent

Orquestador → Arquitectura, Base de datos, Backend, Frontend/UX, QA, Seguridad, Documentación

## Base

- `develop` `2e1291e` (merge PR #9, cierre documental 1D) → rama F3 HEAD `05ba677` → **merge PR #12 `5617831`**
- Worktree: `C:\Users\GVTASNOG\Documents\PGadm-worktrees\layout-kickoff`

## Commit Hashes (7)

```
2d47ce4 docs(layout): add F3 kickoff contract (phase 3 - structured plan, editor, M1, stock)
3cbb627 docs(layout): add F3 documentary package (data model, RLS, test plan, slices) and approve D-L01..D-L14
d4b5fa5 feat(layout): add layout schema, seed fixtures and DB validation (3.2)
b808276 feat(layout): add layout domain, use cases and demo infrastructure (3.3)
5ffdd67 feat(layout): wire supabase repositories and layout feature security (3.4)
c2f7e67 feat(layout): add layout admin UI with structured canvas editor (3.5)
05ba677 F3: 3.6 deteccion de cambios de stock, sugerencia de reemplazo y cierre
```

## Worktree

`C:\Users\GVTASNOG\Documents\PGadm-worktrees\layout-kickoff` (conservado; rama local `feature/f3-PG-LAYOUT-006-layout`)

## State

- **3.1 (aprobado):** D-L01…D-L14 APPROVED 2026-08-08 (`3cbb627`); paquete documental
  (`F3_KICKOFF_CONTRACT`, `F3_DATA_MODEL_PROPOSAL`, `F3_RLS_PERMISSION_MATRIX`,
  `F3_TEST_PLAN`, `F3_IMPLEMENTATION_SLICES`).
- **3.2 (DB):** migración `00000000000011_layout.sql` — tablas org-scoped `layouts`,
  `layout_elements`, `layout_positions`, `layout_version_history`, `layout_ratings`
  + `_audit.layout_events` append-only, `UNIQUE(organization_id, id)`, FK compuestas,
  RLS deny-by-default reutilizando `_access` (004), grants == policies, sin
  `service_role`, sin DELETE físico. Seed: permisos `layout.*` (4 → 15 total,
  39 role_permissions) + fixtures PGM (layout Nogalera draft 12×6, branch NOG,
  bodegas NOG-01/SAL-01, 14 elementos, 35 posiciones, variantes `051/052/053`).
- **3.3 (backend):** `src/features/layout/` espejo del patrón `catalog`/`inventory` —
  domain (errores tipados, `LayoutActor` con `requirePermission`, 4 permisos
  `layout.*`, entidades + ports `LayoutRepository`, `LayoutReferenceCatalog`
  (incl. `findCompatibleVariants`), `LayoutStockProvider`, `LayoutAuditRepository`),
  application (guards org-scope, `requireEditable*` D-L04, versionado draft/published/
  archived con restaurar, posiciones con `review_status`, `detectStockChanges`/
  `suggestCompatibleReplacement` D-L07 que **nunca reasigna**), infrastructure
  (`demo` in-memory + `supabase` RLS-scoped, `repository-selection` con
  `LAYOUT_DATA_SOURCE=demo` default | `supabase`, sin fallback silencioso D-L11).
- **3.4 (permisos/seguridad):** `feature-security.test.ts` (6 tests) — sin
  admin/`service_role`, demo standalone, selección determinista, guards identity,
  aislamiento por org y deny-by-default en pgTAP.
- **3.5 (UI/editor):** `/admin/layout` (listado) y `/admin/layout/[id]` (editor
  read-only: lienzo 12×6, posiciones con SKU/estado/existencia reportada con fecha
  tienda/CEDIS, historial append-only con restaurar, publicar/archivar); server
  layer `requireLayoutSession()` + 17 server actions con `runMutation`
  (re-guard + org-scope + `ActionResult<T>`).
- **3.6 (integración + cierre):** `detectStockChanges` (marca `needs_review` solo si
  la variante reporta existencia total 0 en todas las bodegas de la branch; audita
  `element_edited`) + `suggestCompatibleReplacement` (primer candidato con stock > 0);
  port `findCompatibleVariants` (demo + supabase con `VariantLookupRepository`
  inyectable, filtra `status='active'`); UI con "Detectar cambios de stock" y
  "Confirmar reemplazo" (solo draft + canEdit); `scripts/e2e-identity.mjs` actualizado
  con permisos `layout.*` por rol.

## Final Validation (F3)

```
npm run lint: PASS · npm run typecheck: PASS
npm test: 59 archivos, 500/500 PASS
npm run build -- --webpack: PASS (16 rutas; Turbopack falla en worktree por junction node_modules)
npm run db:verify: ALL CHECKS PASSED (reset + migraciones 001–011 + seed + 748 pgTAP + types en sync)
npm run e2e:auth: PASS (14/14) · npm run e2e:identity: PASS (0 fallos; permisos layout.* incluidos)
```

## Decisiones de Fase 3 (registradas en `DECISION_LOG.md`, D-L01…D-L14 APPROVED)

| Decisión | Opción | Razón |
|----------|--------|-------|
| Modelo 4 tablas org-scoped + versionado (D-L01/D-L04) | `layouts/elements/positions/version_history`, draft→published→archived, restaurar | Edición sobre borrador; versión anterior conservada |
| IDs de ubicación permanentes (D-L02) | `element.code` + `position_code`, el ID completo nunca cambia | Referencias estables entre módulos |
| Geometría normalizada 0-1, sin píxeles (D-L03) | escala/zoom/paneo/rotación/`z_index`/capas | Independiente del viewport |
| `background_reference` visual (D-L05) | Plano de Canva como referencia; el modelo es estructurado | La imagen no se parsea |
| Posición referencia `variant_id` (D-L06) | catálogo 1C + `active_from/to`; posición vacía permitida; historial append-only | Consistencia con catálogo |
| Cambio de stock marca, sugiere, espera confirmación (D-L07) | `needs_review` + `findCompatibleVariants`; nunca auto-reasigna | Confianza con el negocio |
| M1 con riel F/I/P y capacidades 3/3/2 (D-L08) | recomendación confirmable por mueble/proveedor | Base del planograma |
| Catálogo de elementos/tipos + zonas (D-L09) | `element_type` + reglas de composición; Nogalera como seed | Muebles/zona reutilizables |
| Permisos `layout.*` a roles existentes (D-L10) | read/edit/publish/manage, sin roles nuevos | Matriz 1B3 aprobada |
| `LAYOUT_DATA_SOURCE` (D-L11) | `demo` default \| `supabase`, error tipado sin config | Sin fallback silencioso (D031/D-C22/D-I12) |
| Auditoría `_audit.layout_events` (D-L12) | patrón 1C.5/1D | Append-only, trazabilidad |
| Consume inventario 1D por posición (D-L13) | port 1C.5/1D con stock real, no mock | Tienda/CEDIS separados con fecha |
| Validación física asistida (D-L14) | recorrido y registro de diferencias; fotos diferidas | Storage fuera de alcance (D-C17) |

## Blockers / Open Items

| Item | Impact |
|------|--------|
| `npm audit` baseline (postcss/sharp via next, 4 high prod) | Igual que 1B/1C/1D; requiere upgrade mayor — fase de seguridad |
| Flips de fuente de datos | `*_DATA_SOURCE` siguen default `demo`; pasar a `supabase` es decisión de ops |
| Comercialización/IA y capas de layout (D-L09) | Fases propias; consumen layout/ventas |

## Next Phase — Fase 4 (Ventas y cotizaciones)

- **Alcance (roadmap `17-roadmap/02_PROJECT_PHASES.md`, `07_PHASE_7.md`):** búsqueda,
  calculadora, cajas, complementos, comparador, cotización y venta manual.
  Gate de salida: "Flujo producto a cotización completo".
- **CRM** es **Fase 5** en el roadmap (`08_PHASE_8.md`: clientes, proyectos,
  oportunidades, seguimientos, cola diaria, motivos); no se implementa en F4.
- **Consume:** catálogo 1C (productos/variantes/precios), inventario 1D (existencia
  reportada) y layout F3 (stock por posición/tienda, `review_status`); `reserved_stock`
  de `getProductIntegrationSummary` se puebla en ventas (D-I14).
- **Método (por la metodología del repo):** NO se inventan fases ni alcances en este
  cierre. La Fase 4 debe abrirse con **kickoff contract** (`F4_KICKOFF_CONTRACT.md`,
  con decisiones propuestas D-V0x, modelo de datos, RLS y test plan) y **aprobación
  humana explícita** antes de migración/backend/UI. Referencias fuente de negocio:
  `docs/04-sales/` (34 docs) y `docs/07-crm/` (5 docs listados en 1B2); RBAC de ventas
  borrador: `F1B3_RBAC_MATRIX_DRAFT.md` (`sales.capture_own`, `sales.edit_all`).
- **Pendiente de este handoff:** solo el kickoff contract de F4 una vez aprobada su
  apertura.

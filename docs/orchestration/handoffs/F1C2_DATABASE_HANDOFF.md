# F1C.2 — Database Handoff (Catálogo Maestro de Productos)

## Estado: 1C.2 COMPLETED AND PUSHED (base de datos implementada y verificada)

**Fecha:** 2026-08-05
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Base:** `0674e9f` (origin/develop) · HEAD `a4236f7` (discovery/1C.1)

Entrega de la **fase 1C.2**: migración `00000000000008_product_master.sql`,
seed idempotente, pruebas pgTAP, regeneración de tipos y verificación completa de
gates (app + DB + E2E). Define estado de entrada, lo implementado, resultados
reales, desviaciones técnicas y qué queda para 1C.3.

---

## 1. Estado de entrada

- `develop` sincronizado en `0674e9f07499e792e0bd90b01ed32dd893e02827` (merge PR #8,
  fase 1B.3 integrada).
- Worktree de 1C con discovery/1C.1 en `a4236f7` (solo documentación `.md`).
- Sin migraciones, código, tipos ni datos de catálogo previos.

## 2. Entregables (1C.2)

| # | Entregable | Archivo |
|---|-----------|---------|
| 1 | Migración del catálogo maestro | `supabase/migrations/00000000000008_product_master.sql` |
| 2 | Seed idempotente (permisos + fixtures demo) | `supabase/seed.sql` |
| 3 | Suite pgTAP de catálogo (78 aserciones) | `supabase/tests/test_product_master.sql` |
| 4 | Verificación CI actualizada (plan 47) | `supabase/tests/ci_verify.sql` |
| 5 | Pruebas RBAC/RLS actualizadas | `test_identity_rbac_rls.sql`, `test_organization_rls.sql` |
| 6 | Tipos regenerados | `src/types/database.ts` (+370 líneas) |
| 7 | E2E identidad con permisos `catalog.*` + scoping `products` | `scripts/e2e-identity.mjs` |

## 3. Modelo de datos implementado (schema `public` + funciones `_catalog`)

7 tablas en `public` (coherente con el patrón 007; sin schema `catalog` para
entidades):

| Tabla | Notas |
|-------|-------|
| `product_categories` | Jerárquica ≤3 niveles; `UNIQUE(organization_id, id)` inline (ver §7 desviación); parent FK compuesta org-scoped |
| `product_brands` | Padre org-scoped; `UNIQUE(organization_id, id)` |
| `units_of_measure` | Padre org-scoped; `UNIQUE(organization_id, id)`; kind dimensional |
| `product_lines` | Padre org-scoped; `UNIQUE(organization_id, id)` |
| `products` | SKU `upper(trim(...))` único por org; `external_id` Intelisis único por org; `reference_price numeric(14,4)`; nace `inactive` (D-C13) |
| `product_variants` | `base_units_per_sale_unit`; barcodes propios; transiciones propias |
| `product_barcodes` | Barcode `upper(trim(...))` único por org; 1 primario por variante (índice único parcial) |

- FK compuestas `(organization_id, ref_id) → (organization_id, id)` en todas las
  referencias (org-scoped, D-C04).
- Índices funcionales `upper(trim(...))` en códigos; `CHECK trim(x) <> ''`.
- Triggers `updated_at` en todas las tablas.
- **Sin DELETE** sobre ninguna tabla de catálogo (D-C14): baja lógica vía `status`.

## 4. RLS y permisos

- 21 políticas allowlist (3 por tabla), solo `authenticated`:
  - Referencia (`product_categories`, `product_brands`, `units_of_measure`,
    `product_lines`): `*_select_org`, `*_insert_admin`, `*_update_admin`.
  - Transaccionales (`products`, `product_variants`, `product_barcodes`):
    `*_select_org`, `*_insert_create`, `*_update_editor`.
- Reutiliza `_access.is_org_member_in` (migración 004) para el scoping por org.
- FORCE RLS **off** (D20); revokes mínimos PG15-safe; sin grants a `anon`,
  `service_role` ni `public`; sin políticas `USING(true)`/`WITH CHECK(true)`.
- 21 políticas verificadas en `pg_policies` contra la BD local.

## 5. Funciones de enforcement (`_catalog`)

| Función | Propósito |
|---------|-----------|
| `enforce_category_tree()` | Profundidad ≤3, sin ciclos, sin auto-padre, sin cruzar org (trigger `product_categories_tree_enforce`) |
| `enforce_product_active_variant()` | Activar un producto exige ≥1 variante activa (trigger `products_active_variant_enforce`) |
| `enforce_last_active_variant()` | No desactivar la última variante activa (trigger `product_variants_last_active_enforce`) |
| `enforce_status_transition()` | Máquina de estados: nace `inactive`; discontinue exige `catalog.archive`; restore solo con `catalog.manage`; combinado = edit + transición (triggers `products_status_transition_enforce`, `product_variants_status_transition_enforce`) |

Todas **SECURITY INVOKER** con `search_path=''`, sin EXECUTE público
(`revoke all ... from public` + grants solo a `authenticated`, D-C10/D-C17).
`enforce_status_transition` solo ejecuta su lógica cuando
`current_user = 'authenticated'` (D20: el seed corre como owner y activa
fixtures sin restricción).

## 6. Permisos `catalog.*` y role_permissions

- 5 permisos nuevos (total `permissions` = **11**):

| ID (sufijo) | Permiso |
|-------------|---------|
| `50000000-...-000007` | `catalog.read` |
| `50000000-...-000008` | `catalog.create` |
| `50000000-...-000009` | `catalog.update` |
| `50000000-...-000010` | `catalog.archive` |
| `50000000-...-000011` | `catalog.manage` |

- Asignaciones seed por rol (patrón role_permissions por org PGM):

| Rol | Permisos catálogo | Total rol |
|-----|-------------------|-----------|
| `administrator` | read, create, update, archive, manage (+5) | 11 |
| `manager` | read, create, update (+3) | 7 |
| `cashier` | read (+1) | 3 |
| `operator` | read (+1) | 2 |

- `role_permissions` totales en BD = **23**; el test RBAC verifica **22**
  visibles para `administrator` bajo RLS (scoping por org; sin recursión).

## 7. Resultados reales y desviaciones

- `db:reset` (migraciones 001–008 + seed) ✅
- `db:test` **518/518** (8 archivos; 440 de suites previas ajustadas + 78 nuevas) ✅
- `db:lint` sin errores de schema (incluye `_catalog`) ✅
- `db:verify` **ALL CHECKS PASSED** ✅
- `db:types` regenerado (+370 líneas) ✅
- App: `npm ci` · `lint` · `typecheck` · `test` (26 archivos / 149) · `build` ✅
- E2E: `e2e:auth` 14/14 ✅ · `e2e:identity` ✅ (permisos `catalog.*` + scoping
  `products`: manager/cashier ven `TUB-PVC-100`/`VAL-GLOBO-050`, operator ve
  `P-DEMO-B`, inactivo/sin membresía `[]`)
- `git diff --check` limpio ✅ · sin secretos ✅ · `npm audit` baseline (sin `--force`) ✅

### Desviaciones técnicas (registradas, sin reabrir D-C01…D-C17)

1. **Unique inline de categorías** (fix `SQLSTATE 42830`): la FK autoreferenciada
   de `product_categories` exige un `UNIQUE(organization_id, id)` **inline** en la
   propia sentencia `CREATE TABLE`; se reemplazó el `create unique index
   product_categories_organization_id_unique` separado por el constraint inline.
   Misma semántica que lo planeado.
2. **RLS niega UPDATE en silencio**: un UPDATE denegado por RLS afecta 0 filas y
   NO lanza `42501`. Las pruebas CA de edición/transición de cashier/operator
   asertan "fila sin cambios" en lugar de `throws_ok(..., '42501')`. Los INSERT
   denegados sí lanzan `42501` y se prueban con `throws_ok`.

## 8. Seed demo (fixtures idempotentes)

- **PGM** (`70000000-...`): 6 UOM (PZA, M, M2, L, KG, CAJA), 3 líneas (TUB, VAL,
  HER), 2 marcas (MD-A, MD-B), cadena de categorías ≤3 niveles
  (TUBERIA → TUB-PVC → TUB-PVC-PRES), 2 productos activos (`TUB-PVC-100`,
  `VAL-GLOBO-050`), 3 variantes, 4 barcodes (7500000000017 primario, …).
- **PGM-DEMO-B** (`80000000-...`): mínimos — 1 UOM (PZA), 1 línea (GEN), 1 marca
  (MD-B), 1 categoría (GENERAL), 1 producto `P-DEMO-B` con 1 variante y 1 barcode.
- Los productos se insertan `inactive` y se activan al final (después de insertar
  variantes); el UPDATE final es no-op en re-runs (idempotencia, ON CONFLICT).

## 9. Pendiente para 1C.3 (no iniciado)

- Dominio/repositorios/casos de uso TypeScript del catálogo; UI básica de admin.
- No implementado a propósito: carga masiva, sync Intelisis, precios de lista,
  impuestos, imágenes/Storage, sustitutos, visibilidad por sucursal, proveedores,
  comercialización/promociones (ver `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`).
- Flip `ORGANIZATION_DATA_SOURCE`/`CATALOG_DATA_SOURCE` sigue siendo decisión de
  ops (default `demo`, D031).

## 10. Siguientes pasos

1. 1C.3 (dominio TS + UI) **solo con instrucción expresa**.
2. Antes de cualquier merge a `develop`, re-ejecutar la batería de gates del §7.

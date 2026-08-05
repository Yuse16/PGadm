# F1C — Plan de Pruebas (Catálogo Maestro de Productos)
## Estado: decisiones de arquitectura BLOQUEADAS (1C.1 completado)

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Plan de pruebas de la fase 1C, **ajustado** según la revisión humana. Se ejecutará
cuando exista implementación (subfases 1C.2+); aquí se define el alcance para validar.

---

## 1. Comandos de validación (heredados de `package.json`)

| Comando | Objetivo |
|---------|----------|
| `npm run lint` | ESLint en `src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` (unit + RSC tests bajo `src/tests/`) |
| `npm run db:lint` | reglas de seguridad/RLS de Supabase (`supabase db lint`) |
| `npm run db:test` | tests SQL de la base (pgTAP) |
| `npm run db:verify` | `scripts/verify-db.mjs` (chequeo de estado DB) |
| `npm run e2e:identity` / `e2e:auth` | flujos E2E existentes (deben seguir en verde, sin regresión) |

> Sin cambios de código en 1C.1; estos comandos se marcan como línea base y se
> ejecutarán en 1C.2+.

## 2. Casos de aceptación por requisito funcional

### 2.1 Catálogo base (categorías, marcas, unidades, líneas)
- CA-1: crear categoría raíz; crear subcategoría referenciando a la raíz en la **misma org**.
- CA-2: falla crear subcategoría con `parent_id` de **otra org** (FK compuesta).
- CA-3: falla asignar categoría a **profundidad >3** (trigger `enforce_category_tree`).
- CA-4: falla categoría **self-parent** (`parent_id = id`) (trigger).
- CA-5: falla crear **ciclo** en el árbol (A→B, B→A) (trigger).
- CA-6: crear marca/unidad/línea; duplicado de `code` en la misma org rechazado
  (case-insensitive y con `trim`).
- CA-7: el mismo `code` en **otras** orgs está permitido (aislamiento).
- CA-8: `units_of_measure.kind` solo acepta `count|length|area|volume|mass|package`
  (CHECK); valores antiguos rechazados.
- CA-9: `CHECK trim(valor) <> ''` rechaza `code`, `name`, `description` en blanco o
  solo espacios.

### 2.2 Productos y variantes
- CA-10: producto se crea **`inactive`** (default); sin variantes sigue `inactive`.
- CA-11: **activar producto sin variante activa rechazado** (trigger
  `enforce_product_active_variant`).
- CA-12: crear variante con `sku`; duplicado de SKU en la misma org rechazado
  (case-insensitive, `upper(trim(sku))`).
- CA-13: `base_units_per_sale_unit` debe ser > 0 (CHECK); NULL/0 rechazados.
- CA-14: `reference_price` es **una sola columna** `numeric(14,4)` (CHECK >= 0);
  `$0.00005`/4 decimales aceptado; sin columnas `_unit/_box/_square_meter`.
- CA-15: barcode duplicado en la misma org rechazado (case-insensitive+trim);
  permitido en otra org.
- CA-16: solo un barcode primario por variante (índice parcial `WHERE is_primary`).
- CA-17: no existe columna de barcode primario a nivel `products`.
- CA-18: `external_id` único por org (parcial, permite NULL) **case-insensitive**;
  `" ABC "` y `"abc"` chocan.
- CA-19: toda presentación vendible requiere SKU y se modela como variante; el
  producto base nunca lleva SKU/barcode.

### 2.3 Baja lógica y transiciones de estado
- CA-20: `status='discontinued'` conserva la fila; legible para lecturas históricas.
- CA-21: **la última variante activa no puede desactivarse/descontinuarse** si el
  producto sigue `active` (trigger `enforce_last_active_variant`).
- CA-22: `catalog.update` **no puede** marcar `discontinued` (trigger
  `enforce_status_transition`; excepción SQL).
- CA-23: `catalog.update` sí permite `active`↔`inactive`.
- CA-24: `catalog.archive` sí puede marcar `discontinued`.
- CA-25: `catalog.manage` puede **restaurar** `discontinued` → `active`/`inactive`.
- CA-26: no existe camino de `DELETE` (sin política RLS + `REVOKE DELETE`); intento rechazado.

### 2.4 Estructura y unicidades (correcciones aprobadas)
- CA-27: `UNIQUE (organization_id, id)` presente en las 6 tablas padre
  (`product_categories`, `product_brands`, `units_of_measure`, `product_lines`,
  `products`, `product_variants`).
- CA-28: índices funcionales case-insensitive con `trim` verificados
  (`upper(trim(code))`, `upper(trim(sku))`, `upper(trim(barcode))`,
  `upper(trim(external_id))`).
- CA-29: FK compuestas org-scoped verificadas en cada tabla hija (misma org).
- CA-30: trigger `_catalog.enforce_category_tree` es `SECURITY INVOKER` con
  `search_path=''` y vive en esquema `_catalog` (no `_access`).

## 3. Casos de seguridad RLS (deny-by-default)

- CA-31: usuario sin `catalog.read` no ve filas de ninguna tabla de catálogo.
- CA-32: usuario con `catalog.read` solo ve filas de sus organizaciones
  (`_access.current_organization_ids()`), nunca de otra org.
- CA-33: usuario sin `catalog.create` recibe rechazo en INSERT de producto/variante/barcode.
- CA-34: usuario sin `catalog.manage` no puede INSERT/UPDATE categorías, marcas,
  unidades o líneas (aunque tenga `catalog.create`).
- CA-35: usuario sin `catalog.update` no puede modificar filas de su org.
- CA-36: usuario sin `catalog.archive` no puede transicionar a `discontinued`
  (incluso con `catalog.update`).
- CA-37: usuario sin `catalog.manage` no puede restaurar un `discontinued`.
- CA-38: `service_role`/admin: cliente no contiene `service_role` (test existente
  `admin-separation.test.ts` se mantiene; repos de catálogo respetan la regla).
- CA-39: fila insertada con `organization_id` ajeno a las orgs del usuario → rechazada.

## 4. Casos de consistencia de datos y convenciones

- CA-40: los permisos `catalog.*` existen en `permissions` y se asignan según la
  matriz de roles aprobada (administrator/manager/cashier/operator) en `seed.sql` (1C.2).
- CA-41: `updated_at` se actualiza vía trigger `_core.updated_at()` en las 7 tablas.
- CA-42: auditoría: `_audit.catalog_events` registra create/update/archive con actor
  (`_access.current_user_id()`) y timestamp; append-only.
- CA-43: sin borrado físico en ninguna tabla de catálogo.

## 5. Pruebas de no-regresión

- Toda la suite existente (`src/tests/**`, features organization/identity) en verde.
- `npm run lint`, `npm run typecheck` en verde.
- `npm run db:verify` en verde.
- No aparecen nuevas dependencias en `package.json`.

## 6. Datos de prueba planificados (seed 1C.2)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Unidades | 8 | pieza (count), caja/bulto/tarima (package), m (length), m² (area), litro (volume), kilogramo (mass); ambas orgs |
| Marcas | 2–3 | por org (ej. "Marca demo A/B") |
| Categorías | 4–6 | 2 niveles: ej. "Plomería" → "Tuberías" / "Conexiones" |
| Líneas | 2 | referencia Intelisis |
| Productos | 2 | 1 con 2 variantes (caja/pieza), 1 simple; inicialmente `inactive` |
| Variantes | 3 | SKUs distintos, `base_units_per_sale_unit` 1 y 12 |
| Barcodes | 4 | 1 primario + 1 secundario en la variante múltiple |
| Precios | 2–3 | `reference_price numeric(14,4)` por variante, asociado a `sale_unit_id` |

Los datos demo quedan aislados por org (PGM y PGM-DEMO-B) — sin datos globales (D-C07).

## 7. Preguntas de revisión humana — RESUELTAS

Las 5 preguntas abiertas del discovery quedaron cerradas en 1C.1:

| # | Pregunta | Resolución |
|---|----------|-----------|
| 1 | ¿Profundidad de categorías y dónde se valida? | 3 niveles, validado **en la base** por `_catalog.enforce_category_tree()` |
| 2 | ¿Nombres de roles con `catalog.*`? | `administrator`/`manager`/`cashier`/`operator` (matriz §3 de `F1C_RLS_PERMISSION_MATRIX.md`) |
| 3 | ¿`catalog.archive` independiente o subsumido? | **Independiente**; `catalog.manage` administrativo sin sustituir a los demás |
| 4 | ¿Límites de precio de referencia? | `numeric(14,4)`, **una sola columna** `reference_price` asociada a `sale_unit_id` |
| 5 | ¿`is_primary` a nivel variante vs. producto? | **Solo por variante**; no existe barcode primario a nivel producto |

Ver detalle en `F1C_HUMAN_ARCHITECTURE_REVIEW.md`.

## 8. Anexo operativo — Comercialización agosto 2026

- Promociones, precios temporales, colores de etiquetas, incentivos y reglas de
  Outlet **NO** generan casos de prueba ni columnas de 1C (fuera de alcance).
- Las referencias maestras de 1C (`product_id`, `variant_id`, categoría/familia,
  marca, formato, unidades, SKU, barcode, `external_id`, estado) son la base para
  los casos futuros de Comercialización.
- Evidencia y matriz de requisitos: `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`.

## 9. Criterio de salida

- Decisión humana registrada (D-C01…D-C17 APPROVED) en `DECISION_LOG.md` y
  `F1C_HUMAN_ARCHITECTURE_REVIEW.md`.
- Casos CA-1…CA-43 diseñados y trazables a decisiones D-C01…D-C17.
- Línea base de `npm run validate` y `db:*` documentada (a ejecutar en 1C.2+).

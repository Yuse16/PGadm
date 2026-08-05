# F1C — Kickoff Contract: Catálogo Maestro de Productos
## Estado: decisiones de arquitectura BLOQUEADAS (1C.1 completado)

**Fecha:** 2026-08-04
**Base:** `develop` `0674e9f` (merge PR #8, cierre documental 1B.3)
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\catalog-product-master`
**Estado:** 1C.1 (cierre y bloqueo de decisiones arquitectónicas) **COMPLETADO** tras
revisión humana. Decisiones D-C01…D-C17 **APPROVED** (ver `F1C_HUMAN_ARCHITECTURE_REVIEW.md`
y `DECISION_LOG.md`). Pendiente: subfase 1C.2 (migración 008) — **no iniciada**.

---

## 1. Principio rector

El **catálogo maestro de productos** debe existir antes de implementar inventario,
existencias, movimientos, transferencias, ventas, compras, cotizaciones o
proveedores. Todos esos módulos deben poder referenciar **el mismo producto
exacto** (`docs/packs/17-roadmap/12_EPIC_PRODUCT_CATALOG.md`).

## 2. Objetivo de la fase

Diseñar y preparar la base de datos, el dominio y la administración del catálogo
maestro que posteriormente alimentará inventario, almacenes, transferencias,
cotizaciones, ventas, compras, proveedores, reportes e integración futura con
Intelisis.

**Qué pertenece a 1C:**

1. Categorías y subcategorías (jerárquicas, por organización, máx. 3 niveles).
2. Marcas (por organización).
3. Unidades de medida (base vs. venta, por organización; `kind` en
   `count`/`length`/`area`/`volume`/`mass`/`package`).
4. Líneas de producto (referencia, por organización).
5. Productos (entidad base; se crea `inactive`).
6. Variantes o presentaciones (tabla separada; toda presentación vendible con
   SKU/barcode distinto es una variante).
7. SKU interno (en la variante).
8. Código de barras (múltiples por variante; 1 primario por variante).
9. Código/ID externo de Intelisis (`external_id`, normalizado, case-insensitive,
   único por organización).
10. Descripción comercial (obligatoria).
11. Descripción técnica (opcional).
12. Estado `active` / `inactive` / `discontinued` (sin borrado físico).
13. Impuestos (solo modelado de la referencia fiscal; sin motor tributario).
14. Precio de **referencia** único `numeric(14,4)` por variante asociado a
    `sale_unit_id`; **sin** listas de precios.
15. Alcance por organización (multitenencia estricta, RLS deny-by-default).
16. Auditoría de cambios de catálogo (append-only, `_audit`).
17. Permisos `catalog.read / create / update / archive / manage`.

**Qué NO pertenece a 1C (diferido):**

- Listas de precios / precios por sucursal.
- Imágenes y fichas técnicas (Storage).
- Sustitutos / productos relacionados.
- Visibilidad por sucursal.
- Proveedores y vínculo producto–proveedor.
- Sync real con Intelisis.
- UI administrativa completa (slice UI diferido).
- Inventario, ventas, compras, CRM, IA.

## 3. Restricciones de la fase

- No trabajar directamente sobre `develop`.
- No reutilizar el worktree de `identity-rbac-rls`.
- No eliminar ramas anteriores.
- No crear migraciones todavía (se creará en la subfase 1C.2; la migración 008
  **no está iniciada**).
- No modificar código funcional existente.
- No implementar UI todavía.
- No hacer merge.
- No abrir PR.
- No usar `service_role` en código cliente (blindado por `feature-security`).
- Mantener arquitectura `domain/application/infrastructure`.
- Mantener multiorganización, multisucursal, RLS y deny-by-default.
- Mantener repositorio demo y repositorio Supabase **sin fallback silencioso**
  (patrón `ORGANIZATION_DATA_SOURCE`, D031/D32).
- **No cambiar las 7 entidades principales** salvo los ajustes aprobados en la
  revisión humana (ver sección 6 y `F1C_HUMAN_ARCHITECTURE_REVIEW.md`).

## 4. Decisiones aprobadas (D-C01 … D-C17)

| ID | Decisión | Estado |
|----|----------|--------|
| D-C01 | Categorías jerárquicas máx. 3 niveles; la base impide profundidad >3, self-parent y ciclos (`_catalog.enforce_category_tree()`) | **APPROVED** |
| D-C02 | `products` y `product_variants` separados | **APPROVED** |
| D-C03 | SKU en `product_variants`; toda presentación vendible con SKU/barcode distinto es una variante | **APPROVED** |
| D-C04 | Múltiples barcodes por variante; 1 primario por variante; sin primario a nivel producto | **APPROVED** |
| D-C05 | `base_unit_id` / `sale_unit_id` separados; factor `base_units_per_sale_unit numeric CHECK (>0)` | **APPROVED** |
| D-C06 | Precio de referencia único `reference_price numeric(14,4)` asociado a `sale_unit_id`; listas de precios diferidas | **APPROVED** |
| D-C07 | Catálogo por organización (todas las tablas org-scoped) | **APPROVED** |
| D-C08 | Cruces entre orgs impedidos: RLS `current_organization_ids()` + FK compuestas + `UNIQUE(organization_id, id)` en tablas padre | **APPROVED** |
| D-C09 | Permisos `catalog.read/create/update/archive/manage`; `archive` independiente; `manage` administrativo sin sustituir a los demás | **APPROVED** |
| D-C10 | Auditoría append-only `_audit.catalog_events` (1C.5) | **APPROVED** |
| D-C11 | `external_id` normalizado case-insensitive y único por org; sin sync real | **APPROVED** |
| D-C12 | Unicidades con índices funcionales `upper(trim(...))`; `CHECK trim(valor) <> ''` en códigos/SKU/barcode/nombres/descripciones obligatorias | **APPROVED** |
| D-C13 | Producto se crea `inactive`; activo requiere ≥1 variante activa; no se desactiva/descontinúa la última variante activa con producto activo | **APPROVED** |
| D-C14 | `status='discontinued'` conserva fila; sin DELETE físico | **APPROVED** |
| D-C15 | Visibilidad por sucursal diferida | **APPROVED** |
| D-C16 | Sustitutos diferidos | **APPROVED** |
| D-C17 | Imágenes/fichas (Storage) diferidas | **APPROVED** |

Detalle y justificación en `F1C_SCOPE_MATRIX.md`, `F1C_DATA_MODEL_PROPOSAL.md` y
`F1C_HUMAN_ARCHITECTURE_REVIEW.md`.

## 5. Criterios de éxito

1. La base de datos impide duplicados de SKU, barcode y `external_id` por organización
   (índices funcionales case-insensitive + `CHECK trim()`).
2. La base impide profundidad >3, self-parent y ciclos de categorías
   (`_catalog.enforce_category_tree()`).
3. Un producto `active` requiere ≥1 variante `active`; no puede desactivarse o
   descontinuarse la última variante activa con producto activo.
4. Un usuario de la Org A **no puede** leer ni escribir productos de la Org B (RLS).
5. Los permisos `catalog.*` controlan cada operación (deny-by-default); `catalog.update`
   **no puede** marcar `discontinued` (trigger de transición / RPC controlada, nunca
   solo validación frontend).
6. Ningún componente de cliente referencia `service_role`.
7. Los módulos futuros (inventario, ventas, compras) pueden referenciar el mismo
   producto exacto mediante `product_id`/`variant_id` org-scoped.
8. Todos los gates: lint, typecheck, vitest, build, `db:reset`, `db:test`,
   `db:lint`, `db:verify`, `e2e:auth`, `e2e:identity` y los nuevos de 1C.

## 6. Próximo paso

Ejecutar la subfase **1C.2** (migración `00000000000008_product_master.sql` + seed
+ verificación DB) según `F1C_IMPLEMENTATION_SLICES.md`, respetando el modelo final
congelado en `F1C_DATA_MODEL_PROPOSAL.md` y las políticas de
`F1C_RLS_PERMISSION_MATRIX.md`. La migración 008 **no se inicia** hasta instrucción
expresa.

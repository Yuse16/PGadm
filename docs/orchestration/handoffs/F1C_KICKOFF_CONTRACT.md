# F1C — Kickoff Contract: Catálogo Maestro de Productos
## Planificación — sin implementación funcional

**Fecha:** 2026-08-04
**Base:** `develop` `0674e9f` (merge PR #8, cierre documental 1B.3)
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\catalog-product-master`
**Estado:** Descubrimiento controlado (solo documentación). Pendiente de revisión humana de arquitectura y alcance.

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

1. Categorías y subcategorías (jerárquicas, por organización).
2. Marcas (por organización).
3. Unidades de medida (base vs. venta, por organización).
4. Líneas de producto (referencia, por organización).
5. Productos (entidad base).
6. Variantes o presentaciones (tabla separada).
7. SKU interno (en la variante).
8. Código de barras (múltiples por variante).
9. Código/ID externo de Intelisis (`external_id`, único por organización).
10. Descripción comercial (obligatoria).
11. Descripción técnica (opcional).
12. Estado `active` / `inactive` / `discontinued` (sin borrado físico).
13. Impuestos (solo modelado de la referencia fiscal; sin motor tributario).
14. Precios de **referencia** (unitario/caja/m²) como dato; **sin** listas de precios.
15. Alcance por organización (multitenencia estricta, RLS deny-by-default).
16. Auditoría de cambios de catálogo (append-only, `_audit`).
17. Permisos `catalog.read / create / update / archive / manage`.

**Fuera de alcance inicial (diferido, NO se modela en 1C):**

- Existencias, costo promedio, lotes, series, ubicaciones físicas.
- Entradas/salidas, transferencias, pedidos, ventas, compras.
- Clientes, proveedores (y `supplier_id` en producto).
- Sincronización real con Intelisis (lectura/escritura).
- Carga masiva definitiva e importación.
- IA.
- Visibilidad por sucursal (catálogo org-wide en 1C).
- Sustitutos/productos relacionados.
- Imágenes y fichas técnicas físicas (Supabase Storage).
- Motor de listas de precios / precios por sucursal.
- Tabla general de conversiones de unidades (solo factor único por variante).

## 3. Restricciones de la fase

- No trabajar directamente sobre `develop`.
- No reutilizar el worktree de `identity-rbac-rls`.
- No eliminar ramas anteriores.
- No crear migraciones todavía (se propondrá en la subfase 1C.2).
- No modificar código funcional existente.
- No implementar UI todavía (subfase 1C.4).
- No hacer merge.
- No usar `service_role` en código cliente (blindado por `feature-security`).
- Mantener arquitectura `domain/application/infrastructure`.
- Mantener multiorganización, multisucursal, RLS y deny-by-default.
- Mantener repositorio demo y repositorio Supabase **sin fallback silencioso**
  (patrón `ORGANIZATION_DATA_SOURCE`, D031/D32).

## 4. Decisiones propuestas (resumen)

| ID | Decisión | Recomendación |
|----|----------|---------------|
| D-C01 | Categoría jerárquica o plana | **Jerárquica** (auto-referencia `parent_id`, máx. 3 niveles) |
| D-C02 | Producto y variante | **Tablas separadas** `products` + `product_variants` |
| D-C03 | SKU | **Pertenece a la variante** (el producto base no tiene SKU) |
| D-C04 | Códigos de barras | **Múltiples por variante** (`product_barcodes`) |
| D-C05 | Unidad base vs. venta | **Separadas** (`base_unit_id`, `sale_unit_id` + factor) |
| D-C06 | Precio | **Referencia** en la variante; **listas de precios diferidas** |
| D-C07 | Global vs. organización | **Por organización** (todo el catálogo, incl. catálogos de referencia) |
| D-C08 | Cruces entre orgs | **RLS** `_access.current_organization_ids()` + **FK compuestas** |
| D-C09 | Permisos nuevos | `catalog.read/create/update/archive/manage`, deny-by-default |
| D-C10 | Auditoría | Mutaciones de catálogo en `_audit` (append-only) en 1C.5 |
| D-C11 | Intelisis | `external_id` único por org; regla "no descripción como ID"; sin sync real |
| D-C12 | Duplicados | Unicidades funcionales case-insensitive (SKU/barcode); `external_id` único por org |
| D-C13 | Obligatorios | Definidos por tabla (ver `F1C_DATA_MODEL_PROPOSAL`) |
| D-C14 | Descontinuados | Estado `discontinued` conservando filas; nunca borrado físico |
| D-C15 | Visibilidad sucursal | Diferida (catálogo visible a todas las sucursales de la org) |
| D-C16 | Sustitutos | Diferidos a fase comercial |
| D-C17 | Imágenes/fichas | Diferidas (dependen de Storage) |

Detalle y justificación en `F1C_SCOPE_MATRIX.md`.

## 5. Criterios de éxito

1. La base de datos impide duplicados de SKU, barcode y `external_id` por organización.
2. Un usuario de la Org A **no puede** leer ni escribir productos de la Org B (RLS).
3. Los permisos `catalog.*` controlan cada operación (deny-by-default).
4. Ningún componente de cliente referencia `service_role`.
5. Los módulos futuros (inventario, ventas, compras) pueden referenciar el mismo
   producto exacto mediante `product_id`/`variant_id` org-scoped.
6. Todos los gates: lint, typecheck, vitest, build, `db:reset`, `db:test`,
   `db:lint`, `db:verify`, `e2e:auth`, `e2e:identity` y los nuevos de 1C.

## 6. Próximo paso

Revisión humana de Arquitectura, Base de datos, Backend, Frontend/UX, Seguridad y QA
sobre estos entregables documentales antes de aprobar la subfase 1C.2 (migración).

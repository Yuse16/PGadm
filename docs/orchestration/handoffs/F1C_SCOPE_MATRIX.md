# F1C — Scope Matrix: Catálogo Maestro de Productos
## Estado: decisiones de arquitectura BLOQUEADAS (1C.1 completado)

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`

Matriz de los 18 puntos de estudio obligatorios: qué pertenece a 1C y qué se difiere.
Todos los puntos con estado **APPROVED** (revisión humana 2026-08-04).

Leyenda: **1C** = se modela/implementa en 1C · **DIF** = diferido (con nota) · **DISEÑO** = solo diseño, sin tabla.

| # | Punto de estudio | Decisión | Alcance | Justificación |
|---|------------------|----------|---------|---------------|
| 1 | Categorías y subcategorías | Jerárquicas (auto-referencia, máx. 3 niveles) | **1C** | `product_categories.parent_id`; la base impide profundidad >3, self-parent y ciclos vía `_catalog.enforce_category_tree()` |
| 2 | Marcas | Tabla plana por organización | **1C** | `product_brands`; administradas solo con `catalog.manage` |
| 3 | Unidades de medida | Base y venta separadas; `kind` dimensional | **1C** | `units_of_measure.kind` ∈ `count`/`length`/`area`/`volume`/`mass`/`package`; factor `base_units_per_sale_unit` por variante; **tabla general de conversiones DIFERIDA** |
| 4 | Productos | Tabla `products` (entidad base) | **1C** | Comparte marca/categoría/línea/ficha; sin SKU; se crea `inactive` |
| 5 | Variantes o presentaciones | Tabla separada `product_variants` | **1C** | Toda presentación vendible con SKU/barcode distinto es una variante; stock futuro será por variante y almacén |
| 6 | SKU interno | Pertenece a la variante | **1C** | `product_variants.sku` único por org (case-insensitive, `upper(trim(sku))`) |
| 7 | Código de barras | Múltiples por variante | **1C** | `product_barcodes` (varios códigos, 1 primario por variante; sin primario a nivel producto); único por org |
| 8 | Código/ID externo Intelisis | `external_id` en producto, normalizado | **1C** | Único por organización case-insensitive; regla "no descripción como identificador" (`20-int/27`); sync real **DIF** |
| 9 | Descripción comercial | Obligatoria | **1C** | `products.description` NOT NULL + `CHECK trim(description) <> ''` |
| 10 | Descripción técnica | Opcional | **1C** | `products.technical_description` nullable |
| 11 | Estado activo/inactivo/descontinuado | Enum en tabla | **1C** | `status in ('active','inactive','discontinued')`; sin borrado físico; producto se crea `inactive` |
| 12 | Impuestos | Solo referencia fiscal | **DISEÑO** | `tax_rate`/`tax_profile_id` diferidos hasta fase fiscal; se documenta en el modelo |
| 13 | Precio base o separación futura | Precio de **referencia** único por variante | **1C** | `reference_price numeric(14,4)` asociado a `sale_unit_id` (sustituye unit/box/m²); **listas de precios/precios por sucursal DIFERIDAS** |
| 14 | Imágenes y documentos técnicos | Diferidos (Storage) | **DIF** | Requiere Supabase Storage (deshabilitado); solo diseño de `product_assets` |
| 15 | Sustitutos o relacionados | Diferidos | **DIF** | `product_relations` diferida a fase comercial |
| 16 | Alcance por organización | Todo org-scoped | **1C** | `organization_id` en todas las tablas; RLS deny-by-default |
| 17 | Visibilidad por sucursal | Org-wide en 1C | **DIF** | `product_branch_visibility` diferida; en 1C el catálogo es visible a todas las sucursales de la org (`10-arch/07`) |
| 18 | Auditoría de cambios | Append-only en `_audit` | **1C** | `_audit.catalog_events` en subfase 1C.5 (create/update/archive de catálogo) |

---

## Decisiones explícitas (D-C01 … D-C17) — todas APPROVED

Detalle por decisión en `F1C_KICKOFF_CONTRACT.md`, `F1C_DATA_MODEL_PROPOSAL.md` y
`F1C_HUMAN_ARCHITECTURE_REVIEW.md`. Resumen de tensiones resueltas:

- **Jerárquico vs. plano (D-C01):** jerárquico con límite de 3 niveles. La base lo
  garantiza: trigger `_catalog.enforce_category_tree()` (SECURITY INVOKER,
  `search_path=''`) rechaza self-parent, ciclos y profundidad >3. Lógica de
  catálogo en esquema `_catalog`, no en `_access`.
- **Producto/variante (D-C02):** separados. El modelo plano de `10-arch/14` mezclaba
  presentación y producto; inventario y ventas futuras consumen presentaciones.
- **SKU (D-C03):** en la variante. Toda presentación vendible con SKU/barcode
  distinto es una variante (regla de negocio aprobada).
- **Barcodes (D-C04):** múltiples por variante, 1 primario por variante; **no existe**
  barcode primario a nivel producto.
- **Unidades (D-C05):** base vs. venta con factor único `base_units_per_sale_unit
  numeric CHECK (>0)` (renombrado desde `pieces_per_sale_unit`). La tabla de
  conversiones generales se difiere para no sobremodelar.
- **Precios (D-C06):** **una sola columna** `reference_price numeric(14,4)` asociada
  a `sale_unit_id` (dato, no regla de negocio); precios efectivos, listas y precios
  por sucursal en fase comercial.
- **Global vs. org (D-C07):** org-scoped en todas las tablas de 1C. La vía global
  compartida se descarta en 1C por simplicidad RLS y aislamiento.
- **Cruces (D-C08):** RLS `using (organization_id = any(_access.current_organization_ids()))`
  + FK compuestas `(organization_id, id)` + **`UNIQUE(organization_id, id)`** en todas
  las tablas padre destino de FK compuesta. Imposible referenciar un producto de otra
  organización.
- **Permisos (D-C09):** `catalog.read/create/update/archive/manage` (ver matriz RLS).
  `catalog.archive` permanece **independiente** de `catalog.update`; `catalog.manage`
  es administrativo y **no sustituye silenciosamente** a los demás permisos.
- **Auditoría (D-C10):** `_audit.catalog_events` en 1C.5; append-only; actor
  `_access.current_user_id()`.
- **Intelisis (D-C11):** `external_id` único por org y normalizado case-insensitive
  (`upper(trim(...))`); matching por código exacto → referencia externa confirmada →
  manual (`20-int/28`). Sin sync en 1C.
- **Duplicados (D-C12):** índices únicos funcionales `(organization_id, upper(trim(code)))`,
  `(organization_id, upper(trim(sku)))` y equivalentes; `CHECK trim(valor) <> ''` en
  códigos, SKU, barcode, nombres y descripciones obligatorias.
- **Obligatorios (D-C13):** ver modelo de datos (sección "Obligatoriedad"). Además:
  producto se crea `inactive`; activo requiere ≥1 variante activa; no puede
  desactivarse/descontinuarse la última variante activa con producto activo.
- **Descontinuados (D-C14):** `status='discontinued'` conserva la fila; las
  referencias históricas siguen válidas; `catalog.archive` controla la transición a
  `discontinued` y `catalog.manage` la restauración controlada. Sin DELETE físico.
- **Sucursal (D-C15):** diferida. En 1C no hay tabla de visibilidad por sucursal.
- **Sustitutos (D-C16):** diferidos.
- **Imágenes/fichas (D-C17):** diferidas (Storage).

## Correcciones estructurales obligatorias (aprobadas)

1. `UNIQUE (organization_id, id)` en todas las tablas padre destino de FK compuesta
   (`product_categories`, `product_brands`, `units_of_measure`, `product_lines`,
   `products`, `product_variants`).
2. Unicidades case-insensitive mediante índices funcionales `upper(trim(...))`.
3. `CHECK trim(valor) <> ''` en códigos, SKU, barcode, nombres y descripciones
   obligatorias.
4. `external_id` normalizado case-insensitive por org.
5. FK compuestas para impedir cruces entre organizaciones.
6. RLS deny-by-default mantenida.
7. `catalog.update` **no** puede ejecutar `archive`: trigger de transición de estado
   o RPC controlada en la base; **nunca** solo validación frontend (ver
   `F1C_RLS_PERMISSION_MATRIX.md` §4).

## Reglas de consistencia heredadas de fases previas

- Ningún fallback silencioso demo→supabase (D031).
- No `service_role` en cliente (blindado por tests).
- `security definer` solo con whitelist y `SET search_path=''` (D15). El trigger de
  catálogo es `SECURITY INVOKER` (decisión humana 1C).
- Prefijos de permisos `catalog.*` alineados con la convención `{dominio}.{accion}`.

## Anexo operativo — Comercialización agosto 2026

- **Promociones, descuentos temporales, colores de etiquetas, incentivos y reglas de
  Outlet permanecen FUERA de 1C** (no son columnas de `products`/`product_variants`).
- 1C solo provee las referencias maestras (`product_id`, `variant_id`, categoría/familia,
  marca, formato, unidades, SKU, barcode, `external_id`, estado) para aplicarlas después.
- Matriz de requisitos, entidades futuras propuestas y riesgos:
  `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`.

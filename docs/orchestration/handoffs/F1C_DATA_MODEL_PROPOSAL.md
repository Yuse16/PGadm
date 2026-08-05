# F1C — Modelo de Datos FINAL (Catálogo Maestro de Productos)
## Estado: decisiones de arquitectura BLOQUEADAS (1C.1 completado)

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Estado:** Modelo **congelado** tras revisión humana (D-C01…D-C17 APPROVED).
La migración `00000000000008_product_master.sql` se creará en la subfase 1C.2 — **no iniciada**.

---

## 1. Convenciones aplicadas

- PK: `uuid` default `gen_random_uuid()` (patrón 1B.1).
- Timestamps: `timestamptz` + trigger `_core.updated_at()` (patrón 1B.1).
- `organization_id uuid` en **todas** las tablas, FK → `organizations(id)`.
- **`UNIQUE (organization_id, id)`** en todas las tablas padre destino de FK compuesta
  (corrección estructural aprobada; el PK ya garantiza unicidad, se hace explícito).
- FK compuestas `(organization_id, parent_id)` → `(organization_id, id)`: impide que
  una entidad hija referencie entidades de **otra organización**.
- Unicidades case-insensitive con **índices funcionales** `upper(trim(...))`.
- `CHECK trim(valor) <> ''` en códigos, SKU, barcode, nombres y descripciones
  obligatorias.
- `status` con `CHECK`; **sin DELETE físico** (soft state, no `deleted_at`).
- Lógica de catálogo en esquema **`_catalog`** (funciones `SECURITY INVOKER`,
  `SET search_path=''`). No se usa `_access` para lógica de catálogo.
- Sin `SECURITY DEFINER` salvo whitelist justificada (D15).

## 2. Tablas de 1C (migración propuesta `00000000000008_product_master.sql`)

### 2.1 `product_categories` (jerárquicas, máx. 3 niveles)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | ancla de scoping |
| `parent_id` | uuid | NULL; FK compuesta `(organization_id, parent_id)` → `(organization_id, id)` | jerarquía (nivel 1 sin padre) |
| `code` | text | NOT NULL `CHECK (trim(code) <> '')` | |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` | |
| `status` | text | NOT NULL DEFAULT `'active'` `CHECK (active/inactive)` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(code)))`.
- `INDEX (organization_id, parent_id)`.
- **Trigger `_catalog.enforce_category_tree()`** (`BEFORE INSERT OR UPDATE OF parent_id`,
  `SECURITY INVOKER`, `search_path=''`): rechaza **self-parent**, **ciclos** y
  **profundidad >3**. La base impide estos casos; no solo la aplicación.

### 2.2 `product_brands`

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `code` | text | NOT NULL `CHECK (trim(code) <> '')` |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` |
| `status` | text | NOT NULL DEFAULT `'active'` `CHECK (active/inactive)` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(code)))`.

### 2.3 `units_of_measure`

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `code` | text | NOT NULL `CHECK (trim(code) <> '')` |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` |
| `kind` | text | NOT NULL `CHECK (count/length/area/volume/mass/package)` |
| `status` | text | NOT NULL DEFAULT `'active'` `CHECK (active/inactive)` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(code)))`.
- `kind` = dimensión real: `count`, `length`, `area`, `volume`, `mass`, `package`
  (decisión aprobada; sustituye a `piece/box/bulk/set/pallet/area`).
- Unidades semilla por org (cubren los 6 kinds): `pieza` (count), `caja` (package),
  `bulto` (package), `tarima` (package), `m` (length), `m²` (area), `litro` (volume),
  `kilogramo` (mass).

### 2.4 `product_lines` (referencia Intelisis)

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `external_id` | text | NULL; `CHECK (external_id IS NULL OR trim(external_id) <> '')` |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` |
| `status` | text | NOT NULL DEFAULT `'active'` `CHECK (active/inactive)` |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(external_id)))` parcial `WHERE external_id IS NOT NULL`
  (`external_id` normalizado case-insensitive por org).

### 2.5 `products`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `external_id` | text | NULL; `CHECK (external_id IS NULL OR trim(external_id) <> '')` | código externo Intelisis |
| `description` | text | NOT NULL `CHECK (trim(description) <> '')` | descripción comercial |
| `short_name` | text | NULL; `CHECK (short_name IS NULL OR trim(short_name) <> '')` | |
| `brand_id` | uuid | NULL; FK compuesta → product_brands | |
| `category_id` | uuid | NULL; FK compuesta → product_categories | |
| `line_id` | uuid | NULL; FK compuesta → product_lines | |
| `technical_description` | text | NULL | |
| `status` | text | **NOT NULL DEFAULT `'inactive'`** `CHECK (active/inactive/discontinued)` | se crea inactivo (D-C13) |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(external_id)))` parcial `WHERE external_id IS NOT NULL`.
- `INDEX (organization_id, category_id)`, `INDEX (organization_id, brand_id)`,
  `INDEX (organization_id, line_id)`.
- **Regla de integridad:** producto `active` requiere ≥1 variante `active`
  (trigger `_catalog.enforce_product_active_variant`).
- `supplier_id` **diferido** (fase proveedores).

### 2.6 `product_variants`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `product_id` | uuid | NOT NULL; FK compuesta → products | |
| `sku` | text | NOT NULL `CHECK (trim(sku) <> '')` | SKU interno |
| `display_name` | text | NULL; `CHECK (display_name IS NULL OR trim(display_name) <> '')` | default = producto.description |
| `format` | text | NULL | (10-arch/14) |
| `finish` | text | NULL | (10-arch/14) |
| `base_unit_id` | uuid | NOT NULL; FK compuesta → units_of_measure | unidad base |
| `sale_unit_id` | uuid | NOT NULL; FK compuesta → units_of_measure | unidad de venta |
| `base_units_per_sale_unit` | numeric | NOT NULL DEFAULT 1 `CHECK (> 0)` | renombrado de `pieces_per_sale_unit` (D-C05) |
| `pieces_per_box` | numeric | NULL `CHECK (> 0)` | dato comercial |
| `square_meters_per_box` | numeric | NULL `CHECK (> 0)` | pisos/recubrimientos |
| `reference_price` | numeric(14,4) | NULL `CHECK (>= 0)` | **única columna** de precio de referencia, asociada a `sale_unit_id` (D-C06) |
| `status` | text | NOT NULL DEFAULT `'active'` `CHECK (active/inactive/discontinued)` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(sku)))`.
- `INDEX (organization_id, product_id)`.
- `CHECK (base_unit_id <> sale_unit_id)` **NO** se aplica (pueden coincidir).
- **Regla de integridad:** no puede desactivarse/descontinuarse la **última variante
  activa** mientras el producto permanezca `active` (trigger
  `_catalog.enforce_last_active_variant`).
- `reference_price` es dato de referencia (no regla de negocio); al cambiar
  `sale_unit_id` el precio debe revisarse. Listas de precios/precios por sucursal: diferidos.

### 2.7 `product_barcodes`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `variant_id` | uuid | NOT NULL; FK compuesta → product_variants | |
| `barcode` | text | NOT NULL `CHECK (trim(barcode) <> '')` | |
| `is_primary` | boolean | NOT NULL DEFAULT false | 1 primario por variante |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, upper(trim(barcode)))`.
- `UNIQUE (organization_id, variant_id)` parcial `WHERE is_primary`.
- **No existe** columna primaria a nivel `products` (D-C04/8).

## 3. Integridad de ciclo de vida (triggers `_catalog`, SECURITY INVOKER, `search_path=''`)

| Trigger | Tabla | Regla |
|---------|-------|-------|
| `_catalog.enforce_category_tree()` | `product_categories` (`BEFORE INSERT OR UPDATE OF parent_id`) | Rechaza self-parent, ciclos y profundidad >3 |
| `_catalog.enforce_product_active_variant()` | `products` (`BEFORE UPDATE OF status`) | `active` exige ≥1 variante `active` |
| `_catalog.enforce_last_active_variant()` | `product_variants` (`BEFORE UPDATE OF status`) | No se puede retirar la última variante activa con producto `active` |
| `_catalog.enforce_status_transition()` | `products` y `product_variants` (`BEFORE UPDATE OF status`) | Transiciones con permiso: `active↔inactive` requiere `catalog.update`; `→discontinued` requiere `catalog.archive`; restaurar `discontinued` requiere `catalog.manage` |

Estos triggers garantizan que **la base impide** estados inválidos e impiden que
`catalog.update` ejecute `archive` (ver `F1C_RLS_PERMISSION_MATRIX.md` §4). La
validación nunca depende solo del frontend.

## 4. Tablas diferidas (solo diseño, fuera de 1C)

| Tabla | Detalle | Fase |
|-------|---------|------|
| `product_assets` | `(product_id, asset_type image/technical_sheet, storage_path, is_primary)` | Requiere Storage (D-C17) |
| `product_relations` | sustitutos/relacionados `(product_id, related_product_id, relation_type)` | Comercial (D-C16) |
| `product_branch_visibility` | visibilidad por sucursal | Inventario/ventas (D-C15) |
| `product_units_conversion` | factores generales entre unidades | Inventario (D-C05) |
| `tax_profiles` / `tax_rate` | referencia fiscal | Fase fiscal (impuestos) |
| `price_lists` / `product_prices` | listas de precios efectivas, por sucursal | Comercial (D-C06) |
| `suppliers` + `product_suppliers` | proveedores y su producto | Proveedores |
| `commercial_campaigns`/`promotion_rules`/etc. | campañas, promociones, etiquetas, outlet, incentivos | Comercial (ver `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`) |

## 5. Obligatoriedad (D-C13)

| Entidad | Obligatorios | Opcionales |
|---------|--------------|------------|
| `product_categories` | `organization_id`, `code`, `name`, `status` | `parent_id` |
| `product_brands` | `organization_id`, `code`, `name`, `status` | — |
| `units_of_measure` | `organization_id`, `code`, `name`, `kind`, `status` | — |
| `product_lines` | `organization_id`, `name`, `status` | `external_id` |
| `products` | `organization_id`, `description`, `status` (default `inactive`) | `external_id`, `short_name`, `brand_id`, `category_id`, `line_id`, `technical_description` |
| `product_variants` | `organization_id`, `product_id`, `sku`, `base_unit_id`, `sale_unit_id`, `base_units_per_sale_unit`, `status` | `display_name`, `format`, `finish`, `pieces_per_box`, `square_meters_per_box`, `reference_price` |
| `product_barcodes` | `organization_id`, `variant_id`, `barcode`, `is_primary` | — |

Reglas de ciclo de vida:
- Producto se crea **`inactive`**; para activarlo necesita ≥1 variante `active`.
- Un producto `active` no puede quedarse sin variantes activas.
- La baja lógica (`inactive`/`discontinued`) conserva filas; **no existe DELETE físico**.

## 6. Compatibilidad Intelisis (D-C11)

- `products.external_id` es el identificador oficial de Intelisis, **único por org**,
  normalizado case-insensitive (`upper(trim(...))`).
- Matching futuro (`20-int/28`): código exacto → referencia externa confirmada →
  código alterno aprobado → manual. 1C habilita la 1ª y 2ª vía (external_id y barcodes).
- Nunca se usa la descripción como identificador (`20-int/27`).
- Sin escritura en SQL de Intelisis, sin credenciales, sin sync (`10-arch/30`).

## 7. Anexo operativo — Comercialización agosto 2026

El catálogo 1C **no** modela campañas, descuentos temporales, colores de etiquetas,
incentivos, precios mensuales ni reglas de Outlet como columnas permanentes de
`products`/`product_variants` (ver `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`).
1C solo provee las referencias maestras (`product_id`, `variant_id`, categoría/familia,
marca, formato, unidades, SKU, barcode, `external_id`, estado) sobre las que esas
campañas se aplicarán posteriormente.

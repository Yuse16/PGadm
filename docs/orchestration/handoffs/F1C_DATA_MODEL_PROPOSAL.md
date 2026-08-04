# F1C — Propuesta de Modelo de Datos (Catálogo Maestro de Productos)
## Planificación — sin migración todavía

**Fecha:** 2026-08-04
**Rama:** `feature/f1c-PG-CATALOG-004-product-master`
**Estado:** Propuesta para revisión humana. La migración se creará en la subfase 1C.2.

---

## 1. Convenciones aplicadas

- PK: `uuid` default `gen_random_uuid()` (patrón 1B.1).
- Timestamps: `timestamptz` + trigger `_core.updated_at()` (patrón 1B.1).
- `organization_id uuid` en **todas** las tablas, FK → `organizations(id)`.
- FK compuestas `(organization_id, parent_id)` → `(organization_id, id)` para
  garantizar que una entidad hija solo referencie entidades de **su misma organización**
  (patrón 1B.2 D03, `user_role_assignments_membership_fk`).
- `status` con `CHECK`; sin borrado físico (soft state, no `deleted_at`).
- Sin `SECURITY DEFINER` salvo whitelist justificada (D15).

## 2. Tablas de 1C (migración propuesta `00000000000008_product_master.sql`)

### 2.1 `product_categories` (jerárquicas, máx. 3 niveles)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | ancla de scoping |
| `parent_id` | uuid | NULL; FK compuesta `(organization_id, parent_id)` → `(organization_id, id)` | jerarquía (nivel 1 sin padre) |
| `code` | text | NOT NULL | |
| `name` | text | NOT NULL | |
| `status` | text | NOT NULL CHECK (`active`/`inactive`) | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, upper(code))`.
- `INDEX (organization_id, parent_id)`.
- Profundidad ≤ 3: validada en aplicación (opcional: trigger `_access.enforce_category_depth`).

### 2.2 `product_brands`

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `code` | text | NOT NULL |
| `name` | text | NOT NULL |
| `status` | text | NOT NULL CHECK (`active`/`inactive`) |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, upper(code))`.

### 2.3 `units_of_measure`

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `code` | text | NOT NULL |
| `name` | text | NOT NULL |
| `kind` | text | NOT NULL CHECK (`piece`/`box`/`bulk`/`set`/`package`/`pallet`/`area`) |
| `status` | text | NOT NULL CHECK (`active`/`inactive`) |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, upper(code))`.
- Unidades semilla por org: `pieza`, `caja`, `bulto`, `juego`, `paquete`, `tarima`, `m²`.

### 2.4 `product_lines` (referencia Intelisis)

| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations, NOT NULL |
| `external_id` | text | NULL (código de línea de Intelisis) |
| `name` | text | NOT NULL |
| `status` | text | NOT NULL CHECK (`active`/`inactive`) |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

- `UNIQUE (organization_id, external_id)` parcial `WHERE external_id IS NOT NULL`.
- Catálogo de referencia; la "línea actual" se actualiza desde Intelisis (05-inventory/08).

### 2.5 `products`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `external_id` | text | NULL | código externo Intelisis |
| `description` | text | NOT NULL | descripción comercial |
| `short_name` | text | NULL | |
| `brand_id` | uuid | NULL; FK compuesta → product_brands | |
| `category_id` | uuid | NULL; FK compuesta → product_categories | |
| `line_id` | uuid | NULL; FK compuesta → product_lines | |
| `technical_description` | text | NULL | descripción técnica |
| `status` | text | NOT NULL CHECK (`active`/`inactive`/`discontinued`) | descontinuado sin borrar |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, lower(external_id))` parcial `WHERE external_id IS NOT NULL`
  → evita duplicados de código Intelisis por org (10-arch/14 regla).
- `INDEX (organization_id, category_id)`, `INDEX (organization_id, brand_id)`.
- `supplier_id` **diferido** (proveedores fuera de alcance; `10-arch/14` lo listaba,
  se difiere con la fase de proveedores).

### 2.6 `product_variants`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `product_id` | uuid | NOT NULL; FK compuesta → products | |
| `sku` | text | NOT NULL | SKU interno |
| `display_name` | text | NULL | default = producto.description |
| `format` | text | NULL | (10-arch/14) |
| `finish` | text | NULL | (10-arch/14) |
| `base_unit_id` | uuid | NOT NULL; FK compuesta → units_of_measure | unidad base |
| `sale_unit_id` | uuid | NOT NULL; FK compuesta → units_of_measure | unidad de venta |
| `pieces_per_sale_unit` | numeric | NOT NULL DEFAULT 1 CHECK (> 0) | factor único (D-C05) |
| `pieces_per_box` | numeric | NULL CHECK (> 0) | dato comercial |
| `square_meters_per_box` | numeric | NULL CHECK (> 0) | pisos/recubrimientos |
| `reference_price_unit` | numeric(10,2) | NULL CHECK (>= 0) | precio de referencia |
| `reference_price_box` | numeric(10,2) | NULL CHECK (>= 0) | precio de referencia |
| `reference_price_square_meter` | numeric(10,2) | NULL CHECK (>= 0) | precio de referencia |
| `status` | text | NOT NULL CHECK (`active`/`inactive`/`discontinued`) | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, upper(sku))` → evita duplicados de SKU por org (case-insensitive).
- `INDEX (organization_id, product_id)`.
- `CHECK (base_unit_id <> sale_unit_id)` NO se aplica (pueden coincidir).

### 2.7 `product_barcodes`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `variant_id` | uuid | NOT NULL; FK compuesta → product_variants | |
| `barcode` | text | NOT NULL | |
| `is_primary` | boolean | NOT NULL DEFAULT false | 1 primario por variante |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, upper(barcode))` → evita duplicados por org.
- `UNIQUE (organization_id, variant_id)` parcial `WHERE is_primary`.

## 3. Tablas diferidas (solo diseño, fuera de 1C)

| Tabla | Detalle | Fase |
|-------|---------|------|
| `product_assets` | `(product_id, asset_type image/technical_sheet, storage_path, is_primary)` | Requiere Storage (D-C17) |
| `product_relations` | sustitutos/relacionados `(product_id, related_product_id, relation_type)` | Comercial (D-C16) |
| `product_branch_visibility` | visibilidad por sucursal | Inventario/ventas (D-C15) |
| `product_units_conversion` | factores generales entre unidades | Inventario (D-C05) |
| `tax_profiles` / `tax_rate` | referencia fiscal | Fase fiscal (impuestos) |
| `price_lists` / `product_prices` | listas de precios efectivas, por sucursal | Comercial (D-C06) |
| `suppliers` + `product_suppliers` | proveedores y su producto | Proveedores |

## 4. Obligatoriedad (D-C13)

| Entidad | Obligatorios | Opcionales |
|---------|--------------|------------|
| `product_categories` | `organization_id`, `code`, `name`, `status` | `parent_id` |
| `product_brands` | `organization_id`, `code`, `name`, `status` | — |
| `units_of_measure` | `organization_id`, `code`, `name`, `kind`, `status` | — |
| `product_lines` | `organization_id`, `name`, `status` | `external_id` |
| `products` | `organization_id`, `description`, `status` | `external_id`, `short_name`, `brand_id`, `category_id`, `line_id`, `technical_description` |
| `product_variants` | `organization_id`, `product_id`, `sku`, `base_unit_id`, `sale_unit_id`, `pieces_per_sale_unit`, `status` | `display_name`, `format`, `finish`, `pieces_per_box`, `square_meters_per_box`, `reference_price_*` |
| `product_barcodes` | `organization_id`, `variant_id`, `barcode`, `is_primary` | — |

Regla: un producto **activo** debe tener al menos una variante activa (validación en
aplicación; la unicidad de SKU/barcode/external_id es defensa en base de datos).

## 5. Compatibilidad Intelisis (D-C11)

- `products.external_id` es el identificador oficial de Intelisis, **único por org**.
- Matching futuro (`20-int/28`): código exacto → referencia externa confirmada →
  código alterno aprobado → manual. 1C habilita la 1ª y 2ª vía (external_id y barcodes).
- Nunca se usa la descripción como identificador (`20-int/27`).
- Sin escritura en SQL de Intelisis, sin credenciales, sin sync (`10-arch/30`).

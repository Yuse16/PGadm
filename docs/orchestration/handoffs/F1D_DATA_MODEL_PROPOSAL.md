# F1D — Modelo de Datos APROBADO (Inventario — Fase 2)
## Estado: APROBADO — D-I01…D-I14 aprobados por revisión humana (2026-08-06)

**Fecha:** 2026-08-06
**Rama:** `feature/f1d-PG-INVENTORY-005-inventory`
**Base:** `ee761b1` (HEAD 1C) — inventario referencia el catálogo maestro (1C) y los
almacenes (1B.2).

Modelo **candidato** derivado de los packs de inventario. **No es la migración**: la
migración (siguiente número libre de la secuencia) solo se creará tras aprobación
humana de este modelo y del kickoff.

---

## 1. Convenciones aplicadas (heredadas de 1B/1C)

- PK: `uuid` default `gen_random_uuid()` (patrón 1B.1).
- Timestamps: `timestamptz` + trigger `_core.updated_at()` (patrón 1B.1).
- `organization_id uuid` en **todas** las tablas, FK → `organizations(id)`.
- **`UNIQUE (organization_id, id)`** en tablas padre destino de FK compuesta.
- FK compuestas `(organization_id, parent_id)` → `(organization_id, id)`: impiden
  cruces entre organizaciones.
- `CHECK trim(valor) <> ''` en códigos/nombres obligatorios.
- Sin DELETE físico (snapshots y cambios son append-only; observaciones conservan fila).
- RLS deny-by-default reutilizando `_access` (004) y patrón 007.
- Nombres de tablas propuestos según `23-contracts/29_INVENTORY_SCHEMA.md`.

## 2. Tablas propuestas (candidato)

> Nota de nombres: `23-contracts/29_INVENTORY_SCHEMA.md` documenta
> `inventory_snapshot`, `inventory_snapshot_item`, `inventory_change`,
> `inventory_observation` (singular). La nomenclatura del repo usa plurales
> (`products`, `product_variants`). **Pregunta abierta (D-I01):** adoptar el nombre
> documentado singular vs. pluralizarlo para consistencia con el repo.

### 2.1 `inventory_snapshot` — fotografía lógica de una carga aprobada

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | ancla de scoping |
| `warehouse_id` | uuid | NOT NULL; FK compuesta `(organization_id, warehouse_id)` → `warehouses` | almacén de la carga (tienda o CEDIS) |
| `source` | text | NOT NULL `CHECK (source IN ('excel','cube','manual','intelisis'))` | fuente de la carga (D-I11) |
| `source_file` | text | NULL; `CHECK (source_file IS NULL OR trim(source_file) <> '')` | archivo origen |
| `report_date` | timestamptz | NOT NULL | **fecha exacta de la fuente** (regla `21-migration/21`) |
| `imported_at` | timestamptz | NOT NULL DEFAULT now() | |
| `imported_by` | uuid | NULL; FK → `profiles` | actor (D-I02) |
| `is_baseline` | boolean | NOT NULL DEFAULT false | línea base: primer snapshot aprobado (D-I05/`22_INVENTORY_BASELINE.md`) |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, warehouse_id, report_date desc)`.
- `UNIQUE (organization_id, warehouse_id, report_date, source)` parcial
  `WHERE NOT is_baseline` — evita cargas duplicadas de la misma fuente/fecha.

### 2.2 `inventory_snapshot_item` — producto por almacén dentro de un snapshot

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `snapshot_id` | uuid | NOT NULL; FK compuesta → `inventory_snapshot` | |
| `variant_id` | uuid | NOT NULL; FK compuesta → `product_variants` | referenció al producto exacto del catálogo 1C (D-I01/D-I14) |
| `quantity` | numeric | NOT NULL `CHECK (quantity >= 0)` | existencia reportada |
| `boxes` | numeric | NULL `CHECK (boxes >= 0)` | derivado solo con factores confirmados (D-I09) |
| `square_meters` | numeric | NULL `CHECK (square_meters >= 0)` | derivado solo con factores confirmados (D-I09) |
| `created_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, snapshot_id, variant_id)` — un item por variante por snapshot.
- `INDEX (organization_id, variant_id)` — historial por producto.

### 2.3 `inventory_change` — diferencia entre cargas (solo si cambió)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `variant_id` | uuid | NOT NULL; FK compuesta → `product_variants` | |
| `warehouse_id` | uuid | NOT NULL; FK compuesta → `warehouses` | |
| `previous_quantity` | numeric | NOT NULL `CHECK (>= 0)` | carga anterior |
| `new_quantity` | numeric | NOT NULL `CHECK (>= 0)` | carga nueva |
| `difference` | numeric | GENERATED ALWAYS AS (`new_quantity - previous_quantity`) STORED | |
| `change_type` | text | NOT NULL `CHECK (change_type IN ('increase','decrease','zeroed','recovered','new_product','missing_product'))` | tipos de `16_CHANGE_DETECTION.md` |
| `detected_at` | timestamptz | NOT NULL DEFAULT now() | |
| `source_snapshot_id` | uuid | NOT NULL; FK compuesta → `inventory_snapshot` | snapshot que generó el cambio |
| `created_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, source_snapshot_id, variant_id, warehouse_id)` — un cambio
  por variante/almacén por snapshot (idempotencia).
- `INDEX (organization_id, variant_id, detected_at desc)` — historial por producto.

> **Regla (D-I04):** `inventory_change` registra la diferencia, **nunca** la causa
> (venta/recepción/balanceo). Sin cubo de movimientos no se atribuye causa
> (`18_MOVEMENT_INFERENCE.md`).

### 2.4 `inventory_observation` — conteo/nota física (no altera stock oficial)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `variant_id` | uuid | NOT NULL; FK compuesta → `product_variants` | |
| `warehouse_id` | uuid | NOT NULL; FK compuesta → `warehouses` | |
| `observation_type` | text | NOT NULL `CHECK (observation_type IN ('physical_count','damaged','reserved','wrong_location','missing_label','difference'))` | tipos de `24_MANUAL_ADJUSTMENTS.md` |
| `observed_quantity` | numeric | NULL `CHECK (observed_quantity IS NULL OR observed_quantity >= 0)` | conteo observado |
| `note` | text | NULL; `CHECK (note IS NULL OR trim(note) <> '')` | comentario |
| `evidence_url` | text | NULL | evidencia (Storage diferido — D-C17; se registra el campo, no el archivo) |
| `created_by` | uuid | NOT NULL; FK → `profiles` | actor |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, variant_id, created_at desc)`.

> Las observaciones **nunca** mutan `quantity` del snapshot ni el valor oficial
> (D-I06, `02_SOURCE_PRIORITY.md`).

### 2.5 `import_template` (opcional, D-I07) — plantilla de mapeo por tipo de archivo

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` | nombre de plantilla |
| `sheet_name` | text | NOT NULL | hoja del archivo |
| `column_mapping` | jsonb | NOT NULL | mapeo columnas → campos requeridos/opcionales |
| `warehouse_rules` | jsonb | NULL | reglas de vinculación de almacenes |
| `status` | text | NOT NULL DEFAULT 'active' `CHECK (status IN ('active','inactive'))` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

## 3. Integridad y reglas clave (a reforzar en la base o en la capa de aplicación)

| Regla | Origen | Dónde se garantiza |
|-------|--------|--------------------|
| Snapshot conserva **fecha exacta de la fuente** | `21-migration/21_INVENTORY_INITIAL_LOAD.md` | columna `report_date` NOT NULL |
| Aprobar importación crea snapshot + eventos | `23-contracts/14` / `43` | use case `approveImport` → INSERT snapshot + items + audit (D-I02) |
| No calcular cambios antes de aprobar línea base | `21-migration/22_INVENTORY_BASELINE.md` | gate de use case (sin línea base no hay cambios) |
| Guardar **solo cambios**; historial no destructivo | `16_CHANGE_DETECTION.md`, `17_INVENTORY_HISTORY.md` | `inventory_change` append-only; sin DELETE |
| Producto ausente ≠ stock cero | `26_DUPLICATES_AND_MISSING.md` | `change_type='missing_product'`; UI muestra "ausente" |
| No sumar duplicados automáticamente | `26_DUPLICATES_AND_MISSING.md` | validación de importación reporta duplicados |
| Existencia reportada, no disponibilidad | `24-master-index/10` | `quantity` = reportada; UI etiqueta "Existencia reportada" |
| Tienda y CEDIS separados | `24-master-index/10` | `warehouse_id` por carga; UI separa por `warehouse_type` |

## 4. Tablas diferidas (solo diseño, fuera de 1D)

| Tabla | Detalle | Fase |
|-------|---------|------|
| `product_units_conversion` | factores generales entre unidades | **1D solo si se confirman factores** (D-I09; D-C05 lo difería a inventario) |
| `stock_alerts` / umbrales | alertas iniciales con umbrales configurables | **1D.5 / subfase de alertas (D-I13)** si se aprueba |
| `inventory_reserved/backorder` | campos no confirmados de la fuente | solo si la fuente los provee (D-I04) |
| `movement_cube` / causa de movimiento | clasificación venta/recepción/balanceo | fase de ventas/movimientos |
| conector local / sincronizador Intelisis | `27_LOCAL_CONNECTOR.md` | cubos Fase 3+ |
| relaciones layout/ventas/comercialización/CEDIS | `20/21/22/23/29` | fases propias (D-I14) |

## 5. Preguntas abiertas para revisión humana (adicionales a D-I01…D-I14)

1. **Nombres de tablas**: singular (según `23-contracts/29`) vs. plural (consistencia
   repo). Afecta D-I01.
2. **Nivel de referencia**: `variant_id` vs. `product_id` como clave del item de
   inventario. La variante es la presentación vendible (D-C03); propuesta: `variant_id`.
3. **Snapshot por almacén vs. por tienda+CEDIS en un solo snapshot**: la carga cubre
   un almacén por vez (propuesto) o la pareja tienda/CEDIS. Afecta D-I08/D-I04.
4. **`evidence_url`**: almacenar solo URL (registrado como texto) vs. subir a Storage
   (diferido por D-C17). Propuesta: solo URL en 1D.
5. **Permisos por rol operativo** (vendedora/almacén/comercial de `30_PERMISSIONS.md`)
   frente a los 4 roles existentes: ¿se mapean a los roles actuales o se crean roles
   nuevos? Afecta D-I10.
6. **Almacenes detectados en el archivo** (`116NOG-PGM`, `106SAL-PGM`) vs. `warehouses`
   de 1B.2 (`NOG-01`, `SAL-01`): definir el vínculo (code/external_id) en la migración.

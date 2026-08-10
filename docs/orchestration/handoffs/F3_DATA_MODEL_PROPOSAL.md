# F3 — Modelo de Datos (Layout — Fase 3)
## Estado: candidato propuesto en kickoff; D-L01…D-L14 APPROVED 2026-08-08

**Fecha:** 2026-08-08
**Rama:** `feature/f3-PG-LAYOUT-006-layout`
**Base:** `develop` `2e1291e` (1C + 1D integradas) — layout referencia el catálogo
maestro (1C, `product_variants`), las sucursales (1B, `branches`) y consume el
inventario (1D, snapshots/cambios).

Modelo **candidato** derivado de los packs de layout. **No es la migración**: la
migración (siguiente número libre de la secuencia, tras `…10_inventory_snapshots.sql`)
solo se creará tras aprobación humana de este modelo.

---

## 1. Convenciones aplicadas (heredadas de 1B/1C/1D)

- PK: `uuid` default `gen_random_uuid()` (patrón 1B.1).
- Timestamps: `timestamptz` + trigger `_core.updated_at()` (patrón 1B.1).
- `organization_id uuid` en **todas** las tablas, FK → `organizations(id)`.
- **`UNIQUE (organization_id, id)`** en tablas padre destino de FK compuesta.
- FK compuestas `(organization_id, parent_id)` → `(organization_id, id)`: impiden
  cruces entre organizaciones.
- `CHECK trim(valor) <> ''` en códigos/nombres obligatorios.
- Sin DELETE físico (posiciones y versiones son históricas).
- RLS deny-by-default reutilizando `_access` (004) y patrón 007.
- Nombres de tablas propuestos según `23-contracts/30_LAYOUT_SCHEMA.md`
  (pluraizados para consistencia con el repo).

## 2. Tablas propuestas (candidato)

> Nota de nombres: `23-contracts/30_LAYOUT_SCHEMA.md` documenta `layout`,
> `layout_element`, `layout_position`, `layout_version_history` (singular). La
> nomenclatura del repo usa plurales (`products`, `inventory_snapshots`).
> **Pregunta abierta (D-L01):** adoptar el nombre documentado singular vs.
> pluralizarlo para consistencia con el repo.

### 2.1 `layouts` — plano estructurado por tienda (org-scoped)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | ancla de scoping |
| `branch_id` | uuid | NOT NULL; FK compuesta `(organization_id, branch_id)` → `branches` | **tienda** (`branch_type='store'`); el layout es por tienda (D-L01) |
| `name` | text | NOT NULL `CHECK (trim(name) <> '')` | ej. "Nogalera" |
| `status` | text | NOT NULL DEFAULT 'draft' `CHECK (status IN ('draft','published','archived'))` | D-L04 |
| `version` | integer | NOT NULL DEFAULT 1 | versión actual |
| `width` / `height` | numeric | NULL `CHECK (> 0)` | unidades lógicas del lienzo (D-L03) |
| `background_reference` | text | NULL; `CHECK (background_reference IS NULL OR trim(background_reference) <> '')` | plano Canva como referencia (D-L05); URL/ref, no binario |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, branch_id, name)` — un layout con ese nombre por tienda.
- `INDEX (organization_id, branch_id, status)`.

### 2.2 `layout_elements` — muebles/zonas dentro de un layout

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `layout_id` | uuid | NOT NULL; FK compuesta → `layouts` | |
| `element_type` | text | NOT NULL `CHECK (element_type IN ('m1','galeria','muro','escaleras','vanity','banos','griferia','jacuzzi','boiler','parrillas','mallas_fachaletas','adhesivos','ambiente','mostrador','caja','zona','otro'))` | tipos de mueble/zonas de `02-layout/FURNITURE_*.md` (D-L09) |
| `code` | text | NOT NULL `CHECK (trim(code) <> '')` | **ID permanente** (D-L02): `M1-01`, `GAL-LAMOSA-01`, `MURO-VITROMEX-01`, `ESC-01`, `MPB-01` |
| `label` | text | NULL; `CHECK (label IS NULL OR trim(label) <> '')` | nombre visible |
| `x` / `y` | numeric | NOT NULL DEFAULT 0 | coordenadas normalizadas 0–1 (D-L03) |
| `width` / `height` | numeric | NOT NULL DEFAULT 0 `CHECK (>= 0)` | dimensión normalizada |
| `rotation` | numeric | NOT NULL DEFAULT 0 | grados (0–360) |
| `locked` | boolean | NOT NULL DEFAULT false | bloqueado del editor (D-L02/`LAYOUT_EDITING_RULES.md`) |
| `z_index` | integer | NOT NULL DEFAULT 0 | orden de capas |
| `metadata` | jsonb | NULL | reglas de composición por tipo (capacidades M1, proveedores, paquete vanity; D-L09) |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, layout_id, code)` — código permanente único por layout.
- `INDEX (organization_id, layout_id)`.

### 2.3 `layout_positions` — posiciones de exhibición con producto asignado

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `element_id` | uuid | NOT NULL; FK compuesta → `layout_elements` | |
| `position_code` | text | NOT NULL `CHECK (trim(position_code) <> '')` | sub-ubicación (D-L02): `CARA-A-RF-B02-P03` |
| `variant_id` | uuid | NULL; FK compuesta → `product_variants` | producto exacto del catálogo 1C (D-L06); NULL = posición vacía |
| `active_from` | timestamptz | NULL | inicio de vigencia |
| `active_to` | timestamptz | NULL | fin de vigencia (NULL = vigente) |
| `review_status` | text | NOT NULL DEFAULT 'ok' `CHECK (review_status IN ('ok','needs_review'))` | D-L07: stock cambiado marca `needs_review` |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, element_id, position_code)` — un código de posición por elemento.
- `INDEX (organization_id, variant_id)` — productos asignados a posiciones.
- `INDEX (organization_id, element_id, review_status)` — posiciones a revisar.

> El **historial por posición** (producto actual + anteriores con fechas/motivos,
> D-L06) se modela en `layout_version_history` (2.4) con las asignaciones; no se
> borra. Ver nota en §3.

### 2.4 `layout_version_history` — historial de versiones y posiciones (append-only)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `layout_id` | uuid | NOT NULL; FK compuesta → `layouts` | |
| `version` | integer | NOT NULL | versión a la que pertenece el cambio |
| `change_type` | text | NOT NULL `CHECK (change_type IN ('created','element_added','element_changed','element_moved','element_rotated','element_resized','element_locked','element_hidden','element_duplicated','product_assigned','product_removed','published','restored'))` | eventos de `LAYOUT_EDITING_RULES.md` / `43_INVENTORY_LAYOUT_EVENTS.md` |
| `element_id` | uuid | NULL; FK compuesta → `layout_elements` | elemento afectado (NULL para cambios de layout) |
| `position_id` | uuid | NULL; FK compuesta → `layout_positions` | posición afectada (asignación/remoción) |
| `previous_variant_id` | uuid | NULL; FK compuesta → `product_variants` | producto anterior (para `product_assigned`) |
| `new_variant_id` | uuid | NULL; FK compuesta → `product_variants` | producto nuevo |
| `origin` / `destination` | text | NULL | origen/destino de la edición (`LAYOUT_EDITING_RULES.md`) |
| `reason` | text | NULL; `CHECK (reason IS NULL OR trim(reason) <> '')` | motivo del cambio |
| `changed_by` | uuid | NOT NULL; FK → `profiles` | actor |
| `created_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, layout_id, version desc)`.
- `INDEX (organization_id, position_id, created_at desc)` — historial por posición.

> A diferencia de `layouts`/`layout_elements`/`layout_positions` (que se actualizan),
> `layout_version_history` es **append-only**: nunca se edita ni se borra.

## 3. Integridad y reglas clave (a reforzar en la base o en la capa de aplicación)

| Regla | Origen | Dónde se garantiza |
|-------|--------|--------------------|
| Cada ubicación tiene **ID permanente** jerárquico | `02-layout/LOCATION_ID_SYSTEM.md` | `code` (elemento) + `position_code` (posición) inmutables; `UNIQUE(organization_id, layout_id, code)` |
| El plano de Canva es **referencia**, no modelo | `21-migration/23_LAYOUT_MIGRATION.md` | `background_reference` solo guarda la referencia; el modelo es estructurado |
| Editar siempre sobre `draft`; publicar con aprobación | `10-arch/19_LAYOUT_VERSIONING.md` | `status` de `layouts`; use case `publish` (gate: solo en `draft`) |
| Conservar versión anterior y permitir restauración | `10-arch/19_LAYOUT_VERSIONING.md` | `layout_version_history` append-only; use case `restore` |
| Cambio de stock no reasigna automáticamente | `05-inventory/20_LAYOUT_INTEGRATION.md` | `review_status='needs_review'` al detectar cambio; se sugiere reemplazo compatible, espera confirmación |
| Posición referencia `variant_id` del catálogo exacto | `F1C_KICKOFF_CONTRACT.md` criterio 7 | FK compuesta a `product_variants`; nunca se inventa producto |
| Historial de posición conserva producto actual + anteriores | `05-inventory/20_LAYOUT_INTEGRATION.md` | `layout_version_history` con `previous_variant_id`/`new_variant_id`; sin DELETE |
| Stock presentado como "existencia reportada", tienda y CEDIS separados | `24-master-index/10`, `05-inventory/20` | el layout **lee** inventario de 1D (snapshot por `warehouse_id`); nunca lo escribe |
| El layout no muta stock/precios/observaciones | `05-inventory/20_LAYOUT_INTEGRATION.md` | solo lectura de inventario vía port de 1C.5/1D (D-L13) |

## 4. Tablas diferidas (solo diseño, fuera de F3)

| Tabla | Detalle | Fase |
|-------|---------|------|
| `layout_layers` (comercialización/ventas/alertas/mantenimiento/IA) | capas completas como módulos | fases propias (D-L09/Layout system) |
| `layout_validation` / checklist físico | recorrido asistido (D-L14) | F3 solo proceso asistido mínimo; profundización en migración/operación |
| `product_branch_visibility` | visibilidad por sucursal (D-C15) | fase comercial |
| `product_units_conversion` | factores de conversión | si se confirman (D-C05/D-I09) |
| Storage de fotografías/evidencia | evidencia de validación física | Supabase Storage habilitado (D-C17) |

## 5. Preguntas abiertas para revisión humana (adicionales a D-L01…D-L14)

1. **Nombres de tablas**: singular (según `23-contracts/30`) vs. plural (consistencia
   repo). Afecta D-L01.
2. **Anclaje a tienda**: `branch_id` (branch_type='store') vs. `warehouse_id`
   (store_backroom). El layout es del piso de venta → propuesta `branch_id`.
3. **Historial por posición**: en `layout_version_history` con `previous/new_variant_id`
   (propuesto) vs. tabla dedicada `layout_position_history`. Afecta D-L06.
4. **Coordenadas**: 0–1 normalizadas en `layouts.width/height` + x/y 0–1 (propuesto)
   vs. unidades lógicas por layout. Afecta D-L03.
5. **Capacidades M1 (3/3/2)**: hardcodear como CHECK vs. almacenar en
   `layout_elements.metadata` (recomendado, confirmable por mueble/proveedor). Afecta D-L08.
6. **Permisos `layout.*`**: mapear a los 4 roles existentes vs. ampliar catálogo de
   roles. Afecta D-L10.
7. **`background_reference`**: guardar URL de referencia (propuesto) vs. subir imagen a
   Storage (diferido por D-C17).

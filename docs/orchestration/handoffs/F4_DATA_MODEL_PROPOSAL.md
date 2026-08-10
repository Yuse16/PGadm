# F4 — Modelo de Datos (Ventas y cotizaciones — Fase 4)
## Estado: candidato propuesto en kickoff; D-V01…D-V14 APPROVED 2026-08-10

**Fecha:** 2026-08-10
**Rama:** `feature/f4-PG-SALES-007-sales`
**Base:** `develop` `5205eef` (1C + 1D + F3 integradas) — ventas referencia el catálogo
maestro (1C, `product_variants`), las sucursales/almacenes (1B, `branches`/`warehouses`),
el inventario (1D, snapshots/cambios) y el layout (F3) — **sin escribir jamás** sobre
inventario ni catálogo.

Modelo **candidato** derivado de los packs de ventas (`docs/packs/04-sales/`) y CRM
(`docs/packs/07-crm/`). **No es la migración**: la migración (siguiente número libre de
la secuencia, tras `…11_layout.sql`) solo se creará tras aprobación humana de este
modelo y de la subfase 4.2.

---

## 1. Convenciones aplicadas (heredadas de 1B/1C/1D/F3)

- PK: `uuid` default `gen_random_uuid()` (patrón 1B.1).
- Timestamps: `timestamptz` + trigger `_core.updated_at()` (patrón 1B.1).
- `organization_id uuid` en **todas** las tablas, FK → `organizations(id)`.
- **`UNIQUE (organization_id, id)`** en tablas padre destino de FK compuesta.
- FK compuestas `(organization_id, parent_id)` → `(organization_id, id)`: impiden
  cruces entre organizaciones.
- `CHECK x = btrim(x) and x <> ''` en códigos/nombres obligatorios (forma canónica D-C12).
- Sin DELETE físico (cotizaciones, captura, presupuestos y solicitudes son históricos).
- RLS deny-by-default reutilizando `_access` (004) y patrón 007; **vendedora ve sus
  datos, gerente su tienda** (D-V03), la base valida siempre.
- Monedas/importes: `numeric(14,2)`; precios derivados del catálogo 1C `numeric(14,4)`
  (patrón `54_MONEY_QUANTITY_DATE.md`).
- Stock siempre "existencia reportada" con fecha (1D, D-V13), tienda/CEDIS separados;
  **nunca** se reserva ni se escribe inventario desde ventas (D-V05).
- Nombres de tablas: `23-contracts/31_SALES_CRM_SCHEMA.md` documenta `customer`,
  `quotation`, `quotation_item`, `manual_sale`, `sales_budget` (singular); el repo usa
  plurales (`products`, `inventory_snapshots`, `layouts`) — **D-V02 adopta plurales**.

## 2. Tablas propuestas (candidato, D-V02)

### 2.1 `customers` — cliente mínimo (org-scoped)

Suficiente para cotizar (D-V01/D-V02); **sin** proyectos/oportunidades/seguimientos
(CRM = Fase 5).

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | ancla de scoping |
| `name` | text | NOT NULL `CHECK (name = btrim(name) and name <> '')` | |
| `phone` | text | NULL; `CHECK (phone IS NULL OR (phone = btrim(phone) and phone <> ''))` | |
| `whatsapp` | text | NULL; mismo patrón | para mensajes (D-V12) |
| `assigned_seller_id` | uuid | NULL; FK → `profiles` | vendedora responsable (D-V02); NULL = sin asignar |
| `status` | text | NOT NULL DEFAULT 'active' `CHECK (status IN ('active','inactive'))` | ciclo mínimo (el resto es CRM) |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, assigned_seller_id)`.
- `INDEX (organization_id, lower(trim(name)))` — búsqueda de clientes.

> Sin `UNIQUE` de teléfono/WhatsApp: el mismo cliente puede aparecer con datos
> parciales; la deduplicación es de Fase 5 (CRM, `07-crm/21_DUPLICATES.md`).

### 2.2 `quotations` — cotización (org-scoped)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `folio` | text | NOT NULL `CHECK (folio = btrim(folio) and folio <> '')` | folio de la cotización (D-V02) |
| `customer_id` | uuid | NULL; FK compuesta → `customers` | cliente mínimo (D-V02) |
| `seller_id` | uuid | NOT NULL; FK → `profiles` | vendedora que cotiza (D-V03) |
| `branch_id` | uuid | NOT NULL; FK compuesta → `branches` | **tienda** (`branch_type='store'`) |
| `status` | text | NOT NULL DEFAULT 'draft' `CHECK (status IN ('draft','sent','negotiating','accepted','sold','expired','lost'))` | D-V07/D-V14 |
| `subtotal` | numeric(14,2) | NOT NULL DEFAULT 0 `CHECK (subtotal >= 0)` | suma de partidas; se recalcula |
| `total` | numeric(14,2) | NOT NULL DEFAULT 0 `CHECK (total >= 0)` | sin IVA en F4 (D-V08); `total = subtotal` |
| `valid_until` | timestamptz | NULL | **vigencia 30 días** por defecto, configurable por org (D-V08) |
| `delivery_status` | text | NOT NULL DEFAULT 'pending' `CHECK (delivery_status IN ('pending','immediate','from_cedis','insufficient'))` | derivado determinista (D-V09) |
| `observations` | text | NULL; `CHECK (observations IS NULL OR trim(observations) <> '')` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, upper(trim(folio)))` — folio único por org.
- `INDEX (organization_id, branch_id, status)`.
- `INDEX (organization_id, seller_id, created_at desc)`.

> **Entrega sin fechas**: no se promete fecha; el `delivery_status` es determinista a
> partir de existencia reportada (D-V09, `05_DELIVERY_OPTIONS.md`). Estados
> `expired`/`lost` vía use case (D-V14).

### 2.3 `quotation_items` — partidas de la cotización

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `quotation_id` | uuid | NOT NULL; FK compuesta → `quotations` | |
| `variant_id` | uuid | NOT NULL; FK compuesta → `product_variants` | producto exacto 1C (D-V04) |
| `sale_unit_id` | uuid | NOT NULL; FK compuesta → `units_of_measure` | unidad de venta (snapshot 1C) |
| `reference_price` | numeric(14,4) | NULL `CHECK (reference_price IS NULL OR reference_price >= 0)` | **snapshot** del precio 1C al cotizar (D-V04) |
| `base_units_per_sale_unit` | numeric | NOT NULL DEFAULT 1 `CHECK (> 0)` | snapshot 1C |
| `pieces_per_box` | numeric | NULL `CHECK (IS NULL OR > 0)` | snapshot 1C (D-V04) |
| `square_meters_per_box` | numeric | NULL `CHECK (IS NULL OR > 0)` | cobertura por caja (D-V04/D-V09) |
| `area_square_meters` | numeric | NULL `CHECK (IS NULL OR >= 0)` | m² solicitados (D-V02) |
| `waste_percent` | numeric | NULL `CHECK (IS NULL OR (>= 0 AND <= 100))` | desperdicio 5/10/15%/personalizado (D-V02) |
| `box_quantity` | numeric | NULL `CHECK (IS NULL OR > 0)` | cajas requeridas, **redondeo hacia arriba** (D-V09) |
| `unit_price` | numeric(14,4) | NULL `CHECK (IS NULL OR >= 0)` | precio derivado por unidad de venta |
| `line_total` | numeric(14,2) | NOT NULL DEFAULT 0 `CHECK (>= 0)` | importe de la partida |
| `complement_of_id` | uuid | NULL; FK compuesta → `quotation_items` | complemento de una partida base (máx. 3, D-V02) |
| `sort_order` | integer | NOT NULL DEFAULT 0 | orden de presentación |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, quotation_id, sort_order)`.
- `INDEX (organization_id, variant_id)` — productos cotizados.
- `INDEX (organization_id, complement_of_id)` — complementos (alternativa máx. 3,
  D-V02, validado en use case).

> **Stock en la partida**: la cotización **lee** la existencia reportada tienda/CEDIS
> en el momento de cotizar (port 1C.5/1D, D-V13) y la muestra con fecha; **no** se
> persiste como columna de stock (historial de 1D es la fuente, no se duplica).

### 2.4 `manual_sale_entries` — captura manual diaria (D-V02/D-V07)

Resuelve `DailySellerSales` vs `manual_sale` del contrato (D-V02): un agregado por
vendedora/tienda/fecha.

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `seller_id` | uuid | NOT NULL; FK → `profiles` | vendedora |
| `branch_id` | uuid | NOT NULL; FK compuesta → `branches` | tienda |
| `sale_date` | date | NOT NULL | fecha de la captura |
| `sales_amount` | numeric(14,2) | NOT NULL DEFAULT 0 `CHECK (>= 0)` | venta del día |
| `tickets_count` | integer | NOT NULL DEFAULT 0 `CHECK (>= 0)` | `tickets_del_dia` (contador entero, D-V02) |
| `returns_amount` | numeric(14,2) | NOT NULL DEFAULT 0 `CHECK (>= 0)` | devoluciones (D-V02) |
| `comment` | text | NULL; `CHECK (comment IS NULL OR trim(comment) <> '')` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, seller_id, branch_id, sale_date)` — una captura por
  vendedora/tienda/día (corregir = UPDATE con historial, D-V07).
- `INDEX (organization_id, branch_id, sale_date)` — venta diaria de tienda.

> **Corrección con historial**: UPDATE del gerente guarda anterior/nuevo en
> `_audit.sales_events` (D-V14). La suma por vendedora/tienda/mes alimenta presupuestos
> e indicadores (D-V11).

### 2.5 `sales_budgets` — presupuesto por tienda y por vendedora (D-V11)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `branch_id` | uuid | NOT NULL; FK compuesta → `branches` | tienda |
| `seller_id` | uuid | NULL; FK → `profiles` | NULL = presupuesto de tienda; set = por vendedora |
| `period` | text | NOT NULL `CHECK (period ~ '^\d{4}-\d{2}$')` | periodo mensual `YYYY-MM` |
| `amount` | numeric(14,2) | NOT NULL `CHECK (>= 0)` | presupuesto mensual |
| `status` | text | NOT NULL DEFAULT 'active' `CHECK (status IN ('active','archived'))` | sin DELETE físico |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `UNIQUE (organization_id, branch_id, period) WHERE seller_id IS NULL` — un
  presupuesto de tienda por mes.
- `UNIQUE (organization_id, seller_id, period)` — un presupuesto por vendedora/mes.
- `INDEX (organization_id, branch_id, period, status)`.

> El gerente los configura como fallback mientras TI no cargue en Intelisis (D-V11,
> `22_STORE_BUDGET.md`/`23_SELLER_BUDGETS.md`). Indicadores (acumulado, %, faltante,
> venta requerida/día, proyección) se **derivan** de `manual_sale_entries` + presupuesto;
> no se almacenan.

### 2.6 `cedis_requests` — solicitud a CEDIS mínima (D-V06)

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `organization_id` | uuid | FK → organizations, NOT NULL | |
| `quotation_id` | uuid | NULL; FK compuesta → `quotations` | **ligada a la cotización** (D-V06) |
| `variant_id` | uuid | NOT NULL; FK compuesta → `product_variants` | código/producto |
| `requested_quantity` | numeric | NOT NULL `CHECK (> 0)` | cantidad solicitada |
| `requested_date` | date | NOT NULL | fecha de la solicitud |
| `required_date` | date | NULL | fecha requerida por el cliente (informativa; sin promesa) |
| `status` | text | NOT NULL DEFAULT 'requested' `CHECK (status IN ('requested','accepted','modified','rejected','cancelled'))` | F4 crea con `requested`; respuesta → Fase 7 (D-V06) |
| `seller_id` | uuid | NOT NULL; FK → `profiles` | vendedora |
| `branch_id` | uuid | NOT NULL; FK compuesta → `branches` | sucursal |
| `observations` | text | NULL; `CHECK (observations IS NULL OR trim(observations) <> '')` | |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, quotation_id)`.
- `INDEX (organization_id, variant_id)`.

> La respuesta (aceptar/modificar/rechazar), el chat y los balanceos son de Fase 7
> (D-V06, `19_CEDIS_REQUEST_FROM_SALE.md`); en F4 solo se registra la solicitud.

### 2.7 `_audit.sales_events` — auditoría (D-V14, append-only)

Patrón `_audit.layout_events` (migración 011) / `_audit.inventory_events` (010).

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | uuid | PK | |
| `occurred_at` | timestamptz | NOT NULL DEFAULT now() | |
| `actor_user_id` | uuid | NOT NULL; FK → `profiles` | actor (JWT sub) |
| `organization_id` | uuid | NOT NULL; FK → organizations | |
| `action` | text | NOT NULL `CHECK (action IN ('quotation_created','quotation_edited','quotation_sent','quotation_accepted','quotation_sold','quotation_lost','quotation_duplicated','manual_sale_registered','manual_sale_corrected','sales_budget_configured','cedis_request_created'))` | eventos de `44_SALES_CRM_EVENTS.md` (D-V14) |
| `entity_type` | text | NOT NULL `CHECK (entity_type IN ('customer','quotation','quotation_item','manual_sale_entry','sales_budget','cedis_request'))` | |
| `entity_id` | uuid | NOT NULL | |
| `previous_data` | jsonb | NULL | **corrección: valor anterior** (D-V14) |
| `new_data` | jsonb | NULL | **corrección: valor nuevo** (D-V14) |
| `detail` | text | NOT NULL DEFAULT '' | resumen humano |

Índices/unicidad:
- `UNIQUE (organization_id, id)`.
- `INDEX (organization_id, entity_type, entity_id, occurred_at desc)`.
- `INDEX (organization_id, occurred_at desc)`.

> **Append-only**: sin políticas UPDATE/DELETE + REVOKE (patrón 1C.5/1D/F3, D-V14).

## 3. Integridad y reglas clave (reforzar en la base o en la capa de aplicación)

| Regla | Origen | Dónde se garantiza |
|-------|--------|--------------------|
| Las ventas **nunca** escriben inventario/catálogo/precios | `04-sales/00_OVERVIEW.md`, F4 kickoff §3 | ventas solo leen 1C/1D vía port (D-V04/D-V13); prohibido UPDATE a tablas de inventario desde ventas |
| Stock = "existencia reportada" con fecha, tienda/CEDIS separados | `04-sales/04_STOCK_FOR_SALES.md` | lecturas del port 1C.5/1D; sin columna de stock duplicada (D-V13) |
| `reserved_stock` fuera de F4 (NULL); marcar "vendida" no descuenta | D-V05 | no hay reserva en F4; `quotation_sold` solo emite evento (D-V07) |
| Precios derivados y validados de 1C; consistencia m²↔caja | `07_BOX_AND_PRICE_CALCULATION.md` | `reference_price`/`square_meters_per_box`/`pieces_per_box` snapshot (D-V04); validación de consistencia en use case |
| Calculadora: redondeo hacia arriba; nunca fracciones de caja en caja cerrada | `06_AREA_CALCULATOR.md` | `box_quantity = ceil(...)`; validación en use case (D-V09) |
| Entrega determinista sin prometer fechas | `05_DELIVERY_OPTIONS.md` | `delivery_status` derivado (D-V09); sin columna de fecha prometida |
| Cotización y venta manual independientes | D-V07 | `quotation_sold` no auto-crea `manual_sale_entries`; eventos distintos |
| Corrección de captura con historial | `21_MANUAL_SALES_CAPTURE.md` | UPDATE con `previous_data`/`new_data` en `_audit.sales_events` (D-V14) |
| Vigencia 30 días configurable por org | D-V08 | `valid_until` default 30 días en use case de creación |
| Cliente mínimo suficiente; sin CRM en F4 | D-V01/D-V02 | `customers` reducido; sin proyectos/oportunidades/seguimientos |
| Folio único por org | `13_QUOTATIONS.md` | `UNIQUE (organization_id, upper(trim(folio)))`; generación en use case |
| Sin DELETE físico en ninguna tabla de ventas | F4 kickoff §3 | sin políticas DELETE + REVOKE (append-only) |

## 4. Tablas diferidas (solo diseño, fuera de F4)

| Tabla | Detalle | Fase |
|-------|---------|------|
| `customer_projects` / `opportunities` / `follow_ups` | CRM completo (tipos, proyectos, oportunidades, seguimientos, cola diaria, motivos de pérdida, recuperación) | **Fase 5** (D-V01) |
| `price_lists` / precios por sucursal / campañas | listas de precios y campañas/descuentos temporales | Fase 6 Comercialización (D-C06/D-V04) |
| `reservations` / apartados / `reserved_stock` | reserva real, apartado, backorder | Fase 7 (D-V05) |
| `cedis_request` respuesta/chat/balanceos | aceptar/modificar/rechazar con flujo y chat | Fase 7 (D-V06) |
| `tickets` (entidad) | ticket como entidad (en F4 solo contador `tickets_count`) | reportes/Intelisis (D-V02) |
| Cubo de ventas Intelisis | fuente oficial de ventas | cuando exista el cubo (D-V11) |
| PDF formal de cotización | se imprime con la vista del navegador; sin librería PDF | D-V12 |

## 5. Preguntas abiertas para revisión humana (adicionales a D-V01…D-V14)

1. **Folio**: formato propuesto `COT-YYYY-NNNN` por org (use case) vs. secuencia simple
   por tienda. Afecta `quotations.folio`.
2. **`valid_until`**: columna con default de 30 días (propuesto) vs. calculada al
   consultar. Afecta D-V08.
3. **Snapshot de precios**: persistir `reference_price`/`pieces_per_box`/
   `square_meters_per_box` en `quotation_items` (propuesto, inmutabilidad histórica de
   la cotización) vs. derivarlos siempre del catálogo vivo (rompería el historial si 1C
   cambia). Afecta D-V04.
4. **`assigned_seller_id` en `customers`**: FK a `profiles` (propuesto) vs. derivada de
   `user_store_role` (borrador RBAC 1B3). Afecta D-V02/D-V03.
5. **Scoping de gerente**: el gerente ve **su tienda** (via `user_store_role`/branch)
   vs. toda la organización. Se asume por tienda (D-V03); requiere confirmación.
6. **`delivery_status`**: derivado en cada consulta (propuesto) vs. persistido en
   `quotations`. Afecta D-V09.

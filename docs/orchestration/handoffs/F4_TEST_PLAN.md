# F4 — Plan de Pruebas (Ventas y cotizaciones — Fase 4)
## Estado: candidato propuesto en kickoff; D-V01…D-V14 APPROVED 2026-08-10

**Fecha:** 2026-08-10
**Rama:** `feature/f4-PG-SALES-007-sales`

Plan de pruebas de la fase F4. Se ejecutará cuando exista implementación (subfases
4.2+); aquí se define el alcance para validar. Cobertura derivada de
`docs/packs/04-sales/` (búsqueda, ficha, calculadora, complementos/alternativas,
comparador, cotización, cliente, captura manual, presupuestos, CEDIS), del kickoff F4
(D-V01…D-V14) y de los contratos `23-contracts/16_SALES_CRM_ENDPOINTS.md` /
`17_QUOTATION_ENDPOINTS.md` / `31_SALES_CRM_SCHEMA.md` / `44_SALES_CRM_EVENTS.md`.

---

## 1. Comandos de validación (heredados)

| Comando | Objetivo |
|---------|----------|
| `npm run lint` | ESLint en `src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` (unit + RSC tests bajo `src/tests/`) |
| `npm run db:lint` | reglas de seguridad/RLS de Supabase (`supabase db lint`) |
| `npm run db:test` | tests SQL de la base (pgTAP) |
| `npm run db:verify` | `scripts/verify-db.mjs` (chequeo de estado DB) |
| `npm run e2e:identity` / `e2e:auth` | flujos E2E existentes (sin regresión) |

## 2. Casos de modelo de datos (de `F4_DATA_MODEL_PROPOSAL.md`, `23-contracts/31`)

- SV-1: las 7 tablas (`customers`, `quotations`, `quotation_items`,
  `manual_sale_entries`, `sales_budgets`, `cedis_requests` + `_audit.sales_events`)
  existen org-scoped con `UNIQUE(organization_id, id)`.
- SV-2: `quotations` se ancla a una tienda (`branch_id`, `branch_type='store'`); FK
  compuesta `(organization_id, branch_id)` impide cruces de org.
- SV-3: `folio` único por org (`UNIQUE (organization_id, upper(trim(folio)))`).
- SV-4: `variant_id`/`sale_unit_id` de partidas FK compuestas a 1C
  (`product_variants`/`units_of_measure`); NULL = sin snapshot.
- SV-5: `UNIQUE (organization_id, seller_id, branch_id, sale_date)` en
  `manual_sale_entries` — una captura por vendedora/tienda/día.
- SV-6: `sales_budgets` con un presupuesto de tienda por mes
  (`UNIQUE (organization_id, branch_id, period) WHERE seller_id IS NULL`) y uno por
  vendedora (`UNIQUE (organization_id, seller_id, period)`).
- SV-7: `_audit.sales_events` append-only: sin políticas UPDATE/DELETE + REVOKE.
- SV-8: `CHECK` de estados válidos (`quotations.status`, `delivery_status`,
  `cedis_requests.status`, `sales_budgets.status`, `customers.status`) y `period`
  con formato `YYYY-MM`.

## 3. Casos de búsqueda y ficha (de `02_PRODUCT_SEARCH.md`, `03_PRODUCT_DETAIL.md`)

- SV-9: la búsqueda por código exacto/parcial, nombre, marca, línea, categoría,
  formato y acabado abre el **producto exacto** (regla de exactitud); nunca mezcla
  modelos parecidos sin indicarlo.
- SV-10: la ficha muestra stock tienda y CEDIS **separados** como "existencia
  reportada" con fecha (1D) y ubicación (F3); sin snapshot = "sin datos", nunca valor
  fabricado (D-V13).
- SV-11: el historial de stock de la ficha se consume de 1D (`inventory_change`),
  no se duplica (D-V13).

## 4. Casos de calculadora y precios (de `06_AREA_CALCULATOR.md`, `07_BOX_AND_PRICE_CALCULATION.md`)

- SV-12: cálculo de área directa o por espacio (largo × ancho, varias áreas, suma) y
  desperdicio 5/10/15%/personalizado.
- SV-13: cajas requeridas = `ceil(área final / square_meters_per_box)`; redondeo hacia
  arriba; sobrante y cobertura correctos (D-V09).
- SV-14: nunca vender fracciones de caja cuando el producto se vende por caja cerrada.
- SV-15: consistencia entre precio por m² y precio por caja validada; precio derivado
  de 1C (`reference_price`, `base_units_per_sale_unit`) (D-V04).
- SV-16: si el dato de cobertura/precio no está confirmado en 1C, se muestra solo lo
  aplicable y se valida consistencia; sin inventar precios (D-V04).

## 5. Casos de complementos, alternativas y comparador (de `09/10/11/12`)

- SV-17: complementos y alternativas con motores **deterministas** y explicables
  (compatibilidad, stock tienda/CEDIS, precio); máx. 3 alternativas (D-V10).
- SV-18: sin IA (sin aprendizaje por sucursal ni prioridad aprendida) en F4 (D-V10).
- SV-19: comparador de hasta 3 productos con campos comerciales (`12_PRODUCT_COMPARISON.md`).

## 6. Casos de cotización (de `13_QUOTATIONS.md`, D-V07/D-V08)

- SV-20: crear/editar/duplicar cotización con folio, cliente mínimo, partidas (con
  snapshot de precio/cobertura 1C), stock, entrega, vigencia y observaciones.
- SV-21: `valid_until` default **30 días** configurable por org (D-V08); sin IVA
  (`total = subtotal`, D-V08).
- SV-22: estados de cotización gestionados (draft→sent→negotiating→accepted→sold;
  expired; lost) con auditoría (D-V14).
- SV-23: marcar "vendida" emite `quotation_sold` y cierra el estado, pero **no**
  auto-crea la captura manual diaria (D-V07).
- SV-24: entrega determinista sin fechas: tienda ≥ requerido → `immediate`; solo CEDIS
  ≥ requerido → `from_cedis`; ninguno → `insufficient` (D-V09).
- SV-25: vista imprimible y mensaje de WhatsApp preparado con deep link `wa.me`
  (confirmación del usuario; sin WhatsApp API) (D-V12).
- SV-26: el folio se genera en el servidor y es único por org (SV-3).

## 7. Casos de cliente mínimo y CEDIS (de `15_CUSTOMERS.md`, `19_CEDIS_REQUEST_FROM_SALE.md`)

- SV-27: `customers` mínimo (nombre, teléfono, WhatsApp, vendedora) suficiente para
  cotizar; **sin** proyectos/oportunidades/seguimientos (D-V01/D-V02).
- SV-28: solicitud CEDIS mínima ligada a la cotización (cliente, código, cantidades,
  stock, fecha, vendedora, sucursal) con estado inicial `requested` (D-V06); sin
  respuesta/chat (Fase 7).

## 8. Casos de captura manual y presupuestos (de `21/22/23`, D-V11)

- SV-29: la vendedora captura su venta diaria (fecha, venta, tickets, devoluciones,
  comentario); una por vendedora/tienda/día (SV-5).
- SV-30: la vendedora no modifica capturas de otras; el gerente corrige **con
  historial** (`manual_sale_corrected` guarda anterior/nuevo) (D-V07/D-V14).
- SV-31: la suma de ventas de vendedoras actualiza la venta de tienda y los
  indicadores de presupuesto (acumulado, %, faltante, venta requerida/día, proyección)
  derivados, no almacenados (D-V11).
- SV-32: el gerente configura presupuestos por tienda y vendedora
  (`sales.budget_manage`); `archived` deja el presupuesto fuera de consulta activa.

## 9. Casos de seguridad RLS (deny-by-default)

- SV-33: usuario sin `sales.read` no ve filas de ninguna tabla de ventas.
- SV-34: vendedora ve **solo sus** cotizaciones/clientes/capturas/solicitudes, nunca
  de otra vendedora.
- SV-35: gerente con `sales.edit_all` ve/corrige todas (dentro de su tienda según
  scoping por tienda, D-V03).
- SV-36: usuario sin `sales.quote` no puede insertar cotizaciones ni clientes.
- SV-37: usuario sin `sales.capture_own` no puede insertar capturas; sin
  `sales.budget_manage` no puede configurar presupuestos; sin `sales.cedis_request`
  no puede crear solicitudes.
- SV-38: fila insertada con `organization_id`/`branch_id`/`variant_id` ajeno →
  rechazada (FK compuestas + RLS).
- SV-39: `service_role`/admin: repos de ventas no usan admin client
  (`feature-security` de ventas).
- SV-40: `_audit.sales_events` no admite UPDATE/DELETE por ningún rol.

## 10. Casos de consistencia de datos y convenciones

- SV-41: permisos `sales.*` (6) existen en `permissions` y se asignan según la matriz
  (D-V03) en `seed.sql` (total 25 permisos).
- SV-42: `updated_at` se actualiza vía trigger `_core.updated_at()`.
- SV-43: `CHECK btrim`/`<> ''` en campos obligatorios (`folio`, `name`, `period`).
- SV-44: sin DELETE físico en ninguna tabla de ventas (sin política + revoke).
- SV-45: auditoría `_audit.sales_events` con actor y timestamp, append-only; en
  correcciones `previous_data`/`new_data` (D-V14, patrón `_audit` 1C.5/1D/F3).
- SV-46: `SALES_DATA_SOURCE=demo` (default) | `supabase`, sin fallback silencioso
  (D031/D-C22/D-I12/D-L11 extendido a ventas); error tipado sin configuración.
- SV-47: las ventas **no** escriben inventario/catálogo/precios (prohibido UPDATE a
  tablas de inventario/catálogo desde ventas; D-V05/D-V13).

## 11. Pruebas de no-regresión

- Suite existente (`src/tests/**`, organization/identity/catalog/inventory/layout) en
  verde (500/500 base F3).
- `npm run lint`, `npm run typecheck`, `npm run db:verify` en verde.
- `e2e:auth` y `e2e:identity` sin regresión (script actualizado con permisos
  `sales.*` por rol si procede).
- No aparecen dependencias nuevas no justificadas en `package.json`.

## 12. Datos de prueba planificados (seed 4.2, propuesta)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Tiendas | 1 | NOG-01 (branch store, existente 1B) |
| Clientes | 2–3 | cliente mínimo PGM (nombre, teléfono, WhatsApp, vendedora) |
| Cotizaciones | 2 | borrador con partidas + enviada (folio `COT-…`) |
| Partidas | 3–5 | variantes demo PGM con snapshot de precio/cobertura |
| Capturas manuales | 2–3 | una por vendedora/día (días distintos) |
| Presupuestos | 2 | tienda (periodo actual) + por vendedora |
| Solicitudes CEDIS | 1 | ligada a cotización, estado `requested` |
| Permisos `sales.*` | 6 | read/quote/capture_own/edit_all/budget_manage/cedis_request (total 25) |

Los datos demo quedan aislados por org (PGM y PGM-DEMO-B) — sin datos globales.

## 13. Criterio de salida

- Aprobación humana del kickoff (D-V01…D-V14) registrada en `DECISION_LOG.md`
  (hecho 2026-08-10).
- Casos SV-1…SV-47 diseñados y trazables a decisiones D-V01…D-V14.
- Línea base de `npm run validate` y `db:*` documentada (a ejecutar en 4.2+).

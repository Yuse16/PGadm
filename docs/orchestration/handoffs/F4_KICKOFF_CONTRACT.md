# F4 — Kickoff Contract: Ventas y cotizaciones (Fase 4 — búsqueda, calculadora, cajas, complementos, comparador, cotización y venta manual)
## Estado: APROBADO — D-V01…D-V14 registradas en `DECISION_LOG.md` (2026-08-10)

**Fecha:** 2026-08-10
**Fase:** Fase 4 — Ventas y cotizaciones (`docs/orchestration/phases/07_PHASE_7.md`;
roadmap `17-roadmap/02_PROJECT_PHASES.md` agrupa "Ventas y CRM" en Fase 4; el orchestration
separa CRM en Fase 5 — ver D-V01)
**Rama propuesta:** `feature/f4-PG-SALES-007-sales`
**Base:** `develop` `90c2184` (merge PR #12 F3 `5617831` + PR #13 handoff F4)
**Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\layout-kickoff` (o uno nuevo aislado)
**Estado:** kickoff contract **APROBADO** por revisión humana el 2026-08-10.
Decisiones D-V01…D-V14 **registradas en `DECISION_LOG.md`**. Aprobación confirma:
D-V01 (alcance ventas; CRM = Fase 5), D-V03 (mapeo `sales.*` sobre roles existentes) y
D-V08 (vigencia estándar de cotización 30 días; impuestos fuera de F4).
Paquete documental de F4 en preparación.

---

## 1. Principio rector

La PWA **no es un catálogo pasivo**: la vendedora busca, ve stock tienda/CEDIS con fecha,
calcula, complementa, compara, cotiza y comparte — sin inventar stock, precios ni fechas de
entrega (`04-sales/00_OVERVIEW.md`, `25_AI_SALES_ASSISTANT.md`). F4 entrega el flujo
**"producto → cotización" completo** (gate de fase `07_PHASE_7.md`), consumiendo el catálogo
(1C), la existencia reportada (1D, port 1C.5/1D) y el layout (F3) — **sin escribir jamás**
sobre inventario ni catálogo.

## 2. Objetivo de la fase

Búsqueda comercial exacta, ficha de producto con stock tienda/CEDIS y ubicación, calculadora
de m²/cajas (redondeo correcto, sobrante, faltante con CEDIS), complementos, alternativas
(máx. 3), comparador (máx. 3), cotización completa (folio, cliente mínimo, partidas, vigencia,
estados) y **venta manual diaria** con presupuestos de tienda/vendedora.

### Qué pertenece a F4 (alcance propuesto)

1. **Búsqueda**: por código exacto/parcial, nombre, marca, línea, categoría, formato y acabado
   (campos que 1C ya expone). Regla de exactitud: abrir el producto exacto; nunca mezclar
   modelos parecidos sin indicarlo (`04-sales/02_PRODUCT_SEARCH.md`).
2. **Ficha comercial**: precio por m²/caja/pieza cuando aplique (derivado de 1C, D-V04),
   stock Nogalera/CEDIS con fecha (1D) y ubicación (F3); historial de stock consumido de 1D
   (D-V13).
3. **Calculadora**: área directa o por espacio, desperdicio 5/10/15%/personalizado, cajas con
   redondeo hacia arriba, cobertura, sobrante, importe; **nunca vender fracciones de caja**
   cuando se venda por caja cerrada (`04-sales/06,07`).
4. **Complementos y alternativas**: motores deterministas y explicables (D-V10) con reglas base
   (compatibilidad, stock, precio); alternativas máx. 3.
5. **Comparador**: hasta 3 productos con campos comerciales (`04-sales/12`).
6. **Cotización**: entidades `quotations` + `quotation_items`; contenido del pack
   (`04-sales/13`) incluyendo folio, cliente mínimo, m², desperdicio, cajas, precios, importe,
   stock, tipo de entrega, vigencia y observaciones; estados (borrador/enviada/en negociación/
   aceptada/vendida/vencida/perdida — D-V14); acciones guardar/editar/duplicar/WhatsApp
   (D-V12)/vista imprimible/convertir en seguimiento (registro mínimo) y **marcar vendida o
   perdida**.
7. **Cliente mínimo**: entidad `customers` reducida (nombre, teléfono, WhatsApp, sucursal,
   vendedora) suficiente para cotizar; **sin proyectos/oportunidades/seguimientos** (CRM =
   Fase 5, D-V01).
8. **Venta manual diaria**: captura por vendedora (fecha, venta, tickets, devoluciones,
   comentario), correcciones del gerente **con historial** (D-V14), suma hacia venta de tienda
   y presupuestos (`04-sales/21`).
9. **Presupuestos**: `sales_budget` por tienda y por vendedora; captura del gerente como
   fallback mientras TI no cargue en Intelisis; indicadores (acumulado, %, faltante, venta
   requerida/día, proyección) (`04-sales/22,23`).
10. **Solicitud a CEDIS mínima**: registro de `cedis_requests` ligado a la cotización
    (disparador, datos, estado); la respuesta/chat y los balanceos son de Fase 7 (D-V06).
11. **Permisos `sales.*`** sobre los roles existentes (D-V03), con auditoría en
    `_audit.sales_events` (D-V14).

### Qué NO pertenece a F4 (diferido, por diseño)

- **CRM completo**: clientes extendidos (tipos, proyectos, oportunidades, seguimientos, cola
  diaria, motivos de pérdida, recuperación) → **Fase 5** (`08_PHASE_8.md`, D-V01).
- Listas de precios/precios por sucursal y motor de campañas/descuentos temporales/promociones
  → Fase 6 Comercialización (D-C06; F1C no modela campañas como columnas del catálogo).
- Reserva/apartado/backorder y `reserved_stock` del port 1C.5 → Fase 7 Apartados y entregas
  (D-V05). En F4 se mantiene el aviso "Existencia reportada. Confirmar antes de cerrar pedidos
  grandes." (`04-sales/04`).
- CEDIS/balanceos completos (chat, aceptar/modificar/rechazar con flujo) → Fase 7 (D-V06).
- IA (recomendaciones con prioridad aprendida por sucursal) → fase de IA; F4 solo reglas
  deterministas (D-V10).
- WhatsApp Business API / envío automático → el usuario confirma; se prepara el mensaje
  (D-V12).
- PDF formal: la cotización se imprime con la vista del navegador; sin librería PDF (D-V12).
- Cubo de ventas Intelisis: la venta manual es captura agregada hasta que exista el cubo
  (`04-sales/21`).
- Impuestos (IVA) y descuentos de campaña: pendientes de confirmación de negocio (D-V04/D-V08).

## 3. Restricciones de la fase

- No trabajar directamente sobre `develop`; no merge, no PR, no push sin orden.
- No reutilizar worktrees de otras ramas ni eliminar ramas/worktrees anteriores.
- Multitenencia estricta: org-scoped, RLS deny-by-default reutilizando `_access` (004) y el
  patrón 007; `organization_id` nunca se confía del cliente.
- `service_role` **nunca** en cliente (blindado por `feature-security`).
- Repositorios demo + supabase **sin fallback silencioso**: `SALES_DATA_SOURCE=demo` default |
  `supabase` (patrón D031/D-C22/D-I12/D-L11).
- Conservar arquitectura `domain/application/infrastructure` (patrón `catalog`/`inventory`/`layout`).
- No inventar stock, precios, códigos, líneas, acuerdos, fechas ni responsables.
- Stock = "existencia reportada" con fecha, tienda/CEDIS separados (heredado 1D); nunca mezclar
  existencias de otras sucursales; sin causa de movimiento.
- Las ventas **nunca** escriben inventario, catálogo ni precios.
- Nivel de certeza de entrega sin prometer fechas; "no prometer fecha sin respaldo"
  (`04-sales/05`).
- No borrar historial (cotizaciones, captura manual, presupuestos, solicitudes): append-only.
- La resolución por sucursal activa sigue `user_store_role` (borrador RBAC 1B3); si no hay
  resolución, no se asume sucursal (falla explícita).
- Cotizaciones y ventas de una vendedora visibles a ella; el gerente ve su tienda; otras
  visibilidades vía permiso (D-V03).

## 4. Decisiones propuestas (D-V01…D-V14) — PENDIENTES de aprobación humana

| ID | Propuesta | Fuente | Estado |
|----|-----------|--------|--------|
| D-V01 | **Alcance F4 = ventas y cotizaciones** (flujo producto→cotización + venta manual + presupuestos + cliente mínimo). CRM completo (proyectos, oportunidades, seguimientos) = Fase 5, no se implementa en F4. Se sigue la numeración del orchestration (`07_PHASE_7`/`08_PHASE_8`) aunque el roadmap agrupe "Ventas y CRM" | `07_PHASE_7.md`, `08_PHASE_8.md`, `17-roadmap/02_PROJECT_PHASES.md`, `HANDOFF_006` | **PENDIENTE** |
| D-V02 | **Modelo org-scoped** (patrón 1D/F3, `UNIQUE(organization_id, id)`, FK compuestas): `customers` (mínimo), `quotations`, `quotation_items`, `manual_sale_entries` (captura diaria; resuelve `DailySellerSales` vs `manual_sale` del contrato), `sales_budgets` (por tienda y por vendedora), `cedis_requests` (mínimo); `tickets_del_dia` como contador entero (sin entidad ticket en F4) | `04-sales/30_DATA_MODEL.md`, `23-contracts/31_SALES_CRM_SCHEMA.md`, `07-crm/29_DATA_MODEL.md` | **PENDIENTE** |
| D-V03 | **Permisos `sales.*` sobre los roles existentes** (sin roles nuevos en F4, consistente con D-I10/D-L10): `sales.read` (ver propias), `sales.quote` (crear/editar/duplicar cotizaciones propias y ver sus clientes), `sales.capture_own` (capturar ventas propias), `sales.edit_all` (ver/corregir todas, corregir captura con historial), `sales.budget_manage` (configurar presupuestos), `sales.cedis_request` (crear solicitudes CEDIS). Mapeo propuesto: cashier=vendedora → read/quote/capture_own/cedis_request; manager → + edit_all/budget_manage; operator → read (solo consulta); administrator → todos | `F1B3_RBAC_MATRIX_DRAFT.md` (`sales.capture_own`, `sales.edit_all`), `04-sales/29_PERMISSIONS.md`, `07-crm/28_PERMISSIONS.md` | **PENDIENTE** |
| D-V04 | **Precios sin listas de precios**: la cotización usa `reference_price` + `sale_unit_id` + `base_units_per_sale_unit` + `pieces_per_box`/`square_meters_per_box` de 1C (D-C06 mantiene listas de precios diferidas). Se derivan y validan precio m²↔caja con **cobertura por caja** (`square_meters_per_box`); si el dato no está confirmado se muestra solo lo aplicable y se valida consistencia | `04-sales/07_BOX_AND_PRICE_CALCULATION.md`, `F1C_KICKOFF_CONTRACT.md` D-C06, `src/features/catalog/domain/variant.ts` | **PENDIENTE** |
| D-V05 | **Reservado fuera de F4**: `reserved_stock` del port 1C.5 se mantiene `null` (disponible = reportada) con el aviso del pack; apartados/backorder y reserva real → Fase 7. Marcar cotización "vendida" **no** descuenta inventario | `04-sales/04_STOCK_FOR_SALES.md`, `F1D_KICKOFF_CONTRACT.md` D-I14, `HANDOFF_006` | **PENDIENTE** |
| D-V06 | **Solicitud CEDIS mínima**: F4 registra `cedis_requests` ligada a la cotización (cliente, código, cantidades, stock, fecha, vendedora, sucursal) con estado inicial; la respuesta (aceptar/modificar/rechazar), el chat y los balanceos → Fase 7 | `04-sales/19_CEDIS_REQUEST_FROM_SALE.md`, `10_PHASE_10` | **PENDIENTE** |
| D-V07 | **Cotización y venta manual independientes**: marcar "vendida" emite evento y cierra el estado de la cotización, pero **no** auto-crea la captura manual diaria (agregado independiente que suman los reportes); eventos distintos `quotation.sold` y `manual_sale.registered` | `04-sales/13_QUOTATIONS.md`, `04-sales/21_MANUAL_SALES_CAPTURE.md`, `23-contracts/44_SALES_CRM_EVENTS.md` | **PENDIENTE** |
| D-V08 | **Impuestos y vigencia**: sin IVA/impuestos en F4 (pendiente confirmar negocio; la cotización muestra "importe" sin línea de impuesto). **Vigencia estándar de cotización por defecto 30 días** (configurable por org) — requiere confirmación de negocio en la aprobación | `04-sales/32_OPEN_QUESTIONS.md`, `07-crm/31_OPEN_QUESTIONS.md` | **PENDIENTE** |
| D-V09 | **Stock y entrega en cotización**: F4 muestra existencia reportada tienda/CEDIS con fecha (1D) y deriva estados deterministas de entrega (inmediata si tienda ≥ requerido; CEDIS si solo CEDIS ≥ requerido; insuficiente si ninguno; pedido/balanceo solo informativo) **sin prometer fechas**; calculadora redondea cajas hacia arriba y valida cobertura | `04-sales/05_DELIVERY_OPTIONS.md`, `04-sales/10_PRODUCT_RECOMMENDATIONS.md` | **PENDIENTE** |
| D-V10 | **IA fuera de F4**: complementos y alternativas con **motores deterministas** y explicables (compatibilidad por familia/uso/formato, stock tienda/CEDIS, precio); sin aprendizaje por sucursal ni prioridad aprendida (fase de IA) | `04-sales/09_PROJECT_COMPLETION.md`, `26_AI_PRIORITY_RULES.md`, `27_BRANCH_LEARNING.md` | **PENDIENTE** |
| D-V11 | **Presupuestos en F4**: `sales_budgets` por tienda y vendedora; el gerente los configura (fallback mientras TI cargue en Intelisis); indicadores derivados de la captura manual | `04-sales/22_STORE_BUDGET.md`, `23_SELLER_BUDGETS.md` | **PENDIENTE** |
| D-V12 | **WhatsApp y documentos**: F4 prepara el mensaje de cotización/aviso y abre deep link `wa.me` (el usuario confirma el envío); sin WhatsApp Business API. Cotización imprimible con la vista del navegador, sin PDF formal | `04-sales/14_WHATSAPP_SHARING.md`, `07-crm/11_WHATSAPP.md` | **PENDIENTE** |
| D-V13 | **Historial de stock consumido, no duplicado**: la ficha de ventas usa el historial de 1D (`inventory_change`: anterior/nueva/diferencia/fecha/fuente) | `04-sales/04_STOCK_FOR_SALES.md`, `F1D` (1D.5) | **PENDIENTE** |
| D-V14 | **Auditoría `_audit.sales_events`**: cotización creada/editada/enviada/aceptada/vendida/perdida; captura manual registrada/corregida (corrección guarda anterior/nuevo/usuario/fecha); presupuesto configurado; solicitud CEDIS creada. Append-only, patrón `_audit` 1C.5/1D/F3 | `23-contracts/44_SALES_CRM_EVENTS.md`, `04-sales/21_MANUAL_SALES_CAPTURE.md`, D-C10/D-C18/D-L12 | **PENDIENTE** |

> **GAPs detectados en la investigación que esta propuesta resuelve** (referencia para la
> revisión): GAP-1 numeración ventas/CRM (D-V01); GAP-2 modelo divergente entre packs
> (D-V02); GAP-3 permisos insuficientes (D-V03); GAP-4 precios derivables sin listas (D-V04);
> GAP-5 reservado (D-V05); GAP-6 CEDIS mínima (D-V06); GAP-7 cotización↔venta manual (D-V07);
> GAP-8 impuestos/vigencia (D-V08); GAP-9 búsqueda (D-V01/alcance); GAP-10 stock/entrega
> (D-V09); GAP-11 IA (D-V10); GAP-12 presupuestos (D-V11); GAP-13 WhatsApp (D-V12);
> GAP-14 historial (D-V13); GAP-15 eventos (D-V14).

> **Nota de nomenclatura (solicita confirmación):** se propone rama
> `feature/f4-PG-SALES-007-sales` (f4 = Fase 4; 007 = siguiente número de feature; la serie
> usó 006 para layout). Renombrable antes del primer push.

## 5. Criterios de éxito (derivados del gate de fase y `23-contracts/16_SALES_CRM_ENDPOINTS.md` / `17_QUOTATION_ENDPOINTS.md`)

1. La búsqueda abre el producto exacto (regla de exactitud) y muestra stock tienda/CEDIS con
   fecha y ubicación.
2. La calculadora de m²/cajas redondea hacia arriba, no vende fracciones de caja cuando aplica
   caja cerrada y muestra sobrante/faltante con CEDIS.
3. La ficha muestra complementos, alternativas (máx. 3) y comparador (máx. 3) deterministas y
   explicables.
4. La cotización completa (folio, cliente mínimo, partidas, precios derivados y validados,
   stock, entrega, vigencia, observaciones) puede guardarse, duplicarse, enviarse por WhatsApp
   (confirmación del usuario) e imprimirse.
5. Estados de cotización gestionados (borrador→…→vendida/perdida) con auditoría.
6. La venta manual diaria se captura por vendedora; el gerente corrige **con historial**; la
   suma actualiza venta de tienda y presupuestos.
7. Solicitud CEDIS mínima ligada a la cotización, sin chat.
8. Permisos `sales.*` aplicados (UI + servidor); vendedora ve sus datos, gerente su tienda.
9. Los módulos futuros (CRM, comercialización, CEDIS, apartados, IA, reportes) pueden consumir
   cotizaciones/ventas org-scoped.
10. Todos los gates: lint, typecheck, vitest, build, `db:reset`, `db:test`, `db:lint`,
    `db:verify`, `e2e:auth`, `e2e:identity` y los nuevos de F4.

## 6. Próximos pasos

1. **Revisión humana del kickoff contract** (D-V01…D-V14): aprobar, ajustar o diferir. La
   aprobación debe confirmar explícitamente: vigencia estándar de cotización (D-V08), mapeo
   de permisos `sales.*` por rol (D-V03) y alcance ventas vs. CRM (D-V01).
2. Tras aprobación y con instrucción expresa, generar el paquete documental de F4 (data model
   proposal, RLS/permisos, test plan, slices) y luego la subfase de migración + seed +
   verificación DB.
3. No se crea ninguna migración (siguiente número libre de la secuencia) ni código hasta esa
   aprobación.

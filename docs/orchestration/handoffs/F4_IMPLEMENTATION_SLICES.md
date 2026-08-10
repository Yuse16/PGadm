# F4 — Slices de Implementación (Ventas y cotizaciones — Fase 4)
## Estado: kickoff APROBADO — D-V01…D-V14 APPROVED (2026-08-10); 4.1 COMPLETADA; 4.2… PENDIENTES

**Fecha:** 2026-08-10
**Rama:** `feature/f4-PG-SALES-007-sales`

División de F4 en subfases entregables e incrementales. La subfase 4.1 (kickoff +
paquete documental) está **COMPLETADA**; las subfases restantes **no se inician**
hasta aprobación humana e instrucción expresa.

---

## Visión general

```
4.1  Kickoff + paquete documental (modelo, RLS, test plan)  ← COMPLETADA
  ↓
4.2  Migración SQL + seed + verificación DB  ← PENDIENTE
  ↓
4.3  Dominio y casos de uso (búsqueda, calculadora, cotización, captura,
     presupuestos, CEDIS)  ← PENDIENTE
  ↓
4.4  Repositorios supabase, permisos y seguridad  ← PENDIENTE
  ↓
4.5  UI (búsqueda, ficha, calculadora, cotización, captura, presupuestos)  ← PENDIENTE
  ↓
4.6  Integración (WhatsApp/impresión, solicitud CEDIS) + cierre + handoff  ← PENDIENTE
```

Cada slice: definición de terminado clara, repositorios demo + supabase **sin
fallback silencioso** (patrón D031/D-C22/D-I12/D-L11 extendido a `SALES_DATA_SOURCE`),
sin `service_role` en cliente, ventas nunca escriben inventario/catálogo/precios.

## 4.1 — Kickoff y paquete documental (COMPLETADA)

- `F4_KICKOFF_CONTRACT.md`: alcance, restricciones, D-V01…D-V14 APPROVED (2026-08-10,
  PR #14/#15).
- `F4_DATA_MODEL_PROPOSAL.md`: candidato de 7 tablas (6 de negocio +
  `_audit.sales_events`) + preguntas abiertas.
- `F4_RLS_PERMISSION_MATRIX.md`: permisos `sales.*` (6) + políticas RLS.
- `F4_TEST_PLAN.md`: casos SV-1…SV-47 + no-regresión + seed.
- **Definición de terminado:** solo cambios `.md`; `git diff --check` limpio;
  decisiones registradas como APPROVED en `DECISION_LOG.md` (2026-08-10).

## 4.2 — Migración SQL + seed (PENDIENTE)

- Migración `supabase/migrations/00000000000012_sales.sql` con las tablas del modelo
  aprobado (6 tablas org-scoped + `_audit.sales_events`).
- RLS deny-by-default + políticas allowlist (sección 4 de `F4_RLS_PERMISSION_MATRIX.md`).
- FK compuestas org-scoped a `branches` (1B), `product_variants`/`units_of_measure`
  (1C), `profiles`; `UNIQUE(organization_id, id)` en tablas padre.
- `CHECK btrim() <> ''`, triggers `_core.updated_at()`, sin DELETE, revokes mínimos.
- Cargar permisos `sales.*` (6) y `role_permissions` (matriz D-V03) + fixtures demo
  (clientes, cotizaciones con partidas, capturas, presupuestos, solicitud CEDIS).
- Auditoría `_audit.sales_events` (patrón 1C.5/1D/F3, D-V14) con
  `previous_data`/`new_data` en correcciones.
- **Definición de terminado:** `npm run db:lint`, `npm run db:test`, `npm run db:verify`
  en verde; `npm run db:types` regenera `src/types/database.ts`.
- **Nota:** se actualizan los asserts de conteo de permisos (19 → 25) en
  `test_identity_rbac_rls.sql` y el script e2e si procede.

## 4.3 — Dominio y casos de uso (sin UI) (PENDIENTE)

- `src/features/sales/domain/**`: entidades (Customer, Quotation, QuotationItem,
  ManualSaleEntry, SalesBudget, CedisRequest), reglas (entrega sin fechas, redondeo
  hacia arriba, consistencia precio m²↔caja, vigencia 30 días, sin IVA, cotización y
  venta manual independientes, corrección con historial).
- `src/features/sales/application/**`: use cases (searchProduct, getProductDetail,
  calculateArea, calculateBoxes, suggestComplements, suggestAlternatives,
  compareProducts, createQuotation, editQuotation, duplicateQuotation, sendQuotation,
  acceptQuotation, markQuotationSold, markQuotationLost, registerCustomer,
  captureManualSale, correctManualSale, configureBudget, createCedisRequest).
- Precios/stock como ports de **solo lectura** a 1C/1D (D-V04/D-V05/D-V13); demo
  (`in-memory`) + contrato de interfaz; selección `SALES_DATA_SOURCE` con default
  `demo` y error tipado sin fallback silencioso.
- **Definición de terminado:** tests unit de dominio/use cases
  (`src/tests/features/sales/**`); `npm run lint`/`npm run typecheck`/`npm run test`
  en verde.

## 4.4 — Repositorios Supabase, permisos y seguridad (PENDIENTE)

- Repositorio `supabase` (RLS vía `authenticated`), selección por `SALES_DATA_SOURCE`
  con default `"demo"` y **error explícito** sin fallback silencioso (patrón
  `repository-selection`).
- Registro de permisos `sales.*` con `current_user_permissions()`.
- Tests: SV-33…SV-40 (aislamiento por org, propiedad vendedora, edit_all, deny-by-default),
  `admin-separation` y `feature-security` de ventas.
- **Definición de terminado:** suite de seguridad F4 en verde + `npm run lint`/`typecheck`.

## 4.5 — UI (PENDIENTE)

- Server layer: `src/features/sales/server/{context,session,actions,index}.ts`.
  `requireSalesSession()` (guard `sales.read` → redirect) + flags de UI derivados de
  la sesión RLS-scoped; cada server action re-guarda con `requireSales*`.
- Componentes `src/features/sales/components/**`: búsqueda con regla de exactitud,
  ficha con stock tienda/CEDIS con fecha (1D) y ubicación (F3), calculadora m²/cajas,
  complementos/alternativas (máx. 3), comparador (máx. 3), cotización (folio, cliente,
  partidas, entrega, vigencia, observaciones), captura diaria, presupuestos, solicitud
  CEDIS.
- Páginas bajo `/admin/sales/**`; link en `src/app/page.tsx`.
- **Definición de terminado:** vitest de páginas + `npm run build -- --webpack`
  (nota worktree F3); navegación en desarrollo sin errores.

## 4.6 — Integración y cierre (PENDIENTE)

- WhatsApp: preparación del mensaje de cotización/aviso + deep link `wa.me`
  (confirmación del usuario; sin WhatsApp Business API, D-V12).
- Impresión: cotización imprimible con la vista del navegador (sin PDF formal, D-V12).
- Solicitud CEDIS mínima ligada a la cotización (D-V06).
- **Definición de terminado:** cierre de F4; commit de integración y handoff de la
  siguiente fase (CRM completo, Fase 5).

## Notas de secuenciación

- CRM completo (clientes extendidos, proyectos, oportunidades, seguimientos) queda
  **fuera** de F4 (D-V01) → Fase 5.
- Listas de precios/campañas (D-C06/D-V04) → Fase 6; reservas/apartados y respuesta
  CEDIS/balanceos (D-V05/D-V06) → Fase 7.
- Ninguna subfase introduce `service_role` en cliente.
- Ventas **nunca** escriben inventario/catálogo/precios (D-V05/D-V13).
- No se modifica `seed.sql` hasta 4.2 (prohibido en 4.1).

# F4 — Matriz de Permisos y RLS (Ventas y cotizaciones — Fase 4)
## Estado: candidato propuesto en kickoff; D-V01…D-V14 APPROVED 2026-08-10

**Fecha:** 2026-08-10
**Rama:** `feature/f4-PG-SALES-007-sales`

Diseño RLS deny-by-default y matriz de permisos **candidatos** para las tablas de
ventas, derivado del patrón de F3 (`F3_RLS_PERMISSION_MATRIX.md`) y de
`04-sales/29_PERMISSIONS.md` / `07-crm/28_PERMISSIONS.md`. Reutiliza la infraestructura
de 1B (`_access` helpers, migración 004), el patrón RLS org-scoped de la migración 007
y los patrones de catálogo 1C / inventario 1D / layout F3.

---

## 1. Prerrequisitos existentes (reutilizados, sin cambios)

| Helper / RPC | Origen | Uso en F4 |
|--------------|--------|-----------|
| `_access.current_organization_ids()` | migración 004 | scoping org en todas las políticas |
| `_access.has_permission(text)` | migración 004 | chequear `sales.*` |
| `_access.current_user_id()` | migración 004 | auditoría y `seller_id`/`actor_user_id` |
| `public.current_user_permissions()` | migración 007 | UI (ocultar/mostrar) |
| `permissions` / `role_permissions` | migración 003 | registrar `sales.*` |
| `branches` / `warehouses` (RLS org-scoped) | migraciones 002/007 | FK de `branch_id` |
| `product_variants` / `units_of_measure` (RLS org-scoped) | migraciones 008/007 | FKs de partidas (1C) |
| `profiles` | migraciones 003/004/005 | FK de `seller_id`/`actor_user_id` |
| `user_role_assignments` (borrador RBAC 1B3) | migración 003 | scoping por tienda (D-V03) |

## 2. Permisos propuestos (prefijo `sales.`, D-V03)

| Permiso | Acción permitida | Corresponde a |
|---------|------------------|---------------|
| `sales.read` | Consultar cotizaciones, clientes, capturas, presupuestos y solicitudes | Vendedora: sus datos; gerente: su tienda; operator: solo consulta |
| `sales.quote` | Crear/editar/duplicar cotizaciones propias y ver sus clientes | Vendedora |
| `sales.capture_own` | Capturar ventas propias (crear su captura diaria) | Vendedora |
| `sales.edit_all` | Ver/corregir todas las ventas y cotizaciones; corregir captura con historial | Gerente |
| `sales.budget_manage` | Configurar presupuestos por tienda y vendedora | Gerente |
| `sales.cedis_request` | Crear solicitudes a CEDIS | Vendedora |

## 3. Matriz de roles (D-V03, aprobada)

| Rol | sales.read | sales.quote | sales.capture_own | sales.edit_all | sales.budget_manage | sales.cedis_request |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|
| `administrator` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `cashier` (vendedora) | ✓ | ✓ | ✓ | — | — | ✓ |
| `operator` | ✓ | — | — | — | — | — |

> Mapeo (D-V03): `cashier` = vendedora (read/quote/capture_own/cedis_request);
> `manager` = gerente (+ edit_all/budget_manage); `operator` = solo consulta;
> `administrator` = todos. Los `role_permissions` correspondientes se cargan en
> `seed.sql` en la subfase 4.2 (total permisos: 19 actuales + 6 `sales.*` = 25).

## 4. Políticas RLS propuestas por tabla (todas con `ENABLE ROW LEVEL SECURITY`)

Patrón común:
- **SELECT**: `organization_id = any(_access.current_organization_ids())` **AND**
  `_access.has_permission('sales.read')` **AND** (propia `seller_id =
  _access.current_user_id()` **OR** `_access.has_permission('sales.edit_all')`).
- **INSERT / UPDATE**: permiso de la operación + org match; la fila solo puede
  asignarse al usuario actual (o a su tienda vía `user_role_assignments`) salvo
  `sales.edit_all`.
- **DELETE**: sin políticas (prohibido) **y** `REVOKE DELETE` a `authenticated`
  (historial append-only).

> Nota de scoping por tienda: la fila de un gerente se limita a su tienda
> (`branch_id` dentro de las branches de `user_role_assignments` vigentes del usuario).
> Mientras el borrador RBAC 1B3 no esté operativo, la política usa la base org-scoped +
> propiedad (vendedora propia vs. `sales.edit_all`); el refinamiento por tienda se
> añade con `user_store_role` (pregunta abierta §5 de `F4_DATA_MODEL_PROPOSAL.md`).

### 4.1 `customers`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` AND (`assigned_seller_id = current_user_id()` OR `sales.edit_all`) |
| INSERT | `sales.quote` AND org match AND `assigned_seller_id = current_user_id()` |
| UPDATE | `sales.quote` AND org match AND (propio OR `sales.edit_all`) |
| DELETE | — (sin política; baja por `status='inactive'`) |

### 4.2 `quotations`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` AND (`seller_id = current_user_id()` OR `sales.edit_all`) |
| INSERT | `sales.quote` AND org match AND `seller_id = current_user_id()` |
| UPDATE | `sales.quote` AND org match AND (propio OR `sales.edit_all`) |
| DELETE | — (sin política) |

> Transiciones de estado (`draft→sent→accepted→sold`, `expired`, `lost`) validadas en
> la capa de aplicación/use case (D-V07/D-V14); la UI solo oculta botones.

### 4.3 `quotation_items`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` AND (cotización propia OR `sales.edit_all`) |
| INSERT / UPDATE | `sales.quote` AND org match AND (cotización propia OR `sales.edit_all`) |
| DELETE | — (sin política; se corrige la cotización, no se borra historial) |

### 4.4 `manual_sale_entries`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` AND (`seller_id = current_user_id()` OR `sales.edit_all`) |
| INSERT | `sales.capture_own` AND org match AND `seller_id = current_user_id()` |
| UPDATE | `sales.edit_all` AND org match (corrección del gerente **con historial**) |
| DELETE | — (sin política) |

### 4.5 `sales_budgets`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` |
| INSERT / UPDATE | `sales.budget_manage` AND org match (`branch_id` de la misma org) |
| DELETE | — (sin política; baja por `status='archived'`) |

### 4.6 `cedis_requests`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` AND (propio OR `sales.edit_all`) |
| INSERT | `sales.cedis_request` AND org match AND `seller_id = current_user_id()` |
| UPDATE | — (sin política en F4; respuesta/estado → Fase 7, D-V06) |
| DELETE | — (sin política) |

### 4.7 `_audit.sales_events`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `sales.read` |
| INSERT | permiso de la operación (`sales.quote`/`capture_own`/`edit_all`/`budget_manage`/`cedis_request`) AND org match (generado por use cases) |
| UPDATE | — (sin política; append-only) |
| DELETE | — (sin política) |

## 5. Defensa en profundidad

- El cliente usa `authenticated`; `service_role` **nunca** en cliente (patrón
  `feature-security`).
- La creación de cotización, captura, presupuesto, solicitud CEDIS y las transiciones
  de estado se realizan mediante **use case / RPC controlado** (un solo camino de
  escritura), no por UPDATE directo del cliente (patrón 1C §5 / 1D §5 / F3 §5).
- Las validaciones de negocio (no escribir inventario, precios derivados de 1C,
  redondeo hacia arriba, entrega sin fechas, corrección con historial) viven en la
  capa de aplicación/DB; la UI solo oculta botones vía `current_user_permissions()`.
- Auditoría `_audit.sales_events` (D-V14) con `previous_data`/`new_data` en
  correcciones, append-only (patrón `_audit` 1C.5/1D/F3).

## 6. Principios (heredados)

- **Deny-by-default**: RLS habilitado en las 6 tablas + `_audit.sales_events`; sin
  excepción `service_role`.
- Prefijos `sales.*` siguen la convención `{dominio}.{accion}` de `10-arch/10`.
- `current_user_permissions()` alimenta la UI; la base valida siempre.
- Sin DELETE físico en ninguna tabla de ventas (cotizaciones, captura, presupuestos y
  solicitudes conservadas; append-only).
- Ventas **nunca** escriben inventario/catálogo/precios (D-V05/D-V13).

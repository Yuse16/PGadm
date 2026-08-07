# F1D — Matriz de Permisos y RLS PROPUESTA (Inventario — Fase 2)
## Estado: PROPUESTA — pendiente de revisión humana (D-I01…D-I14)

**Fecha:** 2026-08-06
**Rama:** `feature/f1d-PG-INVENTORY-005-inventory`

Diseño RLS deny-by-default y matriz de permisos **candidatos** para las tablas de
inventario, derivado de `05-inventory/30_PERMISSIONS.md`. Reutiliza la
infraestructura de 1B (`_access` helpers, migración 004), el patrón RLS org-scoped de
la migración 007 y el patrón de catálogo 1C.

---

## 1. Prerrequisitos existentes (reutilizados, sin cambios)

| Helper / RPC | Origen | Uso en 1D |
|--------------|--------|-----------|
| `_access.current_organization_ids()` | migración 004 | scoping org en todas las políticas |
| `_access.has_permission(text)` | migración 004 | chequear `inventory.*` |
| `_access.current_user_id()` | migración 004 | auditoría y `imported_by`/`created_by` |
| `public.current_user_permissions()` | migración 007 | UI (ocultar/mostrar) |
| `permissions` / `role_permissions` | migración 003 | registrar `inventory.*` |
| `warehouses` (RLS org-scoped) | migraciones 002/007 | FK de snapshot/change/observation |

## 2. Permisos propuestos (prefijo `inventory.`)

| Permiso | Acción permitida | Corresponde a (`05-inventory/30_PERMISSIONS.md`) |
|---------|------------------|--------------------------------------------------|
| `inventory.read` | Consultar stock, historial básico y observaciones de orgs propias | Vendedora: consultar stock, ver historial básico; Almacén: consultar |
| `inventory.import` | Cargar/validar archivo, detectar hojas/columnas/almacenes, mapear, previsualizar | Gerente: importar archivo |
| `inventory.approve` | Aprobar línea base/importación → crear snapshot + cambios + eventos; confirmar observaciones; configurar umbrales | Gerente: revisar errores, aprobar, configurar umbrales |
| `inventory.observe` | Registrar observaciones manuales (conteo físico, daño, apartado, etc.) | Almacén: reportar conteo/recepción/daño; Vendedora: reportar diferencia |

## 3. Matriz de roles (propuesta — requiere validación con negocio, D-I10)

| Rol | inventory.read | inventory.import | inventory.approve | inventory.observe |
|-----|:---:|:---:|:---:|:---:|
| `administrator` | ✓ | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | ✓ | ✓ |
| `cashier` | ✓ | — | — | ✓ (reportar diferencia) |
| `operator` | ✓ | — | — | ✓ |

> Pregunta abierta (D-I10): las capacidades de "Almacén" y "Comercial" de
> `30_PERMISSIONS.md` (reportar recepción/daño, comparar sucursales, revisar alertas)
> no encajan 1:1 con los 4 roles existentes. Se propone mapear la función "Almacén" al
> permiso `inventory.observe` y "Comercial" a `inventory.read`; si el negocio requiere
> roles distintos, se amplía el catálogo en la migración de 1D.

Los `role_permissions` correspondientes se cargarían en `seed.sql` en la subfase 1D.2.

## 4. Políticas RLS propuestas por tabla (todas con `ENABLE ROW LEVEL SECURITY`)

Patrón común:
- **SELECT**: `organization_id = any(_access.current_organization_ids())` **AND**
  `_access.has_permission('inventory.read')`.
- **INSERT / UPDATE**: permiso de la operación + `organization_id` dentro de las orgs
  del usuario.
- **DELETE**: sin políticas (prohibido) **y** `REVOKE DELETE` a `authenticated`
  (snapshots/cambios/observaciones son históricos).

### 4.1 `inventory_snapshot`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `inventory.read` |
| INSERT | `inventory.approve` AND org match (`report_date`/`warehouse_id` de la misma org) |
| UPDATE | `inventory.approve` AND org match (solo metadatos; cantidad inmutable) |
| DELETE | — (sin política; histórico) |

### 4.2 `inventory_snapshot_item`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `inventory.read` |
| INSERT | `inventory.approve` AND org match (`snapshot_id`/`variant_id` de la misma org, FK compuestas) |
| UPDATE | — (sin política; el snapshot aprobado es inmutable) |
| DELETE | — (sin política) |

### 4.3 `inventory_change`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `inventory.read` |
| INSERT | `inventory.approve` AND org match (generado al aprobar snapshot) |
| UPDATE | — (sin política; append-only) |
| DELETE | — (sin política) |

### 4.4 `inventory_observation`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `inventory.read` |
| INSERT | `inventory.observe` AND org match |
| UPDATE | `inventory.approve` AND org match (confirmar/cerrar observación) |
| DELETE | — (sin política) |

### 4.5 `import_template`

| Operación | Condición RLS propuesta |
|-----------|------------------------|
| SELECT | org match AND `inventory.read` |
| INSERT / UPDATE | `inventory.import` AND org match |
| DELETE | — (sin política; baja por `status`) |

## 5. Defensa en profundidad

- El cliente usa `authenticated`; `service_role` **nunca** en cliente (patrón
  `feature-security`).
- La aprobación de importación y la generación de cambios/eventos se realizan mediante
  **use case / RPC controlado** (un solo camino de escritura), no por UPDATE directo
  del cliente (defensa en profundidad; patrón 1C §5).
- Las validaciones de negocio (línea base antes de cambios, ausente ≠ stock cero,
  solo cambios) viven en la capa de aplicación/DB; la UI solo oculta botones vía
  `current_user_permissions()`.
- Auditoría de eventos de inventario (aprobar importación, crear observación, confirmar)
  usando el patrón `_audit` de 1C.5 (D-C10/D-C18) — a confirmar en D-I02.

## 6. Principios (heredados)

- **Deny-by-default**: RLS habilitado en las 5 tablas; sin excepción `service_role`.
- Prefijos `inventory.*` siguen la convención `{dominio}.{accion}` de `10-arch/10`.
- `current_user_permissions()` alimenta la UI; la base valida siempre.
- Sin DELETE físico en ninguna tabla de inventario.

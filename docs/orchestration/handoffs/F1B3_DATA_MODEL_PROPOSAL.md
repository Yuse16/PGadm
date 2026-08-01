# F1B.3 — Propuesta de modelo de datos (identidad y RBAC)
## Planificación — no implementado

**Fecha:** 2026-07-31
**Estado:** Propuesta preliminar para revisión humana. Sujeta a decisiones de diseño del turno 1B.3.

---

## 1. Tablas propuestas

Modelo candidato derivado de `23-contracts/27_AUTH_SCHEMA`, `14-admin/08`, `14-admin/12`, `14-admin/44` y las anclas de 1B.2 (D13/D14).

### `app_user`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK default `gen_random_uuid()` | |
| `organization_id` | uuid FK → `organizations.id` | ancla de scoping (D13) |
| `auth_user_id` | uuid | referencia a `auth.users`; único; se resuelve el vínculo exacto en el turno 1B.3 |
| `display_name` | text not null | |
| `status` | text + CHECK (`active`/`inactive`) | consistente con 1B.2 |
| `created_at` / `updated_at` | timestamptz | trigger `_core.set_updated_at_column` |

### `role`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | roles configurables por organización (08_ROLE_MODEL) |
| `code` | text | único por organización |
| `name` | text | |
| `status` | text + CHECK | |

Seed propuesto (catálogo configurable, no codificado): `seller`, `store_manager`, `warehouse_operator`, `warehouse_manager`, `cedis_manager`, `logistics_manager`, `commercial_manager`, `administrator`.

### `permission`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `code` | text unique | `inventory.read`, `inventory.import`, `layout.edit`, `sales.capture_own`, `sales.edit_all`, `commercialization.approve`, `supply.accept`, `ai.manage_rules` (10-AUTHORIZATION) |

### `role_permission`

| Columna | Tipo | Notas |
|---------|------|-------|
| `role_id` | uuid FK → `role` | |
| `permission_id` | uuid FK → `permission` | |
| | | único `(role_id, permission_id)` |

### `user_store_role`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → `app_user` | |
| `branch_id` | uuid FK → `branches` | **sucursal** (12_USER_STORE_ROLES) |
| `role_id` | uuid FK → `role` | |
| `valid_from` / `valid_to` | timestamptz | vigencia |
| `status` | text + CHECK | |
| `assigned_by` | uuid FK → `app_user` | |
| | | único `(user_id, branch_id, role_id, valid_from)` |

### `session` (candidata)

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → `app_user` | |
| `started_at` / `ended_at` | timestamptz | |
| | | **A validar:** Supabase Auth ya gestiona sesiones; posiblemente se elimine la tabla propia |

## 2. Estrategia RLS

1. `app_user`: política para que cada autenticado solo vea/edite su propia fila (`auth.uid() = auth_user_id`).
2. Tablas de negocio (organizations/branches/warehouses/relations): política `using (organization_id = ...)` derivada del `app_user` del llamante.
3. Roles/permisos: lectura por organización; escritura restringida a rol `administrator`.
4. La interfaz oculta acciones no permitidas, **y el servidor valida el permiso de todos modos** (10-AUTHORIZATION).

## 3. Regla de sucursal activa

- Los permisos se resuelven usando la sucursal activa del usuario (`user_store_role` vigente), no la organización completa (12_USER_STORE_ROLES).
- La selección de sucursal activa se decide en 1B.3 (sesión vs. resolución por vigencia).

## 4. Interacción con el esquema 1B.2

- Sin cambios estructurales sobre `organizations`/`branches`/`warehouses`; solo se añaden políticas RLS.
- `user_store_role.branch_id` referencia `branches` — requiere el mismo patrón de FK compuesta si se quiere garantizar misma organización (como en 1B.2 D03).

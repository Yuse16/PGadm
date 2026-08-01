# F1B.3 — Borrador de matriz RBAC (planificación — no implementado)
## Roles, permisos y resolución por sucursal activa

**Fecha:** 2026-07-31
**Estado:** Borrador para revisión humana en el turno 1B.3. Fuentes: `14-admin/08_ROLE_MODEL`, `14-admin/12_USER_STORE_ROLES`, `10-architecture/10_AUTHORIZATION`, `23-contracts/27_AUTH_SCHEMA`.

---

## 1. Roles seed propuestos (catálogo configurable, no codificado)

| code | nombre | Dominio principal |
|------|--------|-------------------|
| `seller` | Vendedora | Ventas en tienda |
| `store_manager` | Gerente de tienda | Operación de tienda |
| `warehouse_operator` | Operador de almacén | Inventario |
| `warehouse_manager` | Jefe de almacén | Inventario / almacén |
| `cedis_manager` | Gerente de CEDIS | Distribución |
| `logistics_manager` | Jefe de logística | Fulfillment / abastecimiento |
| `commercial_manager` | Jefe comercial | Comercialización |
| `administrator` | Administrador | Administración global |

Regla (08_ROLE_MODEL): los roles deben ser configurables y no depender de nombres codificados.

## 2. Permisos específicos (10_AUTHORIZATION)

| code | Descripción |
|------|-------------|
| `inventory.read` | Lectura de existencias |
| `inventory.import` | Importación de inventario |
| `layout.edit` | Edición de layout |
| `sales.capture_own` | Captura de ventas propias |
| `sales.edit_all` | Edición de ventas de todos |
| `commercialization.approve` | Aprobación de comercialización |
| `supply.accept` | Aceptación de abastecimiento |
| `ai.manage_rules` | Gestión de reglas de IA |

Regla: la interfaz oculta acciones no permitidas, **y el servidor también debe validarlas**.

## 3. Matriz rol → permiso (borrador)

| Permiso | seller | store_manager | warehouse_operator | warehouse_manager | cedis_manager | logistics_manager | commercial_manager | administrator |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `inventory.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `inventory.import` | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `layout.edit` | — | ✅ | — | — | — | — | ✅ | ✅ |
| `sales.capture_own` | ✅ | ✅ | — | — | — | — | — | ✅ |
| `sales.edit_all` | — | ✅ | — | — | — | — | ✅ | ✅ |
| `commercialization.approve` | — | — | — | — | — | — | ✅ | ✅ |
| `supply.accept` | — | ✅ | — | ✅ | ✅ | ✅ | — | ✅ |
| `ai.manage_rules` | — | — | — | — | — | — | — | ✅ |

**Pendiente:** validar esta matriz con el negocio (documento borrador, no decisión final).

## 4. Resolución de permisos por sucursal activa (12_USER_STORE_ROLES)

- Un usuario puede tener responsabilidades distintas por sucursal (`user_store_role`).
- Los permisos se resuelven usando la **sucursal activa**, no la organización completa.
- `user_store_role` lleva: usuario, sucursal, rol, fecha inicio/fin, estado, asignado por.
- El borrador de modelo está en `F1B3_DATA_MODEL_PROPOSAL.md`; este turno NO implementa nada de esto.

## 5. RLS futura (preparación)

- Tablas de negocio 1B.2 ya tienen `organization_id` → RLS por organización viable sin migración estructural.
- `app_user` autoconsultable por `auth.uid()`.
- Escritura de catálogos restringida a `administrator` (validar con negocio).

# F1B.3 — Discovery: Identidad, sesiones y RBAC
## Exploración previa (planificación — sin implementación)

**Fecha:** 2026-07-31
**Estado:** Borrador de planificación generado en el turno nocturno de 1B.2. Nada de esto está implementado.

---

## 1. Alcance propuesto de la fase

- Usuarios y perfiles de aplicación (`app_user`), sesiones, roles, permisos y asignaciones por sucursal (`user_store_role`).
- Autorización RBAC funcional (interfaz oculta + validación en servidor).
- RLS por `organization_id` / sucursal activa sobre las tablas de negocio de 1B.2 y siguientes.
- Login/logout con Supabase Auth.

## 2. Fuentes verificadas en packs

| Fuente | Contenido relevante |
|--------|----------------------|
| `23-contracts/27_AUTH_SCHEMA.md` | Tablas propuestas: `app_user`, `role`, `permission`, `role_permission`, `user_store_role`, `session` |
| `14-admin/08_ROLE_MODEL.md` | Roles iniciales: Vendedora, Gerente de tienda, Operador de almacén, Jefe de almacén, Gerente de CEDIS, Jefe de logística, Jefe comercial, Administrador. **Regla: configurables, no nombres codificados** |
| `14-admin/12_USER_STORE_ROLES.md` | Un usuario puede tener responsabilidades distintas por sucursal (`UserStoreRole`: usuario, sucursal, rol, fechas, estado, asignado por). Permisos resueltos con la **sucursal activa** |
| `14-admin/44_DATA_MODEL.md` | Entidades esperadas: Organization, Store, User, Role, Permission, RolePermission, UserStoreRole, FeatureFlag, IntegrationConfiguration, AuditLog |
| `10-architecture/10_AUTHORIZATION.md` | RBAC con permisos específicos (`inventory.read`, `inventory.import`, `layout.edit`, `sales.capture_own`, `sales.edit_all`, `commercialization.approve`, `supply.accept`, `ai.manage_rules`). La interfaz oculta acciones no permitidas **y el servidor también debe validarlas** |
| `10-architecture/13_CORE_ENTITIES.md` | Entidades núcleo incluyen `UserStoreRole` |

## 3. Dependencias con 1B.2 (verificadas)

- `organizations.id`, `branches.id` y `warehouses.id` son las anclas de scoping para el RBAC futuro (decisiones D13/D14 de la matriz 1B.2).
- `organization_id` ya existe en todas las tablas de negocio → habilita RLS por organización sin migración adicional de estructura.
- La fase 1B.2 no implementa login: la navegación a `/admin/organization` es libre y muestra estado seguro sin credenciales.

## 4. Preguntas abiertas para el siguiente turno

1. ¿`app_user` se vincula 1:1 con `auth.users` de Supabase o se mantiene separada con `auth_user_id uuid references auth.users(id)`?
2. ¿Sesión propia (`session`) o se delega 100% a Supabase Auth? El pack la lista, pero Supabase ya gestiona sesiones.
3. ¿Los roles seed (Vendedora…Administrador) se siembran como catálogo configurable o se dejan para administración en runtime?
4. ¿La "sucursal activa" se almacena en sesión/cliente o se resuelve por `user_store_role` vigente?
5. ¿`feature_flag` e `integration_configuration` entran en 1B.3 o se difieren?

## 5. Riesgos identificados

- Si el rol seed se vuelve "configurable en runtime", el CHECK de catálogo rígido no aplica: requiere tabla `role` + semilla, no constraint.
- RLS por sucursal activa es más complejo que RLS por organización: evaluar primero RLS por `organization_id`, luego por sucursal donde aplique.
- Supabase Auth + RLS exigen que `anon` solo vea su propio `app_user`; los permisos de lectura de negocio dependen de políticas, no de grants.

# F1B.3 — Diseño de políticas RLS (1B.3C)
## Migración 00000000000004_identity_rbac_rls.sql

**Fecha:** 2026-08-03 (turno nocturno 1B.3C)
**Base:** rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`, HEAD `e584ef5`.
**Estado:** Implementado en migración 004. Las subfases 1B.3A/1B.3B quedaron cerradas; **1B.3D permanece PENDING**.

---

## 1. Alcance y fuentes

- Tablas bajo RLS (solo las 6 de identidad, según contrato):
  `profiles`, `organization_memberships`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`.
- Tablas 1B.2 (`organizations`, `branches`, `warehouses`, `branch_warehouse_relations`) **no** entran en 004;
  su RLS se entrega en una fase posterior (contrato 1B.3C lista explícitamente las 6 tablas).
- Fuentes: `F1B3_DECISION_MATRIX` D04, D05, D06, D07, D11–D19, D22; `F1B3_THREAT_MODEL` T01–T15;
  `F1B3_ACCESS_TEST_MATRIX` ACC-01..12, 15, 17..21; `10-architecture/10_AUTHORIZATION` (allowlist).

## 2. Auditoría empírica (ejecutada sobre el stack local antes de escribir 004)

| Ítem auditado | Hallazgo real (BD local, `docker exec psql`) |
|---|---|
| Rol que dispara `profiles_after_auth_insert` | GoTrue inserta en `auth.users` como **`supabase_auth_admin`** (rol interno LOGIN). El trigger `AFTER INSERT` ejecuta `_core.sync_profile()` con `security invoker` → corre con los privilegios de `supabase_auth_admin`. |
| Privilegios actuales de `supabase_auth_admin` sobre `public.profiles` | **Ninguno** (`relacl` = solo `postgres=arwdDxt/postgres`). |
| ACL de anon/authenticated/service_role | **Ninguno** sobre las 6 tablas (revokes 002/003). |
| `_core.sync_profile()` | `security invoker`, `search_path=public, _core`, insert `on conflict do nothing`. |
| RLS actual | `relrowsecurity = f` en las 6 tablas (dueño `postgres`). |
| Auth local | `[auth] enabled = false` en `config.toml` → **no hay servidor GoTrue corriendo**; el schema `auth` y el trigger existen en la BD, pero el signup E2E no es ejercitable en 1B.3C (se habilita en 1B.3D). |
| `set role` local | `postgres` puede `SET ROLE anon/authenticated/service_role` (miembro). No puede `SET ROLE supabase_auth_admin`. |
| CI | `pr-validation.yml` aplica 001→004 + seed sobre **PostgreSQL 15 plano** (sin schema `auth`, sin roles `anon/authenticated/service_role/supabase_auth_admin`) y ejecuta `pg_prove supabase/tests/*.sql`. |

### 2.1 Conclusión sobre `_core.sync_profile()` → excepción documentada a D15

Con RLS activa en `profiles`, el trigger de sincronización falla de dos formas según el privilegio:

1. **Hoy** (sin grant): `supabase_auth_admin` no tiene INSERT → `permission denied` (SQLSTATE 42501) → el `INSERT INTO auth.users` de GoTrue falla → **el registro de usuarios se rompe**.
2. **Si se le diera grant sin política**: RLS insertaría 0 filas en silencio → el perfil nunca se crea (falla silenciosa, peor).

Una política `FOR INSERT TO supabase_auth_admin` no es viable: `auth.uid()` es `NULL` para ese rol interno (no hay JWT), y el `WITH CHECK` quedaría como "cualquier fila" para un rol con capacidad insert directa no anclada a identidad.

**Decisión:** `_core.sync_profile()` pasa a **`SECURITY DEFINER`** (patrón oficial Supabase para `handle_new_user`), con el endurecimiento completo:
- `SET search_path = ''` (referencias totalmente calificadas en el cuerpo: `public.profiles`).
- `REVOKE ALL ON FUNCTION _core.sync_profile() FROM PUBLIC`; `GRANT EXECUTE` solo a `supabase_auth_admin` (guarded por existencia; el disparo por trigger no exige EXECUTE, pero se deja explícito).
- Súperficie de escalación: el cuerpo solo hace `INSERT ... ON CONFLICT (id) DO NOTHING` con `new.id`/`new.email` controlados por GoTrue; no lee, no actualiza, no toca otras tablas; solo es alcanzable vía el trigger de `auth.users` (que solo GoTrue ejecuta).
- Verificación E2E real (signup) es de **1B.3D** (auth habilitado); en 1B.3C se verifican estructura + escalación (tests ACC-18/19) y se documenta el riesgo.

### 2.2 Conclusión sobre helpers `_access` → excepción documentada a D15 (recursión)

Los helpers que resuelven autorización leen las propias tablas protegidas. Si fueran `security invoker`:

- Una política sobre `organization_memberships` que llama `current_organization_ids()` (que lee `organization_memberships`) → **recursión RLS infinita** → SQLSTATE 42P17.
- Una política sobre `roles`/`user_role_assignments` que llama `has_permission()` (que une esas mismas tablas) → recursión, y además el invoker vería datos filtrados por RLS → resultados incorrectos.

**Decisión:** helpers de resolución en `_access` como **`SECURITY DEFINER`** con `SET search_path=''`, esquema completo, EXECUTE revocado de PUBLIC y concedido solo a `authenticated`. Sin `SECURITY DEFINER` no hay forma de resolver permisos desde una política sin recursión ni resultados filtrados → indispensable (requisito del contrato: "helpers mínimos sin generar recursión").

Lista blanca de funciones `SECURITY DEFINER` (única permitida en `_core`/`_access`):

| Función | Razón |
|---|---|
| `_core.sync_profile()` | Sync 1:1 auth→profiles bajo RLS (2.1) |
| `_access.current_organization_ids()` | Políticas de org-scope; evita recursión en membership/roles/assignments |
| `_access.has_permission(text)` | Resolución de permisos RBAC desde políticas; evita recursión y filtrado |
| `_access.role_in_own_orgs(uuid)` | Validación de rol en políticas de escritura de catálogo/assignments |
| `_access.role_belongs_to_organization(uuid, uuid)` | Validador estructural (trigger 6.1 de 003); autoritativo independiente del RLS del invoker |

`_access.current_user_id()` permanece **`SECURITY INVOKER`** (solo lee el GUC `request.jwt.claim.sub`, sin acceso a tablas → sin recursión).

## 3. Helpers `_access` (implementación)

### 3.1 `_access.current_user_id() -> uuid` — SECURITY INVOKER
Replica `auth.uid()` leyendo el claim JWT `sub` (PostgREST lo fija por petición) sin depender del schema `auth` → **funciona igual en PG15 plano (CI) y Supabase**.
- `NULL` si el claim está ausente, vacío o no es UUID válido.

### 3.2 `_access.current_organization_ids() -> uuid[]` — SECURITY DEFINER
Orgs con membresía **activa** de perfil **activo** del usuario actual. Vacío si no hay membresía → RLS devuelve 0 filas (ACC-05/06/09, T04/T05/T07).

### 3.3 `_access.has_permission(p_code text) -> boolean` — SECURITY DEFINER
Verdadero si existe una asignación activa del usuario (perfil activo, membresía activa, rol activo, permiso activo, ventana `valid_from`/`valid_to` vigente) que otorgue `p_code`. **Ignora cualquier claim distinto de `sub`** (ACC-17, T04/T13).

### 3.4 `_access.role_in_own_orgs(p_role_id uuid) -> boolean` — SECURITY DEFINER
Rol global o de una organización del usuario actual (refuerza org-scope en escrituras).

## 4. Matriz de políticas (allowlist; sin `USING (true)` ni `WITH CHECK (true)`)

Todas las políticas son `TO authenticated`. Resolución de identidad **siempre** vía `_access.current_user_id()` (nunca de un valor de payload → ACC-15, D12/D13).

| Tabla | Operación | Política | Expresión | Casos |
|---|---|---|---|---|
| `profiles` | SELECT | `profiles_select_own` | `id = current_user_id()` | ACC-05/09 |
| `profiles` | UPDATE (solo columnas `full_name`, `phone`, `email`) | `profiles_update_own` | `id = current_user_id()` | — |
| `profiles` | INSERT/DELETE | — (sin política ni grant) | — | sync/seed por owner |
| `organization_memberships` | SELECT | `organization_memberships_select_org` | `organization_id = any(current_org_ids())` | ACC-01 |
| `organization_memberships` | INSERT/UPDATE/DELETE | `organization_memberships_{insert,update,delete}_admin` | org en propias + `has_permission('user.assign')` | ACC-02/11/15 |
| `roles` | SELECT | `roles_select_org` | `organization_id is null or organization_id = any(current_org_ids())` | ACC-01 |
| `roles` | INSERT/UPDATE/DELETE | `roles_{insert,update,delete}_admin` | org en propias o global + `has_permission('role.manage')` | ACC-10/12 |
| `permissions` | SELECT/INSERT/UPDATE/DELETE | `permissions_*_admin` | `has_permission('role.manage')` | ACC-12 |
| `role_permissions` | SELECT/INSERT/UPDATE/DELETE | `role_permissions_*_admin` | `has_permission('role.manage') and role_in_own_orgs(role_id)` | ACC-12 |
| `user_role_assignments` | SELECT | `user_role_assignments_select_own` | `user_id = current_user_id() or (org en propias and has_permission('user.assign'))` | ACC-04/10/11 |
| `user_role_assignments` | INSERT/UPDATE/DELETE | `user_role_assignments_{insert,update,delete}_admin` | org en propias + `has_permission('user.assign')` + `role_in_own_orgs(role_id)` | ACC-02/04/11/15 |

Notas de seguridad:
- Un usuario **no puede** cambiar su propio `status` en `profiles` (grant por columnas: solo `full_name`, `phone`, `email`) → no hay auto-reactivación de `inactive` (refuerza ACC-05, D19).
- El administrador (global) ve/escribe solo las organizaciones de sus asignaciones (`any(current_org_ids())`) → un admin de Org A no cruza a Org B (aislamiento también para admins).
- `user_role_assignments`: los UPDATE de un usuario sobre su propia fila son denegados (la rama "own" solo aplica a SELECT) → ACC-11 (autoasignación) → 0 filas.

## 5. Matriz de grants (nunca `GRANT ALL`)

| Rol | Privilegios |
|---|---|
| `authenticated` | SELECT en las 6; UPDATE (`full_name`,`phone`,`email`) en `profiles`; INSERT/UPDATE/DELETE en las 5 de org/catálogo (acotadas por políticas admin); USAGE en `_access`; EXECUTE en los helpers `_access` |
| `anon` | **Ninguno** → `permission denied` (42501) en tablas de negocio (ACC-08, D17) |
| `service_role` | **Ninguno** → aislada, server-only (ACC-13, D09/T09); la feature no la usa |
| `PUBLIC` | **Ninguno** (revokes 002/003/004) |
| `supabase_auth_admin` | EXECUTE en `_core.sync_profile()` (guarded) |

Cada privilegio otorgado tiene una política equivalente ("grants mínimos con políticas equivalentes", D18).

## 6. Decisiones clave

| Decisión | Elección | Justificación |
|---|---|---|
| Roles de runtime en migración | **Crear** `anon`/`authenticated`/`service_role` NOLOGIN si no existen | Las políticas `TO authenticated` y los grants exigen el rol; en PG15 plano (CI) no existen. Crearlos hace **determinista** el conjunto de tests RLS en ambos entornos. En Supabase ya existen → skip guarded. |
| FORCE ROW LEVEL SECURITY | **NO** se fuerza (`relforcerowsecurity = false`) | FORCE sujeta al dueño (postgres, usado por seed y migraciones) a RLS → el seed insertaría 0 filas en silencio y rompería el bootstrap. Los roles PostgREST (anon/authenticated/service_role) no son dueños → RLS ya se aplica sin FORCE. (ACC-20 se valida con `relrowsecurity=true` + `force=false` documentado.) |
| `sync_profile` | SECURITY DEFINER (excepción D15 documentada) | Ver §2.1 |
| Helpers `_access` | SECURITY DEFINER (excepción D15 documentada) | Ver §2.2 (recursión 42P17) |
| Ancla de identidad | `request.jwt.claim.sub` (GUC de PostgREST) | Equivalente a `auth.uid()`; independiente del schema `auth` → CI-safe y Supabase-safe |

## 7. Rollback (documentado, no destructivo)

No se crea un archivo físico `down/`: `supabase db reset` aplica los `*.sql` del directorio de migraciones y un archivo `00000000000004_down.sql` sería ejecutado automáticamente, desactivando la RLS que los tests validan. Los pasos de rollback (manuales, orden inverso de dependencias) son:

1. `drop policy` de las 6 tablas (todas las creadas en 004).
2. `alter table ... disable row level security` (6 tablas).
3. Revocar grants de 004 (tablas/`_access`/funciones).
4. `drop function` helpers `_access` nuevos y restaurar 003 (o revertir `create or replace`).
5. Roles de runtime: no se eliminan (los creó Supabase; en CI son efímeros).

## 8. Mapa de casos ACC → pruebas

| Caso | Prueba pgTAP (test_identity_rbac_rls.sql) |
|---|---|
| ACC-01 A no lee Org B | membership/roles de Demo B = 0 filas para user_A; propias ≥ 1 |
| ACC-02 A no escribe Org B | insert/update con org B → 0 filas |
| ACC-04 NOG no accede a SAL | assignments con branch SAL = 0; own assignment NOG = 1 |
| ACC-05 perfil inactive | user_IN → 0 filas org |
| ACC-06 membresía inactive | fixture memb. inactive → 0 filas |
| ACC-07 rol inactive | `has_permission` false al inactivar rol |
| ACC-08 anon | `throws_ok` 42501 en las 6 tablas |
| ACC-09 authenticated sin membresía | user_NOM → 0 filas (sin error) |
| ACC-10 rol insuficiente | user_X update roles → 0 filas |
| ACC-11 autoasignación | update/insert assignment propio → 0 filas |
| ACC-12 catálogo no editable | user_X update role_permissions/permissions → 0 filas |
| ACC-15 payload org ajena | insert explícito con org B → 0 filas |
| ACC-17 claims forjados | sub=user_X + claims falsos → sigue denegado |
| ACC-18 sin definer no autorizados | lista blanca exacta + lockdown (search_path, EXECUTE) |
| ACC-19 search_path fijo | proconfig de helpers definer = `search_path=` |
| ACC-20 RLS activa | `relrowsecurity` true en las 6; `force` false documentado |
| ACC-21 sin políticas permisivas | ninguna política `using/with check (true)` |
| Extras | claim ausente/vacío/UUID inválido/usuario inexistente; assignment inactive; assignment vencida; cruce de sucursales; ausencia de recursión (lives_ok en las 6); admin autorizado funciona (parcial ACC-16) |

## 9. Riesgos residuales

| Riesgo | Mitigación / estado |
|---|---|
| `sync_profile` E2E no ejercitable en 1B.3C (auth deshabilitado) | Estructura + escalación verificadas; signup real en 1B.3D |
| Rol definer con código nuevo | Búsqueda de escalación en tests (ACC-18) + body minimalista documentado |
| Grants amplios dependientes de políticas | Cada grant tiene política equivalente; ACC-10/11/12/15 prueban el corte |
| Políticas `TO authenticated` en PG15 plano | Roles creados en 004 si faltan (CI-safe) |

# F1B.3 — Matriz de decisiones (turno de tarde)
## Identidad, sesiones, RBAC y RLS

**Fecha:** 2026-08-01
**Estado:** Decisiones cerradas en el turno de tarde de 1B.3. Tras este documento queda **prohibido** regresar a exploración general.
**Formato:** cada decisión incluye fuente, alternativas, elección, riesgo, prueba requerida y estado.

---

## 1. `auth.users` frente a `profiles`

- **Fuente:** `23-contracts/27_AUTH_SCHEMA.md`; `F1B3_DISCOVERY.md` Q1.
- **Alternativas:** (a) usar `auth.users` como tabla de aplicación; (b) tabla `profiles` 1:1 referenciando `auth.users(id)`.
- **Elección:** `profiles` 1:1 con `auth.users(id)`. `auth.users` queda como dominio exclusivo de Supabase Auth (gestión de credenciales); los datos de aplicación y RBAC viven en `public.profiles`.
- **Riesgo:** desincronización si se crean usuarios fuera del flujo de auth; mitigado con trigger en `auth.users` (insertar `profiles` al crear usuario) y FK `auth.users(id) ON DELETE CASCADE`.
- **Prueba requerida:** todo `profiles` tiene `auth.users` correspondiente; insertar usuario auth crea perfil automáticamente.
- **Estado:** CERRADA.

## 2. Perfil 1:1

- **Fuente:** contrato del turno (sección 8); `F1B3_DATA_MODEL_PROPOSAL.md`.
- **Alternativas:** (a) 1:1 estricta; (b) perfil por sesión/aplicación.
- **Elección:** 1:1 estricta: `profiles.id = auth.users.id`, PK = FK.
- **Riesgo:** bajo. Evita duplicidad de identidades.
- **Prueba requerida:** intentar dos `profiles` para el mismo `auth.users` falla (PK).
- **Estado:** CERRADA.

## 3. Estados active/inactive

- **Fuente:** convención 1B.2 (`organizations.status`, `branches.status`); contrato turno.
- **Alternativas:** (a) CHECK estricto `active`/`inactive`; (b) enum PostgreSQL.
- **Elección:** texto + `CHECK (status in ('active','inactive'))`, consistente con 1B.2 (PG15, sin enums).
- **Riesgo:** bajo; evita valores inválidos.
- **Prueba requerida:** inserción con status inválido falla (SQLSTATE 23514).
- **Estado:** CERRADA.

## 4. Membresía a organización

- **Fuente:** `14-admin/44_DATA_MODEL.md`; contrato turno (sección 8).
- **Alternativas:** (a) FK directa `profiles.organization_id`; (b) tabla N:M `organization_memberships`.
- **Elección:** tabla `organization_memberships` N:M con `status` y único `(organization_id, user_id)`. Un usuario puede pertenecer a varias organizaciones; el aislamiento (Usuario A no lee Org B) se prueba sobre esta tabla.
- **Riesgo:** medio: más tablas; mitigado por unique y por la prueba de aislamiento.
- **Prueba requerida:** Usuario A de Org A no lee Org B; membresía inactive niega acceso.
- **Estado:** CERRADA.

## 5. Acceso a sucursal

- **Fuente:** `14-admin/12_USER_STORE_ROLES.md`; `F1B3_DATA_MODEL_PROPOSAL.md` §4.
- **Alternativas:** (a) `user_role_assignments.branch_id` nullable (org-wide si NULL); (b) tabla dedicada por sucursal.
- **Elección:** `user_role_assignments` con `branch_id` nullable; FK compuesta `(organization_id, branch_id)` → `branches (organization_id, id)` para garantizar misma organización.
- **Riesgo:** medio: requiere validación cruzada (branch pertenece a la org de la asignación); cubierto por FK compuesta y pruebas.
- **Prueba requerida:** sucursal de otra organización rechazada; usuario de NOG no accede a SAL sin asignación.
- **Estado:** CERRADA.

## 6. Roles globales y por organización

- **Fuente:** `14-admin/08_ROLE_MODEL.md`; `F1B3_RBAC_MATRIX_DRAFT.md`.
- **Alternativas:** (a) roles solo por organización; (b) `organization_id` nullable (NULL = global).
- **Elección:** `roles.organization_id uuid NULL`; NULL = rol global (ej. `administrator`), no NULL = rol de organización. `code` único por organización (unique parcial sobre org donde no NULL).
- **Riesgo:** medio: roles globales deben tratarse con cuidado en RLS; cubierto por decisiones 17–18.
- **Prueba requerida:** rol de Org A no asignable en Org B (prueba de aislamiento).
- **Estado:** CERRADA.

## 7. Roles por sucursal

- **Fuente:** `14-admin/12_USER_STORE_ROLES.md`; `10-architecture/13_CORE_ENTITIES.md`.
- **Alternativas:** (a) rol por sucursal explícito; (b) resolución por sucursal activa.
- **Elección:** asignaciones por sucursal vía `user_role_assignments.branch_id` (scope `branch`); la resolución de permisos usará la asignación vigente por sucursal. La "sucursal activa" se resuelve en el servidor a partir de las asignaciones válidas (no se confía de un valor de cliente).
- **Riesgo:** medio: complejidad de resolución; diferido a 1B.3B para implementación, pero la estructura queda decidida.
- **Prueba requerida:** usuario de NOG no accede a SAL sin asignación en SAL.
- **Estado:** CERRADA (estructura) — resolución operativa en 1B.3B.

## 8. Permisos como catálogo

- **Fuente:** `10-architecture/10_AUTHORIZATION.md`; `F1B3_RBAC_MATRIX_DRAFT.md`.
- **Alternativas:** (a) permisos en tabla `permissions`; (b) permisos hardcode en código.
- **Elección:** tabla `permissions` con `code` unique (catálogo configurable), N:M con roles vía `role_permissions`. Nunca nombres codificados en el dominio de negocio.
- **Riesgo:** bajo; catálogo idempotente con `ON CONFLICT`.
- **Prueba requerida:** seed idempotente; `role_permissions` no modificable por el usuario (prueba de acceso).
- **Estado:** CERRADA.

## 9. Asignación directa de permisos

- **Fuente:** `10-architecture/10_AUTHORIZATION.md`.
- **Alternativas:** (a) solo vía roles (no directa); (b) asignación directa usuario→permiso.
- **Elección:** **no** se implementa asignación directa en 1B.3; los permisos se conceden solo vía `role_permissions` + `user_role_assignments`. Mantiene el modelo RBAC limpio y la matriz de pruebas simple.
- **Riesgo:** bajo; flexibilidad reducida, aceptada.
- **Prueba requerida:** permiso sin rol no concede acceso.
- **Estado:** CERRADA.

## 10. Herencia

- **Fuente:** `14-admin/08_ROLE_MODEL.md` (roles configurables).
- **Alternativas:** (a) herencia de roles; (b) composición plana.
- **Elección:** **sin herencia** en 1B.3: cada rol lista sus permisos explícitamente en `role_permissions`. Evita gráficos de herencia y facilita auditoría.
- **Riesgo:** bajo; más filas de catálogo, aceptable.
- **Prueba requerida:** permiso concedido solo a rol A no aplica a rol B.
- **Estado:** CERRADA.

## 11. Denegación por defecto

- **Fuente:** `10-architecture/10_AUTHORIZATION.md`; contrato turno §5.
- **Alternativas:** (a) allowlist; (b) denylist.
- **Elección:** **allowlist** (denegación por defecto): sin política/grant explícito no hay acceso; la UI oculta y el servidor valida.
- **Riesgo:** bajo; patrón seguro estándar.
- **Prueba requerida:** `authenticated` sin membresía/rol obtiene cero filas (no error).
- **Estado:** CERRADA.

## 12. Fuente de `organization_id`

- **Fuente:** contrato turno §5; `F1B3_DISCOVERY.md` Q4.
- **Alternativas:** (a) cliente; (b) derivada del servidor.
- **Elección:** **nunca del cliente**. `organization_id` se deriva en el servidor desde `auth.uid()` → `profiles` → `organization_memberships` (y asignaciones para scope de sucursal). Las políticas RLS usan `auth.uid()` como ancla.
- **Riesgo:** medio si se filtra el ancla; mitigado por no exponer `organization_id` de otra org y por políticas.
- **Prueba requerida:** manipular `organization_id` del cliente no cambia el resultado (RLS).
- **Estado:** CERRADA.

## 13. Claims JWT

- **Fuente:** `10-architecture/10_AUTHORIZATION.md`; buenas prácticas Supabase.
- **Alternativas:** (a) claims JWT de roles/org; (b) resolución en BD vía `auth.uid()`.
- **Elección:** JWT solo lleva identidad (`sub`/`auth.uid()`); **no** se emiten claims de roles/organización. La autorización se resuelve en BD/RLS a partir de `auth.uid()`. Evita claims obsoletos y reduce superficie de escalación.
- **Riesgo:** medio: latencia extra por consultas; aceptada por seguridad.
- **Prueba requerida:** claims forjados no conceden acceso.
- **Estado:** CERRADA.

## 14. Funciones auxiliares RLS

- **Fuente:** buenas prácticas RLS; `F1B3_DATA_MODEL_PROPOSAL.md` §2.
- **Alternativas:** (a) lógica inline en cada política; (b) funciones `security invoker` reutilizables.
- **Elección:** funciones auxiliares **`security invoker`** (ej. `_access.current_organization_id()`, `_access.has_permission(permission_code)`), reutilizables y testeables. Solo en 1B.3C si están plenamente decididas.
- **Riesgo:** medio si la función filtra; mitigado por search_path fijo y tests.
- **Prueba requerida:** cada función devuelve valores esperados con roles distintos.
- **Estado:** CERRADA (diseño) — implementación en 1B.3C.

## 15. `SECURITY DEFINER`

- **Fuente:** contrato turno §3 (prohibido usar sin decisión); `F1B3_DISCOVERY.md`.
- **Alternativas:** (a) `SECURITY INVOKER` (default); (b) `SECURITY DEFINER` limitada.
- **Elección:** **default `SECURITY INVOKER`**; ninguna función `SECURITY DEFINER` en 1B.3. Si el turno nocturno necesita una, exige decisión documentada y revisión de escalación.
- **Riesgo:** bajo; elimina superficie de escalación.
- **Prueba requerida:** ninguna función es `SECURITY DEFINER` (ci_verify).
- **Estado:** CERRADA.

## 16. `search_path`

- **Fuente:** buenas prácticas PostgreSQL; `F1B3_DISCOVERY.md` §5.
- **Alternativas:** (a) default; (b) `SET search_path` explícito en funciones.
- **Elección:** todo objeto de aplicación vive en `public` (y `_access` para helpers internos); cada función auxiliar fija `SET search_path = public, _access` explícito. Prohibido depender del search_path por defecto.
- **Riesgo:** bajo; evita hijacking por `pg_temp`.
- **Prueba requerida:** ci_verify comprueba search_path de funciones auxiliares.
- **Estado:** CERRADA.

## 17. Acceso `anon`

- **Fuente:** contrato turno §3; seguridad 1B.2.
- **Alternativas:** (a) grants de lectura a anon; (b) cero acceso.
- **Elección:** **sin grants** ni políticas para `anon` sobre tablas de negocio; `anon` no obtiene datos organizacionales. `anon` conserva solo lo necesario de auth.
- **Riesgo:** bajo.
- **Prueba requerida:** `anon` → 0 filas / permission denied en tablas de negocio.
- **Estado:** CERRADA.

## 18. Acceso `authenticated`

- **Fuente:** contrato turno §5; `F1B3_DATA_MODEL_PROPOSAL.md` §2.
- **Alternativas:** (a) grants amplios + RLS; (b) grants mínimos + RLS.
- **Elección:** grants mínimos (`select` a tablas de negocio con RLS activa; escritura solo vía políticas explícitas). `authenticated` sin membresía obtiene cero filas.
- **Riesgo:** medio: requiere RLS completa antes de exponer datos; por eso 1B.3C precede al cambio de default (1B.3D).
- **Prueba requerida:** `authenticated` sin membresía → 0 filas; con membresía → solo su org.
- **Estado:** CERRADA.

## 19. Usuarios inactivos

- **Fuente:** contrato turno (estados); `F1B3_DISCOVERY.md`.
- **Alternativas:** (a) solo `auth.users.banned_at`; (b) `profiles.status` como fuente.
- **Elección:** `profiles.status = 'inactive'` niega acceso en las funciones auxiliares de RLS (además de `auth.users` ban si aplica). Membresía/rol inactivos también niegan.
- **Riesgo:** bajo.
- **Prueba requerida:** usuario/membresía/rol inactive → 0 filas.
- **Estado:** CERRADA.

## 20. Transición demo → Supabase

- **Fuente:** contrato turno §4; `F1B3_DISCOVERY.md`.
- **Alternativas:** (a) cambiar default ya; (b) mantener demo hasta validación.
- **Elección:** `ORGANIZATION_DATA_SOURCE` **sigue en `demo`**; `DemoOrganizationRepository` se conserva. El cambio a `supabase` ocurre en 1B.3D solo tras aprobar las 7 pruebas críticas y la matriz de acceso con varios usuarios/orgs; se documentará como decisión (D).
- **Riesgo:** bajo; ningún cambio de default esta tarde.
- **Prueba requerida:** (en 1B.3D) página `/admin/organization` lee vía Supabase con datos scoped por sesión.
- **Estado:** CERRADA.

## 21. Auditoría

- **Fuente:** `14-admin/44_DATA_MODEL.md` (AuditLog); `_audit` schema de 1B.1.
- **Alternativas:** (a) trigger en cada tabla; (b) auditoría de aplicación.
- **Elección:** **sin auditoría funcional** en 1B.3; `_audit` queda reservado (1B.1) para una fase posterior. Se registran decisiones y cambios de estructura en `DECISION_LOG.md`.
- **Riesgo:** bajo; trazabilidad por git/decision log por ahora.
- **Prueba requerida:** ninguna (diferida).
- **Estado:** CERRADA (diferida).

## 22. Seeds de prueba

- **Fuente:** contrato turno §4/§8; patrón seed 1B.2.
- **Alternativas:** (a) seed solo demo; (b) seed con usuarios/roles/permisos/membresías para pruebas.
- **Elección:** seed idempotente de: catálogo de permisos, roles seed (08_ROLE_MODEL, configurables), y **fixtures de usuarios de prueba** (Org A y Org B, sucursales NOG/SAL) para demostrar aislamiento. Las contraseñas de prueba son locales, no secretos reales.
- **Riesgo:** medio: fixtures multi-org deben no colisionar; `ON CONFLICT` idempotente.
- **Prueba requerida:** seed re-aplicable; fixtures presentes.
- **Estado:** CERRADA.

## 23. Rollback

- **Fuente:** contrato turno §11 (rollback).
- **Alternativas:** (a) migración destructiva; (b) `down` manual documentado.
- **Elección:** migración 003 **no destruye** datos 1B.2; para rollback se documenta un script `down` manual (drop tablas nuevas en orden inverso) en `F1B3_MIGRATION_PLAN.md`. No se eliminan tablas de negocio 1B.2.
- **Riesgo:** bajo.
- **Prueba requerida:** documentado en migration plan (no ejecutable automático esta tarde).
- **Estado:** CERRADA.

## 24. PostgreSQL 15

- **Fuente:** entorno Supabase local (PG15); `F1B3_DISCOVERY.md`.
- **Alternativas:** (a) features PG16/17; (b) solo PG15-safe.
- **Elección:** migración 003 estrictamente **PG15-safe** (sin `CREATE OR REPLACE VIEW` sobre tabla con columnas nuevas de PG16+, sin enum, sin `GENERATED ALWAYS AS IDENTITY` dudoso): texto+CHECK, `gen_random_uuid()`, FK compuestas.
- **Riesgo:** bajo.
- **Prueba requerida:** migración aplica limpia sobre el servicio PostgreSQL 15 de CI (`db-validate`).
- **Estado:** CERRADA.

## 25. Separación 1B.3A–D

- **Fuente:** contrato turno §2.
- **Alternativas:** (a) una sola entrega; (b) subfases con gates.
- **Elección:** subfases 1B.3A→B→C→D con gates entre ellas; la migración 003 se entrega por capas en la misma rama (A/B tablas+constraints; C políticas; D validación+default). Esta tarde: base (A/B estructural) + pruebas iniciales.
- **Riesgo:** bajo; reduce integraciones rotas.
- **Prueba requerida:** cada subfase mantiene gates verdes.
- **Estado:** CERRADA.

---

## Resumen de estados

| # | Decisión | Estado |
|---|----------|--------|
| 1–3 | `profiles` 1:1 con `auth.users`; estados active/inactive | CERRADA |
| 4–5 | Membresía N:M; acceso a sucursal con branch nullable + FK compuesta | CERRADA |
| 6–7 | Roles globales (nullable) y por organización; por sucursal vía assignments | CERRADA |
| 8–10 | Permisos catálogo; sin asignación directa; sin herencia | CERRADA |
| 11–13 | Allowlist; `organization_id` del servidor; JWT solo identidad | CERRADA |
| 14–16 | Helpers `security invoker`; sin `SECURITY DEFINER`; search_path fijo | CERRADA |
| 17–19 | anon sin acceso; authenticated mínimo+RLS; inactivos niegan | CERRADA |
| 20–22 | demo conservada; auditoría diferida; seeds multi-org | CERRADA |
| 23–25 | Rollback documentado; PG15-safe; subfases 1B.3A–D | CERRADA |

Pendientes que NO son decisiones de estructura: validación de la matriz rol→permiso con negocio (borrador RBAC), catálogo final de permisos de inventario/ventas (se consumen en fases posteriores), y la decisión documentada de retirar/no-default de `DemoOrganizationRepository` (1B.3D).

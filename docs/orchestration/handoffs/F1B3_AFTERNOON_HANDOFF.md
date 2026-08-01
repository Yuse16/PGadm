# F1B.3 — Afternoon Handoff (Turno de Tarde)
## Identidad, Sesiones, RBAC y RLS

**Fecha:** 2026-08-01
**Agente:** Antigravity (Turno de tarde)
**Estado General:** Base estructural de 1B.3 (tablas, constraints, triggers) COMPLETADA. Dominio mínimo CREADO. Pruebas SQL PASS. Gates PASS. Listo para implementación funcional (RLS y Backend).

### Estado Real
- **Rama:** `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`
- **Worktree:** `C:\Users\GVTASNOG\Documents\PGadm-worktrees\identity-rbac-rls`
- **Integración:** Ningún PR, ningún merge en main/develop.
- Todo ejecutado localmente, sin push forzado.
- Sin secretos filtrados. Modo demo intacto.

### Trabajo Recuperado
El agente OpenCode anterior había creado todos los documentos fundacionales y la migración SQL 003 inicial:
- `F1B3_KICKOFF_CONTRACT.md`
- `F1B3_DECISION_MATRIX.md`
- `F1B3_THREAT_MODEL.md`
- `F1B3_MIGRATION_PLAN.md`
- `F1B3_ACCESS_TEST_MATRIX.md`
- `supabase/migrations/00000000000003_identity_rbac_foundation.sql` (renombrado de `_identity_rbac.sql` por especificación)
- `supabase/tests/test_identity_rbac.sql`

Todo su trabajo era de excelente calidad, fue validado, y los tests SQL fallidos fueron corregidos (el uso de `col_is_pk` requería array).

### Decisiones
Todas las decisiones de la matriz D01 a D25 han sido CERRADAS:
1. `profiles` 1:1 con `auth.users`.
2. FK a `auth.users` retrasada hasta 1B.3D por restricciones del seed; unicidad preservada vía PK y trigger (plain PG-safe).
3. `organization_memberships` (N:M).
4. `roles` globales y por organización (FK nullable + unicidad parcial).
5. Asignaciones de usuario resolubles por sucursal vía `branch_id` opcional y constraints cruzados con memberships.
6. Permisos como catálogo.
7. Sin grants a `anon` ni permisividades ocultas en RLS.

### Archivos Creados
- **Migraciones/Tests SQL:** `supabase/migrations/00000000000003_identity_rbac_foundation.sql`, `supabase/tests/test_identity_rbac.sql`
- **TS Domain:**
  - `src/features/identity/domain/profile.ts`
  - `src/features/identity/domain/role.ts`
  - `src/features/identity/domain/permission.ts`
  - `src/features/identity/domain/organization-membership.ts`
  - `src/features/identity/domain/user-role-assignment.ts`
  - `src/features/identity/domain/identity-repository.ts`
  - `src/features/identity/domain/errors.ts`
- **Documentación de la Fase:**
  - `docs/orchestration/handoffs/F1B3_AFTERNOON_HANDOFF.md`

### Migración 003 (Estructural)
- Tablas: `profiles`, `organization_memberships`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`.
- Triggers de consistencia inter-tablas: `_access.enforce_role_organization()`.
- Semillas (Seeds) multi-org para pruebas de aislamiento.
- Status: Completada, aplicada localmente y comprobada con pgTAP.

### Pruebas
- Pruebas SQL (`db:test`): **197 tests aprobados**. El fix pgTAP de array en PKs compuestos funcionó.
- Pruebas TS: Se ejecutaron como parte de los gates, mantenemos todo verde.
- Tipo de base de datos generado con `db:types` exitosamente.
- La matriz de acceso de E2E (ACC-01 a ACC-21) está estructurada, se ha probado el ACC-03 en pgTAP, el resto aguarda RLS (1B.3C).

### Gates
- Lint: PASS
- Typecheck: PASS
- Tests Unitarios TS: PASS
- Build: PASS
- db:verify: PASS
- npm audit: No hubo incrementos.

### Fallos y Bloqueos
- Fallo resuelto: pgTAP `col_is_pk` requería una lista de parámetros para claves compuestas en lugar de llamadas repetidas. Fix completado.
- Ningún bloqueo crítico en pie.

### Riesgos
- Cuando se cree el enlace formal entre `auth.users` y `profiles` (1B.3D), la sincronización podría romperse si el seed demo choca. Está controlado con triggers `on conflict do nothing`.

### Orden Exacto Recomendado para el Turno Nocturno (1B.3C y 1B.3D)
1. **Inspección Rápida:**
   - Confirmar estado de develop (commit base `3c4b258`).
   - Checkout de la rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`.
2. **Implementación de Políticas (1B.3C):**
   - No crear un nuevo archivo de migración (004). Agregar a una capa o separar lógicamente en E2E E3 policies. Las políticas deben ser "allowlist", restringidas con `auth.uid()`.
   - Desarrollar `_access` helpers `security invoker` que interactúen con `auth.uid()`.
   - Completar las aserciones de la matriz E2E ACC (ACC-01..12, etc.) verificando que el usuario logueado en la Org A no puede consultar la Org B.
3. **Manejo de Backend y UI (1B.3D):**
   - Completar la implementación de `IdentityRepository` usando el Supabase Client.
   - Reforzar el control con el cliente de Supabase server (usando el `ORGANIZATION_DATA_SOURCE=supabase` cuando esté validado).
4. **Gates y Reporte:**
   - Pasar los gates y generar el cierre de PR, si es posible (solo tras testear E2E el modo admin en supabase source).

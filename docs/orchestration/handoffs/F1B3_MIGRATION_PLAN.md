# F1B.3 — Plan de migración 00000000000003_identity_rbac_foundation
## Identidad, sesiones, RBAC y RLS

**Fecha:** 2026-08-01 (turno de tarde 1B.3)
**Estado:** Plan de la migración 003 por capas (subfases 1B.3A→C). Esta tarde se implementa la **base estructural (1B.3A/1B.3B tablas y constraints)**; las políticas RLS funcionales (1B.3C) se entregan en la misma rama en capas posteriores.

---

## 1. Arquitectura de la migración

- **Archivo:** `supabase/migrations/00000000000003_identity_rbac_foundation.sql`
- **Base:** `00000000000002_organization_structure.sql` (organizations, branches, warehouses, branch_warehouse_relations) — **no se altera** ninguna tabla existente.
- **Compatibilidad:** PostgreSQL 15. **Crítico:** el CI (`pr-validation.yml`, job `db-validate`) aplica las migraciones sobre **PostgreSQL 15 plano** sin Supabase (`auth.users` NO existe en CI). Todo acceso al schema `auth` va en bloques `DO $$` condicionales con `if exists` sobre `pg_namespace`/`pg_class`, igual que el patrón de revoke de 002.
- **Capa de entrega esta tarde (1B.3A/1B.3B):** tablas de identidad + RBAC, constraints compuestas, índices, triggers `updated_at`, grants mínimos, seeds idempotentes, trigger condicional de sincronización de `profiles`.
- **Capas posteriores en la misma rama:** 1B.3C → políticas RLS + helpers `_access` (`security invoker`); 1B.3D → validación y switch documentado.

## 2. Orden de creación (dependencias)

1. Schema `_access` (helpers RLS, reservado; solo `CREATE SCHEMA` ahora).
2. `profiles` (depende de `auth.users` **solo de forma condicional**).
3. `organization_memberships` (depende de `organizations`, `profiles`).
4. `roles` (depende de `organizations`; `organization_id` nullable = global).
5. `permissions` (catálogo).
6. `role_permissions` (depende de `roles`, `permissions`).
7. `user_role_assignments` (depende de `organization_memberships`, `roles`, `branches`).
8. Trigger condicional en `auth.users` (sincroniza `profiles`).
9. Triggers `updated_at`.
10. Grants mínimos + revokes (patrón 002).
11. Seeds idempotentes (catálogo permisos/roles + fixtures multi-org).

## 3. Diseño de tablas

### 3.1 `public.profiles`
- `id uuid primary key` — PK = id de `auth.users` (decisión D2: 1:1).
- `full_name text`, `email text` (display, no fuente de auth), `phone text` opcional.
- `status text not null default 'active'` con `check (status in ('active','inactive'))` (D3).
- `created_at`, `updated_at`.
- **FK a `auth.users`:** DIFERIDA a 1B.3D (no se crea en 003). Razón: el seed carga profiles estructurales antes de que existan auth users reales; una FK activa los rechazaría. La 1:1 se garantiza vía PK única de `profiles` + trigger `_core.sync_profile()` (insert con `id = auth.users.id`). En 1B.3D, al crear los auth users de los fixtures, se agrega `constraint profiles_auth_fk foreign key (id) references auth.users (id) on delete cascade`.
- Índice único implícito por PK (1:1). `updated_at` trigger (idempotente `_core.set_updated_at_column('profiles')`).

### 3.2 `public.organization_memberships`
- `organization_id uuid not null`, `user_id uuid not null` (→ `profiles.id`), `status` (active/inactive, D3), `created_at`, `updated_at`.
- PK: `(organization_id, user_id)` — evita duplicidad (D4).
- FK simple: `(organization_id)` → `organizations(id)`; `(user_id)` → `profiles(id) ON DELETE CASCADE`.
- Índice `(user_id)` para resolver membresías por usuario.

### 3.3 `public.roles`
- `id uuid pk`, `organization_id uuid null` (NULL = rol global; D6), `code text`, `name text`, `status` (active/inactive), `created_at`, `updated_at`.
- Unicidad: **unique parcial** `(organization_id, code) where organization_id is not null` + **unique parcial** `(code) where organization_id is null` (codes globales únicos). Patrón 002 usa `where col is not null` para external; aquí con `is null`.
- FK `(organization_id)` → `organizations(id)`.

### 3.4 `public.permissions`
- `id uuid pk`, `code text not null` unique, `description text`, `status` (active/inactive).
- Catálogo de grano de dominio: `organization.read`, `organization.write`, `branch.read`, `warehouse.read`, `role.manage`, `user.assign`, etc. (borrador RBAC 1B.3B).

### 3.5 `public.role_permissions`
- `id uuid pk`, `role_id uuid`, `permission_id uuid`, `created_at`.
- PK o unique `(role_id, permission_id)`.
- FK `(role_id)` → `roles(id) ON DELETE CASCADE`; FK `(permission_id)` → `permissions(id) ON DELETE CASCADE`. **Sin herencia** (D10): cada rol lista explícitamente.

### 3.6 `public.user_role_assignments`
- `id uuid pk`, `organization_id uuid not null`, `user_id uuid not null`, `role_id uuid not null`, `branch_id uuid null` (scope sucursal; null = toda la organización), `status` (active/inactive), `valid_from`, `valid_to`, `created_at`, `updated_at`.
- **FK compuestas que impiden inconsistencias (D5):**
  - `(organization_id, user_id)` → `organization_memberships (organization_id, user_id)` — exige membresía existente.
  - `(role_id)` → `roles (id)` (FK simple) + trigger `_access.enforce_role_organization()` que exige rol global **o** de la misma organización (ver §6.1, RESUELTO).
  - `(organization_id, branch_id)` → `branches (organization_id, id)` — la sucursal debe pertenecer a la organización.
- Índices: `(user_id)`, `(role_id)`, `(organization_id)`.

## 4. Trigger condicional `auth.users → profiles`

- En `DO $$` condicional sobre existencia de `auth.users`:
  - Función `_core.sync_profile()` `returns trigger`, `security invoker`, `set search_path = public, _core`.
  - `AFTER INSERT ON auth.users FOR EACH ROW` → `insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing`.
- En CI plano no se crea (schema `auth` ausente); la 1:1 se valida por test estructural (PK única) y por trigger en entornos Supabase.
- **Ninguna función es `SECURITY DEFINER`** (D15). `sync_profile` es invoker.

## 5. Grants mínimos

- Replicar patrón 002: `alter default privileges ... revoke ... from public`; `revoke all on <tablas nuevas> from public`; `do $$` condicional revocando a `anon`, `authenticated`, `service_role` si existen.
- **Sin grants a `anon`/`authenticated`** esta tarde (D17/D18); las políticas RLS vendrán en 1B.3C.

## 6. Decisiones de detalle abiertas al implementar

### 6.1 Roles globales en asignaciones — **RESUELTO**
Una FK compuesta `(organization_id, role_id)` no puede referenciar roles globales (`organization_id is null`). **Decisión implementada en 003:**
- `user_role_assignments` usa FK simple `(role_id)` → `roles(id)`.
- Trigger `BEFORE INSERT OR UPDATE` `_access.enforce_role_organization()` (security invoker, `set search_path = public, _access`) que llama a `_access.role_belongs_to_organization(role_id, organization_id)` y lanza SQLSTATE `23503` si el rol no es global ni de la misma organización.
- Resultado: `administrator` global asignable en cualquier org; rol de Org A nunca asignable en Org B (ACC-10/aislamiento).
- Verificado en test pgTAP: asignación con rol de otra org → `23503`; asignación con rol global → OK.

### 6.2 `email` en profiles vs `auth.users.email`
`profiles.email` es display y puede divergir; `auth.users.email` es fuente de login. No se sincroniza bidireccionalmente.

### 6.3 Soft delete
`deleted_at` diferido (convención 1B.2 D08); `status` es el control de acceso.

## 7. Seeds idempotentes (mismo archivo `supabase/seed.sql`, secciones nuevas)

- Catálogo `permissions` (ON CONFLICT (code) do nothing).
- `roles` seed configurables: `administrator` (global), `manager` (por org), `cashier`/`user` (por org) con `role_permissions` mapeados (ON CONFLICT do nothing; no sobrescribe).
- Fixtures multi-org para pruebas de aislamiento:
  - Org A = `PGM` (existente, id `1000...001`), sucursales NOG y SAL.
  - Org B = `PGM-DEMO-B` (nueva) con una sucursal.
  - Usuarios `profiles` de prueba (`1000...0b01`, `...0b02`, `...0b03`, `...0b04`) con membresía y asignaciones (uno inactivo; uno sin membresía; uno con rol insuficiente).
- **Sin credenciales reales** (D22): son fixtures locales de estructura; auth users de prueba se crean en 1B.3D con el stack completo.

## 8. Rollback (script `down` documentado, no destructivo)

Orden inverso, en `F1B3_MIGRATION_PLAN` §rollback (archivo `supabase/migrations/down/00000000000003_down.sql` **NO** se crea como ejecutable automático; se documenta):
1. `drop trigger` condicional en `auth.users` + `drop function _core.sync_profile()`.
2. `drop table public.user_role_assignments`, `role_permissions`, `permissions`, `roles`, `organization_memberships`, `profiles` (orden de dependencias inverso).
3. `drop schema _access` si quedó vacío.
- **No toca** tablas 1B.2 (D23): rollback seguro sobre base existente.

## 9. Validación

- **Esta tarde:** `db:reset`, `db:test` (pgTAP nuevos + 119 existentes), `db:verify`, y gates `lint/typecheck/test/build/diff-check/audit`.
- **CI:** `pr-validation.yml` `db-validate` aplica 001→003 + seed sobre PG15 plano; los tests nuevos deben pasar sin schema `auth` (por eso 003 es condicional).
- **1B.3C:** política RLS + helpers `_access` verificados con `set role` y `auth.uid()` simulado.
- **1B.3D:** 7 pruebas críticas + matriz ACC sobre stack local completo.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Migración falla en CI plano por `auth` | Todo acceso a `auth` en `DO $$` con `if exists` (patrón 002 §revokes) |
| FK compuesta de roles globales bloquea asignaciones | Decisión 6.1 resuelta antes de escribir 003 |
| Seed rompe idempotencia con fixtures 1B.2 | `ON CONFLICT (id)`/`(code)` do nothing; ids fijos del bloque `1000...0b..` |
| Tests 119 regresión | Nueva suite es aditiva; ci_verify se extiende, no se edita lo existente |
| search_path hijacking | Helpers fijan `set search_path`; ninguna función `SECURITY DEFINER` (D15/D16) |

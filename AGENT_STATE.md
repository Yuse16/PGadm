# Agent State

## General

- Project: PGadm
- Current Phase: **1B.3 — 1B.3D-1 COMPLETED / 1B.3D-2 PENDING** (turno nocturno)
- Integration Branch: `develop`
- Active Feature Branch: `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`
- Worktree: `C:\Users\GVTASNOG\Documents\PGadm-worktrees\identity-rbac-rls`
- Status: Fase 1B.2 COMPLETED AND INTEGRATED (PR #5 MERGED `05872c9`); Fase 1B.3 iniciada con kickoff controlado; **1B.3A/1B.3B entregadas** (migración 003); **1B.3C COMPLETED** (migración 004 + tests RLS, commit `4a3c553`); **1B.3D-1 COMPLETED** (auth local + migración 005 FK + migración 006 fix current_user_id + seed auth fixtures + suite auth + E2E, commits `e3ba875`); sin PR ni merge; **1B.3D-2 PENDING**
- Last Stable Commit (develop): `3c4b258` (merge PR #6, cierre documental 1B.2)
- PRs: #1 — MERGED | #2 — MERGED | #3 — MERGED | #4 — CLOSED (reemplazado) | #5 — MERGED | **#6 — MERGED** (cierre documental 1B.2)
- Next Phase: 1B.3 en curso — identidad, sesiones, roles, permisos y RLS (subfases 1B.3A–D)

## Active Agents

| Agent | Role |
|-------|------|
| Orquestador | Phase coordination |
| Arquitectura | Organization model, decisions matrix |
| Base de datos | Migration 002, seed, SQL tests |
| Backend | Organization domain, application, infrastructure |
| Frontend/UX | Admin organization overview |
| QA | 111 tests (36 baseline + 75 org) |
| Seguridad | Service role isolation review, no secrets |
| Documentación | Matrix, worklog, report, handoff draft |

## Phase 1A Summary

- **6 commits** → PR #1 merged ✅
- **Architecture**: PASS | **QA**: PASS | **Security**: PASS

## Phase 1B.1 Summary

- Supabase local structure: `config.toml`, migration 001, seed, tests, README
- `_core` schema with `updated_at()` trigger, `is_uuid()`, pgcrypto
- `_audit` schema prepared for future use
- TypeScript clients: browser (`client.ts`), server (`server.ts`), config validation
- Env validation: safe handling when Supabase not configured (build-safe)
- Database types placeholder for auto-generation
- CI: `db-validate` job added (PostgreSQL service, migration apply, SQL verify)
- 8 scripts: `db:start`, `db:stop`, `db:status`, `db:reset`, `db:lint`, `db:test`, `db:types`, `db:verify`
- Security: no secrets, client/server separated, public schema locked, creds git-ignored

## Overnight Review (29 Jul 2026)

**3 bugs found and fixed (no commits):**
1. Migration: removed `create extension with schema extensions` — `extensions` schema does not exist in standard PostgreSQL (would break CI)
2. pgTAP tests: `plan(10)` → `plan(12)` — mismatch between declared plan and actual assertions
3. pgTAP tests: replaced `isnt_superuser('postgres')` (always passes) with `is(has_schema_privilege('public', 'create'), false)` (verifies actual revoke)
4. `scripts/verify-db.mjs`: fixed `readdirSync` function — used `await import()` without async context (syntax error in Node 24)

**Cross-reviews completed:** Architecture ✅ | Security ✅ | QA ✅
**All gates pass:** lint ✅ typecheck ✅ 29 tests ✅ build ✅ db:verify ✅

## Phase 1B.2 Summary (31 Jul 2026 — no commits)

- Migration `00000000000002_organization_structure.sql`: organizations, branches, warehouses, branch_warehouse_relations; FK compuestas, unicidades, CHECKs, triggers, revokes mínimos (PG15-safe)
- Seed idempotente: PGM / Nogalera (store) / CEDIS Saltillo (distribution_center) / NOG-01 / SAL-01 / relación supply
- `src/types/database.ts` escrito manualmente (contrato tipado de migración 002; será reemplazado por `db:types`)
- Dominio `src/features/organization/domain` + aplicación (`getOrganizationStructure`, `listBranches`) + infraestructura (mappers + `SupabaseOrganizationRepository`, anon server)
- UI `/admin/organization`: overview de organización, tarjetas de sucursal, almacenes, estados seguros
- Pruebas: 45 nuevas (79/79 total) + pgTAP `plan(66)` + sección 1B.2 en `ci_verify.sql`
- Seguridad: repositorio normal sin service role; guard de configuración; feature sin secretos
- Docs: F1B2_DECISION_MATRIX, F1B2_SERVICE_ROLE_REVIEW, F1B3_DISCOVERY, F1B3_DATA_MODEL_PROPOSAL, F1B3_TEST_PLAN, NIGHT_WORKLOG_F1B2, REPORT_F1B2_NIGHT_SESSION, HANDOFF_F1B2_DRAFT
- Todos los cambios sin staging; cero commits sobre develop

## Phase 1B.2 Turno V2 Summary (31 Jul 2026 — uso amplio de documentación, no commits)

- Contrato V2 (`PGadm_Turno_Nocturno_Uso_Amplio_Documentacion_F1B2_V2.md`) ejecutado: inventario automatizado de **1264 `.md`** (1186 packs, 66 orchestration, 12 raíz)
- Fase documental completada en ~25 min (límite 90): F1B2_DOCUMENT_USAGE_INDEX, F1B2_AGENT_FINDINGS, F1B2_ORCHESTRATION_CONTENT_MAP, F1B2_DECISION_MATRIX re-validada — exploración general CERRADA
- Anomalía confirmada: 11/11 workflows en `docs/orchestration/workflows/` con nombre ≠ contenido (rotación); registrada, NO corregida
- Corrección §14: `select("*")` → selección explícita de columnas en `supabase-organization-repository.ts` (4 const arrays + `.join(", ")`)
- Corrección §16: etiqueta "Fuente de datos" (external source o seed demo) en `organization-overview.tsx` (+2 tests)
- Gates verdes: lint ✅ typecheck ✅ **81/81 tests** ✅ build ✅ audit (3 high prod, sin cambio) ✅ sin secretos ✅
- Preparación 1B.3 completa: `F1B3_RBAC_MATRIX_DRAFT.md` creado
- Docs V2: NIGHT_WORKLOG_F1B2_V2, REPORT_F1B2_NIGHT_SESSION_V2, HANDOFF_F1B2_DRAFT_V2

## Phase 1B.2 Fix Session Summary (1 Aug 2026 — no commits)

- **Config Supabase local reparada** (`supabase/config.toml` para CLI v2.111.0): `project_id = "organization-foundation"` top-level; `[api] schemas = ["public","storage"]`, `extra_search_path`, `max_rows = 1000`; eliminados `[project]`, `[analytics.vector]`, `[auth.email]`. PostgREST ya no intenta cargar `pg_graphql`.
- **pgTAP corregido** (`test_organization_structure.sql`, pgTAP 1.2.0): `col_is_not_null` → `col_not_null` (5), `index_is_unique` 5-arg (boolean) → 4-arg (7), `throws_ok` texto → `'23514'::character(5), NULL` (8) para validar SQLSTATE real. **66/66 green**.
- **`ci_verify.sql` convertido a pgTAP** (plan 41 = 30 estructurales + 11 behavioral): antes emitía SQL plano y pg_prove reportaba "No plan found" (exit 1). Ahora cada check es aserción real (ok/lives_ok/throws_ok con guards de fixtures y dollar-quoting). Checks que antes eran texto "PASS/FAIL" no bloqueante ahora se validan activamente.
- **`scripts/verify-db.mjs` reescrito**: 10 checks — Docker, compose, migraciones, seed, config, supabase status, `db reset` y `db test` reales (stdio inherit), tipos generados vs committed (normalización BOM/CRLF/whitespace). Exit ≠ 0 ante fallo. Lint sin warnings.
- **`src/types/database.ts` regenerado** con `db:types` (494 líneas) y alineado con repo (línea final limpia).
- **Gates verdes**: lint ✅ typecheck ✅ 81/81 tests TS ✅ build ✅ audit (3 high prod, sin cambio) ✅ `db:test` 119/119 ✅ `db:verify` ALL PASS ✅ sin secretos ✅ `git diff --check` limpio ✅
- **Incidente de datos**: `test_organization_structure.sql` (untracked) quedó vacío por un `-replace` con regex inválida en PowerShell; se reconstruyó íntegro (66 aserciones, behavioral verbatim) y validó contra la BD real.
- Todos los cambios sin staging; cero commits.

## Phase 1B.2 READY FOR PR (1 Aug 2026)

- Fase 1B.2 lista para PR hacia `develop` (sin merge). Rama: `feature/f1b-PG-ORG-002-organization-branches-warehouses`.
- Validación local DB PASSED: `db:test` 119/119 (66 org + 41 ci + 12 base), `db:verify` ALL CHECKS PASSED.
- Docker/WSL OPERATIONAL: contenedores db/kong/studio/pg_meta/realtime healthy; `db:reset`/`db:status` reales.
- SQL tests 119/119 PASSED; Application tests 81/81 PASSED (lint/typecheck/build verdes; audit 3 high prod baseline sin cambio).
- Review final independiente completada sin cambios al código; `git diff --check` limpio; sin secretos; staging vacío.
- **8 commits + push + PR #5 hacia develop**: `1feaf20`, `05f51ce`, `7e36b48`, `beed6bd`, `c8ba689`, `8905489`, `a837d92`, `ad532b1`.
- **CI PASS** en PR #5: `validate` PASS y `db-validate` PASS (119 pgTAP reales sobre servicio PostgreSQL 15 con extensión pgtap; fix `ad532b1` — antes `ci_verify.sql` pgTAP fallaba en CI por `function plan(integer) does not exist`).
- Pendiente: revisiones (Arquitectura, BD, Backend, Frontend, Seguridad, QA) y merge manual del PR.

## Phase 1B.2 Final Integration (1 Aug 2026)

- **PR #5 MERGED** en `develop` con merge commit **`05872c9`** (12 commits: `1feaf20`…`9bc24e1`). Merge commit solicitado (no squash/rebase/force).
- **Fuente de datos demo (decisión final)**: `DemoOrganizationRepository` explícito etiquetado "Datos demo locales"; selección determinista vía `ORGANIZATION_DATA_SOURCE=demo` (default). Modo `supabase` debe pedirse explícito y falla ruidoso (error tipado), nunca fallback silencioso. `SupabaseOrganizationRepository` (anon server client) reservado para Fase 1B.3.
- **Sin `service_role`**: cero uso de admin client/service role en la feature; blindado por `feature-security.test.ts`.
- **Semántica de `priority` unificada**: 1 = mayor prioridad, orden `ascending` (valores menores primero). Comentario SQL de migración 002 corregido; alineación cubierta por `priority-semantics.test.ts`.
- **Seis revisiones técnicas PASS**: Arquitectura · Base de datos · Backend · Frontend · Seguridad · QA.
- **Validación manual real**: `GET /admin/organization` → HTTP 200 con seed completo (PGM, NOG, SAL, NOG-01, SAL-01) y "Fuente de datos: Datos demo locales"; modo `supabase` verificado a fallo ruidoso sin fallback.
- **Regresión post-merge (repositorio principal)**: `npm ci` ✅ · `db:reset` ✅ · `db:test` **119/119** ✅ · `db:types` ✅ · `db:verify` **ALL CHECKS PASSED** ✅ · lint ✅ · typecheck ✅ · `npm test` **111/111** ✅ · build ✅ · `git diff --check` limpio ✅ · sin secretos ✅.

## Phase 1B.3 Afternoon Summary (1 Aug 2026 — rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`)

- **Base:** develop `3c4b258` (PR #6 MERGED). **Sin PR, sin merge, sin tocar main/develop.**
- **Docs:** `F1B3_KICKOFF_CONTRACT.md`, `F1B3_DECISION_MATRIX.md` (D01–D25 CERRADAS), `F1B3_THREAT_MODEL.md` (T01–T15), `F1B3_MIGRATION_PLAN.md` (layers 1B.3A–D, decisión 6.1: trigger `_access.enforce_role_organization`), `F1B3_ACCESS_TEST_MATRIX.md` (ACC-01..21), `F1B3_AFTERNOON_HANDOFF.md`.
- **Migración `00000000000003_identity_rbac_foundation.sql`:** `profiles` (1:1 con auth.users, FK diferida a 1B.3D), `organization_memberships` (PK compuesta), `roles` (global vs org, unicidad parcial), `permissions` (catálogo), `role_permissions`, `user_role_assignments` (FK compuestas + trigger `_access`); helpers `security invoker` con search_path fijo (sin `SECURITY DEFINER`); sync `auth.users→profiles` condicional (plain-PG CI-safe); grants mínimos (patrón 002).
- **Seed:** fixtures multi-org idempotentes (Org A PGM + Org B `PGM-DEMO-B`; permisos, roles `administrator` global / `manager` / `cashier` / `operator`, memberships y assignments; sin credenciales reales).
- **Pruebas SQL:** `db:test` **197/197** PASS (79 nuevas en `test_identity_rbac.sql`; ajuste pgTAP 1.2.0: PK compuesta vía `is()`); `ci_verify.sql` y `test_organization_structure.sql` actualizados (removidas aserciones `hasnt_table` obsoletas por 003).
- **Gates:** lint ✅ typecheck ✅ **133/133** tests TS ✅ build ✅ `git diff --check` limpio ✅ `db:verify` ALL CHECKS PASSED ✅ audit (4 high prod = baseline, `--force` prohibido) ✅ sin secretos ✅.
- **9 commits en rama, push `-u origin` completado** (`2a2cb89`…`cb73a5b`). `DemoOrganizationRepository` y `ORGANIZATION_DATA_SOURCE=demo` intactos.
- **Continuidad:** turno nocturno → 1B.3C (RLS + `_access` helpers, ACC-01..12, 15, 17..21) y 1B.3D (FK profiles→auth.users + auth users reales, switch a `supabase` con decisión documentada).

## Phase 1B.3C Night Summary (3 Aug 2026 — rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`)

- **Migración `00000000000004_identity_rbac_rls.sql`:** 22 políticas allowlist (único rol objetivo `authenticated`), RLS en las 6 tablas de identidad (FORCE off, D20), helpers `_access` (current_user_id INVOKER; current_organization_ids / has_permission / role_in_own_orgs / role_belongs_to_organization DEFINER + `_core.sync_profile` DEFINER) con `SET search_path=''`, REVOKE ALL FROM PUBLIC, EXECUTE mínimo; grants mínimos (nunca GRANT ALL; profiles UPDATE solo full_name/phone/email); bootstrap NOLOGIN anon/authenticated/service_role solo si faltan (CI plain-PG15 determinista); identidad vía GUC `request.jwt.claim.sub` (CI-safe y Supabase-safe). Whitelist DEFINER exacta validada (ACC-18).
- **Tests:** `test_identity_rbac_rls.sql` nuevo (ACC-01..12, 15, 17..21, **139 aserciones**) + `test_identity_rbac.sql` ajustado (`sync_profile` DEFINER esperado). `db:test` **336/336** PASS (5 archivos). Fixtures multi-org del seed (orgs PGM/PGM-DEMO-B, roles globales/de org, permisos, membresías inactivas, rol `legacy` test-only para ACC-07).
- **CI plain-PG15 validado localmente:** contenedor `postgres:15` + pgTAP (sin schema `auth`, sin roles runtime) → migraciones + seed + **336/336** ok. Reproduce el job `db-validate` del PR.
- **Gates:** lint ✅ typecheck ✅ **133/133** tests TS ✅ build ✅ `db:reset` ✅ `db:test` 336/336 ✅ `db:lint` sin errores ✅ `db:verify` ALL CHECKS PASSED ✅ `git diff --check` limpio ✅ sin secretos ✅. audit (4 high prod = baseline) sin cambio.
- **Commit + push (sin PR):** `4a3c553` — migración 004, `test_identity_rbac_rls.sql`, ajuste `test_identity_rbac.sql`, `F1B3_RLS_POLICY_DESIGN.md` (§7 rollback manual documentado, sin `down/`).
- **1B.3C COMPLETED / 1B.3D PENDING.** `DemoOrganizationRepository` y `ORGANIZATION_DATA_SOURCE=demo` intactos; `src/tests/features/identity/feature-security.test.ts` sin modificar.

## Phase 1B.3D-1 Summary (3 Aug 2026 — rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`, commit `e3ba875`)

- **Auth local habilitado:** `supabase/config.toml` — `[auth] enabled=true` (site_url `http://127.0.0.1:3000`, jwt_expiry 3600, token rotation, enable_signup, minimum_password_length 6), `[auth.email] enable_confirmations=false` (autoconfirmación para E2E sin OTP), `[local_smtp]` puerto 54324, `[inbucket]` deprecado eliminado. Stack local: GoTrue v2.194.0 + mailpit v1.30.2, health OK, anon key publicada.
- **Migración `00000000000005_profile_auth_user_fk.sql`:** FK `profiles.id → auth.users.id` `ON DELETE CASCADE` `DEFERRABLE INITIALLY DEFERRED` dentro de `DO $$` guardado por `pg_namespace`/`pg_class` (no-op en plain-PG15 CI). Permite que el seed cargue profiles antes que los auth.users dentro de `BEGIN;…COMMIT;`.
- **Migración `00000000000006_access_current_user_id_json_claims.sql` (hallazgo + fix crítico):** el PostgREST moderno de Supabase (local `postgrest:14.15`) ya NO puebla el GUC plano `request.jwt.claim.sub` — solo `request.jwt.claims` (JSON). Con la 004 original, toda política RLS resolvía NULL vía API real (PostgREST devolvía HTTP 200 `[]` para el propio perfil; las pruebas pgTAP pasaban solo porque forjan el GUC plano). Fix: `CREATE OR REPLACE current_user_id()` lee `sub` de `request.jwt.claims` con fallback al GUC plano (tests y PostgREST antiguos intactos); mismo patrón D15/extensión que usa 004. No modifica 003/004.
- **`seed.sql`:** sección identidad en `BEGIN;…COMMIT;` (requerido por FK diferido) + bloque `DO $$` tras los profiles que inserta 6 `auth.users` fixtures (`30000000-…-01..06`, emails `user.a|user.b|user.x|user.in|user.nom|admin @pgm.local` RFC 2606, `encrypted_password NULL`, guardado por `pg_namespace`, ON CONFLICT DO NOTHING).
- **Suite `supabase/tests/test_auth_sync.sql`:** 19 aserciones en Supabase / 1 marker en plain-PG; usa psql `\gset` + `\if :has_auth` (pgTAP 1.3.4 no tiene skip_all/no_plan). Cubre FK (existencia/deferrable/initially deferred/cascade), trigger `sync_profile`, invariante seed 6↔6, sync 1:1, idempotencia, atomicidad blank-email.
- **`scripts/e2e-auth.mjs` (`npm run e2e:auth`):** orquesta GoTrue + PostgREST + psql; JWT anon HMAC, signup real anon-key, autoconfirmación, 1 auth↔1 profile con email igual, sign-in con token, lectura `/rest/v1/profiles` con user JWT (RLS), duplicado 422, cleanup cascade. **14/14 PASS.** Sin `service_role` en llamadas de cliente; cleanup como `supabase_auth_admin` vía TCP (peer auth falla en contenedor).
- **Gates:** lint ✅ typecheck ✅ **133/133** vitest ✅ build ✅ `db:test` **355/355** ✅ plain-PG (contenedor `postgres:15` + pgTAP, migraciones 001..006 + seed) **337/337** ✅ `db:lint` sin errores ✅ `db:verify` ALL CHECKS PASSED ✅ `git diff --check` limpio ✅ sin secretos ✅. audit (4 high prod = baseline) sin cambio.
- **Commit + push (sin PR):** `e3ba875` — migraciones 005+006, seed, `test_auth_sync.sql`, `e2e-auth.mjs`, `package.json`, `config.toml`.
- **1B.3D-1 COMPLETED / 1B.3D-2 PENDING.** `DemoOrganizationRepository` y `ORGANIZATION_DATA_SOURCE=demo` intactos; `src/tests/features/identity/feature-security.test.ts` sin modificar.

## Blockers

| Blocker | Detail |
|---------|--------|
| ~~Docker Desktop not installed~~ | Resuelto: Docker Desktop disponible en el entorno; Supabase local corre y `db:reset`/`db:test`/`db:verify` se ejecutan de verdad |
| ~~psql/pg_ctl/initdb ausentes en Windows~~ | Resuelto: validación SQL local vía contenedor `pg_prove` de Supabase (pgTAP 1.2.0) |
| ~~`[inbucket]` deprecado~~ | Resuelto en 1B.3D-1: migrado a `[local_smtp]` puerto 54324 (commit `e3ba875`) |
| `public_repo`/token scope (histórico) | Token antiguo sin scope bloqueó edición/merge de PR; resuelto con token con scope `repo` (escritura) |

## Next Action

Iniciar **1B.3D-2** (validación end-to-end multi-usuario/multi-organización sobre el stack real: perfiles de fixture vía JWT por usuario, membresías/roles/permisos por organización, checks RLS negativos a través de PostgREST; cambio a `ORGANIZATION_DATA_SOURCE=supabase` con decisión documentada) — desde la rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls` (estado `e3ba875`).

## Status

Fase 1B.2: **COMPLETED AND INTEGRATED** — PR #5 MERGED (`05872c9`) · PR #6 MERGED (`3c4b258`)
Fase 1B.3: **IN PROGRESS** — 1B.3A/1B.3B entregadas (migración 003) · **1B.3C COMPLETED** (commit `4a3c553`, push sin PR) · **1B.3D-1 COMPLETED** (commit `e3ba875`, push sin PR) · **1B.3D-2 PENDING**
PR #4: CLOSED (sin merge, reemplazado) | **PR #5: MERGED** | **PR #6: MERGED**

# Agent State

## General

- Project: PGadm
- Current Phase: **1D.1 APROBADO (D-I01…D-I14) + 1D.2 COMPLETED + 1D.3 COMPLETED (inventario: migración 010 + seed + 638/638 pgTAP + dominio/use cases/repositorios + 362/362 vitest) — rama `feature/f1d-PG-INVENTORY-005-inventory`, HEAD `bffb2d2`; sin PR; sin merge**
- Integration Branch: `develop` (HEAD `0674e9f`, merge PR #8 cierre documental 1B.3)
- Active Feature Branch: `feature/f1d-PG-INVENTORY-005-inventory`
- Worktree: `C:\Users\GVTASNOG\Documents\PGadm-worktrees\inventory-snapshots`
- Status: Fase 1B.2 COMPLETED AND INTEGRATED (PR #5 MERGED `05872c9`); **Fase 1B.3 COMPLETED AND INTEGRATED** (PR #7 MERGED `a533bde`; 1B.3A-D completadas); **Fase 1C COMPLETED AND PUSHED** (discovery + 1C.1 decisiones bloqueadas; 1C.2 migración 008; 1C.3 dominio/use cases/UI; 1C.4 permisos/seguridad; 1C.5 auditoría `_audit.catalog_events` + timeline + placeholders de integración; 550/550 pgTAP + 294/294 vitest + gates; 17 commits, HEAD `9a7b4b8`; sin PR); **Fase 1D.1 APROBADO** (D-I01…D-I14 APPROVED 2026-08-06, commit `9bc1de3`) **+ 1D.2 COMPLETED** (migración 010 `inventory_snapshots`: 5 tablas + `_audit.inventory_events`; permisos `inventory.*` → 15 permisos / 35 role_permissions; fixtures `90000000-…`; **638/638 pgTAP** + **294/294 vitest** + gates; 3 commits, HEAD `5cb5332`) **+ 1D.3 COMPLETED** (dominio/application/infrastructure de inventario: demo + Supabase repos, use cases approveImport/observaciones/plantillas/historial, guards, `INVENTORY_DATA_SOURCE`; **362/362 vitest** + gates; 2 commits, HEAD `bffb2d2`; sin PR)
- Last Stable Commit (develop): `0674e9f` (merge PR #8, cierre documental Fase 1B.3)
- PRs: #1 — MERGED | #2 — MERGED | #3 — MERGED | #4 — CLOSED (reemplazado) | #5 — MERGED | **#6 — MERGED** (cierre documental 1B.2) | **#7 — MERGED** (Fase 1B.3, merge commit `a533bde`) | **#8 — MERGED** (cierre documental 1B.3, merge commit `0674e9f`)
- Next Phase: **Fase 2 — Inventario (1D)**: 1D.1 APROBADO (D-I01…D-I14, 2026-08-06); **1D.2 COMPLETED** (migración 010 `inventory_snapshots` + seed + pgTAP 638/638 + gates, HEAD `5cb5332`); **1D.3 COMPLETED** (dominio/use cases/repositorios de inventario, HEAD `bffb2d2`); **siguiente: 1D.4 permisos/seguridad + server context/actions de inventario** (aprobación ya obtenida). Pendiente además: revisión humana de las ramas 1C + 1D, PR a `develop` y merge; flips `CATALOG_DATA_SOURCE`/`ORGANIZATION_DATA_SOURCE`/`INVENTORY_DATA_SOURCE` = decisión de ops (default `demo`, D031/D-C22/D-I12)

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

## Phase 1B.3D-2 Summary (3 Aug 2026 — rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls`, commits `02c063e`, `15df869`, `6171149`, `73c55b4`)

- **Migración `00000000000007_organization_rls_and_permissions_rpc.sql`:** RLS en `organizations/branches/warehouses/branch_warehouse_relations` (4 políticas allowlist `to authenticated` vía `_access.current_organization_ids()`), grants SELECT solo a `authenticated` (revokes a `public/anon/service_role`), función `public.current_user_permissions()` (SECURITY DEFINER D15, `search_path=''`, EXECUTE solo `authenticated`) que resuelve permisos efectivos vigentes (`p/m/a/r/perm.status='active'`). No toca 002 ni `ci_verify.sql` (solo aserta rol `public`). **434/434 pgTAP PASS** (7 files; `test_identity_rbac_rls.sql` plan 140, nuevo `test_organization_rls.sql` 78 tests multi-usuario RLS/RPC).
- **App layer (@supabase/ssr 0.12.4):** `src/lib/supabase/server.ts` → `createServerClient` async con cookies de `next/headers` (`getAll`/`setAll` con try/catch); cookie de sesión `sb-127-auth-token` (PKCE, chunks `key`/`key.1`… 3180 chars, `base64-`+`stringToBase64URL`).
- **Infraestructura identity:** `mappers.ts` (`mapProfile/mapOrganizationMembership/mapRole/mapPermission/mapUserRoleAssignment` con `assertStatus`), `supabase-identity-repository.ts` (cliente inyectado, `or()` roles globales+org, orden por código/fechas), `index.ts`.
- **Aplicación identity:** `session.ts` (`resolveIdentitySession` → authenticated/unauthenticated/inactive/error; `getIdentitySession`; `decodeJwtTimes` base64url), `guards.ts` (`requireIdentity`→`/login`, `requirePermission(code)`→`/unauthorized?reason=forbidden`), `index.ts`.
- **Login/logout real:** `src/app/login/actions.ts` (`loginAction` con guard config + mensaje, `logoutAction`), `page.tsx` conectado (submit real, errores inline).
- **Página de sesión real:** `src/app/admin/identity/page.tsx` (`force-dynamic`, `requireIdentity()`, `SessionState`/`UserSummary`/`PermissionSummary`/`SessionStatus`, metadatos, form logout). Home enlaza a `/admin/identity` y `/admin/identity-preview`.
- **Rutas protegidas:** `/admin/organization` ahora exige `requirePermission("organization.read")`; `/admin/identity` exige `requireIdentity()`. `/admin/identity-preview` permanece **público** (showcase visual con datos simulados, etiquetado "sin autenticación real" — decisión alineada con `ORGANIZATION_DATA_SOURCE=demo`).
- **Decisión documentada:** `ORGANIZATION_DATA_SOURCE` sigue default `demo`; modo `supabase` funcional (migración 007) pero el flip es decisión de ops. `.env.example` y `repository-selection.ts` actualizados.
- **Vitest 149/149** (26 files; nuevos `guards.test.ts`, `infrastructure-mappers.test.ts`, `session-compositor.test.ts`, `identity-session-page.test.tsx`; actualizados `identity-routes.test.tsx`, `organization-page.test.tsx`, `feature-security.test.ts`). Lint ✅ typecheck ✅ build ✅ (7 rutas).
- **`scripts/e2e-identity.mjs` (`npm run e2e:identity`):** E2E multiusuario API-level (GoTrue + PostgREST, solo anon key): signup 5 fixtures, provisioning psql, sign-in, RPC `current_user_permissions` por rol, scoping RLS org/sucursal/almacén (manager/cashier/operator + inactive + sin membresía), INSERT cross-org bloqueado (403), logout revoca refresh (400), cleanup ordenado (assignments→memberships→auth.users por FK RESTRICT de `user_role_assignments_membership_fk`). **39/39 PASS.** RLS también deniega por perfil `inactive` (`current_organization_ids()` filtra `p.status='active'`).
- **Gates:** lint ✅ typecheck ✅ **149/149** vitest ✅ build ✅ `db:reset` ✅ `db:test` **434/434** ✅ `db:lint` sin errores ✅ `db:verify` ALL CHECKS PASSED ✅ `git diff --check` limpio ✅ sin secretos ✅. audit (4 high prod = baseline) sin cambio.
- **1B.3D-2 COMPLETED AND PUSHED** (commits `02c063e`, `15df869`, `6171149`, `73c55b4`, HEAD `73c55b4`). `DemoOrganizationRepository` y `ORGANIZATION_DATA_SOURCE=demo` intactos.

## Phase 1B.3 Post-Merge Regression (4 Aug 2026 — repositorio principal)

- **Sync develop:** fast-forward `3c4b258` → `a533bde` (PR #7 MERGED, merge commit). HEAD verificado `a533bde76c020bf89ff007739919da9b1d1771e2`.
- **`npm ci`** ✅ (461 paquetes; audit 4 high prod = baseline, sin `--force`).
- **Gates post-merge:** lint ✅ · typecheck ✅ · **149/149** vitest ✅ · build ✅ (7 rutas) · `db:reset` ✅ · **434/434** pgTAP ✅ · `db:lint` sin errores ✅ · `db:verify` ALL CHECKS PASSED ✅ · **14/14** `e2e:auth` ✅ · **39/39** `e2e:identity` ✅ · `git diff --check` limpio ✅ · sin secretos ✅.
- **Rama feature conservada:** `feature/f1b-PG-IDENTITY-003-auth-rbac-rls` permanece en `origin` (HEAD `816d0bc`), ya no es la rama activa.
- **Cierre documental:** rama `docs/f1b3-post-merge-closeout` hacia `develop` — solo `AGENT_STATE.md`.

## Phase 1C Discovery Summary (4 Aug 2026 — rama `feature/f1c-PG-CATALOG-004-product-master`, worktree `catalog-product-master`)

- **Base:** develop `0674e9f` (merge PR #8, cierre documental 1B.3). Worktree creado desde `origin/develop` sin commits previos; rama previa `feature/f1b-PG-IDENTITY-003-auth-rbac-rls` conservada.
- **Descubrimiento 1C (catálogo maestro de productos) — solo documentación, sin implementación, sin migración, sin UI.**
- **8 entregables F1C iniciales** + acta humana 1C.1: `F1C_KICKOFF_CONTRACT.md`, `F1C_DOCUMENT_USAGE_INDEX.md`, `F1C_SCOPE_MATRIX.md`, `F1C_DATA_MODEL_PROPOSAL.md`, `F1C_RLS_PERMISSION_MATRIX.md`, `F1C_TEST_PLAN.md`, `F1C_IMPLEMENTATION_SLICES.md`, `F1C_DISCOVERY_HANDOFF.md`, **`F1C_HUMAN_ARCHITECTURE_REVIEW.md`**, **`F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md`** (anexo).
- **Decisiones clave:** modelo producto/variante separado (SKU y barcodes en la variante); catálogo org-scoped con FK compuestas; precios de referencia (dato, no regla); baja lógica por `status` sin DELETE; `external_id` Intelisis único por org; permisos `catalog.read/create/update/archive/manage`; RLS deny-by-default reutilizando `_access` (004) y patrón 007.
- **Diferido:** impuestos, listas de precios, imágenes/Storage, sustitutos, visibilidad por sucursal, proveedores, sync Intelisis, UI.
- **Gates:** solo documentación `.md`; `git diff --check` limpio ✅; sin secretos ✅; sin código funcional.
- **Estado discovery:** COMPLETED (`a4236f7`). Continuó en 1C.1 (abajo).

## Phase 1C.1 Architecture Lock (4 Aug 2026 — misma rama/worktree)

- **Revisión humana aprobada** (5 preguntas cerradas). Acta: `F1C_HUMAN_ARCHITECTURE_REVIEW.md`.
- **D-C01…D-C17** registradas en `DECISION_LOG.md` con estado **APPROVED · 2026-08-04**.
- **Ajustes congelados:** `_catalog.enforce_category_tree()`; `reference_price numeric(14,4)` único; `base_units_per_sale_unit`; UOM `kind` dimensional; ciclo de vida inactive/active/última variante; archive ≠ update; manage restore; `UNIQUE(organization_id,id)` en padres; índices `upper(trim(...))`; `CHECK trim() <> ''`.
- **Roles:** administrator / manager / cashier / operator (matriz `catalog.*`).
- **Plan de pruebas** ampliado (CA-3b/3c, CA-14b/c/d, CA-11b, CA-26/27, …).
- **Restricciones respetadas:** solo `.md`; sin migración 008; sin `seed.sql`; sin TypeScript; sin UI; sin PR; sin merge.
- **Siguiente:** 1C.2 (migración 008) solo con instrucción expresa.

## Phase 1C.1 Anexo Comercial — Agosto 2026 (4 Aug 2026)

- **Evidencia operativa analizada:** `C:\Users\GVTASNOG\Desktop\COMERCIALIZACION AGOSTO 2026.pdf` (24 pág.; texto extraído con `pypdf`; PDF mayormente imagen, listas externas no incrustadas).
- **Entregable:** `F1C_COMMERCIALIZATION_INPUT_AUGUST_2026.md` — resumen, matriz de requisitos (R-01…R-12), soporte 1C, diferidos a Comercialización/Inventario/Precios/Incentivos, entidades futuras propuestas (`commercial_campaigns`, `promotion_rules`, `campaign_products`, `promotion_bundles`, `campaign_labels`, `store_merchandising_tasks`, `outlet_rules`, `sales_incentives`) y riesgos.
- **Principio confirmado:** promociones, colores de etiquetas (naranja/amarilla/roja/azul/dorada), incentivos, precios mensuales y reglas de Outlet **NO** son columnas de `products`/`product_variants`; 1C solo aporta referencias maestras.
- **Actualizados:** `F1C_DOCUMENT_USAGE_INDEX.md`, `F1C_SCOPE_MATRIX.md`, `F1C_DISCOVERY_HANDOFF.md`, `F1C_DATA_MODEL_PROPOSAL.md` (§7), `F1C_TEST_PLAN.md` (§8), `F1C_HUMAN_ARCHITECTURE_REVIEW.md` (§5).
- **Sin migraciones ni código de Comercialización** (solo documentación `.md`).

## Phase 1C.2 Database Foundation (5 Aug 2026 — misma rama/worktree)

- **Migración `00000000000008_product_master.sql`** (con autorización expresa): esquema `_catalog` con 7 tablas (`product_categories`, `product_brands`, `units_of_measure`, `product_lines`, `products`, `product_variants`, `product_barcodes`), FK compuestas org-scoped, `UNIQUE(organization_id,id)` inline en `product_categories` (requerido por la FK autoreferenciada; reemplaza el índice único planeado), índices funcionales `upper(trim(...))`, CHECKs `trim() <> ''`, triggers `updated_at`, y 4 funciones `_catalog` (`enforce_category_tree`, `enforce_product_active_variant`, `enforce_last_active_variant`, `enforce_status_transition`) — SECURITY INVOKER con `search_path=''`.
- **RLS y grants:** 21 políticas allowlist (3 por tabla) solo para `authenticated`; sin DELETE; FORCE RLS off (D20); revokes mínimos PG15-safe; `enforce_status_transition` (BEFORE UPDATE, guard `current_user='authenticated'`) aplica la máquina de estados D-C14/D-C16 incl. discontinue sin `catalog.manage`.
- **Seed:** 5 permisos `catalog.*` (total 11); role_permissions administrator +5 / manager +3 / cashier +1 / operator +1 (total 23); fixtures demo catálogo PGM (6 UOM, 3 líneas, 2 marcas, 3 categorías ≤3 niveles, 2 productos activos, 3 variantes, 4 barcodes) y PGM-DEMO-B (mínimos); productos nacen `inactive` y se activan tras insertar variantes.
- **Pruebas:** `test_product_master.sql` nuevo (78 aserciones); `test_identity_rbac_rls.sql` 6→11 permisos y 13→22 role_permissions; `test_organization_rls.sql` sets por rol actualizados (manager 7 / cashier 3 / operator 2) y admin 11; `ci_verify.sql` plan 47 + sección catálogo (se removió `products` de la lista de tablas prohibidas). `db:test` **518/518** (8 archivos).
- **Gates:** lint ✅ · typecheck ✅ · **149/149** vitest ✅ · build ✅ · `db:reset` ✅ · **518/518** pgTAP ✅ · `db:lint` sin errores ✅ (incluye `_catalog`) · `db:verify` ALL CHECKS PASSED ✅ · `db:types` regenerado (+370 líneas) ✅ · **14/14** `e2e:auth` ✅ · `e2e:identity` ✅ (permisos `catalog.*` + scoping RLS `products`) · `git diff --check` limpio ✅ · sin secretos ✅ · `npm audit` baseline (sin `--force`) ✅.
- **Hallazgo:** la FK autoreferenciada de categorías exige unique inline (error `SQLSTATE 42830` → fix en 008); el UPDATE/DELETE denegado por RLS aplica filtro silencioso (0 filas, sin 42501) — cashier y operador bloqueados por `USING`.
- **3 commits + push a `feature/f1c-PG-CATALOG-004-product-master`; sin PR; sin merge; 1C.3 no iniciada.**

## Phase 1C.3 Backend Summary (5 Aug 2026 — misma rama/worktree)

- **Backend TS del catálogo completo, sin UI, sin migraciones nuevas.** Estructura espejo del patrón `organization`: `domain/` + `application/` + `infrastructure/`, errores tipados, interfaces de repositorio, guards reusando `requirePermission` de identity.
- **Domain (`src/features/catalog/domain/`):** `catalog-errors.ts`, `catalog-permissions.ts` (read/create/update/archive/manage), `actor.ts` (`CatalogActor` + `requirePermission` + `permissionsOf`), `status.ts` (statuses product/reference + validadores/normalizadores; `normalizeOptionalText("") → null`), entidades product/variant/barcode/category (árbol ≤3 niveles, `CATEGORY_MAX_DEPTH=3`)/brand/product-line/unit, `catalog-repository.ts` (interfaces, incl. `findVariantById`, `findVariantBySku`, `findBarcodeByValue`), `audit.ts` (port `CatalogAuditRepository`), `index.ts`.
- **Application:** `guards.ts` (`requireCatalogRead/Create/Update/Archive/Manage`, `actorFromIdentitySession`, `assertActorOrganization`), `catalog-context.ts`, `shared.ts` (drafts normalizados + `referenceStatusAction` → audit archive/restore/update), `product-use-cases.ts` (create/update/archive/restore/get/list/search; activación solo con variante activa), `variant-use-cases.ts` (SKU único cross-product, último activo protegido, `requireVariantEditable`), `barcode-use-cases.ts` (Add/ChangePrimary; **Remove rechazado** con `CatalogUnsupportedOperationError`, D-C14), `category-use-cases.ts` (integridad de árbol: self-parent, ciclos, profundidad), `brand-use-cases.ts`, `product-line-use-cases.ts`, `unit-use-cases.ts`, `index.ts`.
- **Infrastructure:** `mappers.ts` (rows DB → dominio con `assert*`), `supabase-catalog-repository.ts` (5 repos org-scoped, `.maybeSingle()`, `escapeLike`, columna RLS respetada), `demo-catalog-repository.ts` (fakes in-memory org-scoped), `noop-catalog-audit-repository.ts` (port; expone `events[]`; swap a `_audit.catalog_events` en 1C.5 D-C10), `repository-selection.ts` (**`CATALOG_DATA_SOURCE` = `demo` default | `supabase`**, determinístico sin fallback D031), `index.ts`.
- **Tests (`src/tests/features/catalog/`):** 11 archivos + `helpers.ts` (factories, `standardReferences`, `makeContext` tipado con audit repo) — use cases producto (24) / variante (13) / barcode (9) / referencias (17), validations (15), permissions+guards (8), demo repos (10), selección de fuente (8), mappers (8), feature-security (5: sin admin client, sin fallback catch). 117 nuevos.
- **Gates:** lint ✅ · typecheck ✅ · **266/266 vitest** (antes 149) ✅ · build ✅ (7 rutas) · `git diff --check` limpio ✅ · sin secretos ✅.
- **5 commits + push a `feature/f1c-PG-CATALOG-004-product-master`; sin PR; sin merge; UI de 1C.3 no iniciada.**

## Phase 1C.4/1C.5 Summary (6 Aug 2026 — misma rama/worktree)

- **1C.4 (permisos/seguridad):** permisos `catalog.*` verificados con
  `current_user_permissions()`; CA-31…CA-39 cubiertos; `feature-security.test.ts`
  confirma cero `service_role`/admin client en la feature.
- **1C.5 (auditoría + cierre):** migración `00000000000009_catalog_audit.sql` —
  `_audit.catalog_events` append-only (FK `public.profiles`/`public.organizations`,
  CHECKs action/entity_type, índices por org+entidad y org+fecha, RLS allowlist
  select/insert con `_access.current_organization_ids()` +
  `_access.has_permission('catalog.*')`, grants select/insert solo `authenticated`,
  revokes a `public`/`anon`/`service_role`). Esquema `_audit` expuesto en
  `supabase/config.toml [api] schemas` (PostgREST, cliente anon RLS-scoped; nunca
  service_role).
- **SupabaseCatalogAuditRepository** (`AUDIT_COLUMNS`, `MAX_HISTORY_EVENTS=50`,
  `record()`/`listEvents(filter)` con orden `occurred_at desc, id desc` y límite
  clamp 1..50; `RepositoryConfigurationError` sin config).
- **Poblado de auditoría:** 19 call-sites en 7 módulos de use cases (product,
  variant, barcode, category, brand, product-line, unit) para
  create/update/archive/restore.
- **Timeline de historial (P6):** `getProductHistory` (máx. 30, fusiona
  producto+variantes, orden desc) + `HistoryTimeline` (es-MX, badges
  Creación/Actualización/Descontinuado/Restaurado, actor primeros 8 chars) en el
  detalle de producto.
- **Placeholders de integración (P2/P3/P4):** `CatalogIntegrationRepository`
  (inventario current/reserved/available stock + average/last cost; compras
  last supplier/purchase/cost; precios base/sugerido/venta/especial/lista) +
  `NoopCatalogIntegrationRepository` (todo null, "Sin integración de inventario")
  para demo y supabase; `IntegrationSummaryCard` en la página de producto. Sin
  implementación de inventario/ventas/promociones (alcance 1C.5).
- **Tests:** `test_catalog_audit.sql` (32 aserciones; fixture multi-org PGM/Demo-B,
  RLS comportamiento real para manager/cashier/operator) + `integration-and-history
  .test.ts` (6) + `repository-selection.test.ts` (9; incl. error tipado sin config).
- **Gates:** lint ✅ · typecheck ✅ · **294/294 vitest** (39 archivos) ✅ · build ✅
  (12 rutas) · `db:reset` ✅ · **550/550 pgTAP** (9 archivos) ✅ · `db:lint` sin
  errores ✅ · `db:verify` ALL CHECKS PASSED ✅ · `git diff --check` limpio ✅ ·
  sin secretos ✅ · audit baseline (4 high prod, sin `--force`) ✅.
- **2 commits + push pendiente de 1C.5** (`aa7975a`, `9a7b4b8`; rama ahead de
  origin por 2) + cierre documental (`HANDOFF_004_F1C_...`, D-C18…D-C22).
- **1C COMPLETED / fase "1D" NO definida** (requiere decisión humana). Flip
  `CATALOG_DATA_SOURCE=supabase` = decisión de ops (default `demo`, D031/D-C22).

## Phase 1D Inventory Kickoff (6 Aug 2026 — rama `feature/f1d-PG-INVENTORY-005-inventory`, worktree `inventory-snapshots`)

- **Kickoff contract** propuesto (`docs/orchestration/handoffs/F1D_KICKOFF_CONTRACT.md`):
  Fase 2 — Productos e inventario (gate: "Archivo válido crea snapshot auditable").
- **Decisión D-I01…D-I14 APROBADAS (2026-08-06, commit `9bc1de3`)**: modelo de 4
  tablas (`inventory_snapshot`, `inventory_snapshot_item`, `inventory_change`,
  `inventory_observation`), snapshot auditable + fecha exacta de fuente (D-I02),
  solo cambios con historial no destructivo (D-I03), "existencia reportada" con fecha
  tienda/CEDIS separados sin causa de movimiento (D-I04), ausente ≠ stock cero (D-I05),
  observaciones sin mutar stock oficial (D-I06), mapeo de columnas por plantilla
  (D-I07), vínculo almacenes detectados ↔ `warehouses` 1B.2 (D-I08), conversión de
  unidades solo con factores confirmados (D-I09), permisos `inventory.*` (D-I10),
  fuente inicial Excel→cubo con Intelisis oficial de referencia + adaptadores (D-I11),
  `INVENTORY_DATA_SOURCE=demo` default sin fallback (D-I12), alertas iniciales (D-I13),
  consumidores futuros (layout/ventas/comercialización/IA) diferidos (D-I14).
- **Base:** `ee761b1` (HEAD 1C; inventario depende del catálogo, sin merge a develop).
- **Docs-only:** 1 commit `5f41ded`; `git diff --check` limpio; sin código/DB/UI.
- **Aprobación kickoff:** D-I01…D-I14 APPROVED (2026-08-06, commit `9bc1de3`); documentos F1D con estado APROBADO.

## Phase 1D Documentation Pack (6 Aug 2026 — misma rama/worktree)

- **Paquete documental 1D.1 COMPLETADO** (propuesta, sin aprobación aún):
  - `F1D_DATA_MODEL_PROPOSAL.md` — candidato de 5 tablas (`inventory_snapshot`,
    `inventory_snapshot_item`, `inventory_change`, `inventory_observation`,
    `import_template`) con FK compuestas a `product_variants` (1C) y `warehouses`
    (1B.2); 6 preguntas abiertas (nombres singular/plural, `variant_id` vs
    `product_id`, snapshot por almacén vs tienda+CEDIS, `evidence_url`, roles
    operativos, vínculo almacenes detectados ↔ warehouses).
  - `F1D_RLS_PERMISSION_MATRIX.md` — permisos `inventory.read/import/approve/observe`,
    matriz de roles (D-I10) y políticas RLS allowlist deny-by-default.
  - `F1D_TEST_PLAN.md` — casos IA-1…IA-37 (importación, snapshot/línea base, cambios,
    observaciones, RLS, consistencia) + no-regresión + seed.
  - `F1D_IMPLEMENTATION_SLICES.md` — subfases 1D.1…1D.5; 1D.1 completada; 1D.2–1D.5
    no iniciadas (requieren aprobación + instrucción expresa).
- **Docs-only:** commit `b6cbbf7`; `git diff --check` limpio; sin código/DB/UI.
- **Aprobación:** D-I01…D-I14 y defaults de preguntas abiertas APPROVED (2026-08-06,
  commit `9bc1de3`); habilitó la subfase 1D.2.

## Phase 1D.2 Inventory Database (6 Aug 2026 — misma rama/worktree)

- **Migración `00000000000010_inventory_snapshots.sql`** (5 tablas públicas + auditoría):
  - `inventory_snapshots` (por `warehouse_id`, `report_date` NOT NULL conserva fecha de
    fuente D-I02/D-I04, `is_baseline`, `source` excel|cube|manual|intelisis, imported_by
    →profiles), `inventory_snapshot_items` (`variant_id` D-I04, quantity/boxes/
    square_meters ≥ 0), `inventory_changes` (STORED GENERATED `difference = new - previous`,
    `change_type` increase|decrease|zeroed|recovered|new_product|missing_product D-I05),
    `inventory_observations` (type physical_count|damaged|reserved|wrong_location|
    missing_label|difference D-I06, `evidence_url` text D-C17, created_by), `import_templates`
    (jsonb `column_mapping` con code/description/warehouse/existence D-I07, `warehouse_rules`
    D-I08).
  - `_audit.inventory_events` append-only (approve_import|create_observation|
    confirm_observation); FK compuestas org-scoped a `warehouses`/`product_variants`;
    `UNIQUE(organization_id, id)` en las 5 tablas; partial unique
    `inventory_snapshots_load_unique` WHERE NOT is_baseline; `_core.set_updated_at_column()`
    solo en las 3 tablas mutables; RLS allowlist deny-by-default (13 políticas + 2 eventos,
    authenticated only D17/D18, grants == políticas, sin DELETE, revokes public/anon/
    service_role, `reset all`).
- **Seed (1D.2):** permisos `inventory.read/import/approve/observe` (IDs `50000000-…-012…015`,
  total 15) + role_permissions (admin +4, manager +4, cashier +2, operator +2, total 35) +
  fixtures PGM `90000000-…`: 2 snapshots (baseline 2026-08-03 + 2026-08-06, NOG-01), 5 items
  (variante 053 ausente en el 2º), 3 changes (increase 100→130, zeroed 4→0, missing_product
  12→0), 2 observaciones, 1 plantilla — `ON CONFLICT (id) DO NOTHING`.
- **Tests:** `test_inventory_stock.sql` pgTAP **plan(88)** (fases A estructura/políticas/grants,
  C fixtures, D RLS authenticated manager/cashier/operator + audit append, B integridad/FK/
  uniques/CHECK); suites previas ajustadas a 15 permisos / 35 role_permissions
  (`test_identity_rbac_rls.sql` 140, `test_organization_rls.sql` 78) + `e2e-identity.mjs`
  con permisos `inventory.*`.
- **Gates:** `db:lint` ✅ · `db:reset` ✅ · **638/638 pgTAP** (10 archivos) ✅ · `db:verify`
  ALL CHECKS PASSED ✅ · `db:types` regenerado (338 líneas nuevas) ✅ · lint ✅ · typecheck ✅ ·
  **294/294 vitest** ✅ · build ✅ (16 rutas) · `e2e:auth` 14/14 ✅ · `e2e:identity` 39/39 ✅ ·
  `git diff --check` limpio ✅ · sin secretos ✅.
- **Commits (3):** `ce42a56` feat(inventory) migración+seed+types · `9e1bdf0` test(inventory)
  pgTAP+suites+e2e · docs (este cierre documental).
- **Pendiente:** subfase **1D.3** (dominio/use cases/repositorios de inventario, port 1C.5);
  revisión humana de ramas 1C + 1D, PR a `develop` y merge; flips de data source = ops.

## Phase 1D.3 Inventory Domain, Use Cases & Repositories (6 Aug 2026 — misma rama/worktree)

- **Dominio (`src/features/inventory/domain/`):** jerarquía de errores tipados
  (`InventoryError` → NotFound/Validation/Data/Permission + `RepositoryConfigurationError`),
  `InventoryActor` con `requirePermission` antes de cada escritura, 4 permisos
  `inventory.read/import/approve/observe`, 5 entidades (snapshot/items/changes/
  observaciones/plantillas), puerto de auditoría `_audit.inventory_events`, contrato
  agregado `InventoryRepository` org-scoped (D-C07) y catálogo de referencias
  (variante/almacén, D-C08). `column_mapping` tipado como `{required, optional}` para
  igualar el jsonb del seed 1D.2 (D-I07).
- **Application (`src/features/inventory/application/`):** guards desde
  `IdentitySession` (RLS-scoped, nunca payload de cliente), `approveImport` con reglas
  de línea base (IA-12/13), rechazo de duplicados (IA-8) y `computeChanges` con los 6
  tipos de cambio (IA-14/15/16/18, `difference = new - previous`); observaciones
  (IA-20/21/22, nunca mutan stock), plantillas (create/update/deactivate, sin DELETE),
  historial no destructivo (IA-17). Auditoría append-only en cada mutación (IA-35).
- **Infrastructure (`src/features/inventory/infrastructure/`):** repos demo en memoria
  sembrados con los fixtures 1D.2 (paridad seed PGM) con opción `{seed:false}` para
  flujos baseline; repos Supabase contra la migración 010 (PostgREST RLS-scoped, D09/T09,
  nunca service_role); catálogo de referencias Supabase reutiliza `SupabaseProductRepository`
  + lookup directo de `warehouses`; `INVENTORY_DATA_SOURCE=demo` por defecto (D-I12),
  selección determinista, error tipado si valor inválido (D031), sin fallback silencioso.
- **Tests (68 nuevos → 362/362 vitest):** `use-cases-import` (23, IA-4/5/6/7/8/12/13/
  14/15/16/17/18/23/25), `use-cases-observation` (11, IA-20/21/22/26), `use-cases-template`
  (14, D-I07/IA-3/33/34), `history-and-guards` (7), `demo-repository` (7 fixtures),
  `repository-selection` (6, D-I12/D031).
- **Gates:** lint ✅ · typecheck ✅ · **362/362 vitest** (45 archivos) ✅ · build ✅
  (16 rutas) · `git diff --check` limpio ✅ · sin secretos ✅.
- **Commits (2):** `e28dfb5` feat(inventory) dominio+application+infrastructure ·
  `bffb2d2` test(inventory) suites 1D.3.
- **Pendiente:** subfase **1D.4** (permisos/seguridad server + server context/actions de
  inventario); revisión humana de ramas 1C + 1D, PR a `develop` y merge; flips de data
  source = ops.

## Blockers

| Blocker | Detail |
|---------|--------|
| ~~Docker Desktop not installed~~ | Resuelto: Docker Desktop disponible en el entorno; Supabase local corre y `db:reset`/`db:test`/`db:verify` se ejecutan de verdad |
| ~~psql/pg_ctl/initdb ausentes en Windows~~ | Resuelto: validación SQL local vía contenedor `pg_prove` de Supabase (pgTAP 1.2.0) |
| ~~`[inbucket]` deprecado~~ | Resuelto en 1B.3D-1: migrado a `[local_smtp]` puerto 54324 (commit `e3ba875`) |
| `public_repo`/token scope (histórico) | Token antiguo sin scope bloqueó edición/merge de PR; resuelto con token con scope `repo` (escritura) |

## Next Action

Fase **1D.1 APROBADO + 1D.2 COMPLETED + 1D.3 COMPLETED** (inventario; D-I01…D-I14 APPROVED `9bc1de3`; migración 010 + seed + **638/638 pgTAP**; dominio/use cases/repositorios + **362/362 vitest** + gates, HEAD `bffb2d2`; sin PR). Siguiente fase: **1D.4 permisos/seguridad + server context/actions de inventario** (aprobación ya obtenida). Pendiente además: revisión humana de las ramas 1C + 1D, PR a `develop` y merge. Flips `CATALOG_DATA_SOURCE` / `ORGANIZATION_DATA_SOURCE` / `INVENTORY_DATA_SOURCE` = decisión de ops (default `demo`, D031/D-C22/D-I12).

## Status

Fase 1C: **1C.1–1C.5 COMPLETED AND PUSHED** (catálogo maestro; 17 commits en `feature/f1c-PG-CATALOG-004-product-master`, HEAD `9a7b4b8`; migración 008 + seed + auditoría 009 + dominio/app/UI + permisos/seguridad; **550/550 pgTAP** + **294/294 vitest** + gates; sin PR; sin merge). Cierre documental: `HANDOFF_004_F1C_...`, D-C18…D-C22.
Fase 1D: **1D.1 APROBADO (D-I01…D-I14, `9bc1de3`) + 1D.2 COMPLETED + 1D.3 COMPLETED** (inventario; migración `00000000000010_inventory_snapshots.sql` + seed `inventory.*` + `test_inventory_stock.sql` plan(88); **638/638 pgTAP** + **362/362 vitest** + gates; commits `ce42a56`+`9e1bdf0` + `e28dfb5`+`bffb2d2`; sin PR; sin merge).
Fase 1C.1: **COMPLETED** — D-C01…D-C17 APPROVED (2026-08-04); acta `F1C_HUMAN_ARCHITECTURE_REVIEW.md`; solo documentación.
Fase 1B.2: **COMPLETED AND INTEGRATED** — PR #5 MERGED (`05872c9`) · PR #6 MERGED (`3c4b258`)
Fase 1B.3: **COMPLETED AND INTEGRATED** — PR #7 MERGED (`a533bde`, merge commit). Rama `feature/f1b-PG-IDENTITY-003-auth-rbac-rls` conservada, ya no activa.
PR #4: CLOSED (sin merge, reemplazado) | **PR #5: MERGED** | **PR #6: MERGED** | **PR #7: MERGED** (Fase 1B.3) | **PR #8: MERGED**

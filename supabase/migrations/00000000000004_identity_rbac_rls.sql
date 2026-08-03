-- PGadm — Identity RLS: policies, _access helpers and minimal grants (Phase 1B.3C)
-- File: 00000000000004_identity_rbac_rls.sql
--
-- Scope (contract F1B3): activate RLS on the six identity tables, add allowlist
-- policies per operation, add the minimal _access resolution helpers, and apply
-- minimal grants. Migration 003 is NOT modified; it is extended via CREATE OR
-- REPLACE for the two functions whose security model must change (documented
-- exceptions to D15 below).
--
-- Design doc: docs/orchestration/handoffs/F1B3_RLS_POLICY_DESIGN.md (§1-§6).
-- Threat model: F1B3_THREAT_MODEL (T01-T15). Access matrix: F1B3_ACCESS_TEST_MATRIX
-- (ACC-01..12, 15, 17..21). Decisions: F1B3_DECISION_MATRIX D04-D19, D22.
--
-- CRITICAL COMPATIBILITY (CI): pr-validation.yml applies migrations 001..004 +
-- seed on plain PostgreSQL 15 with NO Supabase auth schema and NO runtime roles
-- (anon/authenticated/service_role/supabase_auth_admin). To make the RLS suite
-- deterministic on BOTH environments this migration CREATES those runtime roles
-- (NOLOGIN) when they are missing; on Supabase they already exist and are skipped
-- (guarded by pg_roles). Every role-targeted grant/policy can then be created
-- unconditionally and CI exercises the real RLS path.
--
-- Security decisions:
--   D15 EXCEPTION (documented in F1B3_RLS_POLICY_DESIGN §2.1/§2.2):
--     - _core.sync_profile() -> SECURITY DEFINER (auth.profiles sync must survive RLS).
--     - _access.current_organization_ids()/has_permission()/role_in_own_orgs() and
--       role_belongs_to_organization() -> SECURITY DEFINER (RLS policies resolving
--       authorization would otherwise recurse: SQLSTATE 42P17 - "infinite recursion
--       detected in policy for relation").
--     All definer functions: SET search_path = '', schema-qualified references,
--     REVOKE ALL FROM PUBLIC, GRANT EXECUTE minimal, escalation tests in pgTAP.
--   D16  Every helper sets an explicit search_path.
--   D17  No grants/policies for anon.
--   D18  authenticated: grants with equivalent policies only.
--   D20  FORCE ROW LEVEL SECURITY is intentionally NOT enabled: forcing would
--        subject the table owner (postgres: seed/migrations) to RLS and silently
--        drop seed writes; PostgREST roles are not owners so RLS applies to them
--        without FORCE. Documented in ACC-20 test.
--
-- Rollback: documented, non-destructive (F1B3_RLS_POLICY_DESIGN §7).

-- ============================================================
-- 1. Runtime roles (idempotent; no-op on Supabase, bootstrap on plain PG CI)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$$;

-- ============================================================
-- 2. Helpers: _access
-- All helpers fix search_path (D16). The resolution helpers are SECURITY
-- DEFINER (documented D15 exception) to avoid RLS recursion and filtered reads
-- when called from policies. current_user_id() stays INVOKER (GUC only).
-- ============================================================

-- Helper: _access.current_user_id()
-- Replicates auth.uid() by reading the PostgREST JWT 'sub' GUC, independent of
-- the auth schema (works on plain PG CI and Supabase). NULL when the claim is
-- missing, empty or not a UUID.
create function _access.current_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_sub text;
begin
  v_sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  if v_sub is null then
    return null;
  end if;
  begin
    return v_sub::uuid;
  exception when invalid_text_representation then
    return null;
  end;
end;
$$;

comment on function _access.current_user_id() is
  'Current authenticated user id from the verified JWT sub claim (D13). Security invoker; GUC only.';

-- Helper: _access.current_organization_ids()
-- Organizations where the current user has an ACTIVE profile and an ACTIVE
-- membership. Empty when there is no membership -> policies yield zero rows
-- (ACC-05/06/09, D19).
create function _access.current_organization_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array(
    select m.organization_id
    from public.profiles p
    join public.organization_memberships m on m.user_id = p.id
    where p.id = _access.current_user_id()
      and p.status = 'active'
      and m.status = 'active'
  ), array[]::uuid[]);
$$;

comment on function _access.current_organization_ids() is
  'Active organizations of the current user. SECURITY DEFINER (documented D15 exception) to avoid RLS recursion from policies on the membership tables.';

-- Helper: _access.role_in_own_orgs(p_role_id)
-- True when the role is global or belongs to one of the current user's active
-- organizations. Used to keep catalog/assignment writes org-scoped.
create function _access.role_in_own_orgs(p_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.roles r
    where r.id = p_role_id
      and (r.organization_id is null or r.organization_id = any(_access.current_organization_ids()))
  );
$$;

comment on function _access.role_in_own_orgs(uuid) is
  'True when the role is global or belongs to an active organization of the user. SECURITY DEFINER (documented D15 exception).';

-- Helper: _access.has_permission(p_code)
-- True when the current user holds an ACTIVE assignment whose role grants the
-- permission code, with all statuses active and the assignment validity window
-- in force. Only the sub claim matters (ACC-17). SECURITY DEFINER: joins the
-- protected identity tables from within policies without recursion.
create function _access.has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_role_assignments a
    join public.organization_memberships m
      on m.organization_id = a.organization_id and m.user_id = a.user_id
    join public.profiles p on p.id = a.user_id
    join public.roles r on r.id = a.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions perm on perm.id = rp.permission_id
    where a.user_id = _access.current_user_id()
      and p.status = 'active'
      and m.status = 'active'
      and a.status = 'active'
      and r.status = 'active'
      and perm.status = 'active'
      and perm.code = p_code
      and a.valid_from <= now()
      and (a.valid_to is null or a.valid_to > now())
  );
$$;

comment on function _access.has_permission(text) is
  'RBAC permission check for the current user (D08/D10/D13/D19). SECURITY DEFINER (documented D15 exception). Ignores forged claims other than sub (ACC-17).';

-- Helper: _access.role_belongs_to_organization (REPLACED from 003)
-- Now SECURITY DEFINER so the structural trigger (003, decision 6.1) is
-- authoritative regardless of the invoker's RLS visibility of public.roles.
create or replace function _access.role_belongs_to_organization(
  p_role_id uuid,
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.roles r
    where r.id = p_role_id
      and r.status = 'active'
      and (r.organization_id is null or r.organization_id = p_organization_id)
  );
$$;

comment on function _access.role_belongs_to_organization(uuid, uuid) is
  'True when the role is global or belongs to the organization (D06). SECURITY DEFINER (documented D15 exception).';

-- ============================================================
-- 3. _core.sync_profile(): SECURITY DEFINER (documented D15 exception)
-- Auth.user insert triggers fire as supabase_auth_admin (internal role with no
-- privileges on public.profiles). Under RLS the invoker insert either raises
-- permission denied or silently inserts 0 rows; SECURITY DEFINER (table owner)
-- keeps 1:1 profile provisioning working. Body only inserts id/email from
-- GoTrue-controlled NEW values; ON CONFLICT DO NOTHING prevents overwrites.
-- ============================================================
create or replace function _core.sync_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function _core.sync_profile() is
  'Creates a 1:1 profile when an auth user is created (D02). SECURITY DEFINER exception (D15) documented in F1B3_RLS_POLICY_DESIGN §2.1; search_path locked and EXECUTE revoked from PUBLIC.';

-- ============================================================
-- 4. Function privileges: revoke PUBLIC, grant minimal
-- New _access functions default to PUBLIC EXECUTE; _core.sync_profile() and the
-- 003 helpers are revoked too so no internal helper is callable by PUBLIC.
-- ============================================================
revoke all on function _access.current_user_id() from public;
revoke all on function _access.current_organization_ids() from public;
revoke all on function _access.role_in_own_orgs(uuid) from public;
revoke all on function _access.has_permission(text) from public;
revoke all on function _access.role_belongs_to_organization(uuid, uuid) from public;
revoke all on function _access.enforce_role_organization() from public;
revoke all on function _core.sync_profile() from public;

grant execute on function _access.current_user_id() to authenticated;
grant execute on function _access.current_organization_ids() to authenticated;
grant execute on function _access.role_in_own_orgs(uuid) to authenticated;
grant execute on function _access.has_permission(text) to authenticated;
grant execute on function _access.role_belongs_to_organization(uuid, uuid) to authenticated;
grant execute on function _access.enforce_role_organization() to authenticated;

grant usage on schema _access to authenticated;

-- sync_profile is trigger-invoked by Supabase Auth only; grant EXECUTE to the
-- internal auth role when it exists (no-op on plain PG CI).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function _core.sync_profile() to supabase_auth_admin';
  end if;
end
$$;

-- ============================================================
-- 5. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;

-- ============================================================
-- 6. Allowlist policies (no USING(true), no WITH CHECK(true), ACC-21)
-- Identity resolution always via _access.current_user_id() (never payload).
-- ============================================================

-- profiles: own row read; own row update limited to non-status columns by grant.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = _access.current_user_id());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = _access.current_user_id())
  with check (id = _access.current_user_id());

-- organization_memberships: members read their org; writes need user.assign.
create policy organization_memberships_select_org on public.organization_memberships
  for select to authenticated
  using (organization_id = any(_access.current_organization_ids()));

create policy organization_memberships_insert_admin on public.organization_memberships
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  );

create policy organization_memberships_update_admin on public.organization_memberships
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  );

create policy organization_memberships_delete_admin on public.organization_memberships
  for delete to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  );

-- roles: members read global + own-org roles; writes need role.manage.
create policy roles_select_org on public.roles
  for select to authenticated
  using (organization_id is null or organization_id = any(_access.current_organization_ids()));

create policy roles_insert_admin on public.roles
  for insert to authenticated
  with check (
    (organization_id is null or organization_id = any(_access.current_organization_ids()))
    and _access.has_permission('role.manage')
  );

create policy roles_update_admin on public.roles
  for update to authenticated
  using (
    (organization_id is null or organization_id = any(_access.current_organization_ids()))
    and _access.has_permission('role.manage')
  )
  with check (
    (organization_id is null or organization_id = any(_access.current_organization_ids()))
    and _access.has_permission('role.manage')
  );

create policy roles_delete_admin on public.roles
  for delete to authenticated
  using (
    (organization_id is null or organization_id = any(_access.current_organization_ids()))
    and _access.has_permission('role.manage')
  );

-- permissions: global catalog, admin-only (role.manage).
create policy permissions_select_admin on public.permissions
  for select to authenticated
  using (_access.has_permission('role.manage'));

create policy permissions_insert_admin on public.permissions
  for insert to authenticated
  with check (_access.has_permission('role.manage'));

create policy permissions_update_admin on public.permissions
  for update to authenticated
  using (_access.has_permission('role.manage'))
  with check (_access.has_permission('role.manage'));

create policy permissions_delete_admin on public.permissions
  for delete to authenticated
  using (_access.has_permission('role.manage'));

-- role_permissions: admin-only, scoped to roles of the user's organizations.
create policy role_permissions_select_admin on public.role_permissions
  for select to authenticated
  using (_access.has_permission('role.manage') and _access.role_in_own_orgs(role_id));

create policy role_permissions_insert_admin on public.role_permissions
  for insert to authenticated
  with check (_access.has_permission('role.manage') and _access.role_in_own_orgs(role_id));

create policy role_permissions_update_admin on public.role_permissions
  for update to authenticated
  using (_access.has_permission('role.manage') and _access.role_in_own_orgs(role_id))
  with check (_access.has_permission('role.manage') and _access.role_in_own_orgs(role_id));

create policy role_permissions_delete_admin on public.role_permissions
  for delete to authenticated
  using (_access.has_permission('role.manage') and _access.role_in_own_orgs(role_id));

-- user_role_assignments: own rows always; admins (user.assign) see own-org rows.
create policy user_role_assignments_select_own on public.user_role_assignments
  for select to authenticated
  using (
    user_id = _access.current_user_id()
    or (organization_id = any(_access.current_organization_ids()) and _access.has_permission('user.assign'))
  );

create policy user_role_assignments_insert_admin on public.user_role_assignments
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
    and _access.role_in_own_orgs(role_id)
  );

create policy user_role_assignments_update_admin on public.user_role_assignments
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
    and _access.role_in_own_orgs(role_id)
  );

create policy user_role_assignments_delete_admin on public.user_role_assignments
  for delete to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('user.assign')
  );

-- ============================================================
-- 7. Minimal grants to authenticated (each privilege has an equivalent policy,
-- D18). Never GRANT ALL. profiles UPDATE is column-scoped so a user cannot
-- flip their own status (ACC-05 hardening); INSERT/DELETE on profiles have no
-- policy -> no grant.
-- ============================================================
grant select on public.profiles to authenticated;
grant update (full_name, phone, email) on public.profiles to authenticated;

grant select, insert, update, delete on public.organization_memberships to authenticated;
grant select, insert, update, delete on public.roles to authenticated;
grant select, insert, update, delete on public.permissions to authenticated;
grant select, insert, update, delete on public.role_permissions to authenticated;
grant select, insert, update, delete on public.user_role_assignments to authenticated;

-- ============================================================
-- 8. Re-affirm zero access for anon/service_role/PUBLIC (D17/T06/T09/T17)
-- ============================================================
revoke all on table public.profiles, public.organization_memberships, public.roles,
  public.permissions, public.role_permissions, public.user_role_assignments from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.profiles, public.organization_memberships, public.roles, public.permissions, public.role_permissions, public.user_role_assignments from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

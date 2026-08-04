-- PGadm — Organization structure RLS + effective-permissions RPC (Phase 1B.3D-2)
-- File: 00000000000007_organization_rls_and_permissions_rpc.sql
--
-- Scope (contract F1B3 / mission 1B.3D-2): make the organization tables
-- (organizations, branches, warehouses, branch_warehouse_relations) readable
-- by authenticated users ONLY within their active organizations, and expose a
-- PostgREST-callable effective-permissions RPC for the server-side session
-- compositor. This is the data-side prerequisite for
-- ORGANIZATION_DATA_SOURCE=supabase (decision documented in DECISION_LOG and
-- AGENT_STATE 1B.3D-2: default stays demo; supabase is now functional).
--
-- Migration 002 deliberately left the org tables owner-only ("until the
-- authentication + RLS phase F1B3+"); this migration implements that phase.
-- Migration 002 is NOT modified; every fix lives in a new migration.
--
-- Security decisions (same lineage as migration 004):
--   D17  No grants/policies for anon.
--   D18  authenticated: grants with equivalent policies only (SELECT; the
--        read-only scope of this migration).
--   D20  FORCE ROW LEVEL SECURITY intentionally NOT enabled: owner
--        (postgres: migrations/seed) must keep writing without RLS.
--   D15 EXCEPTION (documented, same rationale as _access.has_permission in 004):
--        public.current_user_permissions() is SECURITY DEFINER because the
--        effective-permission projection joins protected identity tables and
--        must not be filtered by the invoker's own RLS. search_path locked,
--        EXECUTE revoked from PUBLIC, granted only to authenticated.
--   Identity resolution always via _access.current_user_id() (ACC-15, D12/D13);
--   JWT carries only sub. No USING(true), no WITH CHECK(true) (ACC-21).
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (roles bootstrapped in 004;
-- grants/policies target role names only, no auth schema access).

-- ============================================================
-- 1. Enable RLS on the four organization tables (no FORCE, D20)
-- ============================================================
alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.warehouses enable row level security;
alter table public.branch_warehouse_relations enable row level security;

-- ============================================================
-- 2. Allowlist policies: authenticated reads only the rows of the
-- current user's ACTIVE organizations (_access.current_organization_ids()).
-- ============================================================
create policy organizations_select_org on public.organizations
  for select to authenticated
  using (id = any(_access.current_organization_ids()));

create policy branches_select_org on public.branches
  for select to authenticated
  using (organization_id = any(_access.current_organization_ids()));

create policy warehouses_select_org on public.warehouses
  for select to authenticated
  using (organization_id = any(_access.current_organization_ids()));

create policy branch_warehouse_relations_select_org on public.branch_warehouse_relations
  for select to authenticated
  using (organization_id = any(_access.current_organization_ids()));

-- ============================================================
-- 3. Grants: SELECT to authenticated only (each has an equivalent policy,
-- D18). Reaffirm zero access for anon/service_role/PUBLIC (D17).
-- ============================================================
grant select on public.organizations to authenticated;
grant select on public.branches to authenticated;
grant select on public.warehouses to authenticated;
grant select on public.branch_warehouse_relations to authenticated;

revoke all on table public.organizations, public.branches, public.warehouses,
  public.branch_warehouse_relations from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.organizations, public.branches, public.warehouses, public.branch_warehouse_relations from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

-- ============================================================
-- 4. public.current_user_permissions(): effective RBAC permissions of the
-- current user (code + description), computed server-side with the same
-- status/validity rules as _access.has_permission() (D08/D10/D13/D19).
-- SECURITY DEFINER (documented D15 exception); called via PostgREST rpc() by
-- the session compositor. Anon/service_role/PUBLIC cannot call it.
-- ============================================================
create function public.current_user_permissions()
returns table(code text, description text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct perm.code::text, perm.description::text
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
    and a.valid_from <= now()
    and (a.valid_to is null or a.valid_to > now())
  order by perm.code::text;
$$;

comment on function public.current_user_permissions() is
  'Effective RBAC permissions of the current authenticated user (code, description). SECURITY DEFINER (documented D15 exception, same rationale as _access.has_permission). search_path locked; EXECUTE only for authenticated.';

revoke all on function public.current_user_permissions() from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format('revoke all on function public.current_user_permissions() from %I', role_name);
    end if;
  end loop;
end
$$;

grant execute on function public.current_user_permissions() to authenticated;

reset all;

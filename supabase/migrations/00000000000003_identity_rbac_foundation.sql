-- PGadm — Identity, Sessions (delegated to Supabase Auth), RBAC and RLS
-- Phase 1B.3: profiles, organization_memberships, roles, permissions,
-- role_permissions, user_role_assignments.
--
-- Scope (contract F1B3): identity + authorization model. This migration is
-- delivered by layers on the same branch:
--   * This file: structural base (1B.3A/1B.3B) — tables, composite FKs,
--     indexes, updated_at triggers, conditional auth sync, minimal grants.
--   * 1B.3C (same branch, later commit): RLS policies + _access helpers.
--   * 1B.3D: E2E validation and ORGANIZATION_DATA_SOURCE switch (documented).
--
-- Sources:
--   23-contracts/27_AUTH_SCHEMA        (auth.users owns credentials)
--   14-admin/08_ROLE_MODEL             (roles, global vs organization)
--   14-admin/12_USER_STORE_ROLES       (user store roles)
--   14-admin/44_DATA_MODEL             (organization memberships)
--   10-architecture/10_AUTHORIZATION   (RBAC + RLS, allowlist)
--   F1B3_DECISION_MATRIX D01..D25      (decisions closed in the afternoon)
--
-- Critical compatibility: CI (pr-validation.yml, db-validate) applies
-- migrations on plain PostgreSQL 15 with NO Supabase auth schema. Every
-- reference to the auth schema is guarded in DO $$ blocks that check
-- pg_namespace/pg_class, following the revoke pattern of migration 002.
--
-- Security decisions (F1B3_DECISION_MATRIX):
--   D15  No SECURITY DEFINER functions.
--   D16  Helpers set an explicit search_path.
--   D17  No grants/policies for anon.
--   D18  No grants for authenticated yet (RLS lands in 1B.3C).
--   D23  Rollback is documented, never destructive.
--   D25  Subphases A->D with gates.
--
-- Rollback (conceptual, non-destructive, reverse dependency order):
--   auth sync trigger + _core.sync_profile() ->
--   user_role_assignments -> role_permissions -> permissions -> roles ->
--   organization_memberships -> profiles -> _access schema.
-- Documented in F1B3_MIGRATION_PLAN.md §8.

-- ============================================================
-- Schema: _access
-- Reserved for RLS helper functions (1B.3C). Created now so structural
-- triggers that validate role/organization consistency live here.
-- The helper functions below are created AFTER the tables (they are SQL
-- functions and are validated at creation time).
-- ============================================================
create schema if not exists _access;

-- ============================================================
-- Table: profiles
-- Application identity, 1:1 with auth.users (D02). The FK to auth.users is
-- added conditionally below (auth.users does not exist on plain-PG CI).
-- ============================================================
create table public.profiles (
  id         uuid primary key,
  full_name  text,
  email      text,
  phone      text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_valid check (status in ('active', 'inactive')),
  constraint profiles_email_not_blank check (
    email is null or (email = btrim(email) and email <> '')
  )
);

comment on table public.profiles is
  'Application identity, 1:1 with auth.users (F1B3 D02). Credentials live in auth.users.';
comment on column public.profiles.id is
  'Equals auth.users.id (1:1). Synced by _core.sync_profile() on Supabase; structural on plain PG.';
comment on column public.profiles.status is
  'active | inactive. Inactive profiles lose access (D19).';
comment on column public.profiles.email is
  'Display email. auth.users.email remains the login source and may diverge.';

-- ============================================================
-- Table: organization_memberships
-- N:M membership of a user in an organization (D04). Unique (org, user);
-- multiple memberships per user across organizations are allowed.
-- ============================================================
create table public.organization_memberships (
  organization_id uuid not null,
  user_id         uuid not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint organization_memberships_pk primary key (organization_id, user_id),
  constraint organization_memberships_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint organization_memberships_user_fk foreign key (user_id)
    references public.profiles (id) on delete cascade,
  constraint organization_memberships_status_valid check (status in ('active', 'inactive'))
);

comment on table public.organization_memberships is
  'User membership in an organization. Primary isolation boundary (D04).';
comment on column public.organization_memberships.status is
  'active | inactive. Inactive membership denies access (D19, ACC-06).';

create index organization_memberships_user_idx on public.organization_memberships (user_id);

-- ============================================================
-- Table: roles
-- Global roles (organization_id is null) or organization-scoped roles (D06).
-- codes are unique among global roles and per organization.
-- ============================================================
create table public.roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid,
  code            text not null,
  name            text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint roles_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint roles_code_not_blank check (code = btrim(code) and code <> ''),
  constraint roles_name_not_blank check (name = btrim(name) and name <> ''),
  constraint roles_status_valid check (status in ('active', 'inactive'))
);

comment on table public.roles is
  'RBAC role. organization_id null = global role (e.g. administrator); otherwise scoped to one organization (D06).';
comment on column public.roles.status is
  'active | inactive. Inactive roles deny access (D19, ACC-07).';

create unique index roles_global_code_unique on public.roles (code) where organization_id is null;
create unique index roles_organization_code_unique on public.roles (organization_id, code) where organization_id is not null;
create index roles_organization_idx on public.roles (organization_id);

-- ============================================================
-- Table: permissions
-- Granular capability catalog (D08). Never hardcoded in domain code.
-- ============================================================
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  description text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint permissions_code_not_blank check (code = btrim(code) and code <> ''),
  constraint permissions_status_valid check (status in ('active', 'inactive'))
);

comment on table public.permissions is
  'Capability catalog referenced by roles (D08). codes are unique.';

create unique index permissions_code_unique on public.permissions (code);

-- ============================================================
-- Table: role_permissions
-- N:M mapping. No role inheritance (D10): each role lists its permissions.
-- ============================================================
create table public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null,
  permission_id uuid not null,
  created_at    timestamptz not null default now(),
  constraint role_permissions_role_fk foreign key (role_id)
    references public.roles (id) on delete cascade,
  constraint role_permissions_permission_fk foreign key (permission_id)
    references public.permissions (id) on delete cascade,
  constraint role_permissions_unique unique (role_id, permission_id)
);

comment on table public.role_permissions is
  'Grant mapping between roles and permissions (D08, D10). No inheritance.';

create index role_permissions_permission_idx on public.role_permissions (permission_id);

-- ============================================================
-- Table: user_role_assignments
-- A user is granted a role, optionally scoped to a branch (D05/D07).
-- Composite FKs keep membership, branch and organization consistent.
-- The role/organization consistency is enforced by the _access trigger
-- (global roles allowed, D06).
-- ============================================================
create table public.user_role_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id         uuid not null,
  role_id         uuid not null,
  branch_id       uuid,
  status          text not null default 'active',
  valid_from      timestamptz not null default now(),
  valid_to        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint user_role_assignments_membership_fk foreign key (organization_id, user_id)
    references public.organization_memberships (organization_id, user_id),
  constraint user_role_assignments_role_fk foreign key (role_id)
    references public.roles (id),
  constraint user_role_assignments_branch_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint user_role_assignments_status_valid check (status in ('active', 'inactive')),
  constraint user_role_assignments_valid_range check (valid_to is null or valid_to > valid_from)
);

comment on table public.user_role_assignments is
  'Grant of a role to a user within an organization, optionally scoped to a branch (D05/D07).';
comment on column public.user_role_assignments.branch_id is
  'When null the assignment applies organization-wide; otherwise scoped to the branch (D07).';
comment on column public.user_role_assignments.status is
  'active | inactive. Inactive assignments deny access (D19).';

create index user_role_assignments_user_idx on public.user_role_assignments (user_id);
create index user_role_assignments_role_idx on public.user_role_assignments (role_id);
create index user_role_assignments_org_idx on public.user_role_assignments (organization_id);

-- ============================================================
-- Helpers: _access
-- Created here (after the tables) because they are SQL functions that are
-- validated at creation time. Used by the structural trigger below and by
-- RLS policies in 1B.3C.
-- ============================================================

-- Helper: _access.role_belongs_to_organization(role_id, organization_id)
-- True when the role is a GLOBAL role (organization_id is null) or a role
-- of the given organization (D06).
create function _access.role_belongs_to_organization(
  p_role_id uuid,
  p_organization_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.roles r
    where r.id = p_role_id
      and r.status = 'active'
      and (r.organization_id is null or r.organization_id = p_organization_id)
  );
$$;

comment on function _access.role_belongs_to_organization(uuid, uuid) is
  'True when the role is global or belongs to the organization (F1B3 D06). Security invoker by default; no SECURITY DEFINER.';

-- Helper: _access.enforce_role_organization()
-- Structural guard: a user_role_assignment may reference a global role or a
-- role of the SAME organization. Raises SQLSTATE 23503 otherwise (decision 6.1).
create function _access.enforce_role_organization()
returns trigger
language plpgsql
security invoker
set search_path = public, _access
as $$
begin
  if not _access.role_belongs_to_organization(new.role_id, new.organization_id) then
    raise exception 'role does not belong to the organization'
      using errcode = '23503';
  end if;
  return new;
end;
$$;

comment on function _access.enforce_role_organization() is
  'BEFORE INSERT/UPDATE guard for user_role_assignments role/organization consistency (F1B3 D06).';

-- ============================================================
-- Structural trigger: role/organization consistency
-- ============================================================
create trigger user_role_assignments_role_org_check
  before insert or update on public.user_role_assignments
  for each row execute function _access.enforce_role_organization();

-- ============================================================
-- Triggers: updated_at
-- Reuses _core.set_updated_at_column() (idempotent) from migration 001.
-- ============================================================
select _core.set_updated_at_column('profiles');
select _core.set_updated_at_column('organization_memberships');
select _core.set_updated_at_column('roles');
select _core.set_updated_at_column('permissions');
select _core.set_updated_at_column('user_role_assignments');

-- ============================================================
-- Conditional auth.users integration (Supabase only)
-- _core.sync_profile() is created unconditionally (it references only
-- public tables); the trigger on auth.users is created only when the auth
-- schema exists. On plain-PG CI this block is a no-op.
--
-- NOTE: the FK profiles -> auth.users is intentionally NOT added here.
-- The seed loads structural fixture profiles before real auth users exist,
-- and an active FK would reject them. profiles.id remains unique (1:1),
-- the sync trigger keeps id = auth.users.id for auth-created users, and the
-- FK is added in 1B.3D together with the real auth fixture users.
-- ============================================================
create function _core.sync_profile()
returns trigger
language plpgsql
security invoker
set search_path = public, _core
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function _core.sync_profile() is
  'Creates a 1:1 profile when an auth user is created (F1B3 D02). Security invoker; no SECURITY DEFINER (D15).';

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth')
     and exists (
       select 1 from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'auth' and c.relname = 'users'
     ) then
    execute 'create trigger profiles_after_auth_insert after insert on auth.users for each row execute function _core.sync_profile()';
  end if;
end
$$;

-- ============================================================
-- Security: minimal privileges
-- Same pattern as migration 002 (D17/D18). No grants to anon or
-- authenticated yet; RLS policies land in 1B.3C.
-- ============================================================
alter default privileges in schema public revoke all on tables from public;
alter default privileges in schema public revoke all on sequences from public;
alter default privileges in schema public revoke all on routines from public;

revoke all on public.profiles from public;
revoke all on public.organization_memberships from public;
revoke all on public.roles from public;
revoke all on public.permissions from public;
revoke all on public.role_permissions from public;
revoke all on public.user_role_assignments from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
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

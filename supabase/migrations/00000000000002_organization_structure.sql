-- PGadm — Organization Structure
-- Phase 1B.2: organizations, branches, warehouses, and branch-warehouse relations.
--
-- Scope (contract F1B2): organizations, branches (store | distribution_center |
-- office), warehouses, codes, statuses, and relations. NO users, profiles, login,
-- sessions, roles, permissions, functional RLS, inventory, products, sales,
-- customers, CRM, layout, suppliers, deliveries, AI, or external integrations.
--
-- Sources:
--   14-admin/02_ORGANIZATION_MODEL     (organization as top-level entity)
--   14-admin/44_DATA_MODEL             (Organization / Store fields)
--   14-admin/05_STORE_WAREHOUSE_RELATIONS (branch-warehouse relations)
--   05-inventory/06_STORE_WAREHOUSE_SELECTION (store + CEDIS selection)
--   24-master-index/08_INITIAL_BRANCH_CONTEXT (Nogalera 116NOG-PGM, CEDIS Saltillo 106SAL-PGM)
--
-- Conventions inherited from migration 00000000000001:
--   * UUID primary keys via gen_random_uuid() (pgcrypto)
--   * timestamptz UTC timestamps
--   * updated_at maintained by _core.set_updated_at_column()
--   * soft delete (deleted_at) intentionally DEFERRED (see F1B2_DECISION_MATRIX D08)
--
-- Compatibility: PostgreSQL 15. No CREATE TRIGGER IF NOT EXISTS, no PG17+ syntax.
-- Uses _core.set_updated_at_column() (idempotent, adds column + trigger) instead.
--
-- Rollback (conceptual): drop in reverse dependency order:
--   branch_warehouse_relations -> warehouses -> branches -> organizations.
-- No data-destructive defaults; safe on a clean database.

-- ============================================================
-- Table: organizations
-- Top-level tenant. Every branch, warehouse and future user/data
-- belongs to exactly one organization.
-- ============================================================
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  name            text not null,
  legal_name      text,
  status          text not null default 'active',
  timezone        text not null default 'America/Mexico_City',
  currency        text not null default 'MXN',
  language        text not null default 'es',
  external_source text,
  external_id     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint organizations_code_not_blank check (code = btrim(code) and code <> ''),
  constraint organizations_name_not_blank check (name = btrim(name) and name <> ''),
  constraint organizations_status_valid check (status in ('active', 'inactive')),
  constraint organizations_timezone_not_blank check (timezone = btrim(timezone) and timezone <> ''),
  constraint organizations_currency_not_blank check (currency = btrim(currency) and currency <> ''),
  constraint organizations_language_not_blank check (language = btrim(language) and language <> ''),
  constraint organizations_external_pair check (
    (external_source is null and external_id is null)
    or (external_source is not null and external_id is not null)
  ),
  constraint organizations_external_source_not_blank check (
    external_source is null or (external_source = btrim(external_source) and external_source <> '')
  ),
  constraint organizations_external_id_not_blank check (
    external_id is null or (external_id = btrim(external_id) and external_id <> '')
  )
);

comment on table public.organizations is
  'Top-level tenant entity. All branches, warehouses and future data belong to an organization (14-admin/02).';
comment on column public.organizations.code is
  'Internal short code, unique across the system.';
comment on column public.organizations.name is
  'Display name of the organization.';
comment on column public.organizations.legal_name is
  'Legal business name (razón social), optional.';
comment on column public.organizations.status is
  'Lifecycle state: active | inactive. Soft delete deferred (D08).';
comment on column public.organizations.timezone is
  'IANA timezone name, e.g. America/Mexico_City.';
comment on column public.organizations.currency is
  'ISO 4217 currency code, default MXN.';
comment on column public.organizations.language is
  'BCP-47 language tag, default es.';
comment on column public.organizations.external_source is
  'External system source for the identifier, e.g. intelisis (D11/D12).';
comment on column public.organizations.external_id is
  'External identifier from the source system, e.g. a company code.';

create unique index organizations_code_unique on public.organizations (code);
create unique index organizations_external_unique on public.organizations (external_source, external_id)
  where external_source is not null;

-- ============================================================
-- Table: branches
-- A branch belongs to one organization. CEDIS Saltillo is modeled
-- as a branch with branch_type = 'distribution_center' (D02).
-- ============================================================
create table public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  code            text not null,
  name            text not null,
  branch_type     text not null,
  status          text not null default 'active',
  timezone        text,
  address_line    text,
  city            text,
  state_province  text,
  postal_code     text,
  country         text not null default 'MX',
  external_source text,
  external_id     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint branches_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint branches_code_not_blank check (code = btrim(code) and code <> ''),
  constraint branches_name_not_blank check (name = btrim(name) and name <> ''),
  constraint branches_type_valid check (branch_type in ('store', 'distribution_center', 'office')),
  constraint branches_status_valid check (status in ('active', 'inactive')),
  constraint branches_country_not_blank check (country = btrim(country) and country <> ''),
  constraint branches_timezone_not_blank check (
    timezone is null or (timezone = btrim(timezone) and timezone <> '')
  ),
  constraint branches_external_pair check (
    (external_source is null and external_id is null)
    or (external_source is not null and external_id is not null)
  ),
  constraint branches_external_source_not_blank check (
    external_source is null or (external_source = btrim(external_source) and external_source <> '')
  ),
  constraint branches_external_id_not_blank check (
    external_id is null or (external_id = btrim(external_id) and external_id <> '')
  )
);

comment on table public.branches is
  'Operational unit of an organization: store, distribution center (CEDIS) or office.';
comment on column public.branches.organization_id is
  'Owning organization.';
comment on column public.branches.code is
  'Internal code, unique within the organization (D05).';
comment on column public.branches.branch_type is
  'store | distribution_center | office. CEDIS Saltillo is a distribution_center (D02).';
comment on column public.branches.status is
  'Lifecycle state: active | inactive.';
comment on column public.branches.timezone is
  'Optional IANA timezone; inherits organization timezone when null (D10).';
comment on column public.branches.address_line is
  'Minimal flat address (D09).';
comment on column public.branches.city is
  'City of the branch.';
comment on column public.branches.state_province is
  'State or province of the branch.';
comment on column public.branches.postal_code is
  'Postal code of the branch.';
comment on column public.branches.country is
  'ISO 3166-1 alpha-2 country code, default MX.';
comment on column public.branches.external_source is
  'External system source, e.g. intelisis (D11/D12).';
comment on column public.branches.external_id is
  'External identifier, e.g. 116NOG-PGM or 106SAL-PGM.';

-- Composite uniqueness enables the composite FK that keeps a warehouse
-- organization consistent with its branch organization.
create unique index branches_organization_code_unique on public.branches (organization_id, code);
create unique index branches_organization_id_unique on public.branches (organization_id, id);
create unique index branches_external_unique on public.branches (external_source, external_id)
  where external_source is not null;
create index branches_organization_idx on public.branches (organization_id);
create index branches_type_idx on public.branches (branch_type);

-- ============================================================
-- Table: warehouses
-- A warehouse belongs to one branch and, through the composite FK,
-- to the same organization as that branch (D03).
-- ============================================================
create table public.warehouses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id       uuid not null,
  code            text not null,
  name            text not null,
  warehouse_type  text not null,
  status          text not null default 'active',
  is_primary      boolean not null default false,
  external_source text,
  external_id     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint warehouses_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint warehouses_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint warehouses_code_not_blank check (code = btrim(code) and code <> ''),
  constraint warehouses_name_not_blank check (name = btrim(name) and name <> ''),
  constraint warehouses_type_valid check (warehouse_type in ('store_backroom', 'distribution')),
  constraint warehouses_status_valid check (status in ('active', 'inactive')),
  constraint warehouses_external_pair check (
    (external_source is null and external_id is null)
    or (external_source is not null and external_id is not null)
  ),
  constraint warehouses_external_source_not_blank check (
    external_source is null or (external_source = btrim(external_source) and external_source <> '')
  ),
  constraint warehouses_external_id_not_blank check (
    external_id is null or (external_id = btrim(external_id) and external_id <> '')
  )
);

comment on table public.warehouses is
  'Storage location owned by a branch. Belongs to the same organization as its branch (D03).';
comment on column public.warehouses.organization_id is
  'Owning organization; must match the branch organization (composite FK).';
comment on column public.warehouses.branch_id is
  'Owning branch.';
comment on column public.warehouses.code is
  'Internal code, unique within the organization (D05).';
comment on column public.warehouses.warehouse_type is
  'store_backroom (warehouse of a store branch) | distribution (warehouse of a CEDIS) (D16).';
comment on column public.warehouses.status is
  'Lifecycle state: active | inactive.';
comment on column public.warehouses.is_primary is
  'True when this is the primary warehouse of its branch; at most one primary per branch (D04).';
comment on column public.warehouses.external_source is
  'External system source, e.g. intelisis (D11/D12).';
comment on column public.warehouses.external_id is
  'External identifier from the source system.';

create unique index warehouses_organization_code_unique on public.warehouses (organization_id, code);
create unique index warehouses_organization_id_unique on public.warehouses (organization_id, id);
create unique index warehouses_branch_primary_unique on public.warehouses (branch_id)
  where is_primary = true;
create unique index warehouses_external_unique on public.warehouses (external_source, external_id)
  where external_source is not null;
create index warehouses_organization_idx on public.warehouses (organization_id);
create index warehouses_branch_idx on public.warehouses (branch_id);

-- ============================================================
-- Table: branch_warehouse_relations
-- Minimal supply relations between a branch and warehouses it may
-- use (14-admin/05). Example: Nogalera <-> CEDIS Saltillo as the
-- primary supply relationship.
-- ============================================================
create table public.branch_warehouse_relations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id       uuid not null,
  warehouse_id    uuid not null,
  relationship_type text not null,
  priority        integer not null default 1,
  active          boolean not null default true,
  valid_from      timestamptz not null default now(),
  valid_to        timestamptz,
  special_rules   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint bwr_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint bwr_warehouse_organization_fk foreign key (organization_id, warehouse_id)
    references public.warehouses (organization_id, id),
  constraint bwr_relationship_type_valid check (relationship_type in ('supply')),
  constraint bwr_priority_positive check (priority >= 1),
  constraint bwr_valid_range check (valid_to is null or valid_to > valid_from),
  constraint bwr_unique_relation unique (branch_id, warehouse_id, relationship_type)
);

comment on table public.branch_warehouse_relations is
  'Relation between a branch and a warehouse it uses (e.g. primary supply from CEDIS Saltillo).';
comment on column public.branch_warehouse_relations.relationship_type is
  'Initial type: supply. Evolving catalog (D15).';
comment on column public.branch_warehouse_relations.priority is
  'Ordering priority for the relation: 1 is the highest priority and lower values are evaluated first (ascending order); default 1.';
comment on column public.branch_warehouse_relations.active is
  'Whether the relation is currently in effect.';
comment on column public.branch_warehouse_relations.valid_from is
  'Effective start of the relation.';
comment on column public.branch_warehouse_relations.valid_to is
  'Optional effective end of the relation.';
comment on column public.branch_warehouse_relations.special_rules is
  'Free-form special rules for the relation.';

create index bwr_organization_idx on public.branch_warehouse_relations (organization_id);
create index bwr_branch_idx on public.branch_warehouse_relations (branch_id);
create index bwr_warehouse_idx on public.branch_warehouse_relations (warehouse_id);

-- ============================================================
-- Triggers: updated_at
-- Reuses _core.set_updated_at_column() (idempotent) from migration 001.
-- Called with the bare table name; resolved through search_path (public).
-- ============================================================
select _core.set_updated_at_column('organizations');
select _core.set_updated_at_column('branches');
select _core.set_updated_at_column('warehouses');
select _core.set_updated_at_column('branch_warehouse_relations');

-- ============================================================
-- Security: minimal privileges
-- No grants to public/anon/authenticated. Tables are owner-only until
-- the authentication + RLS phase (F1B3+). Lock future public-schema
-- objects so they do not inherit broad default grants (D18).
-- ============================================================
alter default privileges in schema public revoke all on tables from public;
alter default privileges in schema public revoke all on sequences from public;
alter default privileges in schema public revoke all on routines from public;

revoke all on public.organizations from public;
revoke all on public.branches from public;
revoke all on public.warehouses from public;
revoke all on public.branch_warehouse_relations from public;

-- Revoke from Supabase runtime roles when they exist (local/cloud).
-- Safe on plain PostgreSQL CI where those roles are absent.
do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.organizations, public.branches, public.warehouses, public.branch_warehouse_relations from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

-- PGadm — Catalog Audit Log (Phase 1C.5)
-- File: 00000000000009_catalog_audit.sql
--
-- Scope (contract F1C / decision D-C10, APPROVED 2026-08-05): the
-- `_audit.catalog_events` append-only table that persists the application
-- audit events (create/update/archive/restore on products, variants, barcodes,
-- categories, brands, lines and units). Phase 1C.3 wired the contract with an
-- in-memory implementation; this migration is the real persistence the
-- `SupabaseCatalogAuditRepository` writes to (1C.5), without touching the use
-- cases.
--
-- Design docs:
--   docs/orchestration/handoffs/F1C_DATA_MODEL_PROPOSAL.md
--   docs/orchestration/handoffs/F1C_RLS_PERMISSION_MATRIX.md
--
-- Conventions inherited (1B.1/1B.2/1B.3/1C.2):
--   * _audit schema reserved in migration 001; this is its first table.
--   * uuid PK via gen_random_uuid() (pgcrypto); timestamptz UTC timestamps.
--   * organization_id on every table; events are org-scoped (D-C07).
--   * Append-only: no UPDATE, no DELETE, no updated_at trigger. The log is a
--     faithful, immutable record of who did what (D-C10).
--   * CHECK x = btrim(x) and x <> '' on mandatory text (canonical form).
--   * Security lineage (D17/D18/D20/ACC-21): SELECT requires catalog.read;
--     INSERT requires at least one catalog write permission; no
--     USING(true)/WITH CHECK(true); grants == policies; no anon/service_role.
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (runtime roles bootstrapped
-- in 004). Rollback: documented, non-destructive.

-- ============================================================
-- 1. Table: catalog_events
-- One row per audited mutation, produced by the use cases via the
-- CatalogAuditRepository port. actor_user_id is the acting profile id
-- (JWT sub); entity_type/entity_id identify the affected catalog row.
-- ============================================================
create table _audit.catalog_events (
  id              uuid primary key default gen_random_uuid(),
  occurred_at     timestamptz not null default now(),
  actor_user_id   uuid not null,
  organization_id uuid not null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid not null,
  detail          text not null default '',
  constraint catalog_events_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint catalog_events_actor_user_fk foreign key (actor_user_id)
    references public.profiles (id),
  constraint catalog_events_action_valid check (action in ('create', 'update', 'archive', 'restore')),
  constraint catalog_events_entity_type_valid check (
    entity_type in ('product', 'variant', 'barcode', 'category', 'brand', 'line', 'unit')
  ),
  constraint catalog_events_detail_not_blank check (detail is not null)
);

comment on table _audit.catalog_events is
  'Append-only application audit log for catalog mutations (D-C10). Never updated or deleted.';
comment on column _audit.catalog_events.actor_user_id is
  'Acting user (profile id, JWT sub). The app writes it; it is not derived from role for the log (D-C10).';
comment on column _audit.catalog_events.entity_type is
  'product | variant | barcode | category | brand | line | unit.';
comment on column _audit.catalog_events.detail is
  'Short human-readable summary of what changed (e.g. description, sku).';

-- History reads are always org + entity scoped, newest first.
create index catalog_events_organization_entity_idx
  on _audit.catalog_events (organization_id, entity_type, entity_id, occurred_at desc);
create index catalog_events_organization_occurred_idx
  on _audit.catalog_events (organization_id, occurred_at desc);

-- ============================================================
-- 2. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table _audit.catalog_events enable row level security;

-- ============================================================
-- 3. Allowlist policies (no UPDATE, no DELETE — append-only)
-- SELECT: any org member with catalog.read (history timeline).
-- INSERT: org member with any catalog write permission (the use cases only
-- record events the actor is authorized to perform; the DB enforces the same
-- bar so a read-only user cannot inject log rows).
-- ============================================================
create policy catalog_events_select_org on _audit.catalog_events
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy catalog_events_insert_authorized on _audit.catalog_events
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('catalog.create')
      or _access.has_permission('catalog.update')
      or _access.has_permission('catalog.archive')
      or _access.has_permission('catalog.manage'))
  );

-- ============================================================
-- 4. Minimal grants (D18: grants == policies) + deny-by-default
-- ============================================================
grant usage on schema _audit to authenticated;
grant select, insert on _audit.catalog_events to authenticated;

revoke all on _audit.catalog_events from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on _audit.catalog_events from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

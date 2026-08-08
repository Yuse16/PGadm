-- PGadm — Inventory snapshots, changes, observations and import templates (Phase 1D.2)
-- File: 00000000000010_inventory_snapshots.sql
--
-- Scope (contract F1D / decisions D-I01..D-I14, APPROVED 2026-08-06): the 5
-- org-scoped tables that persist the inventory domain:
--   * inventory_snapshots      logical photo of an approved load, per warehouse,
--                              keeping the exact source date (D-I02/D-I04/D-I08)
--   * inventory_snapshot_items reported existence per variant inside a snapshot
--                              (reference level = variant, D-I01)
--   * inventory_changes        difference between snapshots, only-changes, append-only
--                              (D-I03/D-I05; missing_product != stock zero)
--   * inventory_observations   manual physical count/note that NEVER mutate the
--                              official stock (D-I06)
--   * import_templates         column mapping per file type (D-I07)
-- plus _audit.inventory_events, the append-only application audit log for
-- inventory mutations (D-I02, pattern _audit from 1C.5).
--
-- Design docs:
--   docs/orchestration/handoffs/F1D_DATA_MODEL_PROPOSAL.md
--   docs/orchestration/handoffs/F1D_RLS_PERMISSION_MATRIX.md
--
-- Conventions inherited (1B.1/1B.2/1B.3/1C.2/1C.5):
--   * uuid PK via gen_random_uuid() (pgcrypto); timestamptz UTC timestamps.
--   * organization_id on every table; FK composite `(organization_id, parent_id)`
--     -> `UNIQUE(organization_id, id)` of the parent prevents cross-org writes
--     (D-C07/D-C08). Targets: warehouses (002) and product_variants (008) already
--     declare UNIQUE(organization_id, id).
--   * CHECK x = btrim(x) and x <> '' on mandatory text (canonical form, D-C12).
--   * No physical DELETE on any inventory table (historical/append-only, D-I03/D-I06).
--   * inventory_changes.difference is STORED GENERATED (new - previous, test IA-18).
--   * RLS deny-by-default reusing _access (004); SELECT requires inventory.read;
--     INSERT/UPDATE require the operation permission; grants == policies; no
--     anon/service_role; no permissive USING(true)/WITH CHECK(true) (D17/D18/ACC-21).
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (runtime roles bootstrapped in
-- 004). Rollback: documented, non-destructive.

-- ============================================================
-- 1. Table: inventory_snapshots
-- Logical photo of an approved load. `report_date` is the exact source date
-- (21-migration/21); `is_baseline` marks the first approved snapshot of a
-- warehouse (21-migration/22); changes are only computed from the baseline on.
-- ============================================================
create table public.inventory_snapshots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  warehouse_id    uuid not null,
  source          text not null,
  source_file     text,
  report_date     timestamptz not null,
  imported_at     timestamptz not null default now(),
  imported_by     uuid,
  is_baseline     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint inventory_snapshots_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint inventory_snapshots_warehouse_organization_fk foreign key (organization_id, warehouse_id)
    references public.warehouses (organization_id, id),
  constraint inventory_snapshots_imported_by_fk foreign key (imported_by)
    references public.profiles (id),
  constraint inventory_snapshots_source_valid check (
    source in ('excel', 'cube', 'manual', 'intelisis')
  ),
  constraint inventory_snapshots_source_file_not_blank check (
    source_file is null or (source_file = btrim(source_file) and source_file <> '')
  )
);

comment on table public.inventory_snapshots is
  'Logical photo of an approved inventory load per warehouse. Append-only; never updated beyond metadata (D-I02/D-I04).';
comment on column public.inventory_snapshots.warehouse_id is
  'Warehouse of the load (store_backroom or distribution). Snapshot is per warehouse (D-I08).';
comment on column public.inventory_snapshots.source is
  'excel | cube | manual | intelisis. Load source; Intelisis stays the official reference (D-I11).';
comment on column public.inventory_snapshots.source_file is
  'Origin file reference; optional free text, never the file itself.';
comment on column public.inventory_snapshots.report_date is
  'Exact source date of the load (21-migration/21). Stock is shown as "existencia reportada" with this date (D-I04).';
comment on column public.inventory_snapshots.imported_by is
  'Profile that approved the import (D-I02). Null allowed for system loads.';
comment on column public.inventory_snapshots.is_baseline is
  'True for the first approved snapshot of a warehouse; no changes are computed before the baseline (D-I05/22_INVENTORY_BASELINE).';

create unique index inventory_snapshots_organization_id_unique on public.inventory_snapshots (organization_id, id);
create index inventory_snapshots_warehouse_report_idx on public.inventory_snapshots (organization_id, warehouse_id, report_date desc);
-- One approved load per warehouse/date/source (IA-8). Baseline snapshots are
-- excluded so the baseline can be re-asserted idempotently.
create unique index inventory_snapshots_load_unique on public.inventory_snapshots (organization_id, warehouse_id, report_date, source)
  where not is_baseline;

-- ============================================================
-- 2. Table: inventory_snapshot_items
-- Reported existence per variant inside a snapshot (D-I01). One row per
-- variant per snapshot; quantity is the reported value, never a guarantee.
-- boxes/square_meters stay NULL unless confirmed factors exist (D-I09).
-- ============================================================
create table public.inventory_snapshot_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  snapshot_id     uuid not null,
  variant_id      uuid not null,
  quantity        numeric not null,
  boxes           numeric,
  square_meters   numeric,
  created_at      timestamptz not null default now(),
  constraint inventory_snapshot_items_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint inventory_snapshot_items_snapshot_organization_fk foreign key (organization_id, snapshot_id)
    references public.inventory_snapshots (organization_id, id),
  constraint inventory_snapshot_items_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint inventory_snapshot_items_quantity_non_negative check (quantity >= 0),
  constraint inventory_snapshot_items_boxes_non_negative check (boxes is null or boxes >= 0),
  constraint inventory_snapshot_items_square_meters_non_negative check (square_meters is null or square_meters >= 0)
);

comment on table public.inventory_snapshot_items is
  'Reported existence per variant inside a snapshot. Immutable once the snapshot is approved (D-I02).';
comment on column public.inventory_snapshot_items.variant_id is
  'Exact sellable presentation from the 1C catalog (D-I01: reference level = variant).';
comment on column public.inventory_snapshot_items.quantity is
  'Reported existence (existencia reportada), NOT guaranteed availability (D-I04).';
comment on column public.inventory_snapshot_items.boxes is
  'Derived boxes; NULL unless confirmed conversion factors exist (D-I09).';
comment on column public.inventory_snapshot_items.square_meters is
  'Derived square meters; NULL unless confirmed conversion factors exist (D-I09).';

create unique index inventory_snapshot_items_organization_id_unique on public.inventory_snapshot_items (organization_id, id);
create unique index inventory_snapshot_items_snapshot_variant_unique on public.inventory_snapshot_items (organization_id, snapshot_id, variant_id);
create index inventory_snapshot_items_variant_idx on public.inventory_snapshot_items (organization_id, variant_id);

-- ============================================================
-- 3. Table: inventory_changes
-- Difference between two snapshots, only for variants whose value changed
-- (D-I03). Append-only history: never deleted when a new Excel is loaded.
-- change_type distinguishes "missing from file" (missing_product) from a real
-- zero report (zeroed): absence is NOT auto-zeroed stock (D-I05).
-- ============================================================
create table public.inventory_changes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null,
  variant_id        uuid not null,
  warehouse_id      uuid not null,
  previous_quantity numeric not null,
  new_quantity      numeric not null,
  difference        numeric not null generated always as (new_quantity - previous_quantity) stored,
  change_type       text not null,
  detected_at       timestamptz not null default now(),
  source_snapshot_id uuid not null,
  created_at        timestamptz not null default now(),
  constraint inventory_changes_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint inventory_changes_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint inventory_changes_warehouse_organization_fk foreign key (organization_id, warehouse_id)
    references public.warehouses (organization_id, id),
  constraint inventory_changes_snapshot_organization_fk foreign key (organization_id, source_snapshot_id)
    references public.inventory_snapshots (organization_id, id),
  constraint inventory_changes_previous_non_negative check (previous_quantity >= 0),
  constraint inventory_changes_new_non_negative check (new_quantity >= 0),
  constraint inventory_changes_type_valid check (
    change_type in ('increase', 'decrease', 'zeroed', 'recovered', 'new_product', 'missing_product')
  )
);

comment on table public.inventory_changes is
  'Difference between snapshots, only-changes. Records the delta, never the cause (no movement cube, D-I04).';
comment on column public.inventory_changes.difference is
  'Generated STORED: new_quantity - previous_quantity (test IA-18).';
comment on column public.inventory_changes.change_type is
  'increase | decrease | zeroed | recovered | new_product | missing_product. missing_product means absent from the file, not stock zero (D-I05).';
comment on column public.inventory_changes.source_snapshot_id is
  'Snapshot that generated the change (the newer load).';
comment on column public.inventory_changes.warehouse_id is
  'Warehouse the change belongs to; store and CEDIS stay separated (D-I04).';

create unique index inventory_changes_organization_id_unique on public.inventory_changes (organization_id, id);
create unique index inventory_changes_source_variant_warehouse_unique on public.inventory_changes (organization_id, source_snapshot_id, variant_id, warehouse_id);
create index inventory_changes_variant_detected_idx on public.inventory_changes (organization_id, variant_id, detected_at desc);

-- ============================================================
-- 4. Table: inventory_observations
-- Manual physical count / note. Never mutates the official stock (D-I06):
-- no trigger links it back to snapshot items or quantities.
-- ============================================================
create table public.inventory_observations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null,
  variant_id        uuid not null,
  warehouse_id      uuid not null,
  observation_type  text not null,
  observed_quantity numeric,
  note              text,
  evidence_url      text,
  created_by        uuid not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint inventory_observations_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint inventory_observations_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint inventory_observations_warehouse_organization_fk foreign key (organization_id, warehouse_id)
    references public.warehouses (organization_id, id),
  constraint inventory_observations_created_by_fk foreign key (created_by)
    references public.profiles (id),
  constraint inventory_observations_type_valid check (
    observation_type in ('physical_count', 'damaged', 'reserved', 'wrong_location', 'missing_label', 'difference')
  ),
  constraint inventory_observations_quantity_non_negative check (
    observed_quantity is null or observed_quantity >= 0
  ),
  constraint inventory_observations_note_not_blank check (
    note is null or (note = btrim(note) and note <> '')
  ),
  constraint inventory_observations_evidence_url_not_blank check (
    evidence_url is null or (evidence_url = btrim(evidence_url) and evidence_url <> '')
  )
);

comment on table public.inventory_observations is
  'Manual observation (physical count, damage, reservation, etc.). Does NOT change the official stock (D-I06).';
comment on column public.inventory_observations.observation_type is
  'physical_count | damaged | reserved | wrong_location | missing_label | difference (24_MANUAL_ADJUSTMENTS).';
comment on column public.inventory_observations.observed_quantity is
  'Observed count when the observation carries one (e.g. physical_count).';
comment on column public.inventory_observations.evidence_url is
  'Evidence as URL text only; Storage upload deferred (D-C17/D-I06).';
comment on column public.inventory_observations.created_by is
  'Profile that registered the observation; audit lineage (D-I06).';

create unique index inventory_observations_organization_id_unique on public.inventory_observations (organization_id, id);
create index inventory_observations_variant_created_idx on public.inventory_observations (organization_id, variant_id, created_at desc);

-- ============================================================
-- 5. Table: import_templates
-- Column mapping per file type (D-I07). Required columns: code, description,
-- warehouse, existence; no silent import when a required column is missing
-- (25_DATA_VALIDATION). Status soft-deactivation instead of DELETE.
-- ============================================================
create table public.import_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name            text not null,
  sheet_name      text,
  column_mapping  jsonb not null,
  warehouse_rules jsonb,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint import_templates_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint import_templates_name_not_blank check (name = btrim(name) and name <> ''),
  constraint import_templates_sheet_name_not_blank check (
    sheet_name is null or (sheet_name = btrim(sheet_name) and sheet_name <> '')
  ),
  constraint import_templates_status_valid check (status in ('active', 'inactive'))
);

comment on table public.import_templates is
  'Column mapping per file type for the import pipeline (D-I07). Deactivated via status, never deleted.';
comment on column public.import_templates.column_mapping is
  'Mapping of file columns to required/optional fields (code, description, warehouse, existence, ...).';
comment on column public.import_templates.warehouse_rules is
  'Optional rules to link detected warehouses to 1B.2 warehouses (D-I08).';

create unique index import_templates_organization_id_unique on public.import_templates (organization_id, id);

-- ============================================================
-- 6. Table: _audit.inventory_events
-- Append-only application audit log for inventory mutations (D-I02, pattern
-- _audit.catalog_events from 1C.5). Written by the use cases
-- (approveImport, createObservation, confirmObservation); never updated/deleted.
-- ============================================================
create table _audit.inventory_events (
  id              uuid primary key default gen_random_uuid(),
  occurred_at     timestamptz not null default now(),
  actor_user_id   uuid not null,
  organization_id uuid not null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid not null,
  detail          text not null default '',
  constraint inventory_events_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint inventory_events_actor_user_fk foreign key (actor_user_id)
    references public.profiles (id),
  constraint inventory_events_action_valid check (
    action in ('approve_import', 'create_observation', 'confirm_observation')
  ),
  constraint inventory_events_entity_type_valid check (
    entity_type in ('inventory_snapshot', 'inventory_change', 'inventory_observation', 'import_template')
  ),
  constraint inventory_events_detail_not_blank check (detail is not null)
);

comment on table _audit.inventory_events is
  'Append-only application audit log for inventory mutations (D-I02). Never updated or deleted.';
comment on column _audit.inventory_events.action is
  'approve_import | create_observation | confirm_observation.';
comment on column _audit.inventory_events.actor_user_id is
  'Acting user (profile id, JWT sub). Written by the use cases (D-I02).';
comment on column _audit.inventory_events.entity_type is
  'inventory_snapshot | inventory_change | inventory_observation | import_template.';
comment on column _audit.inventory_events.detail is
  'Short human-readable summary of the audited mutation.';

create index inventory_events_organization_entity_idx
  on _audit.inventory_events (organization_id, entity_type, entity_id, occurred_at desc);
create index inventory_events_organization_occurred_idx
  on _audit.inventory_events (organization_id, occurred_at desc);

-- ============================================================
-- 7. updated_at triggers (only on mutable tables; snapshot items and changes
-- are append-only and intentionally have no updated_at)
-- ============================================================
select _core.set_updated_at_column('inventory_snapshots');
select _core.set_updated_at_column('inventory_observations');
select _core.set_updated_at_column('import_templates');

-- ============================================================
-- 8. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table public.inventory_snapshots enable row level security;
alter table public.inventory_snapshot_items enable row level security;
alter table public.inventory_changes enable row level security;
alter table public.inventory_observations enable row level security;
alter table public.import_templates enable row level security;
alter table _audit.inventory_events enable row level security;

-- ============================================================
-- 9. Allowlist policies (F1D_RLS_PERMISSION_MATRIX §4; no DELETE anywhere)
-- ============================================================

-- ---- inventory_snapshots: SELECT read; INSERT/UPDATE approve -------------
create policy inventory_snapshots_select_org on public.inventory_snapshots
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy inventory_snapshots_insert_approve on public.inventory_snapshots
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  );

create policy inventory_snapshots_update_approve on public.inventory_snapshots
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  );

-- ---- inventory_snapshot_items: SELECT read; INSERT approve; no UPDATE ----
create policy inventory_snapshot_items_select_org on public.inventory_snapshot_items
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy inventory_snapshot_items_insert_approve on public.inventory_snapshot_items
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  );

-- ---- inventory_changes: SELECT read; INSERT approve; no UPDATE -----------
create policy inventory_changes_select_org on public.inventory_changes
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy inventory_changes_insert_approve on public.inventory_changes
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  );

-- ---- inventory_observations: SELECT read; INSERT observe; UPDATE approve --
create policy inventory_observations_select_org on public.inventory_observations
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy inventory_observations_insert_observe on public.inventory_observations
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.observe')
  );

create policy inventory_observations_update_approve on public.inventory_observations
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.approve')
  );

-- ---- import_templates: SELECT read; INSERT/UPDATE import; no DELETE ------
create policy import_templates_select_org on public.import_templates
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy import_templates_insert_import on public.import_templates
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.import')
  );

create policy import_templates_update_import on public.import_templates
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.import')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.import')
  );

-- ---- _audit.inventory_events: SELECT read; INSERT approve/observe --------
create policy inventory_events_select_org on _audit.inventory_events
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('inventory.read')
  );

create policy inventory_events_insert_authorized on _audit.inventory_events
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('inventory.approve')
      or _access.has_permission('inventory.observe'))
  );

-- ============================================================
-- 10. Minimal grants (D18: grants == policies; no DELETE grants)
-- ============================================================
grant select, insert, update on public.inventory_snapshots to authenticated;
grant select, insert on public.inventory_snapshot_items to authenticated;
grant select, insert on public.inventory_changes to authenticated;
grant select, insert, update on public.inventory_observations to authenticated;
grant select, insert, update on public.import_templates to authenticated;

grant select, insert on _audit.inventory_events to authenticated;

-- ============================================================
-- 11. Re-affirm zero access for anon/service_role/PUBLIC (D17)
-- ============================================================
revoke all on table public.inventory_snapshots, public.inventory_snapshot_items,
  public.inventory_changes, public.inventory_observations, public.import_templates,
  _audit.inventory_events from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.inventory_snapshots, public.inventory_snapshot_items, public.inventory_changes, public.inventory_observations, public.import_templates, _audit.inventory_events from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

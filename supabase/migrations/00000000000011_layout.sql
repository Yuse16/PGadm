-- PGadm — Layout: store floor plans, elements, positions and version history (Phase 3)
-- File: 00000000000011_layout.sql
--
-- Scope (contract F3 / decisions D-L01..D-L14, APPROVED 2026-08-08): the 4
-- org-scoped tables that persist the layout domain:
--   * layouts                  structured floor plan anchored to a store branch
--                              (branch_type='store', D-L01); Canva plan is only a
--                              reference, never the model (D-L05)
--   * layout_elements          furniture/zones inside a layout with permanent
--                              hierarchical ID codes (D-L02/D-L09); coordinates are
--                              normalized 0-1 (D-L03)
--   * layout_positions         display positions with an exact 1C variant assigned
--                              (D-L06); NULL variant = empty position
--   * layout_version_history   append-only version/position history with
--                              previous/new_variant_id (D-L04/D-L06)
-- plus _audit.layout_events, the append-only application audit log for layout
-- mutations (D-L12, pattern _audit from 1C.5/1D).
--
-- Design docs:
--   docs/orchestration/handoffs/F3_DATA_MODEL_PROPOSAL.md
--   docs/orchestration/handoffs/F3_RLS_PERMISSION_MATRIX.md
--
-- Conventions inherited (1B/1C/1D):
--   * uuid PK via gen_random_uuid() (pgcrypto); timestamptz UTC timestamps.
--   * organization_id on every table; FK composite `(organization_id, parent_id)`
--     -> `UNIQUE(organization_id, id)` of the parent prevents cross-org writes.
--     Targets: branches (002), layouts/layout_elements/layout_positions (this
--     migration) and product_variants (008) all declare UNIQUE(organization_id, id).
--   * CHECK x = btrim(x) and x <> '' on mandatory text (canonical form, D-C12).
--   * No physical DELETE on any layout table (positions/versions are historical,
--     D-L04/D-L06/D-L14); soft transitions via status/locked.
--   * RLS deny-by-default reusing _access (004): SELECT requires layout.read;
--     INSERT/UPDATE require the operation permission (layout.edit / layout.publish /
--     layout.manage, matrix §4); grants == policies; no anon/service_role; no
--     permissive USING(true)/WITH CHECK(true) (D17/D18/ACC-21).
--   * The layout NEVER mutates stock/prices/observations (D-L13): no FK/trigger
--     points back into inventory tables, and no grants target them from here.
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (runtime roles bootstrapped in
-- 004). Rollback: documented, non-destructive.

-- ============================================================
-- 1. Table: layouts
-- Structured floor plan per store branch (D-L01). status transitions drive the
-- editing workflow: edition happens on draft only, publish requires approval
-- (D-L04), archive is a soft retirement (D-L14). width/height are the logical
-- canvas scale for normalized 0-1 coordinates (D-L03).
-- ============================================================
create table public.layouts (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null,
  branch_id            uuid not null,
  name                 text not null,
  status               text not null default 'draft',
  version              integer not null default 1,
  width                numeric,
  height               numeric,
  background_reference text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint layouts_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint layouts_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint layouts_name_not_blank check (name = btrim(name) and name <> ''),
  constraint layouts_status_valid check (status in ('draft', 'published', 'archived')),
  constraint layouts_version_positive check (version >= 1),
  constraint layouts_width_positive check (width is null or width > 0),
  constraint layouts_height_positive check (height is null or height > 0),
  constraint layouts_background_reference_not_blank check (
    background_reference is null or (background_reference = btrim(background_reference) and background_reference <> '')
  )
);

comment on table public.layouts is
  'Structured floor plan anchored to a store branch. Canva plan is only a reference, never the model (D-L05).';
comment on column public.layouts.branch_id is
  'Store branch (branch_type=store). The layout is per store sales floor, not per warehouse (D-L01).';
comment on column public.layouts.status is
  'draft | published | archived. Edition happens on draft only; publish requires layout.publish (D-L04).';
comment on column public.layouts.version is
  'Current published/working version; incremented on publish, restored versions never deleted (D-L04).';
comment on column public.layouts.width is
  'Logical canvas width used to interpret normalized 0-1 coordinates (D-L03).';
comment on column public.layouts.height is
  'Logical canvas height used to interpret normalized 0-1 coordinates (D-L03).';
comment on column public.layouts.background_reference is
  'Reference URL/text of the Canva plan. Reference only, never the model (D-L05).';

create unique index layouts_organization_id_unique on public.layouts (organization_id, id);
create unique index layouts_org_branch_name_unique on public.layouts (organization_id, branch_id, name);
create index layouts_org_branch_status_idx on public.layouts (organization_id, branch_id, status);

-- ============================================================
-- 2. Table: layout_elements
-- Furniture/zones inside a layout. code is the permanent hierarchical ID of the
-- location system (D-L02/LOCATION_ID_SYSTEM), unique per layout. element_type is
-- restricted to the FURNITURE_*.md catalog (D-L09); per-type composition rules
-- (e.g. M1 rail capacities 3/3/2) live in metadata as recommendation, not as a
-- hardcoded CHECK (D-L08). Coordinates are normalized 0-1 (D-L03).
-- ============================================================
create table public.layout_elements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  layout_id       uuid not null,
  element_type    text not null,
  code            text not null,
  label           text,
  x               numeric not null default 0,
  y               numeric not null default 0,
  width           numeric not null default 0,
  height          numeric not null default 0,
  rotation        numeric not null default 0,
  locked          boolean not null default false,
  z_index         integer not null default 0,
  metadata        jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint layout_elements_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint layout_elements_layout_organization_fk foreign key (organization_id, layout_id)
    references public.layouts (organization_id, id),
  constraint layout_elements_code_not_blank check (code = btrim(code) and code <> ''),
  constraint layout_elements_label_not_blank check (
    label is null or (label = btrim(label) and label <> '')
  ),
  constraint layout_elements_type_valid check (
    element_type in (
      'm1', 'galeria', 'muro', 'escaleras', 'vanity', 'banos', 'griferia',
      'jacuzzi', 'boiler', 'parrillas', 'mallas_fachaletas', 'adhesivos',
      'ambiente', 'mostrador', 'caja', 'zona', 'otro'
    )
  ),
  constraint layout_elements_x_unit check (x >= 0 and x <= 1),
  constraint layout_elements_y_unit check (y >= 0 and y <= 1),
  constraint layout_elements_width_non_negative check (width >= 0),
  constraint layout_elements_height_non_negative check (height >= 0),
  constraint layout_elements_rotation_valid check (rotation >= 0 and rotation < 360)
);

comment on table public.layout_elements is
  'Furniture/zones inside a layout. Permanent ID code per location system (D-L02).';
comment on column public.layout_elements.element_type is
  'Furniture/zone type from the FURNITURE_*.md catalog: m1 | galeria | muro | escaleras | vanity | banos | griferia | jacuzzi | boiler | parrillas | mallas_fachaletas | adhesivos | ambiente | mostrador | caja | zona | otro (D-L09).';
comment on column public.layout_elements.code is
  'Permanent hierarchical location ID (e.g. M1-01, GAL-LAMOSA-01). Immutable, unique per layout (D-L02).';
comment on column public.layout_elements.x is
  'Normalized horizontal coordinate 0-1 (D-L03). No absolute pixels.';
comment on column public.layout_elements.y is
  'Normalized vertical coordinate 0-1 (D-L03). No absolute pixels.';
comment on column public.layout_elements.locked is
  'Editor-locked element: move/rotate/resize blocked via use case (D-L02).';
comment on column public.layout_elements.metadata is
  'Per-type composition rules (e.g. M1 rail capacities 3/3/2) as recommendation, confirmable per furniture/supplier (D-L08).';

create unique index layout_elements_organization_id_unique on public.layout_elements (organization_id, id);
create unique index layout_elements_org_layout_code_unique on public.layout_elements (organization_id, layout_id, code);
create index layout_elements_org_layout_idx on public.layout_elements (organization_id, layout_id);

-- ============================================================
-- 3. Table: layout_positions
-- Display positions inside an element. variant_id references the exact 1C catalog
-- variant (D-L06); NULL = empty position. position_code is the permanent
-- sub-location (D-L02). review_status marks positions whose assigned stock changed
-- (D-L07): layout NEVver auto-reassigns the product.
-- ============================================================
create table public.layout_positions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  element_id      uuid not null,
  position_code   text not null,
  variant_id      uuid,
  active_from     timestamptz,
  active_to       timestamptz,
  review_status   text not null default 'ok',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint layout_positions_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint layout_positions_element_organization_fk foreign key (organization_id, element_id)
    references public.layout_elements (organization_id, id),
  constraint layout_positions_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint layout_positions_code_not_blank check (position_code = btrim(position_code) and position_code <> ''),
  constraint layout_positions_review_status_valid check (
    review_status in ('ok', 'needs_review')
  ),
  constraint layout_positions_active_window_valid check (
    active_to is null or (active_from is not null and active_to > active_from)
  )
);

comment on table public.layout_positions is
  'Display position inside an element with an exact catalog variant (D-L06). NULL variant = empty position.';
comment on column public.layout_positions.position_code is
  'Permanent hierarchical sub-location (e.g. CARA-A-RF-B02-P03). Immutable, unique per element (D-L02).';
comment on column public.layout_positions.variant_id is
  'Exact sellable variant from the 1C catalog (D-L06); never invents product.';
comment on column public.layout_positions.active_from is
  'Start of the assignment validity window.';
comment on column public.layout_positions.active_to is
  'End of the validity window; NULL = still current.';
comment on column public.layout_positions.review_status is
  'ok | needs_review. A detected stock change marks the position for review; the product is NEVER auto-reassigned (D-L07).';

create unique index layout_positions_organization_id_unique on public.layout_positions (organization_id, id);
create unique index layout_positions_org_element_code_unique on public.layout_positions (organization_id, element_id, position_code);
create index layout_positions_org_variant_idx on public.layout_positions (organization_id, variant_id);
create index layout_positions_org_element_review_idx on public.layout_positions (organization_id, element_id, review_status);

-- ============================================================
-- 4. Table: layout_version_history
-- Append-only history of layout versions and position assignments (D-L04/D-L06).
-- product assignments keep previous/new_variant_id so each position conserves its
-- current + previous products; restoring a version creates a 'restored' event and
-- never deletes the restored version (LA-13).
-- ============================================================
create table public.layout_version_history (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null,
  layout_id          uuid not null,
  version            integer not null,
  change_type        text not null,
  element_id         uuid,
  position_id        uuid,
  previous_variant_id uuid,
  new_variant_id     uuid,
  origin             text,
  destination        text,
  reason             text,
  changed_by         uuid not null,
  created_at         timestamptz not null default now(),
  constraint layout_version_history_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint layout_version_history_layout_organization_fk foreign key (organization_id, layout_id)
    references public.layouts (organization_id, id),
  constraint layout_version_history_element_organization_fk foreign key (organization_id, element_id)
    references public.layout_elements (organization_id, id),
  constraint layout_version_history_position_organization_fk foreign key (organization_id, position_id)
    references public.layout_positions (organization_id, id),
  constraint layout_version_history_previous_variant_organization_fk foreign key (organization_id, previous_variant_id)
    references public.product_variants (organization_id, id),
  constraint layout_version_history_new_variant_organization_fk foreign key (organization_id, new_variant_id)
    references public.product_variants (organization_id, id),
  constraint layout_version_history_changed_by_fk foreign key (changed_by)
    references public.profiles (id),
  constraint layout_version_history_version_positive check (version >= 1),
  constraint layout_version_history_change_type_valid check (
    change_type in (
      'created', 'element_added', 'element_changed', 'element_moved',
      'element_rotated', 'element_resized', 'element_locked', 'element_hidden',
      'element_duplicated', 'product_assigned', 'product_removed', 'published', 'restored'
    )
  ),
  constraint layout_version_history_reason_not_blank check (
    reason is null or (reason = btrim(reason) and reason <> '')
  ),
  constraint layout_version_history_origin_not_blank check (
    origin is null or (origin = btrim(origin) and origin <> '')
  ),
  constraint layout_version_history_destination_not_blank check (
    destination is null or (destination = btrim(destination) and destination <> '')
  )
);

comment on table public.layout_version_history is
  'Append-only history of layout versions and position assignments (D-L04/D-L06). Never edited or deleted.';
comment on column public.layout_version_history.change_type is
  'created | element_added | element_changed | element_moved | element_rotated | element_resized | element_locked | element_hidden | element_duplicated | product_assigned | product_removed | published | restored.';
comment on column public.layout_version_history.previous_variant_id is
  'Product previously assigned to the position (product_assigned).';
comment on column public.layout_version_history.new_variant_id is
  'Product newly assigned to the position (product_assigned).';
comment on column public.layout_version_history.changed_by is
  'Profile that performed the change; audit lineage (D-L12).';

create unique index layout_version_history_organization_id_unique on public.layout_version_history (organization_id, id);
create index layout_version_history_org_layout_version_idx on public.layout_version_history (organization_id, layout_id, version desc);
create index layout_version_history_org_position_created_idx on public.layout_version_history (organization_id, position_id, created_at desc);

-- ============================================================
-- 5. Table: _audit.layout_events
-- Append-only application audit log for layout mutations (D-L12, pattern
-- _audit.catalog_events/inventory_events). Written by the use cases
-- (createLayout, editLayout, publishLayout, restoreLayout, assignProduct);
-- never updated/deleted.
-- ============================================================
create table _audit.layout_events (
  id              uuid primary key default gen_random_uuid(),
  occurred_at     timestamptz not null default now(),
  actor_user_id   uuid not null,
  organization_id uuid not null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid not null,
  detail          text not null default '',
  constraint layout_events_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint layout_events_actor_user_fk foreign key (actor_user_id)
    references public.profiles (id),
  constraint layout_events_action_valid check (
    action in (
      'layout_created', 'layout_edited', 'layout_published', 'layout_restored',
      'layout_archived', 'element_edited', 'product_assigned', 'product_removed'
    )
  ),
  constraint layout_events_entity_type_valid check (
    entity_type in ('layout', 'layout_element', 'layout_position', 'layout_version')
  ),
  constraint layout_events_detail_not_blank check (detail is not null)
);

comment on table _audit.layout_events is
  'Append-only application audit log for layout mutations (D-L12). Never updated or deleted.';
comment on column _audit.layout_events.action is
  'layout_created | layout_edited | layout_published | layout_restored | layout_archived | element_edited | product_assigned | product_removed.';
comment on column _audit.layout_events.actor_user_id is
  'Acting user (profile id, JWT sub). Written by the use cases (D-L12).';
comment on column _audit.layout_events.entity_type is
  'layout | layout_element | layout_position | layout_version.';
comment on column _audit.layout_events.detail is
  'Short human-readable summary of the audited mutation.';

create index layout_events_organization_entity_idx
  on _audit.layout_events (organization_id, entity_type, entity_id, occurred_at desc);
create index layout_events_organization_occurred_idx
  on _audit.layout_events (organization_id, occurred_at desc);

-- ============================================================
-- 6. updated_at triggers (only on mutable tables; layout_version_history is
-- append-only and intentionally has no updated_at)
-- ============================================================
select _core.set_updated_at_column('layouts');
select _core.set_updated_at_column('layout_elements');
select _core.set_updated_at_column('layout_positions');

-- ============================================================
-- 7. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table public.layouts enable row level security;
alter table public.layout_elements enable row level security;
alter table public.layout_positions enable row level security;
alter table public.layout_version_history enable row level security;
alter table _audit.layout_events enable row level security;

-- ============================================================
-- 8. Allowlist policies (F3_RLS_PERMISSION_MATRIX §4; no DELETE anywhere)
-- ============================================================

-- ---- layouts: SELECT read; INSERT manage; UPDATE edit / publish ----------
create policy layouts_select_org on public.layouts
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.read')
  );

create policy layouts_insert_manage on public.layouts
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.manage')
  );

create policy layouts_update_edit on public.layouts
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  );

create policy layouts_update_publish on public.layouts
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.publish')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.publish')
  );

-- ---- layout_elements: SELECT read; INSERT/UPDATE edit; no DELETE ---------
create policy layout_elements_select_org on public.layout_elements
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.read')
  );

create policy layout_elements_insert_edit on public.layout_elements
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  );

create policy layout_elements_update_edit on public.layout_elements
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  );

-- ---- layout_positions: SELECT read; INSERT/UPDATE edit; no DELETE --------
create policy layout_positions_select_org on public.layout_positions
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.read')
  );

create policy layout_positions_insert_edit on public.layout_positions
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  );

create policy layout_positions_update_edit on public.layout_positions
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.edit')
  );

-- ---- layout_version_history: SELECT read; INSERT edit/publish; no UPDATE --
create policy layout_version_history_select_org on public.layout_version_history
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.read')
  );

create policy layout_version_history_insert_edit on public.layout_version_history
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('layout.edit')
      or _access.has_permission('layout.publish'))
  );

-- ---- _audit.layout_events: SELECT read; INSERT edit/publish/manage --------
create policy layout_events_select_org on _audit.layout_events
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('layout.read')
  );

create policy layout_events_insert_authorized on _audit.layout_events
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('layout.edit')
      or _access.has_permission('layout.publish')
      or _access.has_permission('layout.manage'))
  );

-- ============================================================
-- 9. Minimal grants (D18: grants == policies; no DELETE grants)
-- ============================================================
grant select, insert, update on public.layouts to authenticated;
grant select, insert, update on public.layout_elements to authenticated;
grant select, insert, update on public.layout_positions to authenticated;
grant select, insert on public.layout_version_history to authenticated;

grant select, insert on _audit.layout_events to authenticated;

-- ============================================================
-- 10. Re-affirm zero access for anon/service_role/PUBLIC (D17)
-- ============================================================
revoke all on table public.layouts, public.layout_elements,
  public.layout_positions, public.layout_version_history,
  _audit.layout_events from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.layouts, public.layout_elements, public.layout_positions, public.layout_version_history, _audit.layout_events from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

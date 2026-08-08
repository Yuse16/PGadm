-- PGadm — Product Master Catalog (Phase 1C.2)
-- File: 00000000000008_product_master.sql
--
-- Scope (contract F1C / decisions D-C01..D-C17, APPROVED 2026-08-04): the 7
-- catalog tables (product_categories, product_brands, units_of_measure,
-- product_lines, products, product_variants, product_barcodes) with org-scoped
-- composite FKs, functional case-insensitive uniques, lifecycle triggers in the
-- _catalog schema and deny-by-default RLS.
--
-- Design docs:
--   docs/orchestration/handoffs/F1C_DATA_MODEL_PROPOSAL.md
--   docs/orchestration/handoffs/F1C_RLS_PERMISSION_MATRIX.md
--   docs/orchestration/handoffs/F1C_HUMAN_ARCHITECTURE_REVIEW.md
--
-- Conventions inherited (1B.1/1B.2/1B.3):
--   * uuid PKs via gen_random_uuid() (pgcrypto).
--   * timestamptz UTC + updated_at maintained by _core.set_updated_at_column().
--   * organization_id on every table; UNIQUE(organization_id, id) on parent
--     tables so composite FKs (organization_id, child) -> (organization_id, id)
--     prevent cross-organization references (D-C08).
--   * Functional unique indexes upper(trim(...)) for case-insensitive
--     uniqueness (D-C11/D-C12).
--   * CHECK x = btrim(x) and x <> '' on mandatory text (stricter canonical form
--     of D-C12 "CHECK trim(valor) <> ''"; same pattern as migrations 002/003).
--   * status CHECK; no physical DELETE (D-C14).
--   * Catalog logic lives in schema _catalog as SECURITY INVOKER functions with
--     SET search_path = '' (D-C01). No SECURITY DEFINER unless whitelisted.
--
-- Security decisions (same lineage as 004/007):
--   D17  No grants/policies for anon.
--   D18  authenticated: grants with equivalent policies only.
--   D20  FORCE ROW LEVEL SECURITY intentionally NOT enabled (owner
--        postgres: migrations/seed must keep writing without RLS).
--   Identity resolution via _access.current_organization_ids() and
--        _access.has_permission() (ACC-15/D12/D13; JWT carries only sub).
--   No USING(true), no WITH CHECK(true) (ACC-21).
--
-- IMPORTANT design note (refinement of the approved status-transition rule):
--   _catalog.enforce_status_transition() is attached as BEFORE UPDATE (all
--   columns), not BEFORE UPDATE OF status, so it can detect non-status data
--   edits ("nunca confiar en la interfaz", D-C09 section 5). Change detection
--   compares to_jsonb(old) vs to_jsonb(new) excluding status/created_at/
--   updated_at. Permission enforcement applies only when the invoker is the
--   runtime role 'authenticated' (client writes). Owner/maintenance writes
--   (postgres: migrations/seed) skip the permission check, consistent with D20;
--   the structural triggers (category tree, active variant, last active
--   variant) apply to everyone.
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (no auth schema access;
-- runtime roles bootstrapped in 004). Rollback: documented, non-destructive.

-- ============================================================
-- 1. Schema: _catalog
-- Internal trigger/helper functions for catalog integrity. Not exposed via
-- the API; trigger-invoked only (mirrors the _access/_core pattern).
-- ============================================================
create schema if not exists _catalog;

-- ============================================================
-- 2. Table: product_categories
-- Hierarchical categories, max 3 levels (D-C01). Level 1 has no parent.
-- ============================================================
create table public.product_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  parent_id       uuid,
  code            text not null,
  name            text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint product_categories_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint product_categories_organization_id_unique unique (organization_id, id),
  constraint product_categories_parent_organization_fk foreign key (organization_id, parent_id)
    references public.product_categories (organization_id, id),
  constraint product_categories_code_not_blank check (code = btrim(code) and code <> ''),
  constraint product_categories_name_not_blank check (name = btrim(name) and name <> ''),
  constraint product_categories_status_valid check (status in ('active', 'inactive'))
);

comment on table public.product_categories is
  'Hierarchical product category, max 3 levels. Tree integrity enforced by _catalog.enforce_category_tree (D-C01).';
comment on column public.product_categories.organization_id is
  'Owning organization; catalog is org-scoped (D-C07).';
comment on column public.product_categories.parent_id is
  'Parent category in the SAME organization (composite FK). NULL = level 1.';

-- (organization_id, id) unique for product_categories is created inline in the
-- CREATE TABLE so the self-referencing parent FK resolves it at creation time.
create unique index product_categories_organization_code_unique on public.product_categories (organization_id, upper(trim(code)));
create index product_categories_organization_parent_idx on public.product_categories (organization_id, parent_id);

-- ============================================================
-- 3. Table: product_brands
-- ============================================================
create table public.product_brands (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  code            text not null,
  name            text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint product_brands_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint product_brands_code_not_blank check (code = btrim(code) and code <> ''),
  constraint product_brands_name_not_blank check (name = btrim(name) and name <> ''),
  constraint product_brands_status_valid check (status in ('active', 'inactive'))
);

comment on table public.product_brands is
  'Product brand, org-scoped (D-C07).';

create unique index product_brands_organization_id_unique on public.product_brands (organization_id, id);
create unique index product_brands_organization_code_unique on public.product_brands (organization_id, upper(trim(code)));

-- ============================================================
-- 4. Table: units_of_measure
-- kind = real dimension: count | length | area | volume | mass | package (D-C05).
-- ============================================================
create table public.units_of_measure (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  code            text not null,
  name            text not null,
  kind            text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint units_of_measure_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint units_of_measure_code_not_blank check (code = btrim(code) and code <> ''),
  constraint units_of_measure_name_not_blank check (name = btrim(name) and name <> ''),
  constraint units_of_measure_kind_valid check (kind in ('count', 'length', 'area', 'volume', 'mass', 'package')),
  constraint units_of_measure_status_valid check (status in ('active', 'inactive'))
);

comment on table public.units_of_measure is
  'Units of measure. kind is the real dimension (D-C05): count/length/area/volume/mass/package.';
comment on column public.units_of_measure.kind is
  'Physical dimension the unit measures: count | length | area | volume | mass | package.';

create unique index units_of_measure_organization_id_unique on public.units_of_measure (organization_id, id);
create unique index units_of_measure_organization_code_unique on public.units_of_measure (organization_id, upper(trim(code)));

-- ============================================================
-- 5. Table: product_lines
-- Intelisis line reference (D-C11): external_id is the official external code,
-- unique per org, case-insensitive; NULL allowed.
-- ============================================================
create table public.product_lines (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  external_id     text,
  name            text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint product_lines_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint product_lines_external_id_not_blank check (
    external_id is null or (external_id = btrim(external_id) and external_id <> '')
  ),
  constraint product_lines_name_not_blank check (name = btrim(name) and name <> ''),
  constraint product_lines_status_valid check (status in ('active', 'inactive'))
);

comment on table public.product_lines is
  'Product line (Intelisis reference). external_id is the official external code (D-C11).';

create unique index product_lines_organization_id_unique on public.product_lines (organization_id, id);
create unique index product_lines_organization_external_unique on public.product_lines (organization_id, upper(trim(external_id)))
  where external_id is not null;

-- ============================================================
-- 6. Table: products
-- Product base (no SKU/barcode, D-C02/D-C03). Born 'inactive' (D-C13);
-- active requires >= 1 active variant (enforce_product_active_variant).
-- ============================================================
create table public.products (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null,
  external_id            text,
  description            text not null,
  short_name             text,
  brand_id               uuid,
  category_id            uuid,
  line_id                uuid,
  technical_description  text,
  status                 text not null default 'inactive',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint products_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint products_brand_organization_fk foreign key (organization_id, brand_id)
    references public.product_brands (organization_id, id),
  constraint products_category_organization_fk foreign key (organization_id, category_id)
    references public.product_categories (organization_id, id),
  constraint products_line_organization_fk foreign key (organization_id, line_id)
    references public.product_lines (organization_id, id),
  constraint products_external_id_not_blank check (
    external_id is null or (external_id = btrim(external_id) and external_id <> '')
  ),
  constraint products_description_not_blank check (description = btrim(description) and description <> ''),
  constraint products_short_name_not_blank check (
    short_name is null or (short_name = btrim(short_name) and short_name <> '')
  ),
  constraint products_status_valid check (status in ('active', 'inactive', 'discontinued'))
);

comment on table public.products is
  'Product master (base). Presentations are modeled as product_variants (D-C02/D-C03). Born inactive (D-C13).';
comment on column public.products.external_id is
  'Official Intelisis identifier, unique per org, case-insensitive (D-C11).';
comment on column public.products.status is
  'active | inactive | discontinued. No physical DELETE (D-C14).';

create unique index products_organization_id_unique on public.products (organization_id, id);
create unique index products_organization_external_unique on public.products (organization_id, upper(trim(external_id)))
  where external_id is not null;
create index products_organization_category_idx on public.products (organization_id, category_id);
create index products_organization_brand_idx on public.products (organization_id, brand_id);
create index products_organization_line_idx on public.products (organization_id, line_id);

-- ============================================================
-- 7. Table: product_variants
-- Sellable presentation: owns SKU, barcodes and sale units (D-C03/D-C05/D-C06).
-- ============================================================
create table public.product_variants (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null,
  product_id               uuid not null,
  sku                      text not null,
  display_name             text,
  format                   text,
  finish                   text,
  base_unit_id             uuid not null,
  sale_unit_id             uuid not null,
  base_units_per_sale_unit numeric not null default 1,
  pieces_per_box           numeric,
  square_meters_per_box    numeric,
  reference_price          numeric(14,4),
  status                   text not null default 'active',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint product_variants_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint product_variants_product_organization_fk foreign key (organization_id, product_id)
    references public.products (organization_id, id),
  constraint product_variants_base_unit_organization_fk foreign key (organization_id, base_unit_id)
    references public.units_of_measure (organization_id, id),
  constraint product_variants_sale_unit_organization_fk foreign key (organization_id, sale_unit_id)
    references public.units_of_measure (organization_id, id),
  constraint product_variants_sku_not_blank check (sku = btrim(sku) and sku <> ''),
  constraint product_variants_display_name_not_blank check (
    display_name is null or (display_name = btrim(display_name) and display_name <> '')
  ),
  constraint product_variants_base_units_positive check (base_units_per_sale_unit > 0),
  constraint product_variants_pieces_per_box_positive check (pieces_per_box is null or pieces_per_box > 0),
  constraint product_variants_square_meters_positive check (square_meters_per_box is null or square_meters_per_box > 0),
  constraint product_variants_reference_price_non_negative check (reference_price is null or reference_price >= 0),
  constraint product_variants_status_valid check (status in ('active', 'inactive', 'discontinued'))
);

comment on table public.product_variants is
  'Sellable presentation of a product. SKU and barcodes live here (D-C03/D-C04).';
comment on column public.product_variants.sku is
  'Internal SKU, unique per org, case-insensitive (D-C03).';
comment on column public.product_variants.base_units_per_sale_unit is
  'Units of the base unit that make one sale unit; must be > 0 (D-C05).';
comment on column public.product_variants.reference_price is
  'Single reference price column (numeric(14,4)), associated to sale_unit_id (D-C06). Lists/prices per branch deferred.';

create unique index product_variants_organization_id_unique on public.product_variants (organization_id, id);
create unique index product_variants_organization_sku_unique on public.product_variants (organization_id, upper(trim(sku)));
create index product_variants_organization_product_idx on public.product_variants (organization_id, product_id);

-- ============================================================
-- 8. Table: product_barcodes
-- Multiple barcodes per variant; exactly one primary per variant (D-C04).
-- No primary barcode at product level.
-- ============================================================
create table public.product_barcodes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  variant_id      uuid not null,
  barcode         text not null,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint product_barcodes_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint product_barcodes_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint product_barcodes_barcode_not_blank check (barcode = btrim(barcode) and barcode <> '')
);

comment on table public.product_barcodes is
  'Barcodes of a variant; multiple allowed, one primary per variant (D-C04).';

create unique index product_barcodes_organization_barcode_unique on public.product_barcodes (organization_id, upper(trim(barcode)));
create unique index product_barcodes_organization_variant_primary_unique on public.product_barcodes (organization_id, variant_id)
  where is_primary;

-- ============================================================
-- 9. Triggers: updated_at (idempotent, _core.set_updated_at_column)
-- ============================================================
select _core.set_updated_at_column('product_categories');
select _core.set_updated_at_column('product_brands');
select _core.set_updated_at_column('units_of_measure');
select _core.set_updated_at_column('product_lines');
select _core.set_updated_at_column('products');
select _core.set_updated_at_column('product_variants');
select _core.set_updated_at_column('product_barcodes');

-- ============================================================
-- 10. Catalog integrity functions (_catalog, SECURITY INVOKER, search_path='')
-- ============================================================

-- 10.1 _catalog.enforce_category_tree()
-- Rejects self-parent, cycles and depth > 3 (D-C01). BEFORE INSERT OR UPDATE
-- OF parent_id on product_categories.
create function _catalog.enforce_category_tree()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_depth  integer;
  v_node   uuid;
  v_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'category cannot be its own parent'
      using errcode = 'P0001';
  end if;

  v_depth := 1;
  v_node := new.parent_id;
  while v_node is not null loop
    v_depth := v_depth + 1;
    if v_depth > 3 then
      raise exception 'category tree depth exceeds 3 levels'
        using errcode = 'P0001';
    end if;
    if v_node = new.id then
      raise exception 'category tree cycle detected'
        using errcode = 'P0001';
    end if;
    select parent_id into v_parent
      from public.product_categories
      where id = v_node
        and organization_id = new.organization_id;
    v_node := v_parent;
  end loop;

  return new;
end;
$$;

comment on function _catalog.enforce_category_tree() is
  'Rejects self-parent, cycles and depth > 3 in product_categories (D-C01). SECURITY INVOKER, search_path locked.';

-- 10.2 _catalog.enforce_product_active_variant()
-- An active product requires >= 1 active variant (D-C13). BEFORE INSERT OR
-- UPDATE on products.
create function _catalog.enforce_product_active_variant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'active' and not exists (
    select 1
    from public.product_variants v
    where v.product_id = new.id
      and v.organization_id = new.organization_id
      and v.status = 'active'
  ) then
    raise exception 'an active product requires at least one active variant'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function _catalog.enforce_product_active_variant() is
  'Active products must keep >= 1 active variant (D-C13). SECURITY INVOKER, search_path locked.';

-- 10.3 _catalog.enforce_last_active_variant()
-- The last active variant of an ACTIVE product cannot be retired (D-C13).
-- BEFORE UPDATE OF status on product_variants.
create function _catalog.enforce_last_active_variant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'active'
     and new.status is distinct from 'active'
     and exists (
       select 1
       from public.products p
       where p.id = old.product_id
         and p.organization_id = old.organization_id
         and p.status = 'active'
     )
     and not exists (
       select 1
       from public.product_variants v
       where v.product_id = old.product_id
         and v.organization_id = old.organization_id
         and v.status = 'active'
         and v.id <> old.id
     )
  then
    raise exception 'cannot retire the last active variant of an active product'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function _catalog.enforce_last_active_variant() is
  'Protects the last active variant of an active product (D-C13). SECURITY INVOKER, search_path locked.';

-- 10.4 _catalog.enforce_status_transition()
-- Permission-gated status transitions on products and product_variants
-- (D-C09 §5 / D-C14): active<->inactive needs catalog.update; ->discontinued
-- needs catalog.archive (update never implies archive); restoring a
-- discontinued record needs catalog.manage. Non-status data edits need
-- catalog.update. Change detection compares the full normalized row
-- (to_jsonb) excluding status/created_at/updated_at, so the check never
-- relies on the application ("nunca confiar en la interfaz").
-- Attached as BEFORE UPDATE (all columns) so data-only edits are enforced too.
-- Permission enforcement applies only to runtime client writes
-- (current_user = 'authenticated'); owner/maintenance writes (postgres:
-- migrations/seed) skip it, consistent with D20.
create function _catalog.enforce_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status_changed boolean;
  v_data_changed  boolean;
  v_has_update    boolean;
  v_has_archive   boolean;
  v_has_manage    boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  v_status_changed := old.status is distinct from new.status;
  v_data_changed := (to_jsonb(old) - 'status' - 'created_at' - 'updated_at')
                 is distinct from (to_jsonb(new) - 'status' - 'created_at' - 'updated_at');

  -- No-op update: nothing changed, nothing to enforce.
  if not v_status_changed and not v_data_changed then
    return new;
  end if;

  -- D: non-status data edits require catalog.update.
  if not v_status_changed then
    if not _access.has_permission('catalog.update') then
      raise exception 'editing catalog data requires catalog.update'
        using errcode = '42501';
    end if;
    return new;
  end if;

  v_has_update  := _access.has_permission('catalog.update');
  v_has_archive := _access.has_permission('catalog.archive');
  v_has_manage  := _access.has_permission('catalog.manage');

  -- B: entering discontinued requires catalog.archive; catalog.update alone
  -- can never do it (D-C09 §5 / CA-22/CA-36).
  if new.status = 'discontinued' then
    if not v_has_archive then
      raise exception 'transition to discontinued requires catalog.archive'
        using errcode = '42501';
    end if;
    -- E: combined data edit + discontinue requires update too.
    if v_data_changed and not v_has_update then
      raise exception 'combined edit + discontinue requires catalog.update and catalog.archive'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- C: restoration from discontinued requires catalog.manage (D-C14).
  if old.status = 'discontinued' then
    if not v_has_manage then
      raise exception 'restoring a discontinued record requires catalog.manage'
        using errcode = '42501';
    end if;
    -- F: restoration + data changes requires update too.
    if v_data_changed and not v_has_update then
      raise exception 'restoring with data changes requires catalog.manage and catalog.update'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- A: active <-> inactive requires catalog.update.
  if not v_has_update then
    raise exception 'transition between active and inactive requires catalog.update'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

comment on function _catalog.enforce_status_transition() is
  'Permission-gated status transitions (D-C09/D-C14): update for active/inactive, archive for discontinued, manage for restore. Change detection excludes status/created_at/updated_at. SECURITY INVOKER, search_path locked; enforcement applies to authenticated only (D20).';

-- ============================================================
-- 11. Attach triggers
-- ============================================================
create trigger product_categories_tree_enforce
  before insert or update of parent_id on public.product_categories
  for each row execute function _catalog.enforce_category_tree();

create trigger products_active_variant_enforce
  before insert or update on public.products
  for each row execute function _catalog.enforce_product_active_variant();

create trigger products_status_transition_enforce
  before update on public.products
  for each row execute function _catalog.enforce_status_transition();

create trigger product_variants_status_transition_enforce
  before update on public.product_variants
  for each row execute function _catalog.enforce_status_transition();

create trigger product_variants_last_active_enforce
  before update of status on public.product_variants
  for each row execute function _catalog.enforce_last_active_variant();

-- ============================================================
-- 12. Function privileges: revoke PUBLIC, grant minimal (trigger-only +
--       authenticated, mirroring the _access pattern in migration 004)
-- ============================================================
revoke all on function _catalog.enforce_category_tree() from public;
revoke all on function _catalog.enforce_product_active_variant() from public;
revoke all on function _catalog.enforce_last_active_variant() from public;
revoke all on function _catalog.enforce_status_transition() from public;

grant execute on function _catalog.enforce_category_tree() to authenticated;
grant execute on function _catalog.enforce_product_active_variant() to authenticated;
grant execute on function _catalog.enforce_last_active_variant() to authenticated;
grant execute on function _catalog.enforce_status_transition() to authenticated;

grant usage on schema _catalog to authenticated;

alter default privileges in schema _catalog revoke all on routines from public;

-- ============================================================
-- 13. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table public.product_categories enable row level security;
alter table public.product_brands enable row level security;
alter table public.units_of_measure enable row level security;
alter table public.product_lines enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_barcodes enable row level security;

-- ============================================================
-- 14. Allowlist policies (F1C_RLS_PERMISSION_MATRIX §4; no DELETE anywhere)
-- ============================================================

-- ---- product_categories: SELECT read; INSERT/UPDATE catalog.manage --------
create policy product_categories_select_org on public.product_categories
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy product_categories_insert_admin on public.product_categories
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

create policy product_categories_update_admin on public.product_categories
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

-- ---- product_brands: SELECT read; INSERT/UPDATE catalog.manage -----------
create policy product_brands_select_org on public.product_brands
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy product_brands_insert_admin on public.product_brands
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

create policy product_brands_update_admin on public.product_brands
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

-- ---- units_of_measure: SELECT read; INSERT/UPDATE catalog.manage ---------
create policy units_of_measure_select_org on public.units_of_measure
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy units_of_measure_insert_admin on public.units_of_measure
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

create policy units_of_measure_update_admin on public.units_of_measure
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

-- ---- product_lines: SELECT read; INSERT/UPDATE catalog.manage ------------
create policy product_lines_select_org on public.product_lines
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy product_lines_insert_admin on public.product_lines
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

create policy product_lines_update_admin on public.product_lines
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.manage')
  );

-- ---- products: SELECT read; INSERT catalog.create; UPDATE editor ---------
-- Single UPDATE policy: entry allowed with at least one of update/archive/
-- manage; the actual transition is validated by enforce_status_transition
-- (D-C09 §5, one-policy design).
create policy products_select_org on public.products
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy products_insert_create on public.products
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.create')
  );

create policy products_update_editor on public.products
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('catalog.update')
      or _access.has_permission('catalog.archive')
      or _access.has_permission('catalog.manage'))
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('catalog.update')
      or _access.has_permission('catalog.archive')
      or _access.has_permission('catalog.manage'))
  );

-- ---- product_variants: SELECT read; INSERT catalog.create; UPDATE editor --
create policy product_variants_select_org on public.product_variants
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy product_variants_insert_create on public.product_variants
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.create')
  );

create policy product_variants_update_editor on public.product_variants
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('catalog.update')
      or _access.has_permission('catalog.archive')
      or _access.has_permission('catalog.manage'))
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and (_access.has_permission('catalog.update')
      or _access.has_permission('catalog.archive')
      or _access.has_permission('catalog.manage'))
  );

-- ---- product_barcodes: SELECT read; INSERT catalog.create; UPDATE update --
create policy product_barcodes_select_org on public.product_barcodes
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.read')
  );

create policy product_barcodes_insert_create on public.product_barcodes
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.create')
  );

create policy product_barcodes_update_editor on public.product_barcodes
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.update')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('catalog.update')
  );

-- ============================================================
-- 15. Minimal grants to authenticated (D18: grants == policies)
-- No DELETE grant on any catalog table (D-C14).
-- ============================================================
grant select on public.product_categories, public.product_brands,
  public.units_of_measure, public.product_lines, public.products,
  public.product_variants, public.product_barcodes to authenticated;

grant insert, update on public.product_categories, public.product_brands,
  public.units_of_measure, public.product_lines to authenticated;

grant insert, update on public.products, public.product_variants,
  public.product_barcodes to authenticated;

-- ============================================================
-- 16. Re-affirm zero access for anon/service_role/PUBLIC (D17)
-- ============================================================
revoke all on table public.product_categories, public.product_brands,
  public.units_of_measure, public.product_lines, public.products,
  public.product_variants, public.product_barcodes from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.product_categories, public.product_brands, public.units_of_measure, public.product_lines, public.products, public.product_variants, public.product_barcodes from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

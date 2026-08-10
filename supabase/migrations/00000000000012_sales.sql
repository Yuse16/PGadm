-- PGadm — Sales: quotations, manual sales capture, budgets and CEDIS requests (Phase 4)
-- File: 00000000000012_sales.sql
--
-- Scope (contract F4 / decisions D-V01..D-V14, APPROVED 2026-08-10): the 6
-- org-scoped tables that persist the sales domain:
--   * customers             minimal customer, enough to quote (D-V01/D-V02);
--                           CRM (projects/opportunities/follow-ups) = Phase 5
--   * quotations            quotation anchored to a store branch with unique
--                           folio per org and deterministic delivery_status
--                           (D-V07/D-V08/D-V09/D-V14)
--   * quotation_items       quotation lines with price/coverage snapshot of 1C
--                           (reference_price, pieces_per_box, square_meters_per_box,
--                           D-V04); stock is NEVER stored here (D-V13)
--   * manual_sale_entries   daily manual capture per seller/branch/day (D-V02/D-V07)
--   * sales_budgets         monthly budget per store and per seller (D-V11)
--   * cedis_requests        minimal CEDIS request tied to a quotation (D-V06);
--                           response/chat/balancing = Phase 7
-- plus _audit.sales_events, the append-only application audit log for sales
-- mutations with previous_data/new_data on corrections (D-V14, pattern _audit
-- from 1C.5/1D/F3).
--
-- Design docs:
--   docs/orchestration/handoffs/F4_DATA_MODEL_PROPOSAL.md
--   docs/orchestration/handoffs/F4_RLS_PERMISSION_MATRIX.md
--
-- Conventions inherited (1B/1C/1D/F3):
--   * uuid PK via gen_random_uuid() (pgcrypto); timestamptz UTC timestamps.
--   * organization_id on every table; FK composite `(organization_id, parent_id)`
--     -> `UNIQUE(organization_id, id)` of the parent prevents cross-org writes.
--     Targets: branches (002), product_variants/units_of_measure (008) and the
--     parent sales tables (this migration) all declare UNIQUE(organization_id, id).
--   * CHECK x = btrim(x) and x <> '' on mandatory text (canonical form, D-C12).
--   * No physical DELETE on any sales table (quotations, captures, budgets and
--     requests are historical, D-V05/D-V06/D-V14); soft transitions via status.
--   * RLS deny-by-default reusing _access (004): SELECT requires sales.read;
--     INSERT/UPDATE require the operation permission (matrix §4); a seller only
--     sees her own rows unless she holds sales.edit_all (D-V03). Grants ==
--     policies; no anon/service_role; no permissive USING(true)/WITH CHECK(true)
--     (D17/D18/ACC-21). The per-store scoping of the manager is documented as a
--     follow-up when RBAC user_store_role lands (open question §5).
--   * Sales NEVER write inventory/catalog/prices (D-V05/D-V13): no FK/trigger
--     points back into inventory tables from here, and no grants target them.
--   * quotation_sold does NOT auto-create manual_sale_entries (D-V07): the
--     capture is an independent daily aggregate.
--
-- Compatibility: PostgreSQL 15, plain-PG CI safe (runtime roles bootstrapped in
-- 004). Rollback: documented, non-destructive.

-- ============================================================
-- 1. Table: customers
-- Minimal customer, enough to quote (D-V01/D-V02). No projects/opportunities/
-- follow-ups (CRM = Phase 5). assigned_seller_id NULL = unassigned (D-V02);
-- deduplication of phone/WhatsApp is Phase 5 (no unique here).
-- ============================================================
create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null,
  name               text not null,
  phone              text,
  whatsapp           text,
  assigned_seller_id uuid,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint customers_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint customers_assigned_seller_fk foreign key (assigned_seller_id)
    references public.profiles (id),
  constraint customers_name_not_blank check (name = btrim(name) and name <> ''),
  constraint customers_phone_not_blank check (
    phone is null or (phone = btrim(phone) and phone <> '')
  ),
  constraint customers_whatsapp_not_blank check (
    whatsapp is null or (whatsapp = btrim(whatsapp) and whatsapp <> '')
  ),
  constraint customers_status_valid check (status in ('active', 'inactive'))
);

comment on table public.customers is
  'Minimal customer, enough to quote (D-V01). CRM (projects/opportunities/follow-ups) is Phase 5.';
comment on column public.customers.assigned_seller_id is
  'Seller responsible for the customer (D-V02); NULL = unassigned.';
comment on column public.customers.status is
  'active | inactive. Soft retirement; no physical DELETE (D-V14).';

create unique index customers_organization_id_unique on public.customers (organization_id, id);
create index customers_org_seller_idx on public.customers (organization_id, assigned_seller_id);
create index customers_org_name_idx on public.customers (organization_id, lower(trim(name)));

-- ============================================================
-- 2. Table: quotations
-- Quotation anchored to a store branch (branch_type='store', D-V01). folio is
-- unique per org (D-V02); status transitions are driven by use cases (D-V07).
-- delivery_status is deterministic from reported existence (D-V09); no promised
-- delivery date is stored (05_DELIVERY_OPTIONS.md). valid_until defaults to 30
-- days at creation in the use case (D-V08); no IVA in F4 (total = subtotal).
-- ============================================================
create table public.quotations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  folio           text not null,
  customer_id     uuid,
  seller_id       uuid not null,
  branch_id       uuid not null,
  status          text not null default 'draft',
  subtotal        numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  valid_until     timestamptz,
  delivery_status text not null default 'pending',
  observations    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint quotations_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint quotations_customer_organization_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id),
  constraint quotations_seller_fk foreign key (seller_id)
    references public.profiles (id),
  constraint quotations_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint quotations_folio_not_blank check (folio = btrim(folio) and folio <> ''),
  constraint quotations_status_valid check (
    status in ('draft', 'sent', 'negotiating', 'accepted', 'sold', 'expired', 'lost')
  ),
  constraint quotations_subtotal_non_negative check (subtotal >= 0),
  constraint quotations_total_non_negative check (total >= 0),
  constraint quotations_delivery_status_valid check (
    delivery_status in ('pending', 'immediate', 'from_cedis', 'insufficient')
  ),
  constraint quotations_observations_not_blank check (
    observations is null or trim(observations) <> ''
  )
);

comment on table public.quotations is
  'Quotation anchored to a store branch with unique folio per org (D-V01/D-V02).';
comment on column public.quotations.folio is
  'Unique folio per organization (e.g. COT-YYYY-NNNN); generated server-side in the use case (D-V02, SV-26).';
comment on column public.quotations.branch_id is
  'Store branch (branch_type=store). The quotation is per sales floor, not per warehouse (D-V01).';
comment on column public.quotations.status is
  'draft | sent | negotiating | accepted | sold | expired | lost. Transitions validated in the use case (D-V07).';
comment on column public.quotations.subtotal is
  'Sum of quotation line totals; recalculated from the items (D-V08).';
comment on column public.quotations.total is
  'Total = subtotal (no IVA in F4, D-V08).';
comment on column public.quotations.valid_until is
  'Offer validity; default 30 days configurable per org at creation (D-V08).';
comment on column public.quotations.delivery_status is
  'pending | immediate | from_cedis | insufficient. Deterministic from reported existence (D-V09); no promised date stored.';
comment on column public.quotations.observations is
  'Free text observations; blank value normalized.';

create unique index quotations_organization_id_unique on public.quotations (organization_id, id);
create unique index quotations_org_folio_unique on public.quotations (organization_id, upper(trim(folio)));
create index quotations_org_branch_status_idx on public.quotations (organization_id, branch_id, status);
create index quotations_org_seller_created_idx on public.quotations (organization_id, seller_id, created_at desc);

-- ============================================================
-- 3. Table: quotation_items
-- Quotation lines. variant_id/sale_unit_id reference the exact 1C catalog
-- (D-V04). reference_price/pieces_per_box/square_meters_per_box are a SNAPSHOT
-- of the catalog at quoting time so the quotation is immutable historically
-- (D-V04). Stock is never persisted here: the line only reads reported
-- existence from 1D with its date (D-V13). complement_of_id links an item to a
-- base item (alternatives, max 3 validated in the use case, D-V02/D-V10).
-- ============================================================
create table public.quotation_items (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null,
  quotation_id           uuid not null,
  variant_id             uuid not null,
  sale_unit_id           uuid not null,
  reference_price        numeric(14,4),
  base_units_per_sale_unit numeric not null default 1,
  pieces_per_box         numeric,
  square_meters_per_box  numeric,
  area_square_meters     numeric,
  waste_percent          numeric,
  box_quantity           numeric,
  unit_price             numeric(14,4),
  line_total             numeric(14,2) not null default 0,
  complement_of_id       uuid,
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint quotation_items_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint quotation_items_organization_id_unique unique (organization_id, id),
  constraint quotation_items_quotation_organization_fk foreign key (organization_id, quotation_id)
    references public.quotations (organization_id, id),
  constraint quotation_items_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint quotation_items_sale_unit_organization_fk foreign key (organization_id, sale_unit_id)
    references public.units_of_measure (organization_id, id),
  constraint quotation_items_complement_organization_fk foreign key (organization_id, complement_of_id)
    references public.quotation_items (organization_id, id),
  constraint quotation_items_reference_price_non_negative check (
    reference_price is null or reference_price >= 0
  ),
  constraint quotation_items_base_units_positive check (base_units_per_sale_unit > 0),
  constraint quotation_items_pieces_per_box_positive check (
    pieces_per_box is null or pieces_per_box > 0
  ),
  constraint quotation_items_square_meters_positive check (
    square_meters_per_box is null or square_meters_per_box > 0
  ),
  constraint quotation_items_area_non_negative check (
    area_square_meters is null or area_square_meters >= 0
  ),
  constraint quotation_items_waste_percent_valid check (
    waste_percent is null or (waste_percent >= 0 and waste_percent <= 100)
  ),
  constraint quotation_items_box_quantity_positive check (
    box_quantity is null or box_quantity > 0
  ),
  constraint quotation_items_unit_price_non_negative check (
    unit_price is null or unit_price >= 0
  ),
  constraint quotation_items_line_total_non_negative check (line_total >= 0)
);

comment on table public.quotation_items is
  'Quotation lines with a snapshot of the 1C price/coverage (D-V04). Stock is never stored here (D-V13).';
comment on column public.quotation_items.variant_id is
  'Exact sellable variant from the 1C catalog (D-V04); never invents product.';
comment on column public.quotation_items.reference_price is
  'Snapshot of the 1C reference price at quoting time (numeric(14,4)); NULL = not confirmed in 1C (D-V04/D-V16).';
comment on column public.quotation_items.base_units_per_sale_unit is
  'Snapshot of base units per sale unit (1C, D-V04).';
comment on column public.quotation_items.pieces_per_box is
  'Snapshot of pieces per box (1C, D-V04); NULL = not a closed box.';
comment on column public.quotation_items.square_meters_per_box is
  'Snapshot of square meters per box (1C, D-V04/D-V09); drives box_quantity = ceil(...).';
comment on column public.quotation_items.box_quantity is
  'Required boxes, rounded UP (ceil, D-V09); fractions of a closed box are never sold.';
comment on column public.quotation_items.complement_of_id is
  'Links this item as complement/alternative of a base item; max 3 validated in the use case (D-V02/D-V10).';

create index quotation_items_org_quotation_sort_idx on public.quotation_items (organization_id, quotation_id, sort_order);
create index quotation_items_org_variant_idx on public.quotation_items (organization_id, variant_id);
create index quotation_items_org_complement_idx on public.quotation_items (organization_id, complement_of_id);

-- ============================================================
-- 4. Table: manual_sale_entries
-- Daily manual capture resolved from DailySellerSales vs manual_sale (D-V02):
-- one aggregate per seller/branch/day (D-V07). tickets_count is the integer
-- counter (tickets_del_dia); no ticket entity in F4. A correction by the
-- manager is an UPDATE that writes previous/new into _audit.sales_events
-- (D-V14). Seller/month totals feed budgets and indicators (derived, D-V11).
-- ============================================================
create table public.manual_sale_entries (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  seller_id      uuid not null,
  branch_id      uuid not null,
  sale_date      date not null,
  sales_amount   numeric(14,2) not null default 0,
  tickets_count  integer not null default 0,
  returns_amount numeric(14,2) not null default 0,
  comment        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint manual_sale_entries_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint manual_sale_entries_seller_fk foreign key (seller_id)
    references public.profiles (id),
  constraint manual_sale_entries_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint manual_sale_entries_sales_amount_non_negative check (sales_amount >= 0),
  constraint manual_sale_entries_tickets_count_non_negative check (tickets_count >= 0),
  constraint manual_sale_entries_returns_non_negative check (returns_amount >= 0),
  constraint manual_sale_entries_comment_not_blank check (
    comment is null or trim(comment) <> ''
  )
);

comment on table public.manual_sale_entries is
  'Daily manual sale capture: one aggregate per seller/branch/day (D-V02/D-V07).';
comment on column public.manual_sale_entries.sale_date is
  'Date of the captured sales (date only).';
comment on column public.manual_sale_entries.sales_amount is
  'Total sales of the day (numeric(14,2), >= 0).';
comment on column public.manual_sale_entries.tickets_count is
  'tickets_del_dia integer counter; the ticket entity is not modeled in F4 (D-V02).';
comment on column public.manual_sale_entries.returns_amount is
  'Returns/refunds of the day (>= 0).';
comment on column public.manual_sale_entries.comment is
  'Optional note; blank value normalized.';

create unique index manual_sale_entries_organization_id_unique on public.manual_sale_entries (organization_id, id);
create unique index manual_sale_entries_org_seller_branch_date_unique
  on public.manual_sale_entries (organization_id, seller_id, branch_id, sale_date);
create index manual_sale_entries_org_branch_date_idx on public.manual_sale_entries (organization_id, branch_id, sale_date);

-- ============================================================
-- 5. Table: sales_budgets
-- Monthly budget per store (seller_id NULL) and per seller (D-V11). Indicators
-- (accumulated, %, shortfall, required sale/day, projection) are DERIVED from
-- manual_sale_entries + budget; never stored. status='archived' soft-retires a
-- budget (no DELETE). Period format YYYY-MM.
-- ============================================================
create table public.sales_budgets (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id      uuid not null,
  seller_id      uuid,
  period         text not null,
  amount         numeric(14,2) not null,
  status         text not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint sales_budgets_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint sales_budgets_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint sales_budgets_seller_fk foreign key (seller_id)
    references public.profiles (id),
  constraint sales_budgets_period_valid check (
    period ~ '^\d{4}-(0[1-9]|1[0-2])$'
  ),
  constraint sales_budgets_amount_non_negative check (amount >= 0),
  constraint sales_budgets_status_valid check (status in ('active', 'archived'))
);

comment on table public.sales_budgets is
  'Monthly budget per store and per seller (D-V11); indicators are derived, never stored.';
comment on column public.sales_budgets.seller_id is
  'NULL = store budget; set = per-seller budget (D-V11).';
comment on column public.sales_budgets.period is
  'Monthly period in YYYY-MM format.';
comment on column public.sales_budgets.status is
  'active | archived. archived leaves the budget out of active queries; no physical DELETE (D-V14).';

create unique index sales_budgets_organization_id_unique on public.sales_budgets (organization_id, id);
create unique index sales_budgets_org_branch_period_unique
  on public.sales_budgets (organization_id, branch_id, period) where seller_id is null;
create unique index sales_budgets_org_seller_period_unique
  on public.sales_budgets (organization_id, seller_id, period);
create index sales_budgets_org_branch_period_status_idx
  on public.sales_budgets (organization_id, branch_id, period, status);

-- ============================================================
-- 6. Table: cedis_requests
-- Minimal CEDIS request tied to a quotation (D-V06). F4 only registers the
-- request with status 'requested'; accept/modify/reject response, chat and
-- balancing are Phase 7. required_date is informative; no delivery promise.
-- ============================================================
create table public.cedis_requests (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null,
  quotation_id       uuid,
  variant_id         uuid not null,
  requested_quantity numeric not null,
  requested_date     date not null,
  required_date      date,
  status             text not null default 'requested',
  seller_id          uuid not null,
  branch_id          uuid not null,
  observations       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint cedis_requests_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint cedis_requests_quotation_organization_fk foreign key (organization_id, quotation_id)
    references public.quotations (organization_id, id),
  constraint cedis_requests_variant_organization_fk foreign key (organization_id, variant_id)
    references public.product_variants (organization_id, id),
  constraint cedis_requests_seller_fk foreign key (seller_id)
    references public.profiles (id),
  constraint cedis_requests_branch_organization_fk foreign key (organization_id, branch_id)
    references public.branches (organization_id, id),
  constraint cedis_requests_quantity_positive check (requested_quantity > 0),
  constraint cedis_requests_status_valid check (
    status in ('requested', 'accepted', 'modified', 'rejected', 'cancelled')
  ),
  constraint cedis_requests_observations_not_blank check (
    observations is null or trim(observations) <> ''
  )
);

comment on table public.cedis_requests is
  'Minimal CEDIS request tied to a quotation (D-V06). Response/chat/balancing are Phase 7.';
comment on column public.cedis_requests.quotation_id is
  'Quotation that originated the request (D-V06); nullable standalone request.';
comment on column public.cedis_requests.requested_quantity is
  'Requested quantity (> 0).';
comment on column public.cedis_requests.status is
  'requested | accepted | modified | rejected | cancelled. F4 only creates with requested (D-V06).';
comment on column public.cedis_requests.required_date is
  'Informative date required by the customer; no delivery promise (D-V09).';

create unique index cedis_requests_organization_id_unique on public.cedis_requests (organization_id, id);
create index cedis_requests_org_quotation_idx on public.cedis_requests (organization_id, quotation_id);
create index cedis_requests_org_variant_idx on public.cedis_requests (organization_id, variant_id);

-- ============================================================
-- 7. Table: _audit.sales_events
-- Append-only application audit log for sales mutations (D-V14, pattern
-- _audit.layout_events/inventory_events/catalog_events). Corrections keep
-- previous_data/new_data. Written by the use cases (createQuotation,
-- editQuotation, sendQuotation, markQuotationSold, captureManualSale,
-- correctManualSale, configureBudget, createCedisRequest); never updated or
-- deleted.
-- ============================================================
create table _audit.sales_events (
  id              uuid primary key default gen_random_uuid(),
  occurred_at     timestamptz not null default now(),
  actor_user_id   uuid not null,
  organization_id uuid not null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid not null,
  previous_data   jsonb,
  new_data        jsonb,
  detail          text not null default '',
  constraint sales_events_organization_fk foreign key (organization_id)
    references public.organizations (id),
  constraint sales_events_actor_user_fk foreign key (actor_user_id)
    references public.profiles (id),
  constraint sales_events_action_valid check (
    action in (
      'quotation_created', 'quotation_edited', 'quotation_sent',
      'quotation_accepted', 'quotation_sold', 'quotation_lost',
      'quotation_duplicated', 'manual_sale_registered',
      'manual_sale_corrected', 'sales_budget_configured', 'cedis_request_created'
    )
  ),
  constraint sales_events_entity_type_valid check (
    entity_type in (
      'customer', 'quotation', 'quotation_item',
      'manual_sale_entry', 'sales_budget', 'cedis_request'
    )
  ),
  constraint sales_events_detail_not_blank check (detail is not null)
);

comment on table _audit.sales_events is
  'Append-only application audit log for sales mutations (D-V14). Never updated or deleted.';
comment on column _audit.sales_events.action is
  'quotation_created | quotation_edited | quotation_sent | quotation_accepted | quotation_sold | quotation_lost | quotation_duplicated | manual_sale_registered | manual_sale_corrected | sales_budget_configured | cedis_request_created.';
comment on column _audit.sales_events.actor_user_id is
  'Acting user (profile id, JWT sub). Written by the use cases (D-V14).';
comment on column _audit.sales_events.entity_type is
  'customer | quotation | quotation_item | manual_sale_entry | sales_budget | cedis_request.';
comment on column _audit.sales_events.previous_data is
  'Previous row values on a correction (manual_sale_corrected, D-V14).';
comment on column _audit.sales_events.new_data is
  'New row values on a correction (manual_sale_corrected, D-V14).';
comment on column _audit.sales_events.detail is
  'Short human-readable summary of the audited mutation.';

create unique index sales_events_organization_id_unique on _audit.sales_events (organization_id, id);
create index sales_events_organization_entity_idx
  on _audit.sales_events (organization_id, entity_type, entity_id, occurred_at desc);
create index sales_events_organization_occurred_idx
  on _audit.sales_events (organization_id, occurred_at desc);

-- ============================================================
-- 8. updated_at triggers (only on mutable tables; _audit.sales_events is
-- append-only and intentionally has no updated_at)
-- ============================================================
select _core.set_updated_at_column('customers');
select _core.set_updated_at_column('quotations');
select _core.set_updated_at_column('quotation_items');
select _core.set_updated_at_column('manual_sale_entries');
select _core.set_updated_at_column('sales_budgets');
select _core.set_updated_at_column('cedis_requests');

-- ============================================================
-- 9. Enable RLS (no FORCE, documented D20)
-- ============================================================
alter table public.customers enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.manual_sale_entries enable row level security;
alter table public.sales_budgets enable row level security;
alter table public.cedis_requests enable row level security;
alter table _audit.sales_events enable row level security;

-- ============================================================
-- 10. Allowlist policies (F4_RLS_PERMISSION_MATRIX §4; no DELETE anywhere)
-- Common rule: a seller sees her own rows (seller_id/assigned_seller_id =
-- current user) unless she holds sales.edit_all. Store scoping of the manager
-- is a documented follow-up with RBAC user_store_role (open question §5).
-- ============================================================

-- ---- customers: SELECT read; INSERT/UPDATE quote; no DELETE ---------------
create policy customers_select_org on public.customers
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
    and (
      assigned_seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  );

create policy customers_insert_quote on public.customers
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and assigned_seller_id = _access.current_user_id()
  );

create policy customers_update_quote on public.customers
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and (
      assigned_seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
  );

-- ---- quotations: SELECT read; INSERT/UPDATE quote; no DELETE --------------
create policy quotations_select_org on public.quotations
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
    and (
      seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  );

create policy quotations_insert_quote on public.quotations
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and seller_id = _access.current_user_id()
  );

create policy quotations_update_quote on public.quotations
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and (
      seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
  );

-- ---- quotation_items: SELECT/INSERT/UPDATE quote; no DELETE ---------------
-- "cotización propia" is resolved through the parent quotation (the policies on
-- quotations never reference quotation_items, so there is no recursion).
create policy quotation_items_select_org on public.quotation_items
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
    and (
      exists (
        select 1 from public.quotations q
        where q.organization_id = quotation_items.organization_id
          and q.id = quotation_items.quotation_id
          and q.seller_id = _access.current_user_id()
      )
      or _access.has_permission('sales.edit_all')
    )
  );

create policy quotation_items_insert_quote on public.quotation_items
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and (
      exists (
        select 1 from public.quotations q
        where q.organization_id = quotation_items.organization_id
          and q.id = quotation_items.quotation_id
          and q.seller_id = _access.current_user_id()
      )
      or _access.has_permission('sales.edit_all')
    )
  );

create policy quotation_items_update_quote on public.quotation_items
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
    and (
      exists (
        select 1 from public.quotations q
        where q.organization_id = quotation_items.organization_id
          and q.id = quotation_items.quotation_id
          and q.seller_id = _access.current_user_id()
      )
      or _access.has_permission('sales.edit_all')
    )
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.quote')
  );

-- ---- manual_sale_entries: SELECT read; INSERT capture_own; UPDATE edit_all
-- (correction with history); no DELETE --------------------------------------
create policy manual_sale_entries_select_org on public.manual_sale_entries
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
    and (
      seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  );

create policy manual_sale_entries_insert_capture_own on public.manual_sale_entries
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.capture_own')
    and seller_id = _access.current_user_id()
  );

create policy manual_sale_entries_update_edit_all on public.manual_sale_entries
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.edit_all')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.edit_all')
  );

-- ---- sales_budgets: SELECT read; INSERT/UPDATE budget_manage; no DELETE ---
create policy sales_budgets_select_org on public.sales_budgets
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
  );

create policy sales_budgets_insert_manage on public.sales_budgets
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.budget_manage')
  );

create policy sales_budgets_update_manage on public.sales_budgets
  for update to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.budget_manage')
  )
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.budget_manage')
  );

-- ---- cedis_requests: SELECT read; INSERT cedis_request; no UPDATE/DELETE --
create policy cedis_requests_select_org on public.cedis_requests
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
    and (
      seller_id = _access.current_user_id()
      or _access.has_permission('sales.edit_all')
    )
  );

create policy cedis_requests_insert_request on public.cedis_requests
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.cedis_request')
    and seller_id = _access.current_user_id()
  );

-- ---- _audit.sales_events: SELECT read; INSERT any sales operation ---------
create policy sales_events_select_org on _audit.sales_events
  for select to authenticated
  using (
    organization_id = any(_access.current_organization_ids())
    and _access.has_permission('sales.read')
  );

create policy sales_events_insert_authorized on _audit.sales_events
  for insert to authenticated
  with check (
    organization_id = any(_access.current_organization_ids())
    and (
      _access.has_permission('sales.quote')
      or _access.has_permission('sales.capture_own')
      or _access.has_permission('sales.edit_all')
      or _access.has_permission('sales.budget_manage')
      or _access.has_permission('sales.cedis_request')
    )
  );

-- ============================================================
-- 11. Minimal grants (D18: grants == policies; no DELETE grants)
-- ============================================================
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.quotations to authenticated;
grant select, insert, update on public.quotation_items to authenticated;
grant select, insert, update on public.manual_sale_entries to authenticated;
grant select, insert, update on public.sales_budgets to authenticated;
grant select, insert on public.cedis_requests to authenticated;

grant select, insert on _audit.sales_events to authenticated;

-- ============================================================
-- 12. Re-affirm zero access for anon/service_role/PUBLIC (D17)
-- ============================================================
revoke all on table public.customers, public.quotations, public.quotation_items,
  public.manual_sale_entries, public.sales_budgets, public.cedis_requests,
  _audit.sales_events from public;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.customers, public.quotations, public.quotation_items, public.manual_sale_entries, public.sales_budgets, public.cedis_requests, _audit.sales_events from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

reset all;

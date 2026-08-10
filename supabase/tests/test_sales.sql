-- PGadm — Sales Tests (Phase 4.2)
-- Verifies migration 00000000000012 (6 public tables, _audit.sales_events,
-- composite org-scoped FKs to branches/customers/quotations/product_variants/
-- units_of_measure/profiles, allowlist RLS deny-by-default, minimal grants,
-- no DELETE) and the sales demo fixtures in supabase/seed.sql (decisions
-- D-V01..D-V14, test plan SV-1..SV-8, SV-33..SV-45, SV-47 at DB level).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql: org PGM (10000000-...), store branch NOG
-- (10000000-...-002), catalog variants 051/052/053, profiles 001 (user_A,
-- manager@NOG) / 003 (user_X, cashier@NOG) / 002 (user_B, operator@Demo-B) /
-- 006 (admin_PGM), 3 customers, 2 quotations with 5 items, 3 manual captures,
-- 3 budgets and 1 CEDIS request (B0000000-... range).
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15 (migration 004 bootstraps
-- anon/authenticated/service_role roles there; CI applies seed too).

begin;
select plan(136);

-- ============================================================
-- Phase A: structure, policies, grants (as postgres)
-- ============================================================

-- SV-1: 6 sales tables exist, RLS enabled, FORCE off (D20)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r' and c.relrowsecurity), 6,
  'RLS enabled on all 6 sales tables (SV-1)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r' and not c.relforcerowsecurity), 6,
  'FORCE RLS off on all 6 sales tables (D20, owner seed keeps working)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'sales_events' and c.relkind = 'r'
     and c.relrowsecurity), 1,
  'RLS enabled on _audit.sales_events (SV-7)');

-- Allowlist policy counts (F4_RLS_PERMISSION_MATRIX §4): 3+3+3+3+3+2 = 17
select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
   and tablename in ('customers','quotations','quotation_items',
                     'manual_sale_entries','sales_budgets','cedis_requests')),
  17, 'exactly 17 sales allowlist policies (3+3+3+3+3+2)');

select is(
  (select count(*)::int from pg_policies where schemaname = '_audit'
   and tablename = 'sales_events'), 2,
  'exactly 2 sales_events policies (select/insert)');

select is(
  (select array_agg(distinct r.rolname::text order by r.rolname::text)
   from pg_policies p join lateral unnest(p.roles) as r(rolname) on true
   where (p.schemaname = 'public'
     and p.tablename in ('customers','quotations','quotation_items',
                         'manual_sale_entries','sales_budgets','cedis_requests'))
      or (p.schemaname = '_audit' and p.tablename = 'sales_events')),
  array['authenticated'], 'all sales policies target authenticated only (D17)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('customers','quotations','quotation_items',
                       'manual_sale_entries','sales_budgets','cedis_requests')
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive USING(true)/WITH CHECK(true) sales policy (ACC-21)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = '_audit' and tablename = 'sales_events'
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive sales_events policy (ACC-21)');

-- Grants == policies (D18); no DELETE anywhere (SV-44)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'select')), 6,
  'authenticated can select all 6 sales tables (D18)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'insert')), 6,
  'authenticated has insert on all 6 sales tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'update')), 5,
  'authenticated has update on 5 sales tables (cedis_requests is create-only in F4, D-V06)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')), 0,
  'authenticated has NO delete on any sales table (SV-44)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('service_role', c.oid, 'select'))), 0,
  'anon/service_role have no select on any sales table (D17)');

-- _audit.sales_events append-only grants (SV-7)
select is(
  (select has_table_privilege('authenticated', '_audit.sales_events', 'select')), true,
  'authenticated can select _audit.sales_events');

select is(
  (select has_table_privilege('authenticated', '_audit.sales_events', 'insert')), true,
  'authenticated can insert _audit.sales_events');

select is(
  (select has_table_privilege('authenticated', '_audit.sales_events', 'update')), false,
  'authenticated has no update on _audit.sales_events (append-only, SV-7)');

select is(
  (select has_table_privilege('authenticated', '_audit.sales_events', 'delete')), false,
  'authenticated has no delete on _audit.sales_events (append-only, SV-7)');

-- SV-1: UNIQUE(organization_id, id) on the 6 sales tables + _audit.sales_events
select is(
  (select count(*)::int from pg_index i
   join pg_class t on t.oid = i.indrelid
   join pg_namespace n on n.oid = t.relnamespace
   where ((n.nspname = 'public' and t.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests'))
       or (n.nspname = '_audit' and t.relname = 'sales_events'))
      and i.indisunique and i.indexrelid::regclass::text in (
        'customers_organization_id_unique',
        'quotations_organization_id_unique',
        'quotation_items_organization_id_unique',
        'manual_sale_entries_organization_id_unique',
        'sales_budgets_organization_id_unique',
        'cedis_requests_organization_id_unique',
        '_audit.sales_events_organization_id_unique')), 7,
  'UNIQUE(organization_id, id) on all 7 sales tables (composite FK targets, SV-1)');

-- SV-3: folio unique per org
select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.quotations_org_folio_unique'::regclass
     and i.indisunique), 1,
  'folio unique per organization (SV-3)');

-- SV-5: one manual capture per seller/branch/day
select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.manual_sale_entries_org_seller_branch_date_unique'::regclass
     and i.indisunique), 1,
  'one manual capture per seller/branch/day (SV-5)');

-- SV-6: one store budget per month + one seller budget per month
select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.sales_budgets_org_branch_period_unique'::regclass
     and i.indisunique and i.indpred is not null), 1,
  'one store budget per month (partial unique, SV-6)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.sales_budgets_org_seller_period_unique'::regclass
     and i.indisunique), 1,
  'one seller budget per month (SV-6)');

-- SV-42: updated_at triggers on the 6 mutable tables only
select is(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'customers','quotations','quotation_items','manual_sale_entries',
     'sales_budgets','cedis_requests')
     and not t.tgisinternal and t.tgname like '%_updated_at'), 6,
  'updated_at trigger on all 6 mutable sales tables (SV-42)');

-- Composite org-scoped FKs (SV-2/SV-4/SV-38)
select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotations_branch_organization_fk' and contype = 'f'), 1,
  'quotation anchored to a branch with composite org-scoped FK (SV-2)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotations_customer_organization_fk' and contype = 'f'), 1,
  'quotation customer composite FK to customers');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotation_items_quotation_organization_fk' and contype = 'f'), 1,
  'quotation items composite FK to quotations');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotation_items_variant_organization_fk' and contype = 'f'), 1,
  'quotation items composite FK to 1C product_variants (SV-4)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotation_items_sale_unit_organization_fk' and contype = 'f'), 1,
  'quotation items composite FK to 1C units_of_measure (SV-4)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'quotation_items_complement_organization_fk' and contype = 'f'), 1,
  'quotation items self-complement composite FK');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'manual_sale_entries_branch_organization_fk' and contype = 'f'), 1,
  'manual capture composite FK to branches');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'sales_budgets_branch_organization_fk' and contype = 'f'), 1,
  'budget composite FK to branches');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'cedis_requests_quotation_organization_fk' and contype = 'f'), 1,
  'CEDIS request composite FK to quotations (D-V06)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'cedis_requests_variant_organization_fk' and contype = 'f'), 1,
  'CEDIS request composite FK to 1C product_variants');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'cedis_requests_branch_organization_fk' and contype = 'f'), 1,
  'CEDIS request composite FK to branches');

-- Seller/profile FKs (profiles are global, not org-scoped)
select is(
  (select count(*)::int from pg_constraint
   where conname in (
     'customers_assigned_seller_fk',
     'quotations_seller_fk',
     'manual_sale_entries_seller_fk',
     'sales_budgets_seller_fk',
     'cedis_requests_seller_fk',
     'sales_events_actor_user_fk') and contype = 'f'), 6,
  'seller/actor FKs point to profiles');

-- SV-47: sales NEVER write inventory/catalog: no FK references any inventory
-- table (snapshots/changes/observations) from the sales tables
select is(
  (select count(*)::int from pg_constraint c
   join pg_class rt on rt.oid = c.confrelid
   join pg_namespace rn on rn.oid = rt.relnamespace
   where c.contype = 'f' and c.conrelid in (
     'public.customers'::regclass, 'public.quotations'::regclass,
     'public.quotation_items'::regclass, 'public.manual_sale_entries'::regclass,
     'public.sales_budgets'::regclass, 'public.cedis_requests'::regclass)
     and rt.relname in ('inventory_snapshots','inventory_changes',
                        'inventory_observations')), 0,
  'no FK from sales tables into inventory tables (SV-47, D-V13)');

-- ============================================================
-- Phase B: sales demo fixtures (as postgres)
-- ============================================================

-- SV-41: sales.* permissions (6) exist and follow the D-V03 matrix (total 25)
select is((select count(*)::int from public.permissions where code like 'sales.%'), 6, 'seed defines 6 sales.* permissions (SV-41)');
select is((select count(*)::int from public.permissions), 25, 'total permissions = 25 (19 + 6 sales.*)');

select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000001' and p.code like 'sales.%'), 6, 'administrator role has all 6 sales permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000002' and p.code like 'sales.%'), 6, 'manager role has all 6 sales permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000003' and p.code like 'sales.%'), 4, 'cashier role has sales.read/quote/capture_own/cedis_request');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000004' and p.code like 'sales.%'), 1, 'operator role has sales.read only');

-- Customers fixtures (D-V01/D-V02)
select is((select count(*)::int from public.customers), 3, 'PGM has 3 demo customers');
select is((select count(*)::int from public.customers where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'no customers in Demo B (org isolation)');
select is((select assigned_seller_id from public.customers where id = 'B0000000-0000-0000-0000-000000000001'), '30000000-0000-0000-0000-000000000003'::uuid, 'customer 001 assigned to cashier user_X');

-- Quotations fixtures (D-V07/D-V08)
select is((select count(*)::int from public.quotations), 2, 'PGM has 2 demo quotations');
select is((select array_agg(folio order by folio) from public.quotations), array['COT-2026-0001','COT-2026-0002'], 'demo folios COT-2026-0001/COT-2026-0002');
select is((select status from public.quotations where id = 'B0000000-0000-0000-0000-000000000012'), 'draft', 'quotation 012 is a draft');
select is((select b.branch_type from public.quotations q join public.branches b on b.id = q.branch_id and b.organization_id = q.organization_id where q.id = 'B0000000-0000-0000-0000-000000000011'), 'store', 'quotation anchored to a store branch (SV-2)');
select is((select q.total = q.subtotal from public.quotations q where q.id = 'B0000000-0000-0000-0000-000000000011'), true, 'total = subtotal (no IVA in F4, D-V08)');
select is((select delivery_status from public.quotations where id = 'B0000000-0000-0000-0000-000000000011'), 'immediate', 'quotation 011 delivery immediate (D-V09 demo)');

-- Quotation items fixtures (D-V04 snapshot)
select is((select count(*)::int from public.quotation_items), 5, 'PGM has 5 quotation items');
select is((select reference_price from public.quotation_items where id = 'B0000000-0000-0000-0000-000000000021'), 42.5000, 'item 021 snapshots variant 051 price (D-V04)');
select is((select reference_price from public.quotation_items where id = 'B0000000-0000-0000-0000-000000000022'), 1000.0000, 'item 022 snapshots variant 052 price');
select is((select base_units_per_sale_unit from public.quotation_items where id = 'B0000000-0000-0000-0000-000000000022'), 25::numeric, 'item 022 snapshots base units per sale unit');
select is((select count(*)::int from public.quotation_items where variant_id = '80000000-0000-0000-0000-000000000051'), 0, 'no item references a Demo-B variant (org isolation)');

-- Manual captures fixtures (D-V07)
select is((select count(*)::int from public.manual_sale_entries), 3, 'PGM has 3 demo manual captures');
select is((select count(distinct (seller_id, branch_id, sale_date))::int from public.manual_sale_entries), 3, 'captures are one per seller/branch/day (SV-5)');
select is((select tickets_count from public.manual_sale_entries where id = 'B0000000-0000-0000-0000-000000000031'), 18, 'capture 031 ticket counter = 18');

-- Budgets fixtures (D-V11)
select is((select count(*)::int from public.sales_budgets), 3, 'PGM has 3 demo budgets');
select is((select seller_id is null from public.sales_budgets where id = 'B0000000-0000-0000-0000-000000000041'), true, 'budget 041 is a store budget (seller NULL)');
select is((select bool_and(period ~ '^\d{4}-\d{2}$') from public.sales_budgets), true, 'all budget periods are YYYY-MM (SV-8)');

-- CEDIS request fixtures (D-V06)
select is((select count(*)::int from public.cedis_requests), 1, 'PGM has 1 demo CEDIS request');
select is((select status from public.cedis_requests), 'requested', 'CEDIS request starts in requested (D-V06)');
select is((select quotation_id from public.cedis_requests), 'B0000000-0000-0000-0000-000000000012'::uuid, 'CEDIS request tied to quotation 012');

-- Audit fixtures (SV-45)
select is((select count(*)::int from _audit.sales_events), 2, 'PGM has 2 demo audit events');
select is((select previous_data is not null from _audit.sales_events where id = 'B0000000-0000-0000-0000-000000000062'), true, 'manual_sale_corrected keeps previous_data (SV-45)');
select is((select new_data is not null from _audit.sales_events where id = 'B0000000-0000-0000-0000-000000000062'), true, 'manual_sale_corrected keeps new_data (SV-45)');

-- ============================================================
-- Phase C: RLS behavior + permission-gated writes (authenticated)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- user_X (cashier@PGM: sales.read/quote/capture_own/cedis_request, no edit_all)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
select is((select count(*)::int from public.customers), 2, 'cashier sees only her own customers (SV-34)');
select is((select count(*)::int from public.customers where id = 'B0000000-0000-0000-0000-000000000003'), 0, 'cashier cannot see a customer assigned to another seller (SV-34)');
select is((select count(*)::int from public.quotations), 2, 'cashier sees her own quotations (SV-34)');
select is((select count(*)::int from public.manual_sale_entries), 2, 'cashier sees only her own manual captures (SV-34)');
select is((select count(*)::int from public.sales_budgets), 3, 'cashier reads all budgets of own org (no ownership rule)');
select is((select count(*)::int from public.cedis_requests), 1, 'cashier sees her own CEDIS requests (SV-34)');
select lives_ok('insert into public.customers (organization_id, name, phone, whatsapp, assigned_seller_id) values (''10000000-0000-0000-0000-000000000001'', ''Cliente Nuevo'', ''+52 844 000 0001'', null, ''30000000-0000-0000-0000-000000000003'')', 'cashier creates a customer assigned to herself (sales.quote)');
select is((select count(*)::int from public.customers), 3, 'cashier customer persisted');
select throws_ok('insert into public.customers (organization_id, name, assigned_seller_id) values (''10000000-0000-0000-0000-000000000001'', ''Cliente Ajeno'', ''30000000-0000-0000-0000-000000000001'')', '42501'::character(5), NULL, 'cashier cannot create a customer assigned to another seller (WITH CHECK)');
select lives_ok('insert into public.quotations (organization_id, folio, seller_id, branch_id, status, subtotal, total) values (''10000000-0000-0000-0000-000000000001'', ''COT-2026-0999'', ''30000000-0000-0000-0000-000000000003'', ''10000000-0000-0000-0000-000000000002'', ''draft'', 0, 0)', 'cashier creates a quotation as herself (sales.quote)');
select lives_ok('insert into public.manual_sale_entries (organization_id, seller_id, branch_id, sale_date, sales_amount) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000003'', ''10000000-0000-0000-0000-000000000002'', ''2026-08-07'', 500.00)', 'cashier captures her own daily sale (sales.capture_own)');
select lives_ok('insert into public.cedis_requests (organization_id, variant_id, requested_quantity, requested_date, seller_id, branch_id) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', 5, ''2026-08-07'', ''30000000-0000-0000-0000-000000000003'', ''10000000-0000-0000-0000-000000000002'')', 'cashier creates a CEDIS request (sales.cedis_request, D-V06)');
select throws_ok('insert into public.sales_budgets (organization_id, branch_id, period, amount) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000002'', ''2026-09'', 100000.00)', '42501'::character(5), NULL, 'cashier cannot configure budgets without sales.budget_manage (SV-37)');
select lives_ok('update public.manual_sale_entries set returns_amount = 0 where id = ''B0000000-0000-0000-0000-000000000032''', 'cashier attempts to correct her own capture (only edit_all may)');
select is((select returns_amount from public.manual_sale_entries where id = 'B0000000-0000-0000-0000-000000000032'), 320.00, 'cashier cannot correct any capture (correction requires sales.edit_all, SV-30)');
select throws_ok('update public.cedis_requests set status = ''accepted'' where id = ''B0000000-0000-0000-0000-000000000051''', '42501'::character(5), NULL, 'CEDIS request cannot be updated in F4 (no grant, D-V06)');
select throws_ok('delete from public.quotations where id = ''B0000000-0000-0000-0000-000000000011''', '42501'::character(5), NULL, 'no physical delete on quotations (SV-44)');

-- user_A (manager@PGM: sales.* all 6, sales.edit_all)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is((select count(*)::int from public.customers), 4, 'manager sees all customers (incl. the one created by the cashier, sales.edit_all, SV-35)');
select is((select count(*)::int from public.quotations), 3, 'manager sees all quotations (incl. own inserted by cashier, SV-35)');
select is((select count(*)::int from public.manual_sale_entries), 4, 'manager sees all manual captures (SV-35)');
select lives_ok('update public.manual_sale_entries set returns_amount = 250.00 where id = ''B0000000-0000-0000-0000-000000000032''', 'manager corrects a capture with sales.edit_all (SV-30)');
select is((select returns_amount from public.manual_sale_entries where id = 'B0000000-0000-0000-0000-000000000032'), 250.00, 'manager correction persisted');
select lives_ok('insert into _audit.sales_events (actor_user_id, organization_id, action, entity_type, entity_id, previous_data, new_data, detail) values (''30000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000001'', ''manual_sale_corrected'', ''manual_sale_entry'', ''B0000000-0000-0000-0000-000000000032'', ''{"returns_amount":320.00}''::jsonb, ''{"returns_amount":250.00}''::jsonb, ''Corrección de prueba'')', 'manager appends the correction audit event (SV-45)');
select lives_ok('insert into public.sales_budgets (organization_id, branch_id, period, amount) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000002'', ''2026-09'', 100000.00)', 'manager configures a budget (sales.budget_manage, SV-32)');

-- user_B (operator@Demo-B: sales.read only, org Demo-B)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is((select count(*)::int from public.quotations), 0, 'operator sees zero PGM quotation rows (org isolation, SV-38)');
select throws_ok('insert into public.quotations (organization_id, folio, seller_id, branch_id, status, subtotal, total) values (''10000000-0000-0000-0000-000000000001'', ''COT-2026-0998'', ''30000000-0000-0000-0000-000000000002'', ''10000000-0000-0000-0000-000000000002'', ''draft'', 0, 0)', '42501'::character(5), NULL, 'operator cannot insert a quotation without sales.quote (SV-36)');
select throws_ok('insert into public.customers (organization_id, name, assigned_seller_id) values (''10000000-0000-0000-0000-000000000001'', ''Cliente Foráneo'', ''30000000-0000-0000-0000-000000000002'')', '42501'::character(5), NULL, 'operator cannot insert a customer without sales.quote (SV-36)');
select throws_ok('insert into public.manual_sale_entries (organization_id, seller_id, branch_id, sale_date, sales_amount) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000002'', ''10000000-0000-0000-0000-000000000002'', ''2026-08-08'', 100.00)', '42501'::character(5), NULL, 'operator cannot capture without sales.capture_own (SV-37)');
select throws_ok('insert into public.sales_budgets (organization_id, branch_id, period, amount) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000002'', ''2026-09'', 1.00)', '42501'::character(5), NULL, 'operator cannot configure budgets without sales.budget_manage (SV-37)');
select throws_ok('insert into public.cedis_requests (organization_id, variant_id, requested_quantity, requested_date, seller_id, branch_id) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', 1, ''2026-08-08'', ''30000000-0000-0000-0000-000000000002'', ''10000000-0000-0000-0000-000000000002'')', '42501'::character(5), NULL, 'operator cannot create a CEDIS request without sales.cedis_request (SV-37)');

-- read gate: without sales.read the cashier sees zero sales rows (SV-33)
select lives_ok('reset role', 'back to postgres');
select lives_ok('delete from public.role_permissions where role_id = ''40000000-0000-0000-0000-000000000003'' and permission_id = ''50000000-0000-0000-0000-000000000020''', 'temporarily revoke cashier sales.read');
select lives_ok('set local role authenticated', 'act as authenticated again');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier) without sales.read');
select is((select count(*)::int from public.quotations), 0, 'no sales.read -> cashier sees zero quotation rows (SV-33)');
select lives_ok('reset role', 'back to postgres');
select lives_ok('insert into public.role_permissions (role_id, permission_id) values (''40000000-0000-0000-0000-000000000003'', ''50000000-0000-0000-0000-000000000020'')', 'restore cashier sales.read');

-- SV-39: service_role has no sales grants (server-only)
select lives_ok('set local role service_role', 'act as service_role');
select throws_ok('select * from public.quotations', '42501'::character(5), NULL, 'service_role denied on quotations (SV-39)');
select lives_ok('reset role', 'back to postgres');

-- SV-40: _audit.sales_events cannot be updated/deleted by any role
select lives_ok('set local role authenticated', 'act as authenticated again');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM (administrator)');
select throws_ok('update _audit.sales_events set detail = ''Hacked'' where id = ''B0000000-0000-0000-0000-000000000061''', '42501'::character(5), NULL, 'audit event cannot be updated by any role (SV-40)');
select throws_ok('delete from _audit.sales_events where id = ''B0000000-0000-0000-0000-000000000061''', '42501'::character(5), NULL, 'audit event cannot be deleted by any role (SV-40)');
select lives_ok('reset role', 'back to postgres');

-- ============================================================
-- Phase D: integrity rules (as postgres; runs last so the phases above
-- see the clean seed fixtures)
-- ============================================================

-- SV-43: CHECK btrim() <> '' on mandatory text
select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', '   ', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
$sql$, '23514'::character(5), NULL, 'blank folio rejected (SV-43)');

select throws_ok($sql$
  insert into public.customers (organization_id, name)
  values ('10000000-0000-0000-0000-000000000001', '  ')
$sql$, '23514'::character(5), NULL, 'blank customer name rejected (SV-43)');

-- SV-8: status/period CHECKs
select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id, status)
  values ('10000000-0000-0000-0000-000000000001', 'COT-2026-0901', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'drafting')
$sql$, '23514'::character(5), NULL, 'invalid quotation status rejected (SV-8)');

select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id, delivery_status)
  values ('10000000-0000-0000-0000-000000000001', 'COT-2026-0902', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'later')
$sql$, '23514'::character(5), NULL, 'invalid delivery_status rejected (SV-8)');

select throws_ok($sql$
  insert into public.sales_budgets (organization_id, branch_id, period, amount)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '2026-13', 100.00)
$sql$, '23514'::character(5), NULL, 'invalid budget period format rejected (SV-8)');

select throws_ok($sql$
  insert into public.sales_budgets (organization_id, branch_id, period, amount, status)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '2026-10', 100.00, 'open')
$sql$, '23514'::character(5), NULL, 'invalid budget status rejected (SV-8)');

select throws_ok($sql$
  insert into public.cedis_requests (organization_id, variant_id, requested_quantity, requested_date, status, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', 1, '2026-08-10', 'answered', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
$sql$, '23514'::character(5), NULL, 'invalid CEDIS status rejected (SV-8)');

select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id, subtotal)
  values ('10000000-0000-0000-0000-000000000001', 'COT-2026-0903', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', -1.00)
$sql$, '23514'::character(5), NULL, 'negative subtotal rejected');

select throws_ok($sql$
  insert into public.cedis_requests (organization_id, variant_id, requested_quantity, requested_date, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', 0, '2026-08-10', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
$sql$, '23514'::character(5), NULL, 'non-positive CEDIS quantity rejected');

select throws_ok($sql$
  insert into public.quotation_items (organization_id, quotation_id, variant_id, sale_unit_id, waste_percent)
  values ('10000000-0000-0000-0000-000000000001', 'B0000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000051', '70000000-0000-0000-0000-000000000001', 150)
$sql$, '23514'::character(5), NULL, 'waste_percent > 100 rejected (D-V02)');

-- SV-3: duplicate folio per org rejected
select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', 'cot-2026-0001', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
$sql$, '23505'::character(5), NULL, 'duplicate folio (case-insensitive) rejected (SV-3)');

-- SV-5: duplicate manual capture per seller/branch/day rejected
select throws_ok($sql$
  insert into public.manual_sale_entries (organization_id, seller_id, branch_id, sale_date)
  values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '2026-08-05')
$sql$, '23505'::character(5), NULL, 'duplicate capture for the same seller/branch/day rejected (SV-5)');

-- SV-6: duplicate budgets rejected (store month + seller month)
select throws_ok($sql$
  insert into public.sales_budgets (organization_id, branch_id, period, amount)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '2026-08', 1.00)
$sql$, '23505'::character(5), NULL, 'duplicate store budget for the month rejected (SV-6)');

select throws_ok($sql$
  insert into public.sales_budgets (organization_id, branch_id, seller_id, period, amount)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '2026-08', 1.00)
$sql$, '23505'::character(5), NULL, 'duplicate seller budget for the month rejected (SV-6)');

-- SV-38: cross-org references rejected by composite FKs
select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id, customer_id)
  values ('10000000-0000-0000-0000-000000000001', 'COT-2026-0904', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001')
$sql$, '23503'::character(5), NULL, 'quotation cannot reference a foreign customer (composite FK, SV-38)');

select throws_ok($sql$
  insert into public.quotation_items (organization_id, quotation_id, variant_id, sale_unit_id)
  values ('10000000-0000-0000-0000-000000000001', 'B0000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000051', '70000000-0000-0000-0000-000000000001')
$sql$, '23503'::character(5), NULL, 'quotation item cannot reference a Demo-B variant (composite FK, SV-38)');

select throws_ok($sql$
  insert into public.quotations (organization_id, folio, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', 'COT-2026-0905', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002')
$sql$, '23503'::character(5), NULL, 'quotation cannot anchor to a foreign branch (composite FK, SV-2)');

select throws_ok($sql$
  insert into public.cedis_requests (organization_id, variant_id, requested_quantity, requested_date, seller_id, branch_id)
  values ('10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000051', 1, '2026-08-10', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
$sql$, '23503'::character(5), NULL, 'CEDIS request cannot reference a Demo-B variant (composite FK, SV-38)');

-- audit event action CHECK (append-only, SV-45)
select throws_ok($sql$
  insert into _audit.sales_events (actor_user_id, organization_id, action, entity_type, entity_id)
  values ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'quotation_deleted', 'quotation', 'B0000000-0000-0000-0000-000000000011')
$sql$, '23514'::character(5), NULL, 'invalid audit action rejected (append-only, SV-45)');

select * from finish();
rollback;

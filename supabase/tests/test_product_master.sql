-- PGadm — Product Master Catalog Tests (1C.2)
-- Verifies migration 00000000000008 (schema _catalog, 7 tables, composite FKs,
-- functional case-insensitive uniques, lifecycle triggers, deny-by-default RLS)
-- and the catalog demo fixtures in supabase/seed.sql (decisions D-C01..D-C17).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql: orgs PGM + PGM-DEMO-B; units
-- PZA/M/M2/L/KG/CAJA; lines TUB/VAL/HER; brands MD-A/MD-B; categories
-- TUBERIA/TUB-PVC/TUB-PVC-PRES; products TUB-PVC-100 (70000000-...-041),
-- VAL-GLOBO-050 (70000000-...-042) and demo B (80000000-...-041), with
-- variants (70000000-...-051..053) and barcodes.
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15 (migration 004 bootstraps
-- anon/authenticated/service_role roles there; CI applies seed too).

begin;
select plan(78);

-- ============================================================
-- Phase A: structure, policies, grants, functions (as postgres)
-- ============================================================
select ok(exists (select 1 from pg_namespace where nspname = '_catalog'),
  'Schema _catalog should exist');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and c.relrowsecurity), 7,
  'RLS enabled on all 7 catalog tables (ACC-20 pattern)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and not c.relforcerowsecurity), 7,
  'FORCE RLS off on all 7 catalog tables (D20, owner seed keeps working)');

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
   and tablename in ('product_categories','product_brands','units_of_measure',
                     'product_lines','products','product_variants','product_barcodes')),
  21, 'exactly 21 catalog allowlist policies (3 per table)');

select is(
  (select array_agg(distinct r.rolname::text order by r.rolname::text)
   from pg_policies p join lateral unnest(p.roles) as r(rolname) on true
   where p.schemaname = 'public'
     and p.tablename in ('product_categories','product_brands','units_of_measure',
                         'product_lines','products','product_variants','product_barcodes')),
  array['authenticated'], 'all catalog policies target authenticated only (D17)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('product_categories','product_brands','units_of_measure',
                       'product_lines','products','product_variants','product_barcodes')
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive USING(true)/WITH CHECK(true) catalog policy (ACC-21)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'select')), 7,
  'authenticated can select all 7 catalog tables (D18)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'insert')), 7,
  'authenticated has insert on all 7 catalog tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'update')), 7,
  'authenticated has update on all 7 catalog tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')), 0,
  'authenticated has NO delete on any catalog table (D-C14)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes') and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('service_role', c.oid, 'select'))), 0,
  'anon/service_role have no select on any catalog table (D17)');

select is(
  (select count(*)::int from pg_index i
   join pg_class c on c.oid = i.indexrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories_organization_code_unique',
     'product_brands_organization_code_unique',
     'units_of_measure_organization_code_unique',
     'product_lines_organization_external_unique',
     'products_organization_external_unique',
     'product_variants_organization_sku_unique',
     'product_barcodes_organization_barcode_unique',
     'product_barcodes_organization_variant_primary_unique')
     and i.indisunique), 8,
  'all 8 functional/partial unique indexes exist');

select is(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories','product_brands','units_of_measure','product_lines',
     'products','product_variants','product_barcodes')
     and not t.tgisinternal and t.tgname like '%_updated_at'), 7,
  'all 7 catalog tables have an updated_at trigger');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = '_catalog' and p.proname in (
     'enforce_category_tree','enforce_product_active_variant',
     'enforce_last_active_variant','enforce_status_transition')), 4,
  'all 4 _catalog integrity functions exist');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = '_catalog' and p.proname in (
     'enforce_category_tree','enforce_product_active_variant',
     'enforce_last_active_variant','enforce_status_transition') and not p.prosecdef), 4,
  'all _catalog functions are SECURITY INVOKER');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = '_catalog' and p.proname in (
     'enforce_category_tree','enforce_product_active_variant',
     'enforce_last_active_variant','enforce_status_transition')
     and exists (select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
                 where cfg like 'search_path=%')), 4,
  'all _catalog functions lock search_path');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = '_catalog' and p.proname in (
     'enforce_category_tree','enforce_product_active_variant',
     'enforce_last_active_variant','enforce_status_transition')
     and has_function_privilege('public', p.oid, 'execute')), 0,
  'PUBLIC has no execute on _catalog functions');

-- ============================================================
-- Phase C: catalog demo fixtures (as postgres)
-- ============================================================
select is((select count(*)::int from public.units_of_measure where organization_id = '10000000-0000-0000-0000-000000000001'), 6, 'PGM has 6 units, one per kind (D-C05)');
select is((select array_agg(kind order by kind) from public.units_of_measure where organization_id = '10000000-0000-0000-0000-000000000001'), array['area','count','length','mass','package','volume'], 'PGM unit kinds cover all 6 dimensions');
select is((select count(*)::int from public.product_categories where organization_id = '10000000-0000-0000-0000-000000000001'), 3, 'PGM has 3 categories (one level-3 chain)');
select is((select count(*)::int from public.product_brands where organization_id = '10000000-0000-0000-0000-000000000001'), 2, 'PGM has 2 brands');
select is((select count(*)::int from public.product_lines where organization_id = '10000000-0000-0000-0000-000000000001'), 3, 'PGM has 3 lines');
select is((select count(*)::int from public.products where id in ('70000000-0000-0000-0000-000000000041','70000000-0000-0000-0000-000000000042')), 2, 'PGM has 2 demo products');
select is((select count(*)::int from public.products where id in ('70000000-0000-0000-0000-000000000041','70000000-0000-0000-0000-000000000042') and status = 'active'), 2, 'both PGM demo products are active (D-C13 lifecycle)');
select is((select count(*)::int from public.product_variants where id in ('70000000-0000-0000-0000-000000000051','70000000-0000-0000-0000-000000000052','70000000-0000-0000-0000-000000000053')), 3, 'PGM has 3 demo variants');
select is((select count(*)::int from public.product_barcodes where variant_id = '70000000-0000-0000-0000-000000000051' and is_primary), 1, 'variant 051 has exactly one primary barcode (D-C04)');
select is((select count(*)::int from public.product_barcodes where variant_id = '70000000-0000-0000-0000-000000000051'), 2, 'variant 051 has multiple barcodes');
select is((select count(*)::int from public.products where id = '80000000-0000-0000-0000-000000000041' and status = 'active'), 1, 'Demo B has 1 active demo product');
select is((select count(*)::int from public.permissions where code like 'catalog.%'), 5, 'seed defines 5 catalog.* permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000001' and p.code like 'catalog.%'), 5, 'administrator role has all 5 catalog permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000002' and p.code like 'catalog.%'), 3, 'manager role has catalog.read/create/update');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000003' and p.code like 'catalog.%'), 1, 'cashier role has catalog.read only');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000004' and p.code like 'catalog.%'), 1, 'operator role has catalog.read only');

-- ============================================================
-- Phase D: RLS behavior + permission-gated transitions (authenticated)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- user_A (manager@PGM: catalog.read/create/update, no archive/manage)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is((select count(*)::int from public.products where id in ('70000000-0000-0000-0000-000000000041','70000000-0000-0000-0000-000000000042')), 2, 'manager reads own PGM products');
select is((select count(*)::int from public.products where id = '80000000-0000-0000-0000-000000000041'), 0, 'manager cannot read Demo-B product');
select lives_ok('update public.product_variants set display_name = ''Tubo PVC 1" CED 40 por pieza (ed.)'' where id = ''70000000-0000-0000-0000-000000000051''', 'manager edits variant data (catalog.update, rule D)');
select lives_ok('update public.products set status = ''inactive'' where id = ''70000000-0000-0000-0000-000000000041''', 'manager transitions active->inactive (catalog.update, rule A)');
select lives_ok('update public.products set status = ''active'' where id = ''70000000-0000-0000-0000-000000000041''', 'manager transitions inactive->active (catalog.update, rule A)');
select throws_ok('update public.products set status = ''discontinued'' where id = ''70000000-0000-0000-0000-000000000041''', '42501'::character(5), NULL, 'manager cannot discontinue without catalog.archive (rule B)');

-- admin (administrator: full catalog)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM (administrator)');
select lives_ok('update public.products set status = ''discontinued'' where id = ''70000000-0000-0000-0000-000000000041''', 'admin discontinues product (catalog.archive, rule B)');
select lives_ok('update public.products set description = ''Tubo de PVC hidráulico de 1 pulgada, Cédula 40 (revisado)'', status = ''discontinued'' where id = ''70000000-0000-0000-0000-000000000042''', 'admin combined edit + discontinue (rule E)');
select lives_ok('update public.products set status = ''active'' where id = ''70000000-0000-0000-0000-000000000041''', 'admin restores discontinued product (catalog.manage, rule C)');

-- manager: cannot restore (needs catalog.manage). 042 is still discontinued.
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager) again');
select throws_ok('update public.products set status = ''active'' where id = ''70000000-0000-0000-0000-000000000042''', '42501'::character(5), NULL, 'manager cannot restore discontinued without catalog.manage (rule C)');
select throws_ok('update public.products set description = ''x'', status = ''discontinued'' where id = ''70000000-0000-0000-0000-000000000041''', '42501'::character(5), NULL, 'manager combined edit + discontinue rejected (rule E)');

-- admin: data-only and no-op updates are allowed
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM again');
select lives_ok('update public.products set description = description where id = ''70000000-0000-0000-0000-000000000041''', 'no-op update succeeds (no transition enforced)');

-- user_X (cashier@PGM: catalog.read only)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
update public.product_variants set display_name = 'x' where id = '70000000-0000-0000-0000-000000000051';
select is((select display_name from public.product_variants where id = '70000000-0000-0000-0000-000000000051'), 'Tubo PVC 1" CED 40 por pieza (ed.)', 'cashier cannot edit variant data (RLS silently filters the row)');
update public.products set status = 'inactive' where id = '70000000-0000-0000-0000-000000000041';
select is((select status from public.products where id = '70000000-0000-0000-0000-000000000041'), 'active', 'cashier cannot transition status (RLS silently filters the row)');
select throws_ok('insert into public.product_barcodes (organization_id, variant_id, barcode) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', ''7500000000999'')', '42501'::character(5), NULL, 'cashier cannot insert barcode (needs catalog.create)');

-- user_B (operator@Demo-B: catalog.read only)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is((select count(*)::int from public.products where id = '80000000-0000-0000-0000-000000000041'), 1, 'operator reads own Demo-B product');
select is((select count(*)::int from public.products where id = '70000000-0000-0000-0000-000000000041'), 0, 'operator cannot read PGM product');
select throws_ok('insert into public.products (organization_id, description) values (''20000000-0000-0000-0000-000000000001'', ''No create for operator'')', '42501'::character(5), NULL, 'operator cannot insert product (needs catalog.create)');

-- manager: can create products (catalog.create)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager) to create');
select lives_ok('insert into public.products (organization_id, description, status) values (''10000000-0000-0000-0000-000000000001'', ''Producto creado por manager'', ''inactive'')', 'manager creates a product (catalog.create, born inactive D-C13)');

select lives_ok('reset role', 'back to postgres');

-- ============================================================
-- Phase B: integrity rules (as postgres; runs last so the phases above
-- see the clean seed fixtures)
-- ============================================================

-- category tree (D-C01)
select lives_ok($sql$
  insert into public.product_categories (organization_id, parent_id, code, name)
  values ('10000000-0000-0000-0000-000000000001', null, 'T-B1', 'Test Level 1')
$sql$, 'level-1 category insert succeeds');

select throws_ok($sql$
  insert into public.product_categories (id, organization_id, parent_id, code, name)
  values ('70000000-0000-0000-0000-900000000010', '10000000-0000-0000-0000-000000000001',
          '70000000-0000-0000-0000-900000000010', 'T-B2', 'Self parent')
$sql$, 'P0001'::character(5), NULL, 'self-parent category rejected');

select throws_ok($sql$
  insert into public.product_categories (organization_id, parent_id, code, name)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000033', 'T-B3', 'Depth 4')
$sql$, 'P0001'::character(5), NULL, 'category depth > 3 rejected');

select throws_ok($sql$
  update public.product_categories set parent_id = '70000000-0000-0000-0000-000000000033'
  where id = '70000000-0000-0000-0000-000000000031'
$sql$, 'P0001'::character(5), NULL, 'category cycle rejected');

select throws_ok($sql$
  insert into public.product_categories (organization_id, parent_id, code, name)
  values ('10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000031', 'T-B4', 'Cross org')
$sql$, '23503'::character(5), NULL, 'cross-organization parent rejected (composite FK, D-C08)');

-- case-insensitive uniqueness (D-C11/D-C12)
select throws_ok($sql$
  insert into public.product_categories (organization_id, code, name)
  values ('10000000-0000-0000-0000-000000000001', 't-b1', 'Lowercase dup')
$sql$, '23505'::character(5), NULL, 'category code unique case-insensitively');

select lives_ok($sql$
  insert into public.product_categories (organization_id, code, name)
  values ('20000000-0000-0000-0000-000000000001', 't-b1', 'Other org')
$sql$, 'same category code allowed in another org');

-- products/variants (D-C02/D-C03/D-C13)
select lives_ok($sql$
  insert into public.products (id, organization_id, external_id, description)
  values ('70000000-0000-0000-0000-900000000001', '10000000-0000-0000-0000-000000000001', 'PB-1', 'Producto test B')
$sql$, 'inactive product insert succeeds (born inactive, D-C13)');

select throws_ok($sql$
  insert into public.products (id, organization_id, external_id, description, status)
  values ('70000000-0000-0000-0000-900000000002', '10000000-0000-0000-0000-000000000001', 'PB-2', 'Producto activo sin variante', 'active')
$sql$, 'P0001'::character(5), NULL, 'active product without an active variant rejected');

select lives_ok($sql$
  insert into public.product_variants (
    id, organization_id, product_id, sku, base_unit_id, sale_unit_id,
    base_units_per_sale_unit, status)
  values ('70000000-0000-0000-0000-900000000011', '10000000-0000-0000-0000-000000000001',
          '70000000-0000-0000-0000-900000000001', 'PB-1-PZA',
          '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 1, 'active')
$sql$, 'active variant insert succeeds');

select lives_ok($sql$
  update public.products set status = 'active'
  where id = '70000000-0000-0000-0000-900000000001'
$sql$, 'product activates once its active variant exists (D-C13)');

select throws_ok($sql$
  update public.product_variants set status = 'inactive'
  where id = '70000000-0000-0000-0000-900000000011'
$sql$, 'P0001'::character(5), NULL, 'last active variant of an active product cannot be retired');

select throws_ok($sql$
  insert into public.product_variants (
    id, organization_id, product_id, sku, base_unit_id, sale_unit_id,
    base_units_per_sale_unit)
  values ('70000000-0000-0000-0000-900000000012', '10000000-0000-0000-0000-000000000001',
          '70000000-0000-0000-0000-000000000041', 'tub-pvc-100-pza',
          '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 1)
$sql$, '23505'::character(5), NULL, 'SKU unique case-insensitively (D-C03)');

-- barcodes (D-C04)
select throws_ok($sql$
  insert into public.product_barcodes (organization_id, variant_id, barcode)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '7500000000017')
$sql$, '23505'::character(5), NULL, 'barcode unique per org, case-insensitive');

select throws_ok($sql$
  insert into public.product_barcodes (organization_id, variant_id, barcode, is_primary)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '7500000000998', true)
$sql$, '23505'::character(5), NULL, 'only one primary barcode per variant (D-C04)');

-- cross-organization reference (D-C08)
select throws_ok($sql$
  insert into public.products (organization_id, brand_id, description)
  values ('10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000021', 'Cross org brand')
$sql$, '23503'::character(5), NULL, 'product cannot reference another org brand (composite FK)');

-- data validation
select throws_ok($sql$
  insert into public.product_variants (
    organization_id, product_id, sku, base_unit_id, sale_unit_id, base_units_per_sale_unit)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-900000000001',
          '  ', '70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 1)
$sql$, '23514'::character(5), NULL, 'blank SKU rejected');

select * from finish();
rollback;

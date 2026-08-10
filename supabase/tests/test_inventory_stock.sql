-- PGadm — Inventory Stock Tests (1D.2)
-- Verifies migration 00000000000010 (5 public tables, _audit.inventory_events,
-- composite org-scoped FKs to warehouses/product_variants, allowlist RLS
-- deny-by-default, minimal grants, no DELETE) and the inventory demo fixtures in
-- supabase/seed.sql (decisions D-I01..D-I14, test plan IA-1..IA-37).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql: org PGM (10000000-...), warehouse NOG-01
-- (10000000-...-003), catalog variants 051/052/053, 2 snapshots (baseline +
-- subsequent), 5 snapshot items, 3 changes (increase/zeroed/missing_product),
-- 2 observations, 1 import template.
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15 (migration 004 bootstraps
-- anon/authenticated/service_role roles there; CI applies seed too).

begin;
select plan(88);

-- ============================================================
-- Phase A: structure, policies, grants (as postgres)
-- ============================================================

-- Tables exist, RLS enabled, FORCE off (D20)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and c.relrowsecurity), 5,
  'RLS enabled on all 5 inventory tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and not c.relforcerowsecurity), 5,
  'FORCE RLS off on all 5 inventory tables (D20, owner seed keeps working)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'inventory_events' and c.relkind = 'r'
     and c.relrowsecurity), 1,
  'RLS enabled on _audit.inventory_events');

-- Allowlist policy counts (F1D_RLS_PERMISSION_MATRIX §4): 13 on public, 2 on audit
select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
   and tablename in ('inventory_snapshots','inventory_snapshot_items',
                     'inventory_changes','inventory_observations','import_templates')),
  13, 'exactly 13 inventory allowlist policies (3+2+2+3+3)');

select is(
  (select count(*)::int from pg_policies where schemaname = '_audit'
   and tablename = 'inventory_events'), 2,
  'exactly 2 inventory_events policies (select/insert)');

select is(
  (select array_agg(distinct r.rolname::text order by r.rolname::text)
   from pg_policies p join lateral unnest(p.roles) as r(rolname) on true
   where (p.schemaname = 'public'
     and p.tablename in ('inventory_snapshots','inventory_snapshot_items',
                         'inventory_changes','inventory_observations','import_templates'))
      or (p.schemaname = '_audit' and p.tablename = 'inventory_events')),
  array['authenticated'], 'all inventory policies target authenticated only (D17)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('inventory_snapshots','inventory_snapshot_items',
                       'inventory_changes','inventory_observations','import_templates')
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive USING(true)/WITH CHECK(true) inventory policy (ACC-21)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = '_audit' and tablename = 'inventory_events'
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive inventory_events policy (ACC-21)');

-- Grants == policies (D18); no DELETE anywhere (D-I03/D-I06, IA-34)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'select')), 5,
  'authenticated can select all 5 inventory tables (D18)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'insert')), 5,
  'authenticated has insert on all 5 inventory tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'update')), 3,
  'authenticated has update only on snapshots/observations/templates (immutable items/changes)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')), 0,
  'authenticated has NO delete on any inventory table (IA-34)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('service_role', c.oid, 'select'))), 0,
  'anon/service_role have no select on any inventory table (D17)');

select is(
  (select has_table_privilege('authenticated', '_audit.inventory_events', 'select')), true,
  'authenticated can select _audit.inventory_events');

select is(
  (select has_table_privilege('authenticated', '_audit.inventory_events', 'insert')), true,
  'authenticated can insert _audit.inventory_events');

select is(
  (select has_table_privilege('authenticated', '_audit.inventory_events', 'update')), false,
  'authenticated has no update on _audit.inventory_events (append-only)');

select is(
  (select has_table_privilege('authenticated', '_audit.inventory_events', 'delete')), false,
  'authenticated has no delete on _audit.inventory_events (append-only)');

-- Uniqueness / composite FK targets
select is(
  (select count(*)::int from pg_index i
   join pg_class t on t.oid = i.indrelid
   join pg_class c on c.oid = i.indexrelid
   join pg_namespace n on n.oid = t.relnamespace
   where n.nspname = 'public' and t.relname in (
     'inventory_snapshots','inventory_snapshot_items','inventory_changes',
     'inventory_observations','import_templates') and i.indisunique
     and i.indexrelid::regclass::text in (
       'inventory_snapshots_organization_id_unique',
       'inventory_snapshot_items_organization_id_unique',
       'inventory_changes_organization_id_unique',
       'inventory_observations_organization_id_unique',
       'import_templates_organization_id_unique')), 5,
  'UNIQUE(organization_id, id) on all 5 inventory tables (composite FK targets)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.inventory_snapshots_load_unique'::regclass
     and i.indisunique and i.indpred is not null), 1,
  'load-unique partial index (org, warehouse, report_date, source) WHERE NOT is_baseline (IA-8)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.inventory_snapshot_items_snapshot_variant_unique'::regclass
     and i.indisunique), 1,
  'one item per variant per snapshot (IA-19)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.inventory_changes_source_variant_warehouse_unique'::regclass
     and i.indisunique), 1,
  'one change per variant/warehouse per source snapshot (IA-19)');

-- updated_at triggers only on the mutable tables (IA-32)
select is(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'inventory_snapshots','inventory_observations','import_templates')
     and not t.tgisinternal and t.tgname like '%_updated_at'), 3,
  'updated_at trigger on snapshots/observations/templates (IA-32)');

-- Generated difference column (IA-18)
select is(
  (select attgenerated from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'inventory_changes' and a.attname = 'difference'),
  's', 'inventory_changes.difference is STORED GENERATED (IA-18)');

-- Composite org-scoped FKs to 1B.2 warehouses and 1C variants (IA-30, D-C08)
select is(
  (select count(*)::int from pg_constraint
   where conname in (
     'inventory_snapshots_warehouse_organization_fk',
     'inventory_changes_warehouse_organization_fk',
     'inventory_observations_warehouse_organization_fk')
     and contype = 'f'), 3,
  'warehouse composite FKs present (snapshots/changes/observations)');

select is(
  (select count(*)::int from pg_constraint
   where conname in (
     'inventory_snapshot_items_variant_organization_fk',
     'inventory_changes_variant_organization_fk',
     'inventory_observations_variant_organization_fk')
     and contype = 'f'), 3,
  'variant composite FKs present (items/changes/observations)');

select is(
  (select count(*)::int from pg_constraint
   where conname in (
     'inventory_snapshot_items_snapshot_organization_fk',
     'inventory_changes_snapshot_organization_fk')
     and contype = 'f'), 2,
  'snapshot composite FKs present (items/changes)');

-- ============================================================
-- Phase C: inventory demo fixtures (as postgres)
-- ============================================================

select is((select count(*)::int from public.permissions where code like 'inventory.%'), 4, 'seed defines 4 inventory.* permissions (D-I10)');
select is((select count(*)::int from public.permissions), 19, 'total permissions = 19 (11 + 4 inventory.* + 4 layout.*)');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000001' and p.code like 'inventory.%'), 4, 'administrator role has all 4 inventory permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000002' and p.code like 'inventory.%'), 4, 'manager role has all 4 inventory permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000003' and p.code like 'inventory.%'), 2, 'cashier role has inventory.read + inventory.observe');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000004' and p.code like 'inventory.%'), 2, 'operator role has inventory.read + inventory.observe');

select is((select count(*)::int from public.inventory_snapshots), 2, 'PGM has 2 snapshots (baseline + subsequent)');
select is((select count(*)::int from public.inventory_snapshots where is_baseline), 1, 'exactly 1 baseline snapshot (D-I05)');
select is((select count(*)::int from public.inventory_snapshot_items where snapshot_id = '90000000-0000-0000-0000-000000000001'), 3, 'baseline snapshot has 3 items');
select is((select count(*)::int from public.inventory_snapshot_items where snapshot_id = '90000000-0000-0000-0000-000000000002'), 2, 'subsequent snapshot has 2 items (variant 053 absent, D-I05)');
select is((select count(*)::int from public.inventory_changes), 3, 'PGM has 3 changes (only-changes, D-I03)');
select is((select array_agg(change_type order by change_type) from public.inventory_changes), array['increase','missing_product','zeroed'], 'change types cover increase/zeroed/missing_product');

select is((select difference from public.inventory_changes where id = '90000000-0000-0000-0000-000000000021')::numeric, 30::numeric, 'increase difference = 130-100 (IA-18)');
select is((select difference from public.inventory_changes where id = '90000000-0000-0000-0000-000000000022')::numeric, -4::numeric, 'zeroed difference = 0-4 (IA-18)');
select is((select difference from public.inventory_changes where id = '90000000-0000-0000-0000-000000000023')::numeric, -12::numeric, 'missing_product keeps the delta of last reported quantity (D-I05)');

select is((select count(*)::int from public.inventory_observations), 2, 'PGM has 2 observations (D-I06)');
select is((select count(*)::int from public.import_templates), 1, 'PGM has 1 import template (D-I07)');

-- Observation never mutates the official snapshot quantity (IA-21)
select is((select quantity from public.inventory_snapshot_items where id = '90000000-0000-0000-0000-000000000014')::numeric, 130::numeric, 'snapshot quantity untouched by the physical_count observation (IA-21)');

-- ============================================================
-- Phase D: RLS behavior + permission-gated writes (authenticated)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- user_A (manager@PGM: inventory.read/import/approve/observe)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is((select count(*)::int from public.inventory_snapshots), 2, 'manager reads own PGM snapshots');
select is((select count(*)::int from public.inventory_observations), 2, 'manager reads own PGM observations');
select lives_ok('insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, observed_quantity, note, created_by) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', ''10000000-0000-0000-0000-000000000003'', ''difference'', 5, ''Diferencia detectada'', ''30000000-0000-0000-0000-000000000001'')', 'manager registers an observation (inventory.observe)');
select is((select count(*)::int from public.inventory_observations), 3, 'manager observation persisted (IA-20)');
select lives_ok('insert into public.inventory_snapshots (organization_id, warehouse_id, source, report_date, imported_by) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000003'', ''excel'', ''2026-08-09 09:00:00+00'', ''30000000-0000-0000-0000-000000000006'')', 'manager approves a new load (inventory.approve, D-I02)');
select is((select count(*)::int from public.inventory_snapshots), 3, 'manager snapshot persisted');
select lives_ok('update public.inventory_observations set note = ''Conteo confirmado'' where id = ''90000000-0000-0000-0000-000000000031''', 'manager confirms an observation (inventory.approve, IA-22)');

-- user_X (cashier@PGM: inventory.read + inventory.observe, no approve)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
select is((select count(*)::int from public.inventory_snapshots), 3, 'cashier reads own PGM snapshots');
select lives_ok('insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, created_by) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000052'', ''10000000-0000-0000-0000-000000000003'', ''damaged'', ''30000000-0000-0000-0000-000000000003'')', 'cashier registers an observation (inventory.observe)');
select throws_ok('insert into public.inventory_snapshots (organization_id, warehouse_id, source, report_date) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000003'', ''excel'', ''2026-08-10 09:00:00+00'')', '42501'::character(5), NULL, 'cashier cannot approve a load without inventory.approve (IA-25)');
select lives_ok('update public.inventory_observations set note = ''Hack'' where id = ''90000000-0000-0000-0000-000000000032''', 'cashier attempts observation confirmation (silently filtered)');
select is((select note from public.inventory_observations where id = '90000000-0000-0000-0000-000000000032'), '3 piezas dañadas en anaquel', 'cashier cannot confirm an observation (needs inventory.approve, IA-22)');

-- user_B (operator@Demo-B: inventory.read + inventory.observe, org Demo-B)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is((select count(*)::int from public.inventory_snapshots), 0, 'operator sees zero PGM inventory rows (org isolation, IA-24)');
select throws_ok('insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, created_by) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', ''10000000-0000-0000-0000-000000000003'', ''physical_count'', ''30000000-0000-0000-0000-000000000002'')', '42501'::character(5), NULL, 'cross-org observation insert rejected by RLS (IA-28)');

-- observe gate: remove cashier inventory.observe, insert must fail (IA-26)
select lives_ok('reset role', 'back to postgres');
select lives_ok('delete from public.role_permissions where role_id = ''40000000-0000-0000-0000-000000000003'' and permission_id = ''50000000-0000-0000-0000-000000000015''', 'temporarily revoke cashier inventory.observe');
select lives_ok('set local role authenticated', 'act as authenticated again');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier) without observe');
select throws_ok('insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, created_by) values (''10000000-0000-0000-0000-000000000001'', ''70000000-0000-0000-0000-000000000051'', ''10000000-0000-0000-0000-000000000003'', ''difference'', ''30000000-0000-0000-0000-000000000003'')', '42501'::character(5), NULL, 'no inventory.observe -> cannot register an observation (IA-26)');
select lives_ok('reset role', 'back to postgres');
select lives_ok('insert into public.role_permissions (role_id, permission_id) values (''40000000-0000-0000-0000-000000000003'', ''50000000-0000-0000-0000-000000000015'')', 'restore cashier inventory.observe');

-- admin_PGM: audit event append (D-I02, IA-35)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM (administrator)');
select lives_ok('insert into _audit.inventory_events (actor_user_id, organization_id, action, entity_type, entity_id, detail) values (''30000000-0000-0000-0000-000000000006'', ''10000000-0000-0000-0000-000000000001'', ''approve_import'', ''inventory_snapshot'', ''90000000-0000-0000-0000-000000000002'', ''Carga 2026-08-06 aprobada'')', 'admin appends an inventory audit event');
select is((select count(*)::int from _audit.inventory_events), 1, 'admin reads own inventory audit events (IA-35)');

select lives_ok('reset role', 'back to postgres');

-- ============================================================
-- Phase B: integrity rules (as postgres; runs last so the phases above
-- see the clean seed fixtures)
-- ============================================================

-- duplicate load rejected by the partial unique index (IA-8/IA-11)
select throws_ok($sql$
  insert into public.inventory_snapshots (organization_id, warehouse_id, source, report_date, is_baseline)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
          'excel', '2026-08-06 09:00:00+00', false)
$sql$, '23505'::character(5), NULL, 'duplicate load (same org/warehouse/date/source) rejected (IA-8)');

-- baseline snapshot may be re-asserted (excluded from the partial unique index)
select lives_ok($sql$
  insert into public.inventory_snapshots (organization_id, warehouse_id, source, report_date, is_baseline)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
          'excel', '2026-08-06 09:00:00+00', true)
$sql$, 'baseline snapshot repeat allowed (WHERE NOT is_baseline)');

-- change_type and observation_type CHECKs (D-I03/D-I06)
select throws_ok($sql$
  insert into public.inventory_changes (organization_id, variant_id, warehouse_id, previous_quantity, new_quantity, change_type, source_snapshot_id)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003', 1, 2, 'bogus', '90000000-0000-0000-0000-000000000002')
$sql$, '23514'::character(5), NULL, 'invalid change_type rejected (16_CHANGE_DETECTION)');

select throws_ok($sql$
  insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, created_by)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003', 'ficticio', '30000000-0000-0000-0000-000000000006')
$sql$, '23514'::character(5), NULL, 'invalid observation_type rejected (24_MANUAL_ADJUSTMENTS)');

-- quantities and text checks (IA-33)
select throws_ok($sql$
  insert into public.inventory_snapshot_items (organization_id, snapshot_id, variant_id, quantity)
  values ('10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', -1)
$sql$, '23514'::character(5), NULL, 'negative quantity rejected');

select throws_ok($sql$
  insert into public.inventory_snapshots (organization_id, warehouse_id, source, source_file, report_date)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'excel', '   ', '2026-08-11 09:00:00+00')
$sql$, '23514'::character(5), NULL, 'blank source_file rejected (IA-33)');

select throws_ok($sql$
  insert into public.inventory_observations (organization_id, variant_id, warehouse_id, observation_type, note, created_by)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003', 'difference', '  ', '30000000-0000-0000-0000-000000000006')
$sql$, '23514'::character(5), NULL, 'blank observation note rejected (IA-33)');

select throws_ok($sql$
  insert into public.import_templates (organization_id, name, column_mapping)
  values ('10000000-0000-0000-0000-000000000001', '  ', '{}'::jsonb)
$sql$, '23514'::character(5), NULL, 'blank template name rejected (IA-33)');

select throws_ok($sql$
  insert into public.import_templates (organization_id, name, column_mapping, status)
  values ('10000000-0000-0000-0000-000000000001', 'Plantilla inválida', '{}'::jsonb, 'draft')
$sql$, '23514'::character(5), NULL, 'invalid template status rejected');

-- cross-organization references via composite FKs (IA-30, D-C08)
select throws_ok($sql$
  insert into public.inventory_snapshot_items (organization_id, snapshot_id, variant_id, quantity)
  values ('10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000051', 1)
$sql$, '23503'::character(5), NULL, 'snapshot item cannot reference a Demo-B variant (composite FK)');

select throws_ok($sql$
  insert into public.inventory_snapshots (organization_id, warehouse_id, source, report_date)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'excel', '2026-08-12 09:00:00+00')
$sql$, '23503'::character(5), NULL, 'snapshot cannot reference a foreign warehouse (composite FK)');

select throws_ok($sql$
  insert into public.inventory_changes (organization_id, variant_id, warehouse_id, previous_quantity, new_quantity, change_type, source_snapshot_id)
  values ('10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003', 1, 2, 'increase', '90000000-0000-0000-0000-000000000002')
$sql$, '23503'::character(5), NULL, 'change cannot reference a foreign variant (composite FK)');

-- one item per variant per snapshot; one change per variant/warehouse/source (IA-19)
select throws_ok($sql$
  insert into public.inventory_snapshot_items (organization_id, snapshot_id, variant_id, quantity)
  values ('10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', 5)
$sql$, '23505'::character(5), NULL, 'duplicate snapshot item rejected (IA-19)');

select throws_ok($sql$
  insert into public.inventory_changes (organization_id, variant_id, warehouse_id, previous_quantity, new_quantity, change_type, source_snapshot_id)
  values ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003', 100, 130, 'increase', '90000000-0000-0000-0000-000000000002')
$sql$, '23505'::character(5), NULL, 'duplicate change per variant/warehouse/source snapshot rejected (IA-19)');

-- audit event action CHECK (IA-35)
select throws_ok($sql$
  insert into _audit.inventory_events (actor_user_id, organization_id, action, entity_type, entity_id)
  values ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'deleted', 'inventory_snapshot', '90000000-0000-0000-0000-000000000002')
$sql$, '23514'::character(5), NULL, 'invalid audit action rejected (append-only, IA-35)');

select * from finish();
rollback;

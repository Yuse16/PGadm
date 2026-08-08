-- PGadm — Catalog Audit Log Tests (1C.5)
-- Verifies migration 00000000000009 (_audit.catalog_events: append-only
-- structure, deny-by-default RLS, minimal grants) and the RLS behavior the
-- SupabaseCatalogAuditRepository relies on: select needs catalog.read, insert
-- needs a catalog write permission, everything is org-scoped (D-C10).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql (orgs PGM + PGM-DEMO-B, profiles
-- user_A/user_X/user_B/admin_PGM, roles with catalog.* permissions).
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15.

begin;
select plan(32);

-- ============================================================
-- Phase A: structure, policies, grants (as postgres)
-- ============================================================
select ok(exists (select 1 from pg_namespace where nspname = '_audit'),
  'Schema _audit exists (reserved in migration 001)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events' and c.relkind = 'r'),
  1, 'Table _audit.catalog_events exists');

select is(
  (select relrowsecurity::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events'),
  1, 'RLS enabled on catalog_events');

select is(
  (select relforcerowsecurity::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events'),
  0, 'FORCE RLS off on catalog_events (D20)');

select is(
  (select count(*)::int from pg_policies where schemaname = '_audit' and tablename = 'catalog_events'),
  2, 'exactly 2 policies (select + insert; no update/delete, append-only)');

select is(
  (select array_agg(distinct r.rolname::text order by r.rolname::text)
   from pg_policies p join lateral unnest(p.roles) as r(rolname) on true
   where p.schemaname = '_audit' and p.tablename = 'catalog_events'),
  array['authenticated'], 'catalog_events policies target authenticated only (D17)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = '_audit' and tablename = 'catalog_events'
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive USING(true)/WITH CHECK(true) policy (ACC-21)');

select is(
  (select has_table_privilege('authenticated', '_audit.catalog_events', 'select')),
  true, 'authenticated can select catalog_events (D18)');

select is(
  (select has_table_privilege('authenticated', '_audit.catalog_events', 'insert')),
  true, 'authenticated can insert catalog_events (D18)');

select is(
  (select has_table_privilege('authenticated', '_audit.catalog_events', 'update')),
  false, 'authenticated has NO update on catalog_events (append-only)');

select is(
  (select has_table_privilege('authenticated', '_audit.catalog_events', 'delete')),
  false, 'authenticated has NO delete on catalog_events (append-only)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events' and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('service_role', c.oid, 'select'))),
  0, 'anon/service_role have no select on catalog_events (D17)');

select is(
  (select array_agg(attname::text order by attnum)
   from pg_attribute where attrelid = '_audit.catalog_events'::regclass and attnum > 0 and not attisdropped),
  array['id','occurred_at','actor_user_id','organization_id','action','entity_type','entity_id','detail'],
  'catalog_events has exactly the documented columns');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events_pkey'),
  1, 'catalog_events has its uuid primary key');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events_organization_entity_idx'),
  1, 'org+entity history index exists');

select is(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'catalog_events'
     and not t.tgisinternal and t.tgname like '%_updated_at'),
  0, 'catalog_events has NO updated_at trigger (append-only)');

-- ============================================================
-- Phase B: fixtures (as postgres; owner bypasses RLS, D20)
-- ============================================================
insert into _audit.catalog_events (
  id, actor_user_id, organization_id, action, entity_type, entity_id, detail
) values
  ('90000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001', 'create', 'product',
   '70000000-0000-0000-0000-000000000041', 'TUB-PVC-100'),
  ('90000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001', 'update', 'product',
   '70000000-0000-0000-0000-000000000041', 'TUB-PVC-100'),
  ('90000000-0000-0000-0000-000000000003',
   '30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001', 'create', 'product',
   '80000000-0000-0000-0000-000000000041', 'P-DEMO-B');

select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  2, 'PGM starts with 2 fixture events');

select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '20000000-0000-0000-0000-000000000001'),
  1, 'Demo-B starts with 1 fixture event');

-- ============================================================
-- Phase C: RLS behavior (authenticated)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- user_A (manager@PGM: catalog.read/create/update, no archive/manage)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  2, 'manager reads own PGM audit events (catalog.read)');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '20000000-0000-0000-0000-000000000001'),
  0, 'manager cannot read Demo-B audit events (org isolation)');
select lives_ok($sql$
  insert into _audit.catalog_events (actor_user_id, organization_id, action, entity_type, entity_id, detail)
  values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
          'update', 'product', '70000000-0000-0000-0000-000000000041', 'TUB-PVC-100')
$sql$, 'manager records an audit event (has catalog.create/update)');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  3, 'manager insert is persisted and visible');

-- user_X (cashier@PGM: catalog.read only)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  3, 'cashier reads PGM audit events (catalog.read)');
select throws_ok($sql$
  insert into _audit.catalog_events (actor_user_id, organization_id, action, entity_type, entity_id, detail)
  values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
          'update', 'product', '70000000-0000-0000-0000-000000000041', 'TUB-PVC-100')
$sql$, '42501'::character(5), NULL, 'cashier cannot insert audit event (no catalog write permission)');

-- user_B (operator@Demo-B: catalog.read only)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '20000000-0000-0000-0000-000000000001'),
  1, 'operator reads own Demo-B audit events');
select is(
  (select count(*)::int from _audit.catalog_events
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  0, 'operator cannot read PGM audit events (org isolation)');
select throws_ok($sql$
  insert into _audit.catalog_events (actor_user_id, organization_id, action, entity_type, entity_id, detail)
  values ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
          'update', 'product', '70000000-0000-0000-0000-000000000041', 'TUB-PVC-100')
$sql$, '42501'::character(5), NULL, 'operator cannot insert into another org (org isolation)');

select lives_ok('reset role', 'back to postgres');

select * from finish();
rollback;

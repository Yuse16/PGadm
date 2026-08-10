-- PGadm — Layout Tests (Phase 3.2)
-- Verifies migration 00000000000011 (4 public tables, _audit.layout_events,
-- composite org-scoped FKs to branches/layouts/layout_elements/layout_positions/
-- product_variants, allowlist RLS deny-by-default, minimal grants, no DELETE)
-- and the layout demo fixtures in supabase/seed.sql (decisions D-L01..D-L14,
-- test plan LA-1..LA-34).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql: org PGM (10000000-...), store branch NOG
-- (10000000-...-002), layout "Nogalera" (A0000000-...-001, draft), 14 elements
-- (4 M1 + galeria/muro/escaleras/vanity/griferia/jacuzzi/boiler/mostrador/caja/
-- parrillas), 35 positions (M1 rails 3/3/2 x4 + mostrador/caja), catalog variants
-- 051/052/053, 6 version-history rows.
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15 (migration 004 bootstraps
-- anon/authenticated/service_role roles there; CI applies seed too).

begin;
select plan(110);

-- ============================================================
-- Phase A: structure, policies, grants (as postgres)
-- ============================================================

-- Tables exist, RLS enabled, FORCE off (D20, LA-1)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r' and c.relrowsecurity), 4,
  'RLS enabled on all 4 layout tables (LA-1)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r' and not c.relforcerowsecurity), 4,
  'FORCE RLS off on all 4 layout tables (D20, owner seed keeps working)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = '_audit' and c.relname = 'layout_events' and c.relkind = 'r'
     and c.relrowsecurity), 1,
  'RLS enabled on _audit.layout_events (LA-33)');

-- Allowlist policy counts (F3_RLS_PERMISSION_MATRIX §4): 12 on public, 2 on audit
select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
   and tablename in ('layouts','layout_elements','layout_positions',
                     'layout_version_history')),
  12, 'exactly 12 layout allowlist policies (4+3+3+2)');

select is(
  (select count(*)::int from pg_policies where schemaname = '_audit'
   and tablename = 'layout_events'), 2,
  'exactly 2 layout_events policies (select/insert)');

select is(
  (select array_agg(distinct r.rolname::text order by r.rolname::text)
   from pg_policies p join lateral unnest(p.roles) as r(rolname) on true
   where (p.schemaname = 'public'
     and p.tablename in ('layouts','layout_elements','layout_positions',
                         'layout_version_history'))
      or (p.schemaname = '_audit' and p.tablename = 'layout_events')),
  array['authenticated'], 'all layout policies target authenticated only (D17)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('layouts','layout_elements','layout_positions',
                       'layout_version_history')
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive USING(true)/WITH CHECK(true) layout policy (ACC-21)');

select is(
  (select count(*)::int from pg_policies
   where schemaname = '_audit' and tablename = 'layout_events'
     and (qual = 'true' or with_check = 'true')),
  0, 'no permissive layout_events policy (ACC-21)');

-- Grants == policies (D18); no DELETE anywhere (LA-32)
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'select')), 4,
  'authenticated can select all 4 layout tables (D18)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'insert')), 4,
  'authenticated has insert on all 4 layout tables');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'update')), 3,
  'authenticated has update only on layouts/elements/positions (history append-only, LA-7)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')), 0,
  'authenticated has NO delete on any layout table (LA-32)');

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('service_role', c.oid, 'select'))), 0,
  'anon/service_role have no select on any layout table (D17)');

select is(
  (select has_table_privilege('authenticated', '_audit.layout_events', 'select')), true,
  'authenticated can select _audit.layout_events');

select is(
  (select has_table_privilege('authenticated', '_audit.layout_events', 'insert')), true,
  'authenticated can insert _audit.layout_events');

select is(
  (select has_table_privilege('authenticated', '_audit.layout_events', 'update')), false,
  'authenticated has no update on _audit.layout_events (append-only)');

select is(
  (select has_table_privilege('authenticated', '_audit.layout_events', 'delete')), false,
  'authenticated has no delete on _audit.layout_events (append-only)');

-- Uniqueness / composite FK targets (LA-1)
select is(
  (select count(*)::int from pg_index i
   join pg_class t on t.oid = i.indrelid
   join pg_namespace n on n.oid = t.relnamespace
   where n.nspname = 'public' and t.relname in (
     'layouts','layout_elements','layout_positions','layout_version_history')
     and i.indisunique and i.indexrelid::regclass::text in (
       'layouts_organization_id_unique',
       'layout_elements_organization_id_unique',
       'layout_positions_organization_id_unique',
       'layout_version_history_organization_id_unique')), 4,
  'UNIQUE(organization_id, id) on all 4 layout tables (composite FK targets)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.layouts_org_branch_name_unique'::regclass
     and i.indisunique), 1,
  'one layout with the same name per store branch (D-L01)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.layout_elements_org_layout_code_unique'::regclass
     and i.indisunique), 1,
  'permanent element code unique per layout and org (LA-3)');

select is(
  (select count(*)::int from pg_index i
   where i.indexrelid = 'public.layout_positions_org_element_code_unique'::regclass
     and i.indisunique), 1,
  'position_code unique per element (LA-4)');

-- updated_at triggers only on the mutable tables (LA-30)
select is(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'layouts','layout_elements','layout_positions')
     and not t.tgisinternal and t.tgname like '%_updated_at'), 3,
  'updated_at trigger on layouts/elements/positions (LA-30)');

-- Composite org-scoped FKs (LA-2/LA-5/LA-26)
select is(
  (select count(*)::int from pg_constraint
   where conname = 'layouts_branch_organization_fk' and contype = 'f'), 1,
  'layouts anchored to branch with composite org-scoped FK (LA-2)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'layout_elements_layout_organization_fk' and contype = 'f'), 1,
  'elements composite FK to layouts');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'layout_positions_element_organization_fk' and contype = 'f'), 1,
  'positions composite FK to elements');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'layout_positions_variant_organization_fk' and contype = 'f'), 1,
  'positions composite FK to 1C product_variants (LA-5)');

select is(
  (select count(*)::int from pg_constraint
   where conname in (
     'layout_version_history_layout_organization_fk',
     'layout_version_history_element_organization_fk',
     'layout_version_history_position_organization_fk',
     'layout_version_history_previous_variant_organization_fk',
     'layout_version_history_new_variant_organization_fk') and contype = 'f'), 5,
  'version history composite FKs (layout/element/position/previous/new variant)');

select is(
  (select count(*)::int from pg_constraint
   where conname = 'layout_version_history_changed_by_fk' and contype = 'f'), 1,
  'version history changed_by FK to profiles');

-- ============================================================
-- Phase C: layout demo fixtures (as postgres)
-- ============================================================

select is((select count(*)::int from public.permissions where code like 'layout.%'), 4, 'seed defines 4 layout.* permissions (D-L10, LA-29)');
select is((select count(*)::int from public.permissions), 25, 'total permissions = 25 (15 + 4 layout.* + 6 sales.*)');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000001' and p.code like 'layout.%'), 4, 'administrator role has all 4 layout permissions');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000002' and p.code like 'layout.%'), 3, 'manager role has read/edit/publish (no manage)');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000003' and p.code like 'layout.%'), 1, 'cashier role has layout.read only');
select is((select count(*)::int from public.role_permissions rp join public.permissions p on p.id = rp.permission_id where rp.role_id = '40000000-0000-0000-0000-000000000004' and p.code like 'layout.%'), 1, 'operator role has layout.read only');

select is((select count(*)::int from public.layouts), 1, 'PGM has 1 store layout (D-L01)');
select is((select status from public.layouts where id = 'A0000000-0000-0000-0000-000000000001'), 'draft', 'layout Nogalera is a draft');
select is((select b.branch_type from public.layouts l join public.branches b on b.id = l.branch_id and b.organization_id = l.organization_id where l.id = 'A0000000-0000-0000-0000-000000000001'), 'store', 'layout anchored to a store branch (LA-2)');
select is((select background_reference from public.layouts where id = 'A0000000-0000-0000-0000-000000000001'), 'https://canva.pgm.local/planos/nogalera-2026-08.png', 'layout keeps only a background reference, not the model (D-L05)');

select is((select count(*)::int from public.layout_elements), 14, 'PGM layout has 14 elements');
select is((select count(*)::int from public.layout_elements where element_type = 'm1'), 4, 'seed has four M1 elements M1-01..M1-04 (LA-15)');
select is((select count(*)::int from public.layout_elements where code like 'M1-%'), 4, 'M1 permanent codes M1-01..M1-04 (D-L02)');
select is((select metadata->'capacidad_riel'->>'frontal' from public.layout_elements where code = 'M1-01'), '3', 'M1 frontal rail capacity stored as metadata recommendation, not CHECK (LA-16)');
select is((select metadata->'capacidad_riel'->>'intermedio' from public.layout_elements where code = 'M1-01'), '3', 'M1 intermedio rail capacity = 3 (metadata, D-L08)');
select is((select metadata->'capacidad_riel'->>'posterior' from public.layout_elements where code = 'M1-01'), '2', 'M1 posterior rail capacity = 2 (metadata, D-L08)');
select is((select bool_and(x between 0 and 1 and y between 0 and 1) from public.layout_elements), true, 'all element coordinates are normalized 0-1 (LA-10)');

select is((select count(*)::int from public.layout_positions), 35, 'PGM layout has 35 positions (~30, LA-4)');
select is((select count(*)::int from public.layout_positions where position_code like 'M1-%-RF-%'), 12, 'M1 frontal rail positions: 3 x 4 (LA-15)');
select is((select count(*)::int from public.layout_positions where position_code like 'M1-%-RI-%'), 12, 'M1 intermedio rail positions: 3 x 4 (LA-15)');
select is((select count(*)::int from public.layout_positions where position_code like 'M1-%-RP-%'), 8, 'M1 posterior rail positions: 2 x 4 (LA-15)');
select is((select count(*)::int from public.layout_positions where review_status = 'needs_review'), 1, 'one position marked needs_review (D-L07 demo, LA-19)');
select is((select count(distinct variant_id)::int from public.layout_positions where variant_id is not null), 3, 'assigned variants reuse exact 1C demo variants (051/052/053, D-L06)');
select is((select count(*)::int from public.layout_positions where variant_id = '80000000-0000-0000-0000-000000000051'), 0, 'no layout position references a Demo-B variant (org isolation)');

select is((select count(*)::int from public.layout_version_history), 6, 'PGM layout has 6 version-history rows (append-only demo)');
select is((select array_agg(change_type order by change_type) from public.layout_version_history),
  array['created','element_added','element_added','product_assigned','product_assigned','product_removed'],
  'history covers created/element_added/product_assigned/product_removed (LA-17)');
select is((select previous_variant_id from public.layout_version_history where id = 'A0000000-0000-0000-0000-000000000206'), '70000000-0000-0000-0000-000000000051'::uuid, 'product_removed keeps previous_variant_id (LA-17)');
select is((select new_variant_id from public.layout_version_history where id = 'A0000000-0000-0000-0000-000000000204'), '70000000-0000-0000-0000-000000000051'::uuid, 'product_assigned keeps new_variant_id (LA-17)');

-- ============================================================
-- Phase D: RLS behavior + permission-gated writes (authenticated)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- user_A (manager@PGM: layout.read/edit/publish, no manage)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is((select count(*)::int from public.layouts), 1, 'manager reads own PGM layout');
select is((select count(*)::int from public.layout_elements), 14, 'manager reads own PGM elements');
select is((select count(*)::int from public.layout_positions), 35, 'manager reads own PGM positions');
select lives_ok('insert into public.layout_elements (organization_id, layout_id, element_type, code, label) values (''10000000-0000-0000-0000-000000000001'', ''A0000000-0000-0000-0000-000000000001'', ''m1'', ''M1-99'', ''Mueble temporal'')', 'manager adds an element to the draft layout (layout.edit, LA-24)');
select is((select count(*)::int from public.layout_elements where code = 'M1-99'), 1, 'manager element persisted');
select lives_ok('update public.layout_elements set x = 0.55 where code = ''GAL-LAMOSA-01'' and organization_id = ''10000000-0000-0000-0000-000000000001''', 'manager moves an element (layout.edit, LA-8)');
select lives_ok('update public.layout_positions set variant_id = ''70000000-0000-0000-0000-000000000052'' where id = ''A0000000-0000-0000-0000-000000000103'' and organization_id = ''10000000-0000-0000-0000-000000000001''', 'manager assigns a product to an empty position (layout.edit, D-L06)');
select lives_ok('update public.layouts set status = ''published'', version = 2 where id = ''A0000000-0000-0000-0000-000000000001''', 'manager publishes the layout (layout.publish, LA-12)');
select throws_ok('insert into public.layouts (organization_id, branch_id, name) values (''10000000-0000-0000-0000-000000000001'', ''10000000-0000-0000-0000-000000000002'', ''Nogalera 2'')', '42501'::character(5), NULL, 'manager cannot create a layout without layout.manage (LA-24)');

-- user_X (cashier@PGM: layout.read only)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
select is((select count(*)::int from public.layouts), 1, 'cashier reads own PGM layout (layout.read)');
select throws_ok('insert into public.layout_elements (organization_id, layout_id, element_type, code) values (''10000000-0000-0000-0000-000000000001'', ''A0000000-0000-0000-0000-000000000001'', ''m1'', ''M1-98'')', '42501'::character(5), NULL, 'cashier cannot add elements without layout.edit (LA-24)');
select lives_ok('update public.layouts set status = ''archived'' where id = ''A0000000-0000-0000-0000-000000000001''', 'cashier attempts to publish/archive (silently filtered)');
select is((select status from public.layouts where id = 'A0000000-0000-0000-0000-000000000001'), 'published', 'cashier cannot change layout status without layout.publish (LA-25)');

-- user_B (operator@Demo-B: layout.read, org Demo-B)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is((select count(*)::int from public.layouts), 0, 'operator sees zero PGM layout rows (org isolation, LA-23)');
select throws_ok('insert into public.layout_elements (organization_id, layout_id, element_type, code) values (''10000000-0000-0000-0000-000000000001'', ''A0000000-0000-0000-0000-000000000001'', ''m1'', ''M1-97'')', '42501'::character(5), NULL, 'cross-org element insert rejected by RLS (LA-26)');

-- read gate: remove cashier layout.read, select must return zero rows (LA-22)
select lives_ok('reset role', 'back to postgres');
select lives_ok('delete from public.role_permissions where role_id = ''40000000-0000-0000-0000-000000000003'' and permission_id = ''50000000-0000-0000-0000-000000000016''', 'temporarily revoke cashier layout.read');
select lives_ok('set local role authenticated', 'act as authenticated again');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier) without layout.read');
select is((select count(*)::int from public.layouts), 0, 'no layout.read -> cashier sees zero layout rows (LA-22)');
select lives_ok('reset role', 'back to postgres');
select lives_ok('insert into public.role_permissions (role_id, permission_id) values (''40000000-0000-0000-0000-000000000003'', ''50000000-0000-0000-0000-000000000016'')', 'restore cashier layout.read');

-- admin_PGM: audit event append (D-L12, LA-33)
select lives_ok('set local role authenticated', 'act as authenticated again');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM (administrator)');
select lives_ok('insert into _audit.layout_events (actor_user_id, organization_id, action, entity_type, entity_id, detail) values (''30000000-0000-0000-0000-000000000006'', ''10000000-0000-0000-0000-000000000001'', ''layout_published'', ''layout'', ''A0000000-0000-0000-0000-000000000001'', ''Publicación v2'')', 'admin appends a layout audit event');
select is((select count(*)::int from _audit.layout_events), 1, 'admin reads own layout audit events (LA-33)');
select throws_ok('update public.layout_version_history set change_type = ''created'' where id = ''A0000000-0000-0000-0000-000000000201''', '42501'::character(5), NULL, 'version history cannot be updated by any role (LA-7/LA-28)');
select throws_ok('delete from public.layout_version_history where id = ''A0000000-0000-0000-0000-000000000201''', '42501'::character(5), NULL, 'version history cannot be deleted by any role (LA-7/LA-28)');
select throws_ok('delete from public.layout_elements where id = ''A0000000-0000-0000-0000-000000000011''', '42501'::character(5), NULL, 'no physical delete on layout tables (LA-32)');
select throws_ok('delete from public.layout_positions where id = ''A0000000-0000-0000-0000-000000000101''', '42501'::character(5), NULL, 'no physical delete on positions (product unassign via UPDATE, LA-32)');

select lives_ok('reset role', 'back to postgres');

-- ============================================================
-- Phase B: integrity rules (as postgres; runs last so the phases above
-- see the clean seed fixtures)
-- ============================================================

-- permanent code unique per layout (LA-3)
select throws_ok($sql$
  insert into public.layout_elements (organization_id, layout_id, element_type, code)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-01')
$sql$, '23505'::character(5), NULL, 'duplicate element code in the same layout rejected (LA-3)');

-- position_code unique per element (LA-4)
select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P01')
$sql$, '23505'::character(5), NULL, 'duplicate position_code in the same element rejected (LA-4)');

-- CHECK trim() <> '' on mandatory text (LA-31)
select throws_ok($sql$
  insert into public.layouts (organization_id, branch_id, name)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '   ')
$sql$, '23514'::character(5), NULL, 'blank layout name rejected (LA-31)');

select throws_ok($sql$
  insert into public.layout_elements (organization_id, layout_id, element_type, code)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 'm1', '   ')
$sql$, '23514'::character(5), NULL, 'blank element code rejected (LA-31)');

select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', '  ')
$sql$, '23514'::character(5), NULL, 'blank position_code rejected (LA-31)');

-- status / element_type / change_type / review_status CHECKs (LA-6)
select throws_ok($sql$
  insert into public.layouts (organization_id, branch_id, name, status)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Layout inválido', 'drafting')
$sql$, '23514'::character(5), NULL, 'invalid layout status rejected (LA-6)');

select throws_ok($sql$
  insert into public.layout_elements (organization_id, layout_id, element_type, code)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 'vitrina', 'VIT-01')
$sql$, '23514'::character(5), NULL, 'invalid element_type rejected (LA-6)');

select throws_ok($sql$
  insert into public.layout_version_history (organization_id, layout_id, version, change_type, changed_by)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 1, 'deleted', '30000000-0000-0000-0000-000000000006')
$sql$, '23514'::character(5), NULL, 'invalid change_type rejected (LAYOUT_EDITING_RULES)');

select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code, review_status)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P09', 'approved')
$sql$, '23514'::character(5), NULL, 'invalid review_status rejected (D-L07)');

-- geometry checks (LA-10)
select throws_ok($sql$
  insert into public.layouts (organization_id, branch_id, name, width)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Layout negativo', -1)
$sql$, '23514'::character(5), NULL, 'negative layout width rejected');

select throws_ok($sql$
  insert into public.layout_elements (organization_id, layout_id, element_type, code, x)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-96', 1.5)
$sql$, '23514'::character(5), NULL, 'normalized x > 1 rejected (LA-10)');

select throws_ok($sql$
  insert into public.layout_elements (organization_id, layout_id, element_type, code, rotation)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-95', 360)
$sql$, '23514'::character(5), NULL, 'rotation >= 360 rejected (LA-10)');

select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code, active_from, active_to)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P09', '2026-09-01 09:00:00+00', '2026-08-01 09:00:00+00')
$sql$, '23514'::character(5), NULL, 'active window inverted (active_to < active_from) rejected');

select throws_ok($sql$
  insert into public.layout_version_history (organization_id, layout_id, version, change_type, changed_by)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 0, 'created', '30000000-0000-0000-0000-000000000006')
$sql$, '23514'::character(5), NULL, 'version < 1 rejected');

-- cross-organization references via composite FKs (LA-26)
select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code, variant_id)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P09', '80000000-0000-0000-0000-000000000051')
$sql$, '23503'::character(5), NULL, 'position cannot reference a Demo-B variant (composite FK, LA-5)');

select throws_ok($sql$
  insert into public.layout_positions (organization_id, element_id, position_code)
  values ('20000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P09')
$sql$, '23503'::character(5), NULL, 'position cannot reference a foreign element (composite FK, LA-26)');

select throws_ok($sql$
  insert into public.layouts (organization_id, branch_id, name)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Layout ajeno')
$sql$, '23503'::character(5), NULL, 'layout cannot anchor to a foreign branch (composite FK, LA-2)');

select throws_ok($sql$
  insert into public.layout_version_history (organization_id, layout_id, version, change_type, new_variant_id, changed_by)
  values ('10000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 1, 'product_assigned', '80000000-0000-0000-0000-000000000051', '30000000-0000-0000-0000-000000000006')
$sql$, '23503'::character(5), NULL, 'version history cannot reference a foreign variant (composite FK)');

-- audit event action CHECK (LA-33)
select throws_ok($sql$
  insert into _audit.layout_events (actor_user_id, organization_id, action, entity_type, entity_id)
  values ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'deleted', 'layout', 'A0000000-0000-0000-0000-000000000001')
$sql$, '23514'::character(5), NULL, 'invalid audit action rejected (append-only, LA-33)');

select * from finish();
rollback;

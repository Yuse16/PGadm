-- PGadm — Organization RLS & Effective-Permissions RPC Tests (1B.3D-2)
-- Verifies migration 00000000000007 (RLS on organizations/branches/warehouses/
-- branch_warehouse_relations + public.current_user_permissions RPC).
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql (PGM + PGM-DEMO-B orgs, NOG/SAL branches,
-- warehouses, supply relation, users A/B/X/IN/NOM/admin, roles with permissions).
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15.

begin;
select plan(78);

-- ============================================================
-- Phase A: structure, grants, RPC metadata (as postgres)
-- ============================================================

-- RLS enabled on all four org tables; FORCE deliberately off (D20)
select is((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass), true, 'RLS enabled on organizations');
select is((select relrowsecurity from pg_class where oid = 'public.branches'::regclass), true, 'RLS enabled on branches');
select is((select relrowsecurity from pg_class where oid = 'public.warehouses'::regclass), true, 'RLS enabled on warehouses');
select is((select relrowsecurity from pg_class where oid = 'public.branch_warehouse_relations'::regclass), true, 'RLS enabled on branch_warehouse_relations');
select is((select relforcerowsecurity from pg_class where oid = 'public.organizations'::regclass), false, 'FORCE RLS off on organizations (D20, owner seed keeps working)');
select is((select relforcerowsecurity from pg_class where oid = 'public.branches'::regclass), false, 'FORCE RLS off on branches (D20)');
select is((select relforcerowsecurity from pg_class where oid = 'public.warehouses'::regclass), false, 'FORCE RLS off on warehouses (D20)');
select is((select relforcerowsecurity from pg_class where oid = 'public.branch_warehouse_relations'::regclass), false, 'FORCE RLS off on branch_warehouse_relations (D20)');

-- Policies: exactly 4 allowlist policies, authenticated only, no USING(true)
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename in ('organizations','branches','warehouses','branch_warehouse_relations')), 4, 'exactly 4 org allowlist policies');
select is((select array_agg(distinct r.rolname::text order by r.rolname::text) from pg_policies p join lateral unnest(p.roles) as r(rolname) on true where p.schemaname = 'public' and p.tablename in ('organizations','branches','warehouses','branch_warehouse_relations')), array['authenticated'], 'all org policies target authenticated only (D17)');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename in ('organizations','branches','warehouses','branch_warehouse_relations') and (qual = 'true' or with_check = 'true')), 0, 'no permissive USING(true)/WITH CHECK(true) org policy (ACC-21)');

-- Grants: authenticated SELECT only (D18); zero write grants
select is((select has_table_privilege('authenticated', 'public.organizations', 'select')), true, 'authenticated can select organizations');
select is((select has_table_privilege('authenticated', 'public.branches', 'select')), true, 'authenticated can select branches');
select is((select has_table_privilege('authenticated', 'public.warehouses', 'select')), true, 'authenticated can select warehouses');
select is((select has_table_privilege('authenticated', 'public.branch_warehouse_relations', 'select')), true, 'authenticated can select branch_warehouse_relations');
select is((select has_table_privilege('authenticated', 'public.organizations', 'insert')), false, 'authenticated has no insert on organizations');
select is((select has_table_privilege('authenticated', 'public.branches', 'insert')), false, 'authenticated has no insert on branches');
select is((select has_table_privilege('authenticated', 'public.warehouses', 'insert')), false, 'authenticated has no insert on warehouses');
select is((select has_table_privilege('authenticated', 'public.branch_warehouse_relations', 'insert')), false, 'authenticated has no insert on branch_warehouse_relations');
select is((select has_table_privilege('authenticated', 'public.organizations', 'update')), false, 'authenticated has no update on organizations');
select is((select has_table_privilege('authenticated', 'public.branches', 'update')), false, 'authenticated has no update on branches');
select is((select has_table_privilege('authenticated', 'public.warehouses', 'update')), false, 'authenticated has no update on warehouses');
select is((select has_table_privilege('authenticated', 'public.branch_warehouse_relations', 'update')), false, 'authenticated has no update on branch_warehouse_relations');
select is((select has_table_privilege('authenticated', 'public.organizations', 'delete')), false, 'authenticated has no delete on organizations');
select is((select has_table_privilege('authenticated', 'public.branches', 'delete')), false, 'authenticated has no delete on branches');
select is((select has_table_privilege('authenticated', 'public.warehouses', 'delete')), false, 'authenticated has no delete on warehouses');
select is((select has_table_privilege('authenticated', 'public.branch_warehouse_relations', 'delete')), false, 'authenticated has no delete on branch_warehouse_relations');

-- anon / service_role: zero org grants (D17)
select is((select has_table_privilege('anon', 'public.organizations', 'select')), false, 'anon has no select on organizations');
select is((select has_table_privilege('anon', 'public.branches', 'select')), false, 'anon has no select on branches');
select is((select has_table_privilege('anon', 'public.warehouses', 'select')), false, 'anon has no select on warehouses');
select is((select has_table_privilege('anon', 'public.branch_warehouse_relations', 'select')), false, 'anon has no select on branch_warehouse_relations');
select is((select has_table_privilege('service_role', 'public.organizations', 'select')), false, 'service_role has no select on organizations');
select is((select has_table_privilege('service_role', 'public.branches', 'select')), false, 'service_role has no select on branches');
select is((select has_table_privilege('service_role', 'public.warehouses', 'select')), false, 'service_role has no select on warehouses');
select is((select has_table_privilege('service_role', 'public.branch_warehouse_relations', 'select')), false, 'service_role has no select on branch_warehouse_relations');

-- RPC: exists, SECURITY DEFINER (documented D15), locked search_path, EXECUTE only for authenticated
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'current_user_permissions'), 1, 'public.current_user_permissions exists');
select is((select prosecdef from pg_proc where proname = 'current_user_permissions' and pronamespace = 'public'::regnamespace), true, 'current_user_permissions is the documented DEFINER exception');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'current_user_permissions' and exists (select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg where cfg like 'search_path=%')), 1, 'current_user_permissions sets an explicit search_path (ACC-19, D16)');
select is((select pg_get_function_result('public.current_user_permissions()'::regprocedure)), 'TABLE(code text, description text)', 'RPC returns (code, description)');
select is((select has_function_privilege('public', 'public.current_user_permissions()', 'execute')), false, 'PUBLIC has no execute on the RPC');
select is((select has_function_privilege('anon', 'public.current_user_permissions()', 'execute')), false, 'anon has no execute on the RPC');
select is((select has_function_privilege('service_role', 'public.current_user_permissions()', 'execute')), false, 'service_role has no execute on the RPC');
select is((select has_function_privilege('authenticated', 'public.current_user_permissions()', 'execute')), true, 'authenticated can execute the RPC');

-- ============================================================
-- Phase B: RLS behavior as authenticated (set role + sub claim)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- No claim at all -> zero org rows, empty RPC
select is((select count(*)::int from public.organizations), 0, 'no claim sees zero organizations');
select is((select count(*)::int from public.branches), 0, 'no claim sees zero branches');
select is((select count(*)::int from public.current_user_permissions()), 0, 'no claim gets an empty permission set');

-- user_NOM: no membership -> zero rows, no error (ACC-09 pattern)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000005', true); end $$; $sql$, 'act as user_NOM (no membership)');
select is((select count(*)::int from public.organizations), 0, 'user_NOM sees zero organizations');
select is((select count(*)::int from public.branches), 0, 'user_NOM sees zero branches');
select is((select count(*)::int from public.warehouses), 0, 'user_NOM sees zero warehouses');
select is((select count(*)::int from public.branch_warehouse_relations), 0, 'user_NOM sees zero relations');
select is((select count(*)::int from public.current_user_permissions()), 0, 'user_NOM gets an empty permission set');

-- user_IN: inactive profile -> no access (ACC-05 pattern)
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000004', true); end $$; $sql$, 'act as user_IN (inactive profile)');
select is((select count(*)::int from public.organizations), 0, 'inactive profile sees zero organizations (ACC-05)');
select is((select count(*)::int from public.current_user_permissions()), 0, 'inactive profile gets an empty permission set (ACC-05)');

-- user_A (manager@PGM): reads own org, never org B
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A (manager@PGM)');
select is((select count(*)::int from public.organizations), 1, 'user_A sees exactly one organization');
select is((select array_agg(code order by code) from public.organizations), array['PGM'], 'user_A organization is PGM only');
select is((select count(*)::int from public.branches), 2, 'user_A sees both PGM branches');
select is((select count(*)::int from public.branches where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'user_A sees no Demo-B branches');
select is((select count(*)::int from public.warehouses), 2, 'user_A sees both PGM warehouses');
select is((select count(*)::int from public.branch_warehouse_relations), 1, 'user_A sees the PGM supply relation');
select is((select count(*)::int from public.branches where id = '20000000-0000-0000-0000-000000000002'), 0, 'user_A cannot read the Demo-B branch by id');
select is((select array_agg(code order by code) from public.current_user_permissions()), array['branch.read','catalog.create','catalog.read','catalog.update','inventory.approve','inventory.import','inventory.observe','inventory.read','layout.edit','layout.publish','layout.read','organization.read','organization.write','warehouse.read'], 'user_A effective permissions = manager set');
select is((select array_agg(code || '|' || description order by code) from public.current_user_permissions()), array['branch.read|Read branches of own organization','catalog.create|Create products, variants and barcodes','catalog.read|Read product master catalog','catalog.update|Edit catalog data and active/inactive transitions','inventory.approve|Approve inventory loads and create snapshots and changes','inventory.import|Import and validate inventory files','inventory.observe|Register manual inventory observations','inventory.read|Read inventory stock, history and observations','layout.edit|Edit draft layouts: add/move/rotate/resize/lock/hide/duplicate elements and assign products','layout.publish|Publish layout versions (draft -> published) and restore versions','layout.read|Read layout plans, elements, positions and version history','organization.read|Read own organization','organization.write|Write own organization','warehouse.read|Read warehouses of own organization'], 'RPC returns code + description pairs');

-- user_X (cashier@PGM): smaller permission set
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true); end $$; $sql$, 'act as user_X (cashier@PGM)');
select is((select count(*)::int from public.organizations), 1, 'user_X sees one organization');
select is((select array_agg(code order by code) from public.current_user_permissions()), array['branch.read','catalog.read','inventory.observe','inventory.read','layout.read','organization.read'], 'user_X effective permissions = cashier set');

-- user_B (operator@Demo-B): sees only org B
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true); end $$; $sql$, 'act as user_B (operator@Demo-B)');
select is((select array_agg(code order by code) from public.organizations), array['PGM-DEMO-B'], 'user_B organization is Demo-B only');
select is((select count(*)::int from public.branches), 1, 'user_B sees the single Demo-B branch');
select is((select count(*)::int from public.warehouses), 0, 'user_B sees zero warehouses');
select is((select array_agg(code order by code) from public.current_user_permissions()), array['catalog.read','inventory.observe','inventory.read','layout.read','organization.read'], 'user_B effective permissions = operator set');

-- admin_PGM (administrator, global role): full catalog
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM (administrator)');
select is((select count(*)::int from public.organizations), 1, 'admin sees one organization');
select is((select count(*)::int from public.current_user_permissions()), 19, 'admin gets all nineteen permissions (incl. catalog.* + inventory.* + layout.*)');

select lives_ok('reset role', 'back to postgres');

select * from finish();
rollback;

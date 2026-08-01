-- PGadm — Organization Structure Tests
-- Verifies migration 00000000000002 (F1B2: organizations, branches,
-- warehouses, branch_warehouse_relations).
-- Run via: supabase db test (requires Docker)
-- Or manually: psql -f supabase/tests/test_organization_structure.sql
-- Compatibility: pgTAP 1.2.0 (no boolean overloads for index_is_unique).

begin;
select plan(66);

-- ============================================================
-- 1. Table existence (F1B2 scope)
-- ============================================================
select has_table('public', 'organizations', 'organizations table should exist');
select has_table('public', 'branches', 'branches table should exist');
select has_table('public', 'warehouses', 'warehouses table should exist');
select has_table('public', 'branch_warehouse_relations', 'branch_warehouse_relations table should exist');

-- ============================================================
-- 2. Scope exclusions: no auth tables in F1B2
-- ============================================================
select hasnt_table('public', 'users', 'users table must not exist in F1B2 scope');
select hasnt_table('public', 'profiles', 'profiles table must not exist in F1B2 scope');

-- ============================================================
-- 3. organizations: columns
-- ============================================================
select has_column('public', 'organizations', 'id', 'organizations.id should exist');
select has_column('public', 'organizations', 'code', 'organizations.code should exist');
select has_column('public', 'organizations', 'name', 'organizations.name should exist');
select has_column('public', 'organizations', 'legal_name', 'organizations.legal_name should exist');
select has_column('public', 'organizations', 'status', 'organizations.status should exist');
select has_column('public', 'organizations', 'timezone', 'organizations.timezone should exist');
select has_column('public', 'organizations', 'currency', 'organizations.currency should exist');
select has_column('public', 'organizations', 'language', 'organizations.language should exist');
select has_column('public', 'organizations', 'external_source', 'organizations.external_source should exist');
select has_column('public', 'organizations', 'external_id', 'organizations.external_id should exist');
select has_column('public', 'organizations', 'created_at', 'organizations.created_at should exist');
select has_column('public', 'organizations', 'updated_at', 'organizations.updated_at should exist');

-- 4. organizations: types
select col_type_is('public', 'organizations', 'id', 'uuid', 'organizations.id should be uuid');
select col_type_is('public', 'organizations', 'code', 'text', 'organizations.code should be text');

-- 5. organizations: NOT NULL
select col_not_null('public', 'organizations', 'id', 'organizations.id should be NOT NULL');
select col_not_null('public', 'organizations', 'code', 'organizations.code should be NOT NULL');
select col_not_null('public', 'organizations', 'name', 'organizations.name should be NOT NULL');
select col_not_null('public', 'organizations', 'created_at', 'organizations.created_at should be NOT NULL');
select col_not_null('public', 'organizations', 'updated_at', 'organizations.updated_at should be NOT NULL');

-- 6. organizations: primary key
select has_pk('public', 'organizations', 'organizations should have a primary key');

-- 7. organizations: defaults
select col_default_is('public', 'organizations', 'status', 'active'::text, 'organizations.status should default to active');
select col_default_is('public', 'organizations', 'currency', 'MXN'::text, 'organizations.currency should default to MXN');

-- ============================================================
-- 8. branches: columns
-- ============================================================
select has_column('public', 'branches', 'id', 'branches.id should exist');
select has_column('public', 'branches', 'organization_id', 'branches.organization_id should exist');
select has_column('public', 'branches', 'code', 'branches.code should exist');
select has_column('public', 'branches', 'name', 'branches.name should exist');
select has_column('public', 'branches', 'branch_type', 'branches.branch_type should exist');

-- 9. branches: NOT NULL
select col_not_null('public', 'branches', 'organization_id', 'branches.organization_id should be NOT NULL');
select col_not_null('public', 'branches', 'code', 'branches.code should be NOT NULL');
select col_not_null('public', 'branches', 'name', 'branches.name should be NOT NULL');

-- 10. branches: primary key
select has_pk('public', 'branches', 'branches should have a primary key');

-- ============================================================
-- 11. warehouses: columns
-- ============================================================
select has_column('public', 'warehouses', 'id', 'warehouses.id should exist');
select has_column('public', 'warehouses', 'organization_id', 'warehouses.organization_id should exist');
select has_column('public', 'warehouses', 'branch_id', 'warehouses.branch_id should exist');

-- 12. warehouses: NOT NULL
select col_not_null('public', 'warehouses', 'organization_id', 'warehouses.organization_id should be NOT NULL');

-- 13. warehouses: primary key
select has_pk('public', 'warehouses', 'warehouses should have a primary key');

-- ============================================================
-- 14. Foreign keys (D03 composite consistency)
-- ============================================================
select fk_ok('public', 'warehouses', array['organization_id', 'branch_id'], 'public', 'branches', array['organization_id', 'id'], 'warehouses must have composite FK to branches(organization_id, id)');
select fk_ok('public', 'branch_warehouse_relations', array['organization_id', 'branch_id'], 'public', 'branches', array['organization_id', 'id'], 'bwr must have composite FK to branches(organization_id, id)');

-- ============================================================
-- 15. Unique indexes (D03/D04/D05)
-- ============================================================
select index_is_unique('public', 'organizations', 'organizations_code_unique', 'organizations.code must be globally unique');
select index_is_unique('public', 'organizations', 'organizations_external_unique', 'organizations external ids must be unique');
select index_is_unique('public', 'branches', 'branches_organization_code_unique', 'branches.code must be unique per organization');
select index_is_unique('public', 'branches', 'branches_external_unique', 'branches external ids must be unique');
select index_is_unique('public', 'warehouses', 'warehouses_organization_code_unique', 'warehouses.code must be unique per organization');
select index_is_unique('public', 'warehouses', 'warehouses_branch_primary_unique', 'only one primary warehouse per branch');
select index_is_unique('public', 'warehouses', 'warehouses_external_unique', 'warehouses external ids must be unique');

-- ============================================================
-- 16. Server version
-- ============================================================
select is(current_setting('server_version_num')::int >= 150000, true,
  'database must run PostgreSQL 15 or newer');

-- ============================================================
-- 17. Behavioral constraints (data-level)
-- ============================================================
select lives_ok(
  'insert into public.organizations (code, name) values (''TST-ORG'', ''Test Org'')',
  'valid organization insert should succeed'
);

select throws_ok(
  'insert into public.organizations (code, name) values (''TST-ORG2'', ''   '')',
  '23514'::character(5),
  NULL,
  'blank organization name must raise check_violation'
);

select throws_ok(
  'insert into public.organizations (code, name) values (''TST-ORG'', ''Duplicate Org'')',
  '23505'::character(5),
  NULL,
  'duplicate organization code must raise unique_violation'
);

select lives_ok(
  'insert into public.branches (organization_id, code, name, branch_type) values ((select id from public.organizations where code = ''TST-ORG''), ''B1'', ''Branch One'', ''store'')',
  'valid branch insert should succeed'
);

select throws_ok(
  'insert into public.branches (organization_id, code, name, branch_type) values ((select id from public.organizations where code = ''TST-ORG''), ''  '', ''Branch Blank'', ''store'')',
  '23514'::character(5),
  NULL,
  'blank branch code must raise check_violation'
);

select throws_ok(
  'insert into public.branches (organization_id, code, name, branch_type) values ((select id from public.organizations where code = ''TST-ORG''), ''B1'', ''Branch Dup'', ''store'')',
  '23505'::character(5),
  NULL,
  'duplicate branch code within same organization must raise unique_violation'
);

select lives_ok(
  'insert into public.organizations (code, name) values (''TST-ORG2'', ''Test Org 2'')',
  'second organization insert should succeed'
);

select lives_ok(
  'insert into public.branches (organization_id, code, name, branch_type) values ((select id from public.organizations where code = ''TST-ORG2''), ''B1'', ''Branch Two'', ''store'')',
  'same branch code in a different organization should succeed (D05)'
);

select throws_ok(
  'insert into public.warehouses (organization_id, branch_id, code, name, warehouse_type) values ((select id from public.organizations where code = ''TST-ORG2''), (select id from public.branches where code = ''B1'' and organization_id = (select id from public.organizations where code = ''TST-ORG'')), ''W-MISMATCH'', ''Mismatch'', ''store_backroom'')',
  '23503'::character(5),
  NULL,
  'warehouse with organization different from its branch must raise foreign_key_violation'
);

select lives_ok(
  'insert into public.warehouses (organization_id, branch_id, code, name, warehouse_type, is_primary) values ((select id from public.organizations where code = ''TST-ORG''), (select id from public.branches where code = ''B1'' and organization_id = (select id from public.organizations where code = ''TST-ORG'')), ''W1'', ''Primary'', ''store_backroom'', true)',
  'first primary warehouse for a branch should succeed'
);

select throws_ok(
  'insert into public.warehouses (organization_id, branch_id, code, name, warehouse_type, is_primary) values ((select id from public.organizations where code = ''TST-ORG''), (select id from public.branches where code = ''B1'' and organization_id = (select id from public.organizations where code = ''TST-ORG'')), ''W2'', ''Second Primary'', ''store_backroom'', true)',
  '23505'::character(5),
  NULL,
  'second primary warehouse for the same branch must raise unique_violation'
);

select throws_ok(
  'insert into public.branches (organization_id, code, name, branch_type) values ((select id from public.organizations where code = ''TST-ORG2''), ''B2'', ''Bad Type'', ''warehouse'')',
  '23514'::character(5),
  NULL,
  'invalid branch_type must raise check_violation'
);

select lives_ok(
  'insert into public.branch_warehouse_relations (organization_id, branch_id, warehouse_id, relationship_type) values ((select id from public.organizations where code = ''TST-ORG''), (select id from public.branches where code = ''B1'' and organization_id = (select id from public.organizations where code = ''TST-ORG'')), (select id from public.warehouses where code = ''W1''), ''supply'')',
  'valid supply relation insert should succeed'
);

select throws_ok(
  'insert into public.branch_warehouse_relations (organization_id, branch_id, warehouse_id, relationship_type) values ((select id from public.organizations where code = ''TST-ORG''), (select id from public.branches where code = ''B1'' and organization_id = (select id from public.organizations where code = ''TST-ORG'')), (select id from public.warehouses where code = ''W1''), ''transfer'')',
  '23514'::character(5),
  NULL,
  'invalid relationship_type must raise check_violation'
);

select * from finish();
rollback;

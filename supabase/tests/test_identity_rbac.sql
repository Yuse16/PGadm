-- PGadm — Identity & RBAC Tests
-- Verifies migration 00000000000003 (F1B3: profiles, organization_memberships,
-- roles, permissions, role_permissions, user_role_assignments).
-- Run via: supabase db test (requires Docker)
-- Or manually: psql -f supabase/tests/test_identity_rbac.sql
-- Compatibility: pgTAP 1.2.0. Must pass on plain PostgreSQL 15 (no auth schema).
-- Structural base of 1B.3; RLS/access cases (ACC-xx) land in 1B.3C.

begin;
select plan(79);

-- ============================================================
-- 1. Table existence (F1B3 scope)
-- ============================================================
select has_table('public', 'profiles', 'profiles table should exist');
select has_table('public', 'organization_memberships', 'organization_memberships table should exist');
select has_table('public', 'roles', 'roles table should exist');
select has_table('public', 'permissions', 'permissions table should exist');
select has_table('public', 'role_permissions', 'role_permissions table should exist');
select has_table('public', 'user_role_assignments', 'user_role_assignments table should exist');

-- ============================================================
-- 2. Scope exclusions: sessions are delegated to Supabase Auth
-- ============================================================
select hasnt_table('public', 'users', 'users table must not exist (auth.users owns it)');
select hasnt_table('public', 'sessions', 'sessions table must not exist (Supabase Auth owns it)');

-- ============================================================
-- 3. profiles: columns
-- ============================================================
select has_column('public', 'profiles', 'id', 'profiles.id should exist');
select has_column('public', 'profiles', 'full_name', 'profiles.full_name should exist');
select has_column('public', 'profiles', 'email', 'profiles.email should exist');
select has_column('public', 'profiles', 'phone', 'profiles.phone should exist');
select has_column('public', 'profiles', 'status', 'profiles.status should exist');
select has_column('public', 'profiles', 'created_at', 'profiles.created_at should exist');
select has_column('public', 'profiles', 'updated_at', 'profiles.updated_at should exist');

-- 4. profiles: types
select col_type_is('public', 'profiles', 'id', 'uuid', 'profiles.id should be uuid');
select col_type_is('public', 'profiles', 'status', 'text', 'profiles.status should be text');

-- 5. profiles: NOT NULL
select col_not_null('public', 'profiles', 'id', 'profiles.id should be NOT NULL');
select col_not_null('public', 'profiles', 'status', 'profiles.status should be NOT NULL');

-- 6. profiles: primary key (1:1, D02)
select has_pk('public', 'profiles', 'profiles should have a primary key');

-- ============================================================
-- 7. organization_memberships: columns
-- ============================================================
select has_column('public', 'organization_memberships', 'organization_id', 'organization_memberships.organization_id should exist');
select has_column('public', 'organization_memberships', 'user_id', 'organization_memberships.user_id should exist');
select has_column('public', 'organization_memberships', 'status', 'organization_memberships.status should exist');

-- 8. organization_memberships: NOT NULL
select col_not_null('public', 'organization_memberships', 'organization_id', 'organization_memberships.organization_id should be NOT NULL');
select col_not_null('public', 'organization_memberships', 'user_id', 'organization_memberships.user_id should be NOT NULL');

-- 9. organization_memberships: composite primary key (D04)
select is(
  (select array(
    select a.attname::text
    from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.organization_memberships'::regclass and i.indisprimary
    order by a.attnum
  )),
  array['organization_id', 'user_id']::text[],
  'organization_memberships PK should be exactly (organization_id, user_id) (D04)'
);

-- ============================================================
-- 10. roles: columns
-- ============================================================
select has_column('public', 'roles', 'id', 'roles.id should exist');
select has_column('public', 'roles', 'organization_id', 'roles.organization_id should exist');
select has_column('public', 'roles', 'code', 'roles.code should exist');
select has_column('public', 'roles', 'name', 'roles.name should exist');
select has_column('public', 'roles', 'status', 'roles.status should exist');

-- 11. roles: NOT NULL
select col_not_null('public', 'roles', 'code', 'roles.code should be NOT NULL');
select col_not_null('public', 'roles', 'name', 'roles.name should be NOT NULL');
select col_not_null('public', 'roles', 'status', 'roles.status should be NOT NULL');

-- 12. roles: primary key
select has_pk('public', 'roles', 'roles should have a primary key');

-- ============================================================
-- 13. permissions: columns
-- ============================================================
select has_column('public', 'permissions', 'id', 'permissions.id should exist');
select has_column('public', 'permissions', 'code', 'permissions.code should exist');
select has_column('public', 'permissions', 'description', 'permissions.description should exist');
select has_column('public', 'permissions', 'status', 'permissions.status should exist');

-- 14. permissions: primary key
select has_pk('public', 'permissions', 'permissions should have a primary key');

-- 15. permissions: code unique (D08)
select index_is_unique('public', 'permissions', 'permissions_code_unique', 'permissions.code must be unique');

-- ============================================================
-- 16. role_permissions: columns
-- ============================================================
select has_column('public', 'role_permissions', 'role_id', 'role_permissions.role_id should exist');
select has_column('public', 'role_permissions', 'permission_id', 'role_permissions.permission_id should exist');

-- 17. role_permissions: primary key
select has_pk('public', 'role_permissions', 'role_permissions should have a primary key');

-- ============================================================
-- 18. user_role_assignments: columns
-- ============================================================
select has_column('public', 'user_role_assignments', 'id', 'user_role_assignments.id should exist');
select has_column('public', 'user_role_assignments', 'organization_id', 'user_role_assignments.organization_id should exist');
select has_column('public', 'user_role_assignments', 'user_id', 'user_role_assignments.user_id should exist');
select has_column('public', 'user_role_assignments', 'role_id', 'user_role_assignments.role_id should exist');
select has_column('public', 'user_role_assignments', 'branch_id', 'user_role_assignments.branch_id should exist');
select has_column('public', 'user_role_assignments', 'status', 'user_role_assignments.status should exist');

-- 19. user_role_assignments: NOT NULL
select col_not_null('public', 'user_role_assignments', 'organization_id', 'user_role_assignments.organization_id should be NOT NULL');
select col_not_null('public', 'user_role_assignments', 'user_id', 'user_role_assignments.user_id should be NOT NULL');
select col_not_null('public', 'user_role_assignments', 'role_id', 'user_role_assignments.role_id should be NOT NULL');

-- 20. user_role_assignments: primary key
select has_pk('public', 'user_role_assignments', 'user_role_assignments should have a primary key');

-- ============================================================
-- 21. Foreign keys (composite consistency, D05)
-- ============================================================
select fk_ok('public', 'organization_memberships', array['organization_id'], 'public', 'organizations', array['id'],
  'organization_memberships must reference organizations');
select fk_ok('public', 'organization_memberships', array['user_id'], 'public', 'profiles', array['id'],
  'organization_memberships must reference profiles');
select fk_ok('public', 'user_role_assignments', array['organization_id', 'user_id'], 'public', 'organization_memberships', array['organization_id', 'user_id'],
  'user_role_assignments must require an existing membership (composite FK)');
select fk_ok('public', 'user_role_assignments', array['organization_id', 'branch_id'], 'public', 'branches', array['organization_id', 'id'],
  'user_role_assignments must keep branch in the same organization (composite FK)');
select fk_ok('public', 'user_role_assignments', array['role_id'], 'public', 'roles', array['id'],
  'user_role_assignments must reference roles');
select fk_ok('public', 'role_permissions', array['role_id'], 'public', 'roles', array['id'],
  'role_permissions must reference roles');
select fk_ok('public', 'role_permissions', array['permission_id'], 'public', 'permissions', array['id'],
  'role_permissions must reference permissions');

-- ============================================================
-- 22. Unique indexes (D06 global vs organization codes)
-- ============================================================
select index_is_unique('public', 'roles', 'roles_global_code_unique', 'global role codes must be unique');
select index_is_unique('public', 'roles', 'roles_organization_code_unique', 'role codes must be unique per organization');

-- ============================================================
-- 23. Structural trigger (decision 6.1)
-- ============================================================
select has_trigger('public', 'user_role_assignments', 'user_role_assignments_role_org_check',
  'user_role_assignments must have the role/organization consistency trigger');

-- ============================================================
-- 24. Helpers: _access schema, no SECURITY DEFINER, search_path (D15/D16)
-- ============================================================
select ok(
  exists (select 1 from pg_namespace where nspname = '_access'),
  'Schema _access should exist'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_access' and p.proname = 'role_belongs_to_organization'),
  'Function _access.role_belongs_to_organization should exist'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_access' and p.proname = 'enforce_role_organization'),
  'Function _access.enforce_role_organization should exist'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_access' and p.proname = 'enforce_role_organization' and not p.prosecdef),
  'enforce_role_organization must NOT be SECURITY DEFINER (D15)'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_access' and p.proname = 'enforce_role_organization'
      and array_to_string(p.proconfig, ',') like '%search_path%'),
  'enforce_role_organization must set an explicit search_path (D16)'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_core' and p.proname = 'sync_profile'),
  'Function _core.sync_profile should exist'
);
select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '_core' and p.proname = 'sync_profile' and p.prosecdef),
  'sync_profile must be SECURITY DEFINER (documented D15 exception, migration 004)'
);

-- ============================================================
-- 25. Behavioral constraints (self-contained fixtures, rolled back)
-- ============================================================
insert into public.organizations (id, code, name)
values ('90000000-0000-0000-0000-000000000001', 'TST-I', 'Test Identity');
insert into public.organizations (id, code, name)
values ('90000000-0000-0000-0000-000000000002', 'TST-I2', 'Test Identity 2');
insert into public.profiles (id, full_name, email)
values ('90000000-0000-0000-0000-000000000101', 'U1', 'u1@test.local');
insert into public.profiles (id, full_name, email)
values ('90000000-0000-0000-0000-000000000102', 'U2', 'u2@test.local');
insert into public.branches (organization_id, code, name, branch_type)
values ('90000000-0000-0000-0000-000000000001', 'I-B1', 'IB1', 'store');
insert into public.organization_memberships (organization_id, user_id)
values ('90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000101');
insert into public.roles (id, organization_id, code, name)
values ('90000000-0000-0000-0000-000000000201', '90000000-0000-0000-0000-000000000001', 'tst-manager', 'TST Manager');
insert into public.roles (id, organization_id, code, name)
values ('90000000-0000-0000-0000-000000000202', null, 'tst-global', 'TST Global');
insert into public.roles (id, organization_id, code, name)
values ('90000000-0000-0000-0000-000000000203', '90000000-0000-0000-0000-000000000002', 'tst-other', 'TST Other');
insert into public.permissions (id, code, description)
values ('90000000-0000-0000-0000-000000000301', 'tst.read', 'TST read');
insert into public.role_permissions (role_id, permission_id)
values ('90000000-0000-0000-0000-000000000201', '90000000-0000-0000-0000-000000000301');

select throws_ok(
  'insert into public.organization_memberships (organization_id, user_id) values (''90000000-0000-0000-0000-000000000001'', ''90000000-0000-0000-0000-000000000101'')',
  '23505'::character(5),
  NULL,
  'duplicate membership (organization, user) must raise unique_violation'
);

select throws_ok(
  'update public.organization_memberships set status = ''bogus'' where organization_id = ''90000000-0000-0000-0000-000000000001'' and user_id = ''90000000-0000-0000-0000-000000000101''',
  '23514'::character(5),
  NULL,
  'invalid membership status must raise check_violation'
);

select throws_ok(
  'insert into public.user_role_assignments (organization_id, user_id, role_id) values (''90000000-0000-0000-0000-000000000001'', ''90000000-0000-0000-0000-000000000101'', ''90000000-0000-0000-0000-000000000203'')',
  '23503'::character(5),
  NULL,
  'assignment with a role of another organization must raise foreign_key_violation'
);

select lives_ok(
  'insert into public.user_role_assignments (organization_id, user_id, role_id) values (''90000000-0000-0000-0000-000000000001'', ''90000000-0000-0000-0000-000000000101'', ''90000000-0000-0000-0000-000000000202'')',
  'assignment with a global role should succeed'
);

select throws_ok(
  'insert into public.profiles (id, full_name) values (''90000000-0000-0000-0000-000000000101'', ''Dup'')',
  '23505'::character(5),
  NULL,
  'duplicate profile id must raise unique_violation (1:1 with auth.users)'
);

select throws_ok(
  'insert into public.role_permissions (role_id, permission_id) values (''90000000-0000-0000-0000-000000000201'', ''90000000-0000-0000-0000-000000000301'')',
  '23505'::character(5),
  NULL,
  'duplicate role_permissions mapping must raise unique_violation'
);

select throws_ok(
  'insert into public.roles (id, organization_id, code, name) values (''90000000-0000-0000-0000-000000000204'', ''90000000-0000-0000-0000-000000000001'', ''  '', ''Blank'')',
  '23514'::character(5),
  NULL,
  'blank role code must raise check_violation'
);

select lives_ok(
  'insert into public.roles (id, organization_id, code, name) values (''90000000-0000-0000-0000-000000000205'', ''90000000-0000-0000-0000-000000000002'', ''tst-manager'', ''TST Manager 2'')',
  'same role code in a different organization should succeed (D06)'
);

select * from finish();
rollback;

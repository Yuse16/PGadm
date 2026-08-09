-- PGadm — RLS & Access Tests (1B.3C)
-- Verifies migration 00000000000004 (RLS policies, _access helpers, minimal grants)
-- against F1B3_ACCESS_TEST_MATRIX cases ACC-01..12, ACC-15, ACC-17..21.
-- Run via: supabase db test (requires Docker) or psql -f (pgTAP).
-- Fixtures come from supabase/seed.sql (user_A/user_B/user_X/user_IN/user_NOM/
-- admin_PGM, orgs PGM + PGM-DEMO-B, roles administrator/manager/cashier/operator).
-- Test-only extras: inactive memberships for ACC-06 and an inactive role for ACC-07.
-- Compatibility: pgTAP 1.2.0, plain PostgreSQL 15 (migration 004 bootstraps the
-- anon/authenticated/service_role roles there; CI applies seed too).

begin;
select plan(140);

-- ============================================================
-- Test-only fixtures (seed already provides the base matrix)
-- ============================================================
insert into public.organization_memberships (organization_id, user_id, status)
values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'inactive'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'inactive')
on conflict (organization_id, user_id) do nothing;

insert into public.roles (id, organization_id, code, name, status)
values ('45000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000001', 'legacy', 'Legacy', 'active')
on conflict (id) do nothing;

insert into public.role_permissions (role_id, permission_id)
values ('45000000-0000-4000-8000-000000000001', '50000000-0000-0000-0000-000000000005')
on conflict (role_id, permission_id) do nothing;

insert into public.user_role_assignments (organization_id, user_id, role_id, branch_id, status)
values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '45000000-0000-4000-8000-000000000001', null, 'active')
on conflict do nothing;

-- ============================================================
-- Phase A: structure, helper semantics, ACC-18/19/20/21 (as postgres)
-- ============================================================

-- Runtime roles bootstrap (CI-safe)
select is((select rolcanlogin from pg_roles where rolname = 'anon'), false, 'anon must be NOLOGIN');
select is((select rolcanlogin from pg_roles where rolname = 'authenticated'), false, 'authenticated must be NOLOGIN');
select is((select rolcanlogin from pg_roles where rolname = 'service_role'), false, 'service_role must be NOLOGIN');

-- ACC-20: RLS enabled on all six identity tables; FORCE deliberately off (D20)
select is((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), true, 'RLS enabled on profiles (ACC-20)');
select is((select relrowsecurity from pg_class where oid = 'public.organization_memberships'::regclass), true, 'RLS enabled on organization_memberships (ACC-20)');
select is((select relrowsecurity from pg_class where oid = 'public.roles'::regclass), true, 'RLS enabled on roles (ACC-20)');
select is((select relrowsecurity from pg_class where oid = 'public.permissions'::regclass), true, 'RLS enabled on permissions (ACC-20)');
select is((select relrowsecurity from pg_class where oid = 'public.role_permissions'::regclass), true, 'RLS enabled on role_permissions (ACC-20)');
select is((select relrowsecurity from pg_class where oid = 'public.user_role_assignments'::regclass), true, 'RLS enabled on user_role_assignments (ACC-20)');
select is((select relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass), false, 'FORCE RLS must be off (D20, owner seed must keep working)');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename in ('profiles','organization_memberships','roles','permissions','role_permissions','user_role_assignments')), 22, 'exactly 22 allowlist policies');

-- Helper security model (documented D15 exceptions)
select is((select prosecdef from pg_proc where proname = 'current_user_id' and pronamespace = '_access'::regnamespace), false, 'current_user_id must be SECURITY INVOKER');
select is((select prosecdef from pg_proc where proname = 'current_organization_ids' and pronamespace = '_access'::regnamespace), true, 'current_organization_ids is the documented DEFINER exception');
select is((select prosecdef from pg_proc where proname = 'has_permission' and pronamespace = '_access'::regnamespace), true, 'has_permission is the documented DEFINER exception');
select is((select prosecdef from pg_proc where proname = 'role_in_own_orgs' and pronamespace = '_access'::regnamespace), true, 'role_in_own_orgs is the documented DEFINER exception');
select is((select prosecdef from pg_proc where proname = 'role_belongs_to_organization' and pronamespace = '_access'::regnamespace), true, 'role_belongs_to_organization is the documented DEFINER exception');
select is((select prosecdef from pg_proc where proname = 'sync_profile' and pronamespace = '_core'::regnamespace), true, 'sync_profile is the documented DEFINER exception');
select is((select prosecdef from pg_proc where proname = 'enforce_role_organization' and pronamespace = '_access'::regnamespace), false, 'enforce_role_organization must stay SECURITY INVOKER');
select is((select array_agg(n.nspname || '.' || p.proname order by n.nspname, p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('_core','_access') and p.prosecdef), array['_access.current_organization_ids','_access.has_permission','_access.role_belongs_to_organization','_access.role_in_own_orgs','_core.sync_profile'], 'exact SECURITY DEFINER whitelist (ACC-18, no unlisted definer)');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = '_access' or (n.nspname = '_core' and p.proname = 'sync_profile')), 7, 'exactly 7 identity helper functions');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where (n.nspname = '_access' or (n.nspname = '_core' and p.proname = 'sync_profile')) and exists (select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg where cfg like 'search_path=%')), 7, 'all identity helpers set an explicit search_path (ACC-19, D16)');

-- current_user_id: no claim / invalid claim / valid claim
select is((select _access.current_user_id() is null), true, 'current_user_id is NULL without any claim');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', 'not-a-uuid', true); end $$; $sql$, 'set an invalid sub claim');
select is((select _access.current_user_id() is null), true, 'current_user_id is NULL for a non-UUID claim');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'set sub claim to user_A');
select is((select _access.current_user_id()), '30000000-0000-0000-0000-000000000001'::uuid, 'current_user_id returns the sub claim');

-- current_organization_ids + ACC-06 (inactive membership excluded)
select is((select _access.current_organization_ids()), array['10000000-0000-0000-0000-000000000001']::uuid[], 'user_A active orgs only; inactive O_B membership excluded (ACC-06)');

-- ACC-05: inactive profile loses access
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000004', true); end $$; $sql$, 'set sub claim to user_IN (inactive profile)');
select is((select _access.current_organization_ids() = array[]::uuid[]), true, 'inactive profile resolves to zero orgs (ACC-05)');
select is((select _access.has_permission('organization.read')), false, 'inactive profile has no permissions (ACC-05)');
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'set sub claim back to user_A');

-- ACC-07: an active role grants; deactivating the role revokes access
select is((select _access.has_permission('role.manage')), true, 'active role grants its permission');
select lives_ok('update public.roles set status = ''inactive'' where id = ''45000000-0000-4000-8000-000000000001''', 'deactivate the legacy role');
select is((select _access.has_permission('role.manage')), false, 'inactive role revokes access (ACC-07)');
select lives_ok('update public.roles set status = ''active'' where id = ''45000000-0000-4000-8000-000000000001''', 're-activate the legacy role');
select is((select _access.has_permission('role.manage')), true, 're-activated role grants again');
select lives_ok('update public.roles set status = ''inactive'' where id = ''45000000-0000-4000-8000-000000000001''', 'deactivate the legacy role again');
select is((select _access.has_permission('role.manage')), false, 'role stays revoked once inactive (ACC-07)');

-- has_permission and role scope for user_A (legacy role is inactive now)
select is((select _access.has_permission('role.manage')), false, 'user_A lacks role.manage (ACC-10)');
select is((select _access.has_permission('user.assign')), false, 'user_A lacks user.assign (ACC-11)');
select is((select _access.has_permission('organization.write')), true, 'user_A has organization.write via the active manager role');
select is((select _access.role_in_own_orgs('40000000-0000-0000-0000-000000000004')), false, 'role of another org is not in own orgs (ACC-19)');
select is((select _access.role_in_own_orgs('40000000-0000-0000-0000-000000000001')), true, 'global role is in own orgs');
select is((select _access.role_in_own_orgs('40000000-0000-0000-0000-000000000002')), true, 'own-org role is in own orgs');
select is((select _access.role_belongs_to_organization('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001')), false, 'org B role does not belong to org A');
select is((select _access.role_belongs_to_organization('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001')), true, 'org A role belongs to org A');
select is((select _access.role_belongs_to_organization('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001')), true, 'global role belongs to any organization');

-- ACC-17: forged claims other than sub are ignored
select lives_ok($sql$ do $$ begin
  perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
  perform set_config('request.jwt.claim.role', 'administrator', true);
  perform set_config('request.jwt.claim.email', 'fake@test.local', true);
  perform set_config('request.jwt.claim.organization_id', '20000000-0000-0000-0000-000000000001', true);
end $$; $sql$, 'set user_X sub plus forged admin/org claims');
select is((select _access.has_permission('user.assign')), false, 'forged role claim grants nothing (ACC-17)');
select is((select _access.current_organization_ids()), array['10000000-0000-0000-0000-000000000001']::uuid[], 'forged org claim does not change scope (ACC-17/15)');

-- ============================================================
-- Phase B: RLS behavior as authenticated (set role + sub claim)
-- ============================================================
select lives_ok('set local role authenticated', 'act as authenticated');

-- ACC-09: authenticated with no membership -> zero rows, no error
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000005', true); end $$; $sql$, 'act as user_NOM (no membership)');
select is((select count(*)::int from public.profiles), 1, 'user_NOM sees only own profile (ACC-09)');
select is((select count(*)::int from public.profiles where id <> '30000000-0000-0000-0000-000000000005'), 0, 'user_NOM sees no other profiles');
select is((select count(*)::int from public.organization_memberships), 0, 'user_NOM sees no memberships (ACC-09)');
select is((select count(*)::int from public.roles where organization_id is not null), 0, 'user_NOM sees no organization roles (ACC-09)');
select is((select count(*)::int from public.roles), 1, 'user_NOM sees only the global role');
select is((select count(*)::int from public.user_role_assignments), 0, 'user_NOM sees no assignments');
select is((select count(*)::int from public.permissions), 0, 'user_NOM cannot read permission catalog (ACC-12)');
select is((select count(*)::int from public.role_permissions), 0, 'user_NOM cannot read role_permissions (ACC-12)');

-- user_A: reads own org, never org B
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true); end $$; $sql$, 'act as user_A');
select is((select count(*)::int from public.profiles where id = '30000000-0000-0000-0000-000000000001'), 1, 'user_A reads own profile (ACC-05 positive)');
select is((select count(*)::int from public.profiles where id = '30000000-0000-0000-0000-000000000006'), 0, 'user_A cannot read another profile');
select is((select count(*)::int from public.organization_memberships where organization_id = '10000000-0000-0000-0000-000000000001'), 4, 'user_A sees memberships of own org (ACC-01)');
select is((select count(*)::int from public.organization_memberships where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'user_A sees no org B memberships (ACC-01)');
select is((select count(*)::int from public.roles where organization_id = '10000000-0000-0000-0000-000000000001' or organization_id is null), 4, 'user_A sees global + own-org roles');
select is((select count(*)::int from public.roles where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'user_A sees no org B roles (ACC-01)');
select is((select count(*)::int from public.user_role_assignments), 2, 'user_A sees only own assignments (ACC-04/11)');
select is((select count(*)::int from public.user_role_assignments where branch_id = '10000000-0000-0000-0000-000000000002'), 1, 'user_A sees own NOG-branch assignment (ACC-04)');
select is((select count(*)::int from public.user_role_assignments where branch_id = '20000000-0000-0000-0000-000000000002'), 0, 'user_A sees no BSAL-branch assignment (ACC-04)');
select is((select count(*)::int from public.branches), 2, 'user_A reads branches of own org only (1B.3D-2 org reads)');
select is((select count(*)::int from public.branches where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'user_A sees no org B branches (1B.3D-2 org reads)');
select is((select count(*)::int from public.permissions), 0, 'user_A cannot read permission catalog (ACC-12)');
select is((select count(*)::int from public.role_permissions), 0, 'user_A cannot read role_permissions (ACC-12, no recursion)');

-- ACC-10: user_A cannot write roles
select throws_ok('insert into public.roles (organization_id, code, name) values (''10000000-0000-0000-0000-000000000001'', ''new-role'', ''New Role'')', '42501'::character(5), NULL, 'user_A attempts role insert (ACC-10)');
select is((select count(*)::int from public.roles where code = 'new-role'), 0, 'user_A cannot create a role (ACC-10)');

-- ACC-11: user_A cannot update or self-assign
select lives_ok('update public.user_role_assignments set status = ''inactive'' where organization_id = ''10000000-0000-0000-0000-000000000001'' and user_id = ''30000000-0000-0000-0000-000000000001'' and role_id = ''40000000-0000-0000-0000-000000000002''', 'user_A attempts own assignment update');
select is((select count(*)::int from public.user_role_assignments where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000001' and role_id = '40000000-0000-0000-0000-000000000002' and status = 'inactive'), 0, 'user_A cannot modify own assignment (ACC-11)');
select throws_ok('insert into public.user_role_assignments (organization_id, user_id, role_id) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000001'', ''40000000-0000-0000-0000-000000000001'')', '42501'::character(5), NULL, 'user_A attempts self-assignment (ACC-11)');
select is((select count(*)::int from public.user_role_assignments where user_id = '30000000-0000-0000-0000-000000000001' and role_id = '40000000-0000-0000-0000-000000000001'), 0, 'user_A cannot self-assign a role (ACC-11)');

-- ACC-12: user_A cannot touch the RBAC catalog
select lives_ok('update public.permissions set description = ''Hacked'' where id = ''50000000-0000-0000-0000-000000000006''', 'user_A attempts permission update');
select is((select count(*)::int from public.permissions where description = 'Hacked'), 0, 'user_A cannot update permissions (ACC-12)');
select throws_ok('insert into public.role_permissions (role_id, permission_id) values (''40000000-0000-0000-0000-000000000002'', ''50000000-0000-0000-0000-000000000006'')', '42501'::character(5), NULL, 'user_A attempts to grant a permission (ACC-12)');
select is((select count(*)::int from public.role_permissions where role_id = '40000000-0000-0000-0000-000000000002' and permission_id = '50000000-0000-0000-0000-000000000006'), 0, 'user_A cannot grant permissions (ACC-12)');

-- ACC-02 / ACC-15: user_A cannot write org B data
select throws_ok('insert into public.organization_memberships (organization_id, user_id) values (''20000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000003'')', '42501'::character(5), NULL, 'user_A attempts org B membership insert (ACC-02)');
select is((select count(*)::int from public.organization_memberships where organization_id = '20000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000003'), 0, 'user_A cannot write to org B (ACC-02)');
select lives_ok('update public.organization_memberships set status = ''inactive'' where organization_id = ''20000000-0000-0000-0000-000000000001''', 'user_A attempts org B membership update (matches no rows under RLS)');

-- ACC-05: profile update limited to own row and to granted columns
select lives_ok('update public.profiles set full_name = ''Alice'' where id = ''30000000-0000-0000-0000-000000000001''', 'user_A updates own full_name');
select is((select full_name from public.profiles where id = '30000000-0000-0000-0000-000000000001'), 'Alice', 'user_A can update own profile (ACC-05 positive)');
select throws_ok('update public.profiles set status = ''inactive'' where id = ''30000000-0000-0000-0000-000000000001''', '42501'::character(5), NULL, 'user_A cannot change own status (ACC-05 hardening)');
select lives_ok('update public.profiles set full_name = ''Eve'' where id = ''30000000-0000-0000-0000-000000000002''', 'user_A attempts to update user_B (matches no rows under RLS)');

-- admin_PGM: works in own org, isolated from org B
select lives_ok($sql$ do $$ begin perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000006', true); end $$; $sql$, 'act as admin_PGM');
select is((select _access.current_organization_ids()), array['10000000-0000-0000-0000-000000000001']::uuid[], 'admin orgs exclude the inactive O_B membership (ACC-06)');
select is((select count(*)::int from public.organization_memberships where organization_id = '20000000-0000-0000-0000-000000000001'), 0, 'admin sees no org B memberships (ACC-19)');
select lives_ok('update public.organization_memberships set status = ''inactive'' where organization_id = ''20000000-0000-0000-0000-000000000001''', 'admin attempts org B membership update (matches no rows under RLS)');
select lives_ok('update public.organization_memberships set status = ''inactive'' where organization_id = ''10000000-0000-0000-0000-000000000001'' and user_id = ''30000000-0000-0000-0000-000000000003''', 'admin deactivates a member in own org');
select is((select count(*)::int from public.organization_memberships where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000003' and status = 'inactive'), 1, 'admin manages membership in own org (ACC-16)');
select lives_ok('insert into public.organization_memberships (organization_id, user_id) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000005'')', 'admin adds a member in own org');
select is((select count(*)::int from public.organization_memberships where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000005'), 1, 'admin adds a member in own org (ACC-16)');
select lives_ok('update public.roles set name = ''Administrator v2'' where id = ''40000000-0000-0000-0000-000000000001''', 'admin updates a global role');
select is((select name from public.roles where id = '40000000-0000-0000-0000-000000000001'), 'Administrator v2', 'admin updates a global role (ACC-16)');
select lives_ok('update public.roles set name = ''Hacked'' where id = ''40000000-0000-0000-0000-000000000004''', 'admin attempts org B role update (matches no rows under RLS)');
select lives_ok('insert into public.user_role_assignments (organization_id, user_id, role_id) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000005'', ''40000000-0000-0000-0000-000000000002'')', 'admin assigns a role in own org');
select is((select count(*)::int from public.user_role_assignments where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000005'), 1, 'admin assigns a role in own org (ACC-16)');
select throws_ok('insert into public.user_role_assignments (organization_id, user_id, role_id) values (''20000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000005'', ''40000000-0000-0000-0000-000000000004'')', '42501'::character(5), NULL, 'admin attempts org B assignment (ACC-19)');
select is((select count(*)::int from public.user_role_assignments where organization_id = '20000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000005'), 0, 'admin cannot assign in org B (ACC-19)');
select throws_ok('insert into public.user_role_assignments (organization_id, user_id, role_id) values (''10000000-0000-0000-0000-000000000001'', ''30000000-0000-0000-0000-000000000005'', ''40000000-0000-0000-0000-000000000004'')', '23503'::character(5), NULL, 'cross-org role assignment blocked by structural trigger (ACC-15)');
select is((select count(*)::int from public.user_role_assignments where user_id = '30000000-0000-0000-0000-000000000005' and role_id = '40000000-0000-0000-0000-000000000004'), 0, 'no cross-org role row is created (ACC-19)');
select lives_ok('delete from public.user_role_assignments where organization_id = ''10000000-0000-0000-0000-000000000001'' and user_id = ''30000000-0000-0000-0000-000000000005'' and role_id = ''40000000-0000-0000-0000-000000000002''', 'admin removes the assignment again');
select is((select count(*)::int from public.user_role_assignments where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000005'), 0, 'admin removes an assignment in own org (ACC-16)');
select lives_ok('delete from public.organization_memberships where organization_id = ''10000000-0000-0000-0000-000000000001'' and user_id = ''30000000-0000-0000-0000-000000000005''', 'admin removes the member again');
select is((select count(*)::int from public.organization_memberships where organization_id = '10000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000005'), 0, 'admin removes a member in own org (ACC-16)');
select is((select count(*)::int from public.permissions), 19, 'admin reads the permission catalog incl. catalog.* + inventory.* + layout.* (ACC-16)');
select is((select count(*)::int from public.role_permissions), 40, 'admin reads role_permissions of own orgs (incl. test legacy role, no recursion)');
select lives_ok('insert into public.permissions (code, description) values (''audit.read'', ''Audit read'')', 'admin creates a permission');
select is((select count(*)::int from public.permissions where code = 'audit.read'), 1, 'admin creates a permission (ACC-16)');
select is((select count(*)::int from public.profiles where id = '30000000-0000-0000-0000-000000000006'), 1, 'admin reads own profile');

-- ACC-08: anon has no grants -> permission denied
select lives_ok('set local role anon', 'act as anon');
select throws_ok('select * from public.profiles', '42501'::character(5), NULL, 'anon denied on profiles (ACC-08)');
select throws_ok('select * from public.organization_memberships', '42501'::character(5), NULL, 'anon denied on organization_memberships (ACC-08)');
select throws_ok('select * from public.roles', '42501'::character(5), NULL, 'anon denied on roles (ACC-08)');
select throws_ok('select * from public.permissions', '42501'::character(5), NULL, 'anon denied on permissions (ACC-08)');
select throws_ok('select * from public.role_permissions', '42501'::character(5), NULL, 'anon denied on role_permissions (ACC-08)');
select throws_ok('select * from public.user_role_assignments', '42501'::character(5), NULL, 'anon denied on user_role_assignments (ACC-08)');

-- ACC-13: service_role has no identity grants (server-only)
select lives_ok('set local role service_role', 'act as service_role');
select throws_ok('select * from public.profiles', '42501'::character(5), NULL, 'service_role denied on profiles (ACC-13)');
select throws_ok('select * from public.roles', '42501'::character(5), NULL, 'service_role has no identity grants (ACC-13)');

select lives_ok('reset role', 'back to postgres');

-- Data-integrity verification of denied writes (postgres context, RLS bypassed)
select is((select count(*)::int from public.organization_memberships where organization_id = '20000000-0000-0000-0000-000000000001' and status = 'active'), 1, 'org B memberships untouched by user_A/admin (ACC-02/15/19)');
select is((select full_name from public.profiles where id = '30000000-0000-0000-0000-000000000002'), 'Usuario B', 'user_B profile untouched by user_A (ACC-05)');
select is((select name from public.roles where id = '40000000-0000-0000-0000-000000000004'), 'Operador', 'org B role untouched by admin (ACC-19)');
select is((select description from public.permissions where id = '50000000-0000-0000-0000-000000000006'), 'Assign roles to users', 'permission catalog untouched by user_A (ACC-12)');

-- ============================================================
-- Phase C: grant-level hardening (as postgres)
-- ============================================================
select is((select has_table_privilege('authenticated', 'public.profiles', 'insert')), false, 'authenticated has no insert on profiles');
select is((select has_column_privilege('authenticated', 'public.profiles', 'status', 'update')), false, 'authenticated cannot update status (ACC-05 hardening)');
select is((select has_column_privilege('authenticated', 'public.profiles', 'full_name', 'update')), true, 'authenticated can update full_name');
select is((select has_table_privilege('authenticated', 'public.roles', 'insert')), true, 'authenticated has policy-gated insert on roles');
select is((select has_table_privilege('service_role', 'public.profiles', 'select')), false, 'service_role has no select grant (ACC-13)');
select is((select has_table_privilege('anon', 'public.profiles', 'select')), false, 'anon has no select grant (ACC-08)');
select is((select array_agg(distinct r.rolname::text order by r.rolname::text) from pg_policies p join lateral unnest(p.roles) as r(rolname) on true where p.schemaname = 'public' and p.tablename in ('profiles','organization_memberships','roles','permissions','role_permissions','user_role_assignments')), array['authenticated'], 'all RLS policies target authenticated only (D17)');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename in ('profiles','organization_memberships','roles','permissions','role_permissions','user_role_assignments') and (qual = 'true' or with_check = 'true')), 0, 'no permissive USING(true)/WITH CHECK(true) policy (ACC-21)');

select * from finish();
rollback;

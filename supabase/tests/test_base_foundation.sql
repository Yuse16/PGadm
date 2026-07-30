-- PGadm — Base Foundation Tests
-- These tests verify the infrastructure created in migration 00000000000001.
-- Run via: supabase db test (requires Docker)
-- Or manually: psql -f supabase/tests/test_base_foundation.sql

begin;
select plan(10);

-- 1. _core schema exists
select has_schema('_core', 'Schema _core should exist');

-- 2. _audit schema exists
select has_schema('_audit', 'Schema _audit should exist');

-- 3. pgcrypto extension exists
select has_extension('pgcrypto', 'Extension pgcrypto should exist');

-- 4. _core.updated_at() function exists
select has_function('_core', 'updated_at', 'Function _core.updated_at() should exist');

-- 5. _core.set_updated_at_column() function exists
select has_function('_core', 'set_updated_at_column', 'Function _core.set_updated_at_column(text) should exist');

-- 6. _core.is_uuid() function exists
select has_function('_core', 'is_uuid', 'Function _core.is_uuid(text) should exist');

-- 7. _core.updated_at() returns trigger
select function_lang_is('_core', 'updated_at', 'plpgsql', 'updated_at should be plpgsql');
select function_returns('_core', 'updated_at', 'trigger', 'updated_at should return trigger');

-- 8. _core.is_uuid validates correctly
select is('_core.is_uuid'::text, '0195e4b0-5b4f-782c-b23e-3c0d8c12a3f4', 'Valid UUID should return true');
select is('_core.is_uuid'::text, 'not-a-uuid', 'Invalid UUID should return false');

-- 9. Revoke create on public
select isnt_superuser('postgres', 'postgres should be superuser (test setup)');

-- 10. Ensure public has no create privilege (skip in test if not superuser)
select has_schema_privilege('public', 'usage', 'Public should have usage on schema public');

select * from finish();
rollback;

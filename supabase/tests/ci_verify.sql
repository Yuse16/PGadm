-- PGadm — CI Database Verification
-- Plain SQL checks (no pgTAP dependency) executed by the CI db-validate job
-- against a freshly-migrated PostgreSQL database.

SELECT 'CI-DB-TEST: Migration applied without errors';

SELECT 'Schema _core: ' || CASE
  WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = '_core')
  THEN 'PASS' ELSE 'FAIL' END AS check_core_schema;

SELECT 'Schema _audit: ' || CASE
  WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = '_audit')
  THEN 'PASS' ELSE 'FAIL' END AS check_audit_schema;

SELECT 'Function _core.updated_at: ' || CASE
  WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = '_core' AND p.proname = 'updated_at')
  THEN 'PASS' ELSE 'FAIL' END AS check_updated_at_fn;

SELECT 'Function _core.is_uuid: ' || CASE
  WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = '_core' AND p.proname = 'is_uuid')
  THEN 'PASS' ELSE 'FAIL' END AS check_is_uuid_fn;

SELECT 'Extension pgcrypto: ' || CASE
  WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto')
  THEN 'PRESENT' ELSE 'MISSING' END AS check_pgcrypto;

SELECT 'is_uuid valid UUID: ' || CASE
  WHEN _core.is_uuid('0195e4b0-5b4f-782c-b23e-3c0d8c12a3f4') THEN 'PASS'
  ELSE 'FAIL' END AS check_uuid_valid;

SELECT 'is_uuid invalid input: ' || CASE
  WHEN _core.is_uuid('not-a-uuid') THEN 'FAIL'
  ELSE 'PASS' END AS check_uuid_invalid;

SELECT 'Revoke create on schema public: ' || CASE
  WHEN NOT has_schema_privilege('public', 'public', 'create') THEN 'PASS'
  ELSE 'FAIL' END AS check_revoke_create;

SELECT 'Public usage on schema public: ' || CASE
  WHEN has_schema_privilege('public', 'public', 'usage') THEN 'PASS'
  ELSE 'FAIL' END AS check_public_usage;

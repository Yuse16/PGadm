-- PGadm — CI Database Verification
-- pgTAP tests executed by `supabase db test` against a freshly-migrated
-- PostgreSQL database. Runs inside a transaction that is rolled back.

begin;
select plan(50);

-- ============================================================
-- Base foundation (migration 00000000000001)
-- ============================================================
select ok(
  exists (select 1 from pg_namespace where nspname = '_core'),
  'Schema _core should exist'
);

select ok(
  exists (select 1 from pg_namespace where nspname = '_audit'),
  'Schema _audit should exist'
);

select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = '_core' and p.proname = 'updated_at'),
  'Function _core.updated_at should exist'
);

select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = '_core' and p.proname = 'is_uuid'),
  'Function _core.is_uuid should exist'
);

select ok(
  exists (select 1 from pg_extension where extname = 'pgcrypto'),
  'Extension pgcrypto should exist'
);

select ok(
  _core.is_uuid('0195e4b0-5b4f-782c-b23e-3c0d8c12a3f4'),
  'is_uuid should accept a valid UUID'
);

select ok(
  not _core.is_uuid('not-a-uuid'),
  'is_uuid should reject invalid input'
);

select ok(
  not has_schema_privilege('public', 'public', 'create'),
  'Role public should NOT have create privilege on schema public'
);

select ok(
  has_schema_privilege('public', 'public', 'usage'),
  'Role public should retain usage on schema public'
);

-- ============================================================
-- Organization structure (migration 00000000000002)
-- ============================================================

-- Tables
select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'organizations' and c.relkind = 'r'),
  'Table organizations should exist'
);

select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'branches' and c.relkind = 'r'),
  'Table branches should exist'
);

select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'warehouses' and c.relkind = 'r'),
  'Table warehouses should exist'
);

select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'branch_warehouse_relations' and c.relkind = 'r'),
  'Table branch_warehouse_relations should exist'
);

select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('users', 'user_profiles', 'inventory_items')),
  'No F1B2-prohibited tables beyond the F1B3 identity, F1C catalog and F4 sales scopes'
);

-- Primary keys
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.organizations'::regclass and contype = 'p'),
  'organizations should have a primary key'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.branches'::regclass and contype = 'p'),
  'branches should have a primary key'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.warehouses'::regclass and contype = 'p'),
  'warehouses should have a primary key'
);

-- Foreign keys
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.branches'::regclass and contype = 'f' and confrelid = 'public.organizations'::regclass),
  'branches should reference organizations via FK'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.warehouses'::regclass and contype = 'f' and confrelid = 'public.branches'::regclass and conname = 'warehouses_branch_organization_fk'),
  'warehouses should have composite FK to branches (org-consistent)'
);

-- Uniqueness
select ok(
  exists (select 1 from pg_index where indexrelid = 'public.organizations_code_unique'::regclass and indisunique),
  'organizations.code should be unique'
);

select ok(
  exists (select 1 from pg_index where indexrelid = 'public.branches_organization_code_unique'::regclass and indisunique),
  'branches (organization_id, code) should be unique'
);

select ok(
  exists (select 1 from pg_index where indexrelid = 'public.warehouses_organization_code_unique'::regclass and indisunique),
  'warehouses (organization_id, code) should be unique'
);

select ok(
  exists (select 1 from pg_index where indexrelid = 'public.warehouses_branch_primary_unique'::regclass and indisunique),
  'single primary warehouse per branch should be enforced'
);

-- updated_at triggers
select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.organizations'::regclass and tgname = 'organizations_updated_at' and not tgisinternal),
  'organizations should have an updated_at trigger'
);

select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.branches'::regclass and tgname = 'branches_updated_at' and not tgisinternal),
  'branches should have an updated_at trigger'
);

select ok(
  exists (select 1 from pg_trigger where tgrelid = 'public.warehouses'::regclass and tgname = 'warehouses_updated_at' and not tgisinternal),
  'warehouses should have an updated_at trigger'
);

-- Minimal privileges
select ok(
  not has_table_privilege('public', 'public.organizations', 'select'),
  'public should not have select on organizations'
);

select ok(
  not has_table_privilege('public', 'public.branches', 'select'),
  'public should not have select on branches'
);

select ok(
  not has_table_privilege('public', 'public.warehouses', 'select'),
  'public should not have select on warehouses'
);

-- PostgreSQL 15+
select ok(
  current_setting('server_version_num')::int >= 150000,
  'PostgreSQL 15 or newer required'
);

-- ============================================================
-- Behavioral checks (data-level). Fixture inserts are guarded so a
-- missing fixture fails loudly instead of silently passing.
-- ============================================================

select lives_ok($sql$
  DO $$
  DECLARE
    v_rows bigint;
  BEGIN
    INSERT INTO public.organizations (code, name) VALUES ('CI-ORG', 'CI Org');
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'FAIL: valid organization insert did not insert one row';
    END IF;
  END $$;
$sql$, 'valid organization insert should succeed');

select throws_ok($sql$
  insert into public.organizations (code, name) values ('CI-ORG2', '   ')
$sql$, '23514'::character(5), NULL, 'blank organization name must raise check_violation');

select throws_ok($sql$
  insert into public.organizations (code, name) values ('CI-ORG', 'Duplicate')
$sql$, '23505'::character(5), NULL, 'duplicate organization code must raise unique_violation');

-- CI-ORG2 is intentionally created only here (the blank-name check above
-- does not create it). It is required by the D05 and cross-organization
-- checks that follow.
select lives_ok($sql$
  DO $$
  DECLARE
    v_rows bigint;
  BEGIN
    INSERT INTO public.organizations (code, name) VALUES ('CI-ORG2', 'CI Org 2');
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'FAIL: second organization (CI-ORG2) was not inserted';
    END IF;
  END $$;
$sql$, 'second organization (CI-ORG2) insert should succeed');

select lives_ok($sql$
  DO $$
  DECLARE
    v_rows bigint;
  BEGIN
    INSERT INTO public.branches (organization_id, code, name, branch_type)
      SELECT id, 'B1', 'Branch One', 'store' FROM public.organizations WHERE code = 'CI-ORG';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'FAIL: branch fixture was not inserted';
    END IF;
  END $$;
$sql$, 'valid branch insert should succeed');

select throws_ok($sql$
  DO $$
  DECLARE
    v_org uuid;
  BEGIN
    SELECT id INTO v_org FROM public.organizations WHERE code = 'CI-ORG';
    IF v_org IS NULL THEN
      RAISE EXCEPTION 'FAIL: fixture CI-ORG is missing';
    END IF;
    INSERT INTO public.branches (organization_id, code, name, branch_type)
      VALUES (v_org, 'B1', 'Branch Dup', 'store');
  END $$;
$sql$, '23505'::character(5), NULL, 'duplicate branch code within organization must raise unique_violation');

-- D05: the same branch code in a different organization is allowed.
select lives_ok($sql$
  DO $$
  DECLARE
    v_org2 uuid;
    v_rows bigint;
  BEGIN
    SELECT id INTO v_org2 FROM public.organizations WHERE code = 'CI-ORG2';
    IF v_org2 IS NULL THEN
      RAISE EXCEPTION 'FAIL: fixture CI-ORG2 is missing for D05 check';
    END IF;
    INSERT INTO public.branches (organization_id, code, name, branch_type)
      VALUES (v_org2, 'B1', 'Other Org', 'store');
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'FAIL: D05 branch insert did not insert one row';
    END IF;
  END $$;
$sql$, 'same branch code in a different organization should succeed (D05)');

-- Cross-organization protection via the composite FK
-- warehouses(organization_id, branch_id) -> branches(organization_id, id).
select throws_ok($sql$
  DO $$
  DECLARE
    v_org2   uuid;
    v_b1_org uuid;
  BEGIN
    SELECT id INTO v_org2 FROM public.organizations WHERE code = 'CI-ORG2';
    SELECT id INTO v_b1_org FROM public.branches
      WHERE code = 'B1'
        AND organization_id = (SELECT id FROM public.organizations WHERE code = 'CI-ORG');
    IF v_org2 IS NULL OR v_b1_org IS NULL THEN
      RAISE EXCEPTION 'FAIL: fixtures for cross-organization mismatch are missing';
    END IF;
    INSERT INTO public.warehouses (organization_id, branch_id, code, name, warehouse_type)
      VALUES (v_org2, v_b1_org, 'W-MISMATCH', 'Mismatch', 'store_backroom');
  END $$;
$sql$, '23503'::character(5), NULL, 'warehouse organization mismatch with branch must raise foreign_key_violation');

select lives_ok($sql$
  DO $$
  DECLARE
    v_rows bigint;
  BEGIN
    INSERT INTO public.warehouses (organization_id, branch_id, code, name, warehouse_type, is_primary)
      SELECT b.organization_id, b.id, 'W1', 'Primary', 'store_backroom', true
      FROM public.branches b WHERE b.code = 'B1'
        AND b.organization_id = (SELECT id FROM public.organizations WHERE code = 'CI-ORG');
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'FAIL: primary warehouse fixture was not inserted';
    END IF;
  END $$;
$sql$, 'first primary warehouse for a branch should succeed');

select throws_ok($sql$
  DO $$
  DECLARE
    v_b1 uuid;
  BEGIN
    SELECT b.id INTO v_b1 FROM public.branches b
      WHERE b.code = 'B1'
        AND b.organization_id = (SELECT id FROM public.organizations WHERE code = 'CI-ORG');
    IF v_b1 IS NULL THEN
      RAISE EXCEPTION 'FAIL: fixture B1 is missing for second-primary check';
    END IF;
    INSERT INTO public.warehouses (organization_id, branch_id, code, name, warehouse_type, is_primary)
      VALUES ((SELECT id FROM public.organizations WHERE code = 'CI-ORG'), v_b1,
              'W2', 'Second Primary', 'store_backroom', true);
  END $$;
$sql$, '23505'::character(5), NULL, 'second primary warehouse for a branch must raise unique_violation');

select throws_ok($sql$
  DO $$
  DECLARE
    v_org2 uuid;
  BEGIN
    SELECT id INTO v_org2 FROM public.organizations WHERE code = 'CI-ORG2';
    IF v_org2 IS NULL THEN
      RAISE EXCEPTION 'FAIL: fixture CI-ORG2 is missing for branch_type check';
    END IF;
    INSERT INTO public.branches (organization_id, code, name, branch_type)
      VALUES (v_org2, 'B2', 'Bad Type', 'warehouse');
  END $$;
$sql$, '23514'::character(5), NULL, 'invalid branch_type must raise check_violation');

-- ============================================================
-- Product master catalog (migration 00000000000008)
-- ============================================================

select ok(
  exists (select 1 from pg_namespace where nspname = '_catalog'),
  'Schema _catalog should exist'
);

select ok(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories', 'product_brands', 'units_of_measure', 'product_lines',
     'products', 'product_variants', 'product_barcodes') and c.relkind = 'r') = 7,
  'All 7 F1C catalog tables should exist'
);

select ok(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories', 'product_brands', 'units_of_measure', 'product_lines',
     'products', 'product_variants', 'product_barcodes') and c.relkind = 'r'
     and c.relrowsecurity) = 7,
  'All 7 F1C catalog tables should have RLS enabled'
);

select ok(
  (select count(*)::int from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories', 'product_brands', 'units_of_measure', 'product_lines',
     'products', 'product_variants', 'product_barcodes')
     and not t.tgisinternal and t.tgname like '%_updated_at') = 7,
  'All 7 F1C catalog tables should have an updated_at trigger'
);

select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in (
     'product_categories', 'product_brands', 'units_of_measure', 'product_lines',
     'products', 'product_variants', 'product_barcodes') and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')),
  'authenticated should have no DELETE privilege on any F1C catalog table (D-C14)'
);

select ok(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = '_catalog' and p.proname = 'enforce_status_transition'),
  'Function _catalog.enforce_status_transition should exist'
);

-- ============================================================
-- Sales (migration 00000000000012, F4)
-- ============================================================

select ok(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where ((n.nspname = 'public' and c.relname in (
     'customers', 'quotations', 'quotation_items', 'manual_sale_entries',
     'sales_budgets', 'cedis_requests'))
     or (n.nspname = '_audit' and c.relname = 'sales_events')) and c.relkind = 'r') = 7,
  'All 6 F4 sales tables and _audit.sales_events should exist'
);

select ok(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where ((n.nspname = 'public' and c.relname in (
     'customers', 'quotations', 'quotation_items', 'manual_sale_entries',
     'sales_budgets', 'cedis_requests'))
     or (n.nspname = '_audit' and c.relname = 'sales_events')) and c.relkind = 'r'
     and c.relrowsecurity) = 7,
  'All 6 F4 sales tables and _audit.sales_events should have RLS enabled'
);

select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where ((n.nspname = 'public' and c.relname in (
     'customers', 'quotations', 'quotation_items', 'manual_sale_entries',
     'sales_budgets', 'cedis_requests'))
     or (n.nspname = '_audit' and c.relname = 'sales_events')) and c.relkind = 'r'
     and has_table_privilege('authenticated', c.oid, 'delete')),
  'authenticated should have no DELETE privilege on any F4 sales table (D-V05/D-V14)'
);

select * from finish();
rollback;

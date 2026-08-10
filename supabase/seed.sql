-- PGadm seed
-- Phase 1B.2: demo fixtures only (decision D17 in F1B2_DECISION_MATRIX).
-- These are DEMO records used by the initial admin screen and tests.
-- No employees, phones, emails, customers, or personal data.
-- Codes 116NOG-PGM and 106SAL-PGM are "pending validation" per docs
-- (24-master-index/08) and are stored as external identifiers.
--
-- Phase 1C.2: catalog.demo fixtures (D-C01..D-C17). Demo units/brands/lines/
-- categories/products/variants/barcodes for PGM and PGM-DEMO-B only. No
-- Intelisis sync data, no price lists.
--
-- Phase 1D.2: inventory.demo fixtures (D-I01..D-I14). 4 inventory.* permissions
-- (total 15), role_permissions per the approved matrix, 2 snapshots (baseline +
-- subsequent) for NOG-01, items, changes (increase/zeroed/missing_product),
-- observations and an import template for PGM only. See F1D_TEST_PLAN §8.
--
-- Idempotent: ON CONFLICT on the unique code/indexes.

insert into public.organizations (id, code, name, status, timezone, currency, language)
values (
  '10000000-0000-0000-0000-000000000001',
  'PGM',
  'Plomería García',
  'active',
  'America/Mexico_City',
  'MXN',
  'es'
)
on conflict (code) do nothing;

insert into public.branches (
  id, organization_id, code, name, branch_type, status, timezone,
  address_line, city, state_province, postal_code, country,
  external_source, external_id
)
values (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'NOG',
  'Nogalera',
  'store',
  'active',
  'America/Mexico_City',
  null,
  null,
  null,
  null,
  'MX',
  'intelisis',
  '116NOG-PGM'
),
(
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  'SAL',
  'CEDIS Saltillo',
  'distribution_center',
  'active',
  'America/Monterrey',
  null,
  'Saltillo',
  'Coahuila',
  null,
  'MX',
  'intelisis',
  '106SAL-PGM'
)
on conflict (organization_id, code) do nothing;

insert into public.warehouses (
  id, organization_id, branch_id, code, name, warehouse_type, status, is_primary,
  external_source, external_id
)
values (
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'NOG-01',
  'Almacén Nogalera',
  'store_backroom',
  'active',
  true,
  'intelisis',
  '116NOG-PGM'
),
(
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  'SAL-01',
  'Almacén CEDIS Saltillo',
  'distribution',
  'active',
  true,
  'intelisis',
  '106SAL-PGM'
)
on conflict (organization_id, code) do nothing;

insert into public.branch_warehouse_relations (
  id, organization_id, branch_id, warehouse_id, relationship_type, priority, active,
  valid_from, valid_to, special_rules
)
values (
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000005',
  'supply',
  1,
  true,
  now(),
  null,
  null
)
on conflict (branch_id, warehouse_id, relationship_type) do nothing;

-- ============================================================
-- F1B.3 identity + RBAC fixtures (Phase 1B.3)
-- Structural fixtures for isolation tests (ACC matrix). No real
-- credentials: auth users for these profiles are created in 1B.3D
-- with the full local stack (decision D22).
-- Idempotent: ON CONFLICT (no target) for tables with partial indexes.
-- Order matters: Org B is created before roles/memberships that
-- reference it (FK dependencies). The whole identity section runs in ONE
-- transaction: with the deferred profiles_auth_user_fk (migration 005) every
-- profile must have a matching auth.users row at COMMIT, so the fixture auth
-- users are created here before the commit (1B.3D-1, decision D22).
-- ============================================================

begin;

-- Second organization for isolation tests (Org B)
insert into public.organizations (id, code, name, status, timezone, currency, language)
values (
  '20000000-0000-0000-0000-000000000001',
  'PGM-DEMO-B',
  'Plomería García Demo B',
  'active',
  'America/Mexico_City',
  'MXN',
  'es'
)
on conflict (code) do nothing;

insert into public.branches (id, organization_id, code, name, branch_type, status, country)
values (
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'BSAL',
  'Sucursal Demo B',
  'store',
  'active',
  'MX'
)
on conflict (organization_id, code) do nothing;

-- Permissions catalog
insert into public.permissions (id, code, description)
values
  ('50000000-0000-0000-0000-000000000001', 'organization.read', 'Read own organization'),
  ('50000000-0000-0000-0000-000000000002', 'organization.write', 'Write own organization'),
  ('50000000-0000-0000-0000-000000000003', 'branch.read', 'Read branches of own organization'),
  ('50000000-0000-0000-0000-000000000004', 'warehouse.read', 'Read warehouses of own organization'),
  ('50000000-0000-0000-0000-000000000005', 'role.manage', 'Manage roles and permissions'),
  ('50000000-0000-0000-0000-000000000006', 'user.assign', 'Assign roles to users'),
  ('50000000-0000-0000-0000-000000000007', 'catalog.read', 'Read product master catalog'),
  ('50000000-0000-0000-0000-000000000008', 'catalog.create', 'Create products, variants and barcodes'),
  ('50000000-0000-0000-0000-000000000009', 'catalog.update', 'Edit catalog data and active/inactive transitions'),
  ('50000000-0000-0000-0000-000000000010', 'catalog.archive', 'Discontinue products/variants'),
  ('50000000-0000-0000-0000-000000000011', 'catalog.manage', 'Manage catalog structure and restore discontinued records'),
  ('50000000-0000-0000-0000-000000000012', 'inventory.read', 'Read inventory stock, history and observations'),
  ('50000000-0000-0000-0000-000000000013', 'inventory.import', 'Import and validate inventory files'),
  ('50000000-0000-0000-0000-000000000014', 'inventory.approve', 'Approve inventory loads and create snapshots and changes'),
  ('50000000-0000-0000-0000-000000000015', 'inventory.observe', 'Register manual inventory observations'),
  ('50000000-0000-0000-0000-000000000016', 'layout.read', 'Read layout plans, elements, positions and version history'),
  ('50000000-0000-0000-0000-000000000017', 'layout.edit', 'Edit draft layouts: add/move/rotate/resize/lock/hide/duplicate elements and assign products'),
  ('50000000-0000-0000-0000-000000000018', 'layout.publish', 'Publish layout versions (draft -> published) and restore versions'),
  ('50000000-0000-0000-0000-000000000019', 'layout.manage', 'Manage layouts: archive/rename, soft-retire drafts and reassign store')
on conflict do nothing;

-- Roles: one global (administrator), organization-scoped for PGM and Demo B
insert into public.roles (id, organization_id, code, name)
values
  ('40000000-0000-0000-0000-000000000001', null, 'administrator', 'Administrador'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'manager', 'Gerente'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'cashier', 'Cajero'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'operator', 'Operador')
on conflict do nothing;

-- Role -> permission mappings (no inheritance, D10)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.id = '40000000-0000-0000-0000-000000000001' and p.code in (
    'organization.read', 'organization.write', 'branch.read', 'warehouse.read',
    'role.manage', 'user.assign', 'catalog.read', 'catalog.create',
    'catalog.update', 'catalog.archive', 'catalog.manage',
    'inventory.read', 'inventory.import', 'inventory.approve', 'inventory.observe',
    'layout.read', 'layout.edit', 'layout.publish', 'layout.manage'
  )
  or r.id = '40000000-0000-0000-0000-000000000002' and p.code in (
    'organization.read', 'organization.write', 'branch.read', 'warehouse.read',
    'catalog.read', 'catalog.create', 'catalog.update',
    'inventory.read', 'inventory.import', 'inventory.approve', 'inventory.observe',
    'layout.read', 'layout.edit', 'layout.publish'
  )
  or r.id = '40000000-0000-0000-0000-000000000003' and p.code in (
    'organization.read', 'branch.read', 'catalog.read',
    'inventory.read', 'inventory.observe',
    'layout.read'
  )
  or r.id = '40000000-0000-0000-0000-000000000004' and p.code in (
    'organization.read', 'catalog.read',
    'inventory.read', 'inventory.observe',
    'layout.read'
  )
)
on conflict do nothing;

-- Profiles (structural; auth users arrive in 1B.3D)
insert into public.profiles (id, full_name, email, status)
values
  ('30000000-0000-0000-0000-000000000001', 'Usuario A', 'user.a@pgm.local', 'active'),
  ('30000000-0000-0000-0000-000000000002', 'Usuario B', 'user.b@pgm.local', 'active'),
  ('30000000-0000-0000-0000-000000000003', 'Usuario X', 'user.x@pgm.local', 'active'),
  ('30000000-0000-0000-0000-000000000004', 'Usuario Inactivo', 'user.in@pgm.local', 'inactive'),
  ('30000000-0000-0000-0000-000000000005', 'Usuario Sin Membresia', 'user.nom@pgm.local', 'active'),
  ('30000000-0000-0000-0000-000000000006', 'Admin PGM', 'admin@pgm.local', 'active')
on conflict (id) do nothing;

-- Auth users for the structural profiles (1B.3D-1, decision D22). Must come
-- AFTER the profiles insert: the AFTER INSERT trigger _core.sync_profile()
-- fires on every auth.users insert and its ON CONFLICT DO NOTHING preserves the
-- richer profile row (full_name/status) loaded above, inside this transaction.
-- Dummy emails only (RFC 2606 *.local) and NO real credentials: encrypted_password
-- stays NULL — these are structural identities for JWT/RLS tests, not login
-- accounts. Guarded: no auth schema on plain-PG CI (migrations 003/005 no-op).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    insert into auth.users (
      id, instance_id, aud, role, email, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      created_at, updated_at
    )
    values
      ('30000000-0000-0000-0000-000000000001', null, 'authenticated', 'authenticated', 'user.a@pgm.local',   now(), '{}', '{}', false, false, now(), now()),
      ('30000000-0000-0000-0000-000000000002', null, 'authenticated', 'authenticated', 'user.b@pgm.local',   now(), '{}', '{}', false, false, now(), now()),
      ('30000000-0000-0000-0000-000000000003', null, 'authenticated', 'authenticated', 'user.x@pgm.local',   now(), '{}', '{}', false, false, now(), now()),
      ('30000000-0000-0000-0000-000000000004', null, 'authenticated', 'authenticated', 'user.in@pgm.local',  now(), '{}', '{}', false, false, now(), now()),
      ('30000000-0000-0000-0000-000000000005', null, 'authenticated', 'authenticated', 'user.nom@pgm.local', now(), '{}', '{}', false, false, now(), now()),
      ('30000000-0000-0000-0000-000000000006', null, 'authenticated', 'authenticated', 'admin@pgm.local',    now(), '{}', '{}', false, false, now(), now())
    on conflict (id) do nothing;
  end if;
end
$$;

-- Memberships: user_A/user_X/user_IN/admin_PGM in PGM, user_B in Demo B.
-- user_NOM intentionally has no membership (ACC-09).
insert into public.organization_memberships (organization_id, user_id, status)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'active'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'active')
on conflict (organization_id, user_id) do nothing;

-- Assignments: admin_PGM global, user_A manager@NOG, user_B operator@BSAL,
-- user_X cashier@NOG (insufficient for org.write), user_IN cashier@NOG.
insert into public.user_role_assignments (
  organization_id, user_id, role_id, branch_id, status
)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000001', null, 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'active'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
   '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003',
   '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'active'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004',
   '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'active')
on conflict do nothing;

commit;

-- ============================================================
-- F1C.2 catalog demo fixtures (Phase 1C.2)
-- Org-scoped demo catalog for PGM and PGM-DEMO-B (D-C07). Unit codes cover the
-- 6 kinds (D-C05). Products are born 'inactive' (D-C13) and are activated below
-- once their active variants exist. These writes run as the owner (postgres),
-- so the permission-gated status transition trigger (authenticated-only, D20)
-- does not interfere; the structural triggers (category tree, active variant)
-- apply to everyone.
-- Idempotent: ON CONFLICT (id) on every insert; the final UPDATE is a no-op on
-- re-runs (product already active).
-- ============================================================

begin;

-- Units of measure: one per kind (D-C05)
insert into public.units_of_measure (id, organization_id, code, name, kind, status)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PZA',  'Pieza',          'count',   'active'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'M',    'Metro',          'length',  'active'),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'M2',   'Metro cuadrado', 'area',    'active'),
  ('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'L',    'Litro',          'volume',  'active'),
  ('70000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'KG',   'Kilogramo',      'mass',    'active'),
  ('70000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'CAJA', 'Caja',           'package', 'active'),
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'PZA',  'Pieza',          'count',   'active')
on conflict (id) do nothing;

-- Product lines (Intelisis line reference, D-C11)
insert into public.product_lines (id, organization_id, external_id, name, status)
values
  ('70000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'TUB', 'Tubería y conexiones', 'active'),
  ('70000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'VAL', 'Válvulas y llaves',    'active'),
  ('70000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'HER', 'Herramientas',         'active'),
  ('80000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', 'GEN', 'Línea general',        'active')
on conflict (id) do nothing;

-- Brands
insert into public.product_brands (id, organization_id, code, name, status)
values
  ('70000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', 'MD-A', 'Marca Demo A', 'active'),
  ('70000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', 'MD-B', 'Marca Demo B', 'active'),
  ('80000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000001', 'MD-B', 'Marca Demo B', 'active')
on conflict (id) do nothing;

-- Categories (hierarchy <= 3 levels, D-C01)
insert into public.product_categories (id, organization_id, parent_id, code, name, status)
values
  ('70000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', null, 'TUBERIA',      'Tubería',                 'active'),
  ('70000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000031',                        'TUB-PVC',     'Tubería PVC',            'active'),
  ('70000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000032',                        'TUB-PVC-PRES', 'Tubería PVC de presión', 'active'),
  ('80000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000001', null, 'GENERAL',      'General',                'active')
on conflict (id) do nothing;

-- Products (born 'inactive', D-C13; activated below once variants exist)
insert into public.products (
  id, organization_id, external_id, description, short_name,
  brand_id, category_id, line_id, technical_description, status
)
values
  (
    '70000000-0000-0000-0000-000000000041',
    '10000000-0000-0000-0000-000000000001',
    'TUB-PVC-100',
    'Tubo de PVC hidráulico de 1 pulgada, Cédula 40',
    'Tubo PVC 1" CED 40',
    '70000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000032',
    '70000000-0000-0000-0000-000000000011',
    null,
    'inactive'
  ),
  (
    '70000000-0000-0000-0000-000000000042',
    '10000000-0000-0000-0000-000000000001',
    'VAL-GLOBO-050',
    'Válvula de globo de bronce de 1/2 pulgada',
    'Válvula globo 1/2" bronce',
    '70000000-0000-0000-0000-000000000022',
    null,
    '70000000-0000-0000-0000-000000000012',
    null,
    'inactive'
  ),
  (
    '80000000-0000-0000-0000-000000000041',
    '20000000-0000-0000-0000-000000000001',
    'P-DEMO-B',
    'Producto demo B',
    'Producto demo B',
    '80000000-0000-0000-0000-000000000021',
    '80000000-0000-0000-0000-000000000031',
    '80000000-0000-0000-0000-000000000011',
    null,
    'inactive'
  )
on conflict (id) do nothing;

-- Variants (active; SKU/barcode/pricing live here, D-C03/D-C04/D-C06)
insert into public.product_variants (
  id, organization_id, product_id, sku, display_name, format, finish,
  base_unit_id, sale_unit_id, base_units_per_sale_unit,
  pieces_per_box, square_meters_per_box, reference_price, status
)
values
  (
    '70000000-0000-0000-0000-000000000051',
    '10000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000041',
    'TUB-PVC-100-PZA',
    'Tubo PVC 1" CED 40 por pieza',
    null,
    null,
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    1,
    null,
    null,
    42.5000,
    'active'
  ),
  (
    '70000000-0000-0000-0000-000000000052',
    '10000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000041',
    'TUB-PVC-100-CJA',
    'Caja con 25 tubos PVC 1" CED 40',
    null,
    null,
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000006',
    25,
    25,
    null,
    1000.0000,
    'active'
  ),
  (
    '70000000-0000-0000-0000-000000000053',
    '10000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000042',
    'VAL-GLOBO-050-PZA',
    'Válvula globo 1/2" bronce',
    null,
    null,
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    1,
    null,
    null,
    185.5000,
    'active'
  ),
  (
    '80000000-0000-0000-0000-000000000051',
    '20000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000041',
    'P-DEMO-B-PZA',
    'Producto demo B por pieza',
    null,
    null,
    '80000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    1,
    null,
    null,
    10.0000,
    'active'
  )
on conflict (id) do nothing;

-- Barcodes (multiple per variant, one primary, D-C04)
insert into public.product_barcodes (id, organization_id, variant_id, barcode, is_primary)
values
  ('70000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000051', '7500000000017', true),
  ('70000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000051', '7500000000024', false),
  ('70000000-0000-0000-0000-000000000063', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000052', '7500000000031', true),
  ('70000000-0000-0000-0000-000000000064', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000053', '7500000000048', true),
  ('80000000-0000-0000-0000-000000000061', '20000000-0000-0000-0000-000000000001',
   '80000000-0000-0000-0000-000000000051', '7500000001000', true)
on conflict (id) do nothing;

-- Activate the demo products now that their active variants exist (D-C13).
-- No-op on re-runs (already active).
update public.products
set status = 'active'
where id in (
  '70000000-0000-0000-0000-000000000041',
  '70000000-0000-0000-0000-000000000042',
  '80000000-0000-0000-0000-000000000041'
);

commit;

-- ============================================================
-- F1D.2 inventory demo fixtures (Phase 1D.2)
-- Org-scoped for PGM only (D-I01..D-I14): 2 snapshots of warehouse NOG-01
-- (baseline + subsequent), snapshot items with reported existences, changes
-- (increase/zeroed/missing_product), observations that never mutate official
-- stock, and one import template. Fixed UUIDs in the 90000000-... range keep
-- the fixtures deterministic and idempotent (ON CONFLICT (id) DO NOTHING).
-- Writes run as the owner (postgres), so RLS deny-by-default is bypassed as
-- in the catalog section.
-- ============================================================

begin;

-- Snapshots: baseline (is_baseline, excluded from the load-unique partial
-- index) + subsequent load of the same warehouse (D-I02/D-I08).
insert into public.inventory_snapshots (
  id, organization_id, warehouse_id, source, source_file,
  report_date, imported_at, imported_by, is_baseline
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'excel',
    'inventario_nogalera_20260803.xlsx',
    '2026-08-03 09:00:00+00',
    now(),
    '30000000-0000-0000-0000-000000000006',
    true
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'excel',
    'inventario_nogalera_20260806.xlsx',
    '2026-08-06 09:00:00+00',
    now(),
    '30000000-0000-0000-0000-000000000006',
    false
  )
on conflict (id) do nothing;

-- Snapshot items: reported existences (D-I04). Variant 053 is intentionally
-- absent from the second snapshot (missing_product, D-I05).
insert into public.inventory_snapshot_items (
  id, organization_id, snapshot_id, variant_id, quantity
)
values
  ('90000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000051', 100),
  ('90000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000052', 4),
  ('90000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000053', 12),
  ('90000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000051', 130),
  ('90000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000052', 0)
on conflict (id) do nothing;

-- Changes: only-changes history between snapshots (D-I03/D-I05, IA-14..IA-18).
-- difference is STORED GENERATED; previous_quantity/new_quantity seed it.
insert into public.inventory_changes (
  id, organization_id, variant_id, warehouse_id,
  previous_quantity, new_quantity, change_type, source_snapshot_id
)
values
  ('90000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003',
   100, 130, 'increase', '90000000-0000-0000-0000-000000000002'),
  ('90000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000003',
   4, 0, 'zeroed', '90000000-0000-0000-0000-000000000002'),
  ('90000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000003',
   12, 0, 'missing_product', '90000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- Observations: never mutate official stock (D-I06); actor + date + evidence.
insert into public.inventory_observations (
  id, organization_id, variant_id, warehouse_id, observation_type,
  observed_quantity, note, evidence_url, created_by
)
values
  ('90000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000003',
   'physical_count', 128, 'Conteo físico: 128 piezas en bodega',
   'https://storage.pgm.local/evidencia/nogalera-20260806.jpg',
   '30000000-0000-0000-0000-000000000006'),
  ('90000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001',
   '70000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000003',
   'damaged', null, '3 piezas dañadas en anaquel', null,
   '30000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Import template: column mapping per file type (D-I07).
insert into public.import_templates (
  id, organization_id, name, sheet_name, column_mapping, warehouse_rules, status
)
values (
  '90000000-0000-0000-0000-000000000041',
  '10000000-0000-0000-0000-000000000001',
  'Plantilla estándar Excel',
  'Inventario',
  '{"required": ["codigo", "descripcion", "almacen", "existencia"], "optional": ["cajas", "metros_cuadrados"]}'::jsonb,
  '{"external_source": "intelisis"}'::jsonb,
  'active'
)
on conflict (id) do nothing;

-- ============================================================
-- F3.2 layout demo fixtures (Phase 3.2)
-- Org-scoped demo layout for PGM only (D-L01..D-L14): one store floor plan
-- "Nogalera" anchored to branch NOG (branch_type='store'), 14 furniture/zone
-- elements (four M1 with rail-capacity metadata as recommendation, D-L08),
-- 35 display positions (M1 rails 3/3/2 x4 + mostrador/caja), product
-- assignments reusing exact 1C demo variants (D-L06, never invented), one
-- needs_review position (D-L07) and 6 append-only version-history rows.
-- Fixed UUIDs in the A0000000-... range keep the fixtures deterministic and
-- idempotent (ON CONFLICT (id) DO NOTHING). Writes run as the owner
-- (postgres), so RLS deny-by-default is bypassed as in the catalog section.
-- ============================================================

begin;

-- Layout: store floor plan for branch NOG (D-L01), logical canvas 12x6.
insert into public.layouts (
  id, organization_id, branch_id, name, status, version, width, height,
  background_reference
)
values (
  'A0000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'Nogalera',
  'draft',
  1,
  12,
  6,
  'https://canva.pgm.local/planos/nogalera-2026-08.png'
)
on conflict (id) do nothing;

-- Elements: four M1 (rails 3/3/2 stored as metadata recommendation, D-L08) +
-- galeria/muro/escaleras/vanity/griferia/jacuzzi/boiler/mostrador/caja/parrillas.
insert into public.layout_elements (
  id, organization_id, layout_id, element_type, code, label,
  x, y, width, height, rotation, locked, z_index, metadata
)
values
  ('A0000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-01', 'Mueble M1 01',
   0.10, 0.10, 0.12, 0.06, 0, true, 1,
   '{"capacidad_riel": {"frontal": 3, "intermedio": 3, "posterior": 2}}'),
  ('A0000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-02', 'Mueble M1 02',
   0.10, 0.22, 0.12, 0.06, 0, true, 1,
   '{"capacidad_riel": {"frontal": 3, "intermedio": 3, "posterior": 2}}'),
  ('A0000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-03', 'Mueble M1 03',
   0.30, 0.10, 0.12, 0.06, 0, true, 1,
   '{"capacidad_riel": {"frontal": 3, "intermedio": 3, "posterior": 2}}'),
  ('A0000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'm1', 'M1-04', 'Mueble M1 04',
   0.30, 0.22, 0.12, 0.06, 0, true, 1,
   '{"capacidad_riel": {"frontal": 3, "intermedio": 3, "posterior": 2}}'),
  ('A0000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'galeria', 'GAL-LAMOSA-01', 'Galería Lamosa',
   0.55, 0.10, 0.20, 0.12, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'muro', 'MURO-VITROMEX-01', 'Muro Vitromex',
   0.80, 0.10, 0.10, 0.30, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'escaleras', 'ESC-01', 'Escaleras',
   0.85, 0.60, 0.10, 0.20, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'vanity', 'VAN-01', 'Vanity',
   0.10, 0.60, 0.12, 0.10, 0, false, 2, '{"paquete": "vanity-completo"}'),
  ('A0000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'griferia', 'GRI-01', 'Grifería',
   0.30, 0.60, 0.12, 0.10, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'jacuzzi', 'JAC-01', 'Jacuzzi',
   0.50, 0.60, 0.15, 0.15, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'boiler', 'BOI-01', 'Boiler',
   0.70, 0.60, 0.10, 0.10, 0, false, 2, null),
  ('A0000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'mostrador', 'MOST-01', 'Mostrador',
   0.10, 0.85, 0.25, 0.08, 0, true, 10, null),
  ('A0000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'caja', 'CAJ-01', 'Caja',
   0.70, 0.85, 0.12, 0.08, 0, true, 10, null),
  ('A0000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 'parrillas', 'PAR-01', 'Parrillas',
   0.85, 0.30, 0.10, 0.10, 0, false, 2, null)
on conflict (id) do nothing;

-- Positions: M1 rails 3/3/2 x4 (32) + mostrador (2) + caja (1). Variant
-- assignments reuse exact 1C PGM demo variants (D-L06). Position RF-B01-P01 of
-- M1-01 is needs_review (D-L07 demo: stock change detected, no auto-reassign).
insert into public.layout_positions (
  id, organization_id, element_id, position_code, variant_id, active_from, review_status
)
values
  ('A0000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P01', '70000000-0000-0000-0000-000000000051',
   '2026-08-01 09:00:00+00', 'needs_review'),
  ('A0000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P02', '70000000-0000-0000-0000-000000000051',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RF-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RI-B01-P01', '70000000-0000-0000-0000-000000000053',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RI-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RI-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RP-B01-P01', '70000000-0000-0000-0000-000000000052',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000011', 'M1-01-RP-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000111', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RF-B01-P01', '70000000-0000-0000-0000-000000000051',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000112', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RF-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000113', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RF-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000114', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RI-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000115', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RI-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000116', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RI-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000117', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RP-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000118', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000012', 'M1-02-RP-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000121', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RF-B01-P01', '70000000-0000-0000-0000-000000000052',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000122', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RF-B01-P02', '70000000-0000-0000-0000-000000000053',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000123', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RF-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000124', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RI-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000125', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RI-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000126', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RI-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000127', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RP-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000128', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000013', 'M1-03-RP-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000131', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RF-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000132', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RF-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000133', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RF-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000134', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RI-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000135', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RI-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000136', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RI-B01-P03', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000137', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RP-B01-P01', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000138', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000014', 'M1-04-RP-B01-P02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000022', 'MOST-01-V01', '70000000-0000-0000-0000-000000000051',
   '2026-08-01 09:00:00+00', 'ok'),
  ('A0000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000022', 'MOST-01-V02', null,
   null, 'ok'),
  ('A0000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000023', 'CAJ-01-P01', null,
   null, 'ok')
on conflict (id) do nothing;

-- Version history (append-only demo, D-L04/D-L06): layout created, elements
-- added, products assigned/reassigned with previous/new_variant_id, one
-- product removed. Actor = admin PGM profile.
insert into public.layout_version_history (
  id, organization_id, layout_id, version, change_type,
  element_id, position_id, previous_variant_id, new_variant_id, origin, reason, changed_by
)
values
  ('A0000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'created',
   null, null, null, null, null, 'Layout inicial Nogalera',
   '30000000-0000-0000-0000-000000000006'),
  ('A0000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'element_added',
   'A0000000-0000-0000-0000-000000000011', null, null, null, 'library', 'Agregar M1-01',
   '30000000-0000-0000-0000-000000000006'),
  ('A0000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'element_added',
   'A0000000-0000-0000-0000-000000000015', null, null, null, 'library', 'Agregar galería',
   '30000000-0000-0000-0000-000000000006'),
  ('A0000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'product_assigned',
   'A0000000-0000-0000-0000-000000000011', 'A0000000-0000-0000-0000-000000000101',
   null, '70000000-0000-0000-0000-000000000051', 'picking', 'Asignar tubo PVC',
   '30000000-0000-0000-0000-000000000006'),
  ('A0000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'product_assigned',
   'A0000000-0000-0000-0000-000000000011', 'A0000000-0000-0000-0000-000000000104',
   null, '70000000-0000-0000-0000-000000000053', 'picking', 'Asignar válvula globo',
   '30000000-0000-0000-0000-000000000006'),
  ('A0000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000001',
   'A0000000-0000-0000-0000-000000000001', 1, 'product_removed',
   'A0000000-0000-0000-0000-000000000011', 'A0000000-0000-0000-0000-000000000103',
   '70000000-0000-0000-0000-000000000051', null, 'picking', 'Retirar producto de la posición',
   '30000000-0000-0000-0000-000000000006')
on conflict (id) do nothing;

commit;

-- PGadm seed
-- Phase 1B.2: demo fixtures only (decision D17 in F1B2_DECISION_MATRIX).
-- These are DEMO records used by the initial admin screen and tests.
-- No employees, phones, emails, customers, or personal data.
-- Codes 116NOG-PGM and 106SAL-PGM are "pending validation" per docs
-- (24-master-index/08) and are stored as external identifiers.
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
-- reference it (FK dependencies).
-- ============================================================

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
  ('50000000-0000-0000-0000-000000000006', 'user.assign', 'Assign roles to users')
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
    'role.manage', 'user.assign'
  )
  or r.id = '40000000-0000-0000-0000-000000000002' and p.code in (
    'organization.read', 'organization.write', 'branch.read', 'warehouse.read'
  )
  or r.id = '40000000-0000-0000-0000-000000000003' and p.code in (
    'organization.read', 'branch.read'
  )
  or r.id = '40000000-0000-0000-0000-000000000004' and p.code in (
    'organization.read'
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

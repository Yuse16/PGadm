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

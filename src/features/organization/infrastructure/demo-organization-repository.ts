import type {
  Branch,
  BranchWarehouseRelation,
  Organization,
  OrganizationRepository,
  Warehouse,
} from "../domain";
import { OrganizationNotFoundError } from "../domain";

/**
 * Phase 1B.2 demo data source.
 *
 * The organization tables are owner-only until Phase 1B.3 enables
 * authentication, grants and RLS, so an anon-keyed client cannot read them
 * (`permission denied`). This repository serves the same fixtures that
 * `supabase/seed.sql` inserts, explicitly labelled as local demo data.
 *
 * It is selected explicitly by `createOrganizationRepository` — never as a
 * silent fallback after a failed database read. Real anon reads will be
 * enabled when Phase 1B.3 implements auth, grants and RLS.
 */

const DEMO_TIMESTAMP = "2026-07-31T00:00:00.000Z";

const ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";
const BRANCH_NOG_ID = "10000000-0000-0000-0000-000000000002";
const BRANCH_SAL_ID = "10000000-0000-0000-0000-000000000004";
const WAREHOUSE_NOG01_ID = "10000000-0000-0000-0000-000000000003";
const WAREHOUSE_SAL01_ID = "10000000-0000-0000-0000-000000000005";

const DEMO_ORGANIZATION: Organization = {
  id: ORGANIZATION_ID,
  code: "PGM",
  name: "Plomería García",
  legalName: null,
  status: "active",
  timezone: "America/Mexico_City",
  currency: "MXN",
  language: "es",
  externalSource: null,
  externalId: null,
  createdAt: DEMO_TIMESTAMP,
  updatedAt: DEMO_TIMESTAMP,
};

const DEMO_BRANCHES: Branch[] = [
  {
    id: BRANCH_NOG_ID,
    organizationId: ORGANIZATION_ID,
    code: "NOG",
    name: "Nogalera",
    branchType: "store",
    status: "active",
    timezone: "America/Mexico_City",
    address: {
      line: null,
      city: null,
      stateProvince: null,
      postalCode: null,
      country: "MX",
    },
    externalSource: "intelisis",
    externalId: "116NOG-PGM",
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    id: BRANCH_SAL_ID,
    organizationId: ORGANIZATION_ID,
    code: "SAL",
    name: "CEDIS Saltillo",
    branchType: "distribution_center",
    status: "active",
    timezone: "America/Monterrey",
    address: {
      line: null,
      city: "Saltillo",
      stateProvince: "Coahuila",
      postalCode: null,
      country: "MX",
    },
    externalSource: "intelisis",
    externalId: "106SAL-PGM",
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

const DEMO_WAREHOUSES: Warehouse[] = [
  {
    id: WAREHOUSE_NOG01_ID,
    organizationId: ORGANIZATION_ID,
    branchId: BRANCH_NOG_ID,
    code: "NOG-01",
    name: "Almacén Nogalera",
    warehouseType: "store_backroom",
    status: "active",
    isPrimary: true,
    externalSource: "intelisis",
    externalId: "116NOG-PGM",
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    id: WAREHOUSE_SAL01_ID,
    organizationId: ORGANIZATION_ID,
    branchId: BRANCH_SAL_ID,
    code: "SAL-01",
    name: "Almacén CEDIS Saltillo",
    warehouseType: "distribution",
    status: "active",
    isPrimary: true,
    externalSource: "intelisis",
    externalId: "106SAL-PGM",
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

const DEMO_RELATIONS: BranchWarehouseRelation[] = [
  {
    id: "10000000-0000-0000-0000-000000000006",
    organizationId: ORGANIZATION_ID,
    branchId: BRANCH_NOG_ID,
    warehouseId: WAREHOUSE_SAL01_ID,
    relationshipType: "supply",
    priority: 1,
    active: true,
    validFrom: DEMO_TIMESTAMP,
    validTo: null,
    specialRules: null,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

function ascendingByName(a: Branch, b: Branch): number {
  return a.name.localeCompare(b.name);
}

function warehousesForBranch(branchId: string): Warehouse[] {
  return DEMO_WAREHOUSES.filter((warehouse) => warehouse.branchId === branchId).sort(
    (a, b) => (a.isPrimary === b.isPrimary ? a.code.localeCompare(b.code) : a.isPrimary ? -1 : 1)
  );
}

export class DemoOrganizationRepository implements OrganizationRepository {
  async findOrganizationById(organizationId: string): Promise<Organization> {
    const found = DEMO_ORGANIZATION.id === organizationId ? DEMO_ORGANIZATION : null;
    if (!found) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return found;
  }

  async findOrganizationByCode(code: string): Promise<Organization> {
    if (DEMO_ORGANIZATION.code !== code) {
      throw new OrganizationNotFoundError(code);
    }
    return DEMO_ORGANIZATION;
  }

  async listBranchesByOrganization(organizationId: string): Promise<Branch[]> {
    return DEMO_BRANCHES.filter(
      (branch) => branch.organizationId === organizationId
    ).sort(ascendingByName);
  }

  async listWarehousesByBranch(branchId: string): Promise<Warehouse[]> {
    return warehousesForBranch(branchId);
  }

  async listBranchWarehouseRelations(
    organizationId: string
  ): Promise<BranchWarehouseRelation[]> {
    return DEMO_RELATIONS.filter(
      (relation) => relation.organizationId === organizationId
    ).sort((a, b) => a.priority - b.priority);
  }
}

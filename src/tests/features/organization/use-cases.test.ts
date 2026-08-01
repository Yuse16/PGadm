import { describe, it, expect } from "vitest";
import {
  getOrganizationStructure,
  listBranches,
} from "@/features/organization/application";
import type {
  Branch,
  BranchWarehouseRelation,
  Organization,
  OrganizationRepository,
  Warehouse,
} from "@/features/organization/domain";
import { OrganizationNotFoundError } from "@/features/organization/domain";

function organization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "10000000-0000-0000-0000-000000000001",
    code: "PGM",
    name: "Plomería García",
    legalName: "Plomería García, S.A. de C.V.",
    status: "active",
    timezone: "America/Mexico_City",
    currency: "MXN",
    language: "es",
    externalSource: null,
    externalId: null,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function branch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: "10000000-0000-0000-0000-000000000002",
    organizationId: "10000000-0000-0000-0000-000000000001",
    code: "NOG",
    name: "Nogalera",
    branchType: "store",
    status: "active",
    timezone: null,
    address: {
      line: null,
      city: null,
      stateProvince: null,
      postalCode: null,
      country: "MX",
    },
    externalSource: null,
    externalId: null,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function warehouse(overrides: Partial<Warehouse> = {}): Warehouse {
  return {
    id: "10000000-0000-0000-0000-000000000003",
    organizationId: "10000000-0000-0000-0000-000000000001",
    branchId: "10000000-0000-0000-0000-000000000002",
    code: "NOG-01",
    name: "Almacén Nogalera 1",
    warehouseType: "store_backroom",
    status: "active",
    isPrimary: true,
    externalSource: null,
    externalId: null,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function relation(
  overrides: Partial<BranchWarehouseRelation> = {}
): BranchWarehouseRelation {
  return {
    id: "10000000-0000-0000-0000-000000000006",
    organizationId: "10000000-0000-0000-0000-000000000001",
    branchId: "10000000-0000-0000-0000-000000000002",
    warehouseId: "10000000-0000-0000-0000-000000000005",
    relationshipType: "supply",
    priority: 1,
    active: true,
    validFrom: "2026-07-31T00:00:00.000Z",
    validTo: null,
    specialRules: null,
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

class FakeOrganizationRepository implements OrganizationRepository {
  organizations: Organization[];
  branches: Branch[];
  warehouses: Warehouse[];
  relations: BranchWarehouseRelation[];

  constructor(
    organizations: Organization[],
    branches: Branch[],
    warehouses: Warehouse[],
    relations: BranchWarehouseRelation[]
  ) {
    this.organizations = organizations;
    this.branches = branches;
    this.warehouses = warehouses;
    this.relations = relations;
  }

  async findOrganizationById(organizationId: string): Promise<Organization> {
    const found = this.organizations.find((item) => item.id === organizationId);
    if (!found) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return found;
  }

  async findOrganizationByCode(code: string): Promise<Organization> {
    const found = this.organizations.find((item) => item.code === code);
    if (!found) {
      throw new OrganizationNotFoundError(code);
    }
    return found;
  }

  async listBranchesByOrganization(organizationId: string): Promise<Branch[]> {
    return this.branches.filter((item) => item.organizationId === organizationId);
  }

  async listWarehousesByBranch(branchId: string): Promise<Warehouse[]> {
    return this.warehouses.filter((item) => item.branchId === branchId);
  }

  async listBranchWarehouseRelations(
    organizationId: string
  ): Promise<BranchWarehouseRelation[]> {
    return this.relations.filter((item) => item.organizationId === organizationId);
  }
}

describe("getOrganizationStructure use case", () => {
  const salWarehouse = warehouse({
    id: "10000000-0000-0000-0000-000000000005",
    branchId: "10000000-0000-0000-0000-000000000004",
    code: "SAL-01",
    name: "CEDIS Saltillo",
    warehouseType: "distribution",
  });

  it("assembles organization, branches and warehouses", async () => {
    const repository = new FakeOrganizationRepository(
      [organization()],
      [branch()],
      [warehouse(), salWarehouse],
      [relation()]
    );

    const result = await getOrganizationStructure(
      { organizationRepository: repository },
      { organizationId: organization().id }
    );

    expect(result.organization.name).toBe("Plomería García");
    expect(result.branches).toHaveLength(1);
    expect(result.branches[0].warehouses).toHaveLength(1);
    expect(result.branches[0].warehouses[0].isPrimary).toBe(true);
    expect(result.branches[0].relations[0].relationshipType).toBe("supply");
  });

  it("filters relations to the owning branch", async () => {
    const repository = new FakeOrganizationRepository(
      [organization()],
      [branch()],
      [warehouse(), salWarehouse],
      [
        relation(),
        relation({
          id: "10000000-0000-0000-0000-000000000007",
          branchId: "10000000-0000-0000-0000-000000000004",
        }),
      ]
    );

    const result = await getOrganizationStructure(
      { organizationRepository: repository },
      { organizationId: organization().id }
    );

    expect(result.branches[0].relations).toHaveLength(1);
  });

  it("propagates a not found error", async () => {
    const repository = new FakeOrganizationRepository([], [], [], []);

    await expect(
      getOrganizationStructure(
        { organizationRepository: repository },
        { organizationId: "missing-id" }
      )
    ).rejects.toThrow(OrganizationNotFoundError);
  });
});

describe("listBranches use case", () => {
  it("returns the branches of an organization", async () => {
    const repository = new FakeOrganizationRepository(
      [organization()],
      [branch()],
      [],
      []
    );

    const branches = await listBranches(
      { organizationRepository: repository },
      { organizationId: organization().id }
    );

    expect(branches).toHaveLength(1);
    expect(branches[0].code).toBe("NOG");
  });
});

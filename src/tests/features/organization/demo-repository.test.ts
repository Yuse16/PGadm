import { describe, it, expect } from "vitest";
import { DemoOrganizationRepository } from "@/features/organization/infrastructure/demo-organization-repository";
import { OrganizationNotFoundError } from "@/features/organization/domain";

const ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";
const BRANCH_NOG_ID = "10000000-0000-0000-0000-000000000002";
const BRANCH_SAL_ID = "10000000-0000-0000-0000-000000000004";

describe("DemoOrganizationRepository", () => {
  const repository = new DemoOrganizationRepository();

  it("finds the demo organization by code", async () => {
    const organization = await repository.findOrganizationByCode("PGM");
    expect(organization.name).toBe("Plomería García");
    expect(organization.code).toBe("PGM");
  });

  it("finds the demo organization by id", async () => {
    const organization = await repository.findOrganizationById(ORGANIZATION_ID);
    expect(organization.name).toBe("Plomería García");
  });

  it("throws a typed not-found error for an unknown code", async () => {
    await expect(repository.findOrganizationByCode("XXX")).rejects.toThrow(
      OrganizationNotFoundError
    );
  });

  it("throws a typed not-found error for an unknown id", async () => {
    await expect(repository.findOrganizationById("other-id")).rejects.toThrow(
      OrganizationNotFoundError
    );
  });

  it("lists branches sorted by name in a stable order", async () => {
    const branches = await repository.listBranchesByOrganization(ORGANIZATION_ID);
    expect(branches.map((branch) => branch.name)).toEqual([
      "CEDIS Saltillo",
      "Nogalera",
    ]);
    const again = await repository.listBranchesByOrganization(ORGANIZATION_ID);
    expect(again.map((branch) => branch.id)).toEqual(
      branches.map((branch) => branch.id)
    );
  });

  it("returns the branch warehouses with the primary one first", async () => {
    const nogWarehouses = await repository.listWarehousesByBranch(BRANCH_NOG_ID);
    expect(nogWarehouses.map((warehouse) => warehouse.code)).toEqual(["NOG-01"]);
    const salWarehouses = await repository.listWarehousesByBranch(BRANCH_SAL_ID);
    expect(salWarehouses.map((warehouse) => warehouse.code)).toEqual(["SAL-01"]);
  });

  it("returns warehouses for an unknown branch as an empty list", async () => {
    const warehouses = await repository.listWarehousesByBranch("unknown-branch");
    expect(warehouses).toEqual([]);
  });

  it("lists the supply relation with the demo seed data", async () => {
    const relations = await repository.listBranchWarehouseRelations(ORGANIZATION_ID);
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({
      branchId: BRANCH_NOG_ID,
      relationshipType: "supply",
      priority: 1,
      active: true,
    });
  });
});

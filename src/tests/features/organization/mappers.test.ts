import { describe, it, expect } from "vitest";
import type { Database } from "@/types/database";

type OrganizationsRow = Database["public"]["Tables"]["organizations"]["Row"];
type BranchesRow = Database["public"]["Tables"]["branches"]["Row"];
type WarehousesRow = Database["public"]["Tables"]["warehouses"]["Row"];
type BranchWarehouseRelationsRow =
  Database["public"]["Tables"]["branch_warehouse_relations"]["Row"];
import {
  mapOrganization,
  mapBranch,
  mapWarehouse,
  mapBranchWarehouseRelation,
} from "@/features/organization/infrastructure/mappers";
import { OrganizationDataError } from "@/features/organization/domain";

function organizationRow(overrides: Partial<OrganizationsRow> = {}): OrganizationsRow {
  return {
    id: "10000000-0000-0000-0000-000000000001",
    code: "PGM",
    name: "Plomería García",
    legal_name: "Plomería García, S.A. de C.V.",
    status: "active",
    timezone: "America/Mexico_City",
    currency: "MXN",
    language: "es",
    external_source: null,
    external_id: null,
    created_at: "2026-07-31T00:00:00.000Z",
    updated_at: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function branchRow(overrides: Partial<BranchesRow> = {}): BranchesRow {
  return {
    id: "10000000-0000-0000-0000-000000000002",
    organization_id: "10000000-0000-0000-0000-000000000001",
    code: "NOG",
    name: "Nogalera",
    branch_type: "store",
    status: "active",
    timezone: null,
    address_line: null,
    city: null,
    state_province: null,
    postal_code: null,
    country: "MX",
    external_source: null,
    external_id: null,
    created_at: "2026-07-31T00:00:00.000Z",
    updated_at: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function warehouseRow(overrides: Partial<WarehousesRow> = {}): WarehousesRow {
  return {
    id: "10000000-0000-0000-0000-000000000003",
    organization_id: "10000000-0000-0000-0000-000000000001",
    branch_id: "10000000-0000-0000-0000-000000000002",
    code: "NOG-01",
    name: "Almacén Nogalera 1",
    warehouse_type: "store_backroom",
    status: "active",
    is_primary: true,
    external_source: null,
    external_id: null,
    created_at: "2026-07-31T00:00:00.000Z",
    updated_at: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

function relationRow(
  overrides: Partial<BranchWarehouseRelationsRow> = {}
): BranchWarehouseRelationsRow {
  return {
    id: "10000000-0000-0000-0000-000000000006",
    organization_id: "10000000-0000-0000-0000-000000000001",
    branch_id: "10000000-0000-0000-0000-000000000002",
    warehouse_id: "10000000-0000-0000-0000-000000000005",
    relationship_type: "supply",
    priority: 1,
    active: true,
    valid_from: "2026-07-31T00:00:00.000Z",
    valid_to: null,
    special_rules: null,
    created_at: "2026-07-31T00:00:00.000Z",
    updated_at: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("organization mappers", () => {
  it("maps an organization row to a domain entity", () => {
    const entity = mapOrganization(organizationRow());
    expect(entity).toEqual({
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
    });
  });

  it("maps a branch row to a domain entity", () => {
    const entity = mapBranch(branchRow());
    expect(entity.organizationId).toBe("10000000-0000-0000-0000-000000000001");
    expect(entity.branchType).toBe("store");
    expect(entity.address).toEqual({
      line: null,
      city: null,
      stateProvince: null,
      postalCode: null,
      country: "MX",
    });
  });

  it("maps a warehouse row to a domain entity", () => {
    const entity = mapWarehouse(warehouseRow());
    expect(entity.isPrimary).toBe(true);
    expect(entity.warehouseType).toBe("store_backroom");
    expect(entity.branchId).toBe("10000000-0000-0000-0000-000000000002");
  });

  it("maps a relation row to a domain entity", () => {
    const entity = mapBranchWarehouseRelation(relationRow());
    expect(entity.relationshipType).toBe("supply");
    expect(entity.priority).toBe(1);
    expect(entity.active).toBe(true);
  });

  it("maps an external source pair", () => {
    const row = organizationRow({
      external_source: "intelisis",
      external_id: "ORG-42",
    });
    expect(mapOrganization(row).externalSource).toBe("intelisis");
    expect(mapOrganization(row).externalId).toBe("ORG-42");
  });

  it("throws a typed error for an unknown status", () => {
    expect(() =>
      mapOrganization(organizationRow({ status: "archived" }))
    ).toThrow(OrganizationDataError);
  });

  it("throws a typed error for an unknown branch type", () => {
    expect(() => mapBranch(branchRow({ branch_type: "headquarters" }))).toThrow(
      OrganizationDataError
    );
  });

  it("throws a typed error for an unknown warehouse type", () => {
    expect(() =>
      mapWarehouse(warehouseRow({ warehouse_type: "hub" }))
    ).toThrow(OrganizationDataError);
  });

  it("throws a typed error for an unknown relationship type", () => {
    expect(() =>
      mapBranchWarehouseRelation(relationRow({ relationship_type: "transfer" }))
    ).toThrow(OrganizationDataError);
  });

  it("throws a typed error for an unknown external source", () => {
    expect(() =>
      mapOrganization(organizationRow({ external_source: "sap" }))
    ).toThrow(OrganizationDataError);
  });
});

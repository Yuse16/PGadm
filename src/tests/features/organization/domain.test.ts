import { describe, it, expect } from "vitest";
import {
  ORGANIZATION_STATUSES,
  EXTERNAL_SOURCES,
  BRANCH_TYPES,
  WAREHOUSE_TYPES,
  RELATIONSHIP_TYPES,
  isOrganizationStatus,
  isExternalSource,
  isBranchType,
  isWarehouseType,
  isRelationshipType,
  assertOrganizationStatus,
  assertBranchType,
  assertWarehouseType,
  assertRelationshipType,
  assertRelationshipPriority,
  validateOrganizationCode,
  validateBranchCode,
  validateBranchName,
  validateWarehouseCode,
  validateWarehouseName,
  OrganizationDataError,
  OrganizationValidationError,
} from "@/features/organization/domain";

describe("organization domain", () => {
  it("defines the expected statuses", () => {
    expect(ORGANIZATION_STATUSES).toEqual(["active", "inactive"]);
  });

  it("defines the expected external sources", () => {
    expect(EXTERNAL_SOURCES).toEqual(["intelisis"]);
  });

  it("recognizes valid statuses", () => {
    expect(isOrganizationStatus("active")).toBe(true);
    expect(isOrganizationStatus("inactive")).toBe(true);
    expect(isOrganizationStatus("archived")).toBe(false);
  });

  it("asserts status values with context", () => {
    expect(assertOrganizationStatus("active", "test")).toBe("active");
    expect(() => assertOrganizationStatus("draft", "table.status")).toThrow(
      OrganizationDataError
    );
    expect(() => assertOrganizationStatus("draft", "table.status")).toThrow(
      "table.status"
    );
  });

  it("recognizes the supported external source", () => {
    expect(isExternalSource("intelisis")).toBe(true);
    expect(isExternalSource("sap")).toBe(false);
    expect(isExternalSource(null)).toBe(false);
  });

  it("validates non-blank trimmed organization codes", () => {
    expect(validateOrganizationCode("PGM")).toBe("PGM");
    expect(() => validateOrganizationCode("")).toThrow(OrganizationValidationError);
    expect(() => validateOrganizationCode(" PGM")).toThrow(OrganizationValidationError);
    expect(() => validateOrganizationCode("PGM ")).toThrow(OrganizationValidationError);
  });
});

describe("branch domain", () => {
  it("defines the expected branch types", () => {
    expect(BRANCH_TYPES).toEqual(["store", "distribution_center", "office"]);
  });

  it("recognizes valid branch types", () => {
    expect(isBranchType("store")).toBe(true);
    expect(isBranchType("distribution_center")).toBe(true);
    expect(isBranchType("office")).toBe(true);
    expect(isBranchType("warehouse")).toBe(false);
  });

  it("asserts branch types with context", () => {
    expect(assertBranchType("store", "branches.branch_type")).toBe("store");
    expect(() => assertBranchType("headquarters", "branches.branch_type")).toThrow(
      "branches.branch_type"
    );
  });

  it("validates branch codes and names", () => {
    expect(validateBranchCode("NOG")).toBe("NOG");
    expect(() => validateBranchCode(" ")).toThrow(OrganizationValidationError);
    expect(validateBranchName("Nogalera")).toBe("Nogalera");
    expect(() => validateBranchName("")).toThrow(OrganizationValidationError);
    expect(() => validateBranchName(" Nogalera")).toThrow(OrganizationValidationError);
  });
});

describe("warehouse domain", () => {
  it("defines the expected warehouse types", () => {
    expect(WAREHOUSE_TYPES).toEqual(["store_backroom", "distribution"]);
  });

  it("recognizes valid warehouse types", () => {
    expect(isWarehouseType("store_backroom")).toBe(true);
    expect(isWarehouseType("distribution")).toBe(true);
    expect(isWarehouseType("cross_dock")).toBe(false);
  });

  it("asserts warehouse types with context", () => {
    expect(assertWarehouseType("distribution", "warehouses.warehouse_type")).toBe(
      "distribution"
    );
    expect(() =>
      assertWarehouseType("hub", "warehouses.warehouse_type")
    ).toThrow("warehouses.warehouse_type");
  });

  it("validates warehouse codes and names", () => {
    expect(validateWarehouseCode("NOG-01")).toBe("NOG-01");
    expect(() => validateWarehouseCode("\t")).toThrow(OrganizationValidationError);
    expect(validateWarehouseName("Almacén Central")).toBe("Almacén Central");
    expect(() => validateWarehouseName("  ")).toThrow(OrganizationValidationError);
  });
});

describe("branch warehouse relation domain", () => {
  it("defines the expected relationship types", () => {
    expect(RELATIONSHIP_TYPES).toEqual(["supply"]);
  });

  it("recognizes valid relationship types", () => {
    expect(isRelationshipType("supply")).toBe(true);
    expect(isRelationshipType("backup")).toBe(false);
  });

  it("asserts relationship types with context", () => {
    expect(assertRelationshipType("supply", "rel.relationship_type")).toBe("supply");
    expect(() =>
      assertRelationshipType("transfer", "rel.relationship_type")
    ).toThrow("rel.relationship_type");
  });

  it("requires a positive integer priority", () => {
    expect(assertRelationshipPriority(1, "rel.priority")).toBe(1);
    expect(() => assertRelationshipPriority(0, "rel.priority")).toThrow(
      OrganizationDataError
    );
    expect(() => assertRelationshipPriority(1.5, "rel.priority")).toThrow(
      OrganizationDataError
    );
    expect(() => assertRelationshipPriority(Number.NaN, "rel.priority")).toThrow(
      OrganizationDataError
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  assertNonNegativeNumber,
  assertNullablePositiveNumber,
  assertPositiveNumber,
  assertProductStatus,
  assertReferenceStatus,
  assertUnitKind,
  CATALOG_PERMISSIONS,
  CatalogDataError,
  CatalogNotFoundError,
  CatalogValidationError,
  isCatalogPermission,
  isProductStatus,
  isReferenceStatus,
  isUnitKind,
  normalizeOptionalText,
  requireEntity,
  validateRequiredText,
  validateUnitKind,
  UNIT_KINDS,
} from "@/features/catalog/domain";

describe("status validators", () => {
  it("recognizes product statuses", () => {
    expect(isProductStatus("active")).toBe(true);
    expect(isProductStatus("inactive")).toBe(true);
    expect(isProductStatus("discontinued")).toBe(true);
    expect(isProductStatus("deleted")).toBe(false);
    expect(isProductStatus(42)).toBe(false);
  });

  it("asserts product status and throws a data error otherwise", () => {
    expect(assertProductStatus("active", "products.status")).toBe("active");
    expect(() => assertProductStatus("bogus", "products.status")).toThrow(
      CatalogDataError
    );
  });

  it("recognizes reference statuses", () => {
    expect(isReferenceStatus("active")).toBe(true);
    expect(isReferenceStatus("inactive")).toBe(true);
    expect(isReferenceStatus("discontinued")).toBe(false);
  });

  it("asserts reference status and throws a data error otherwise", () => {
    expect(assertReferenceStatus("inactive", "categories.status")).toBe("inactive");
    expect(() => assertReferenceStatus("discontinued", "categories.status")).toThrow(
      CatalogDataError
    );
  });
});

describe("unit kind validators", () => {
  it("exposes the six dimensional kinds", () => {
    expect(UNIT_KINDS).toEqual(["count", "length", "area", "volume", "mass", "package"]);
  });

  it("recognizes valid kinds", () => {
    expect(isUnitKind("length")).toBe(true);
    expect(isUnitKind("volume")).toBe(true);
    expect(isUnitKind("other")).toBe(false);
  });

  it("asserts a kind and throws a data error otherwise", () => {
    expect(assertUnitKind("mass", "units_of_measure.kind")).toBe("mass");
    expect(() => assertUnitKind("bogus", "units_of_measure.kind")).toThrow(
      CatalogDataError
    );
  });

  it("validates a kind with a validation error", () => {
    expect(validateUnitKind("package", "kind")).toBe("package");
    expect(() => validateUnitKind("bogus", "kind")).toThrow(CatalogValidationError);
  });
});

describe("text and number validators", () => {
  it("rejects blank and untrimmed required text", () => {
    expect(validateRequiredText("PVC", "description")).toBe("PVC");
    expect(() => validateRequiredText("", "description")).toThrow(
      CatalogValidationError
    );
    expect(() => validateRequiredText("  ", "description")).toThrow(
      CatalogValidationError
    );
    expect(() => validateRequiredText("  PVC", "description")).toThrow(
      CatalogValidationError
    );
  });

  it("normalizes optional text to null", () => {
    expect(normalizeOptionalText(null, "external_id")).toBeNull();
    expect(normalizeOptionalText(undefined, "external_id")).toBeNull();
    expect(normalizeOptionalText("", "external_id")).toBeNull();
    expect(normalizeOptionalText("E-1", "external_id")).toBe("E-1");
    expect(() => normalizeOptionalText("  E-1", "external_id")).toThrow(
      CatalogValidationError
    );
  });

  it("asserts positive and non-negative numbers", () => {
    expect(assertPositiveNumber(3, "base_units_per_sale_unit")).toBe(3);
    expect(() => assertPositiveNumber(0, "field")).toThrow(CatalogValidationError);
    expect(() => assertPositiveNumber(-1, "field")).toThrow(CatalogValidationError);
    expect(() => assertPositiveNumber(Number.NaN, "field")).toThrow(
      CatalogValidationError
    );

    expect(assertNonNegativeNumber(null, "reference_price")).toBeNull();
    expect(assertNonNegativeNumber(0, "reference_price")).toBe(0);
    expect(() => assertNonNegativeNumber(-1, "reference_price")).toThrow(
      CatalogValidationError
    );

    expect(assertNullablePositiveNumber(null, "pieces_per_box")).toBeNull();
    expect(assertNullablePositiveNumber(5, "pieces_per_box")).toBe(5);
    expect(() => assertNullablePositiveNumber(0, "pieces_per_box")).toThrow(
      CatalogValidationError
    );
  });
});

describe("permissions", () => {
  it("exposes the five catalog permission codes", () => {
    expect(CATALOG_PERMISSIONS).toEqual([
      "catalog.read",
      "catalog.create",
      "catalog.update",
      "catalog.archive",
      "catalog.manage",
    ]);
  });

  it("recognizes catalog permissions", () => {
    expect(isCatalogPermission("catalog.manage")).toBe(true);
    expect(isCatalogPermission("organization.read")).toBe(false);
  });
});

describe("requireEntity", () => {
  it("returns the value when present", () => {
    expect(requireEntity({ id: "1" }, "product", "1")).toEqual({ id: "1" });
  });

  it("throws a not found error when null", () => {
    expect(() => requireEntity(null, "product", "missing")).toThrow(
      CatalogNotFoundError
    );
  });
});

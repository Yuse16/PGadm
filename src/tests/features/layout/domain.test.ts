import { describe, it, expect } from "vitest";
import {
  LayoutDataError,
  LayoutValidationError,
  assertIntegerZIndex,
  assertLayoutChangeType,
  assertLayoutElementType,
  assertLayoutReviewStatus,
  assertLayoutStatus,
  assertNonNegativeDimension,
  assertNullablePositiveDimension,
  assertPositiveVersion,
  assertRotation,
  assertUnitCoordinate,
  isLayoutPermission,
  normalizeMetadata,
  normalizeOptionalText,
  validateRequiredText,
} from "@/features/layout/domain";

describe("layout status/element/change/review validators", () => {
  it("accepts the draft/published/archived statuses (LA-6)", () => {
    expect(assertLayoutStatus("draft")).toBe("draft");
    expect(assertLayoutStatus("published")).toBe("published");
    expect(assertLayoutStatus("archived")).toBe("archived");
    expect(() => assertLayoutStatus("deleted")).toThrow(LayoutDataError);
  });

  it("accepts the FURNITURE element types and rejects unknown ones (LA-6)", () => {
    expect(assertLayoutElementType("m1")).toBe("m1");
    expect(assertLayoutElementType("mostrador")).toBe("mostrador");
    expect(assertLayoutElementType("caja")).toBe("caja");
    expect(() => assertLayoutElementType("silla")).toThrow(LayoutDataError);
  });

  it("accepts the append-only change types", () => {
    expect(assertLayoutChangeType("created")).toBe("created");
    expect(assertLayoutChangeType("product_assigned")).toBe("product_assigned");
    expect(assertLayoutChangeType("restored")).toBe("restored");
    expect(() => assertLayoutChangeType("deleted")).toThrow(LayoutDataError);
  });

  it("accepts ok/needs_review and rejects anything else", () => {
    expect(assertLayoutReviewStatus("ok")).toBe("ok");
    expect(assertLayoutReviewStatus("needs_review")).toBe("needs_review");
    expect(() => assertLayoutReviewStatus("blocked")).toThrow(LayoutDataError);
  });

  it("isLayoutPermission matches the seeded layout.* codes (LA-29)", () => {
    expect(isLayoutPermission("layout.read")).toBe(true);
    expect(isLayoutPermission("layout.edit")).toBe(true);
    expect(isLayoutPermission("layout.publish")).toBe(true);
    expect(isLayoutPermission("layout.manage")).toBe(true);
    expect(isLayoutPermission("layout.delete")).toBe(false);
  });
});

describe("canonical text validation", () => {
  it("accepts trimmed non-blank text", () => {
    expect(validateRequiredText("M1-01", "code")).toBe("M1-01");
  });

  it("rejects blank, whitespace-only and untrimmed values", () => {
    expect(() => validateRequiredText("", "code")).toThrow(LayoutValidationError);
    expect(() => validateRequiredText("   ", "code")).toThrow(LayoutValidationError);
    expect(() => validateRequiredText(" M1-01", "code")).toThrow(LayoutValidationError);
  });

  it("normalizes optional text to null", () => {
    expect(normalizeOptionalText(null, "label")).toBeNull();
    expect(normalizeOptionalText(undefined, "label")).toBeNull();
    expect(normalizeOptionalText("M1", "label")).toBe("M1");
    expect(() => normalizeOptionalText("  ", "label")).toThrow(LayoutValidationError);
  });
});

describe("geometry validators (D-L03, LA-10)", () => {
  it("asserts normalized 0-1 coordinates", () => {
    expect(assertUnitCoordinate(0, "x")).toBe(0);
    expect(assertUnitCoordinate(0.75, "x")).toBe(0.75);
    expect(assertUnitCoordinate(1, "x")).toBe(1);
    expect(() => assertUnitCoordinate(1.1, "x")).toThrow(LayoutValidationError);
    expect(() => assertUnitCoordinate(-0.1, "x")).toThrow(LayoutValidationError);
    expect(() => assertUnitCoordinate(Number.NaN, "x")).toThrow(LayoutValidationError);
  });

  it("asserts non-negative dimensions", () => {
    expect(assertNonNegativeDimension(0.12, "width")).toBe(0.12);
    expect(assertNonNegativeDimension(0, "width")).toBe(0);
    expect(() => assertNonNegativeDimension(-1, "width")).toThrow(LayoutValidationError);
  });

  it("asserts rotation in [0, 360)", () => {
    expect(assertRotation(0, "rotation")).toBe(0);
    expect(assertRotation(90, "rotation")).toBe(90);
    expect(() => assertRotation(360, "rotation")).toThrow(LayoutValidationError);
    expect(() => assertRotation(-5, "rotation")).toThrow(LayoutValidationError);
  });

  it("asserts nullable positive canvas dimensions", () => {
    expect(assertNullablePositiveDimension(null, "width")).toBeNull();
    expect(assertNullablePositiveDimension(12, "width")).toBe(12);
    expect(() => assertNullablePositiveDimension(0, "width")).toThrow(LayoutValidationError);
    expect(() => assertNullablePositiveDimension(-3, "width")).toThrow(LayoutValidationError);
  });

  it("asserts integer version and z-index", () => {
    expect(assertPositiveVersion(1, "version")).toBe(1);
    expect(() => assertPositiveVersion(0, "version")).toThrow(LayoutValidationError);
    expect(() => assertPositiveVersion(1.5, "version")).toThrow(LayoutValidationError);
    expect(assertIntegerZIndex(10, "z_index")).toBe(10);
    expect(() => assertIntegerZIndex(1.5, "z_index")).toThrow(LayoutValidationError);
  });

  it("normalizes metadata to object or null", () => {
    expect(normalizeMetadata(null)).toBeNull();
    expect(normalizeMetadata({ capacidad_riel: { frontal: 3 } })).toEqual({
      capacidad_riel: { frontal: 3 },
    });
    expect(() => normalizeMetadata([1, 2] as never)).toThrow(LayoutValidationError);
  });
});

import { CatalogDataError, CatalogValidationError } from "./catalog-errors";

/**
 * Lifecycle status for products and variants (D-C13/D-C14).
 * Reference tables (categories, brands, lines, units) only use
 * active | inactive.
 */
export const PRODUCT_STATUSES = ["active", "inactive", "discontinued"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const REFERENCE_STATUSES = ["active", "inactive"] as const;
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

export function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === "string" &&
    (PRODUCT_STATUSES as readonly string[]).includes(value)
  );
}

export function assertProductStatus(
  value: unknown,
  context: string
): ProductStatus {
  if (!isProductStatus(value)) {
    throw new CatalogDataError(`Invalid product status in ${context}: ${String(value)}`);
  }
  return value;
}

export function isReferenceStatus(value: unknown): value is ReferenceStatus {
  return (
    typeof value === "string" &&
    (REFERENCE_STATUSES as readonly string[]).includes(value)
  );
}

export function assertReferenceStatus(
  value: unknown,
  context: string
): ReferenceStatus {
  if (!isReferenceStatus(value)) {
    throw new CatalogDataError(`Invalid reference status in ${context}: ${String(value)}`);
  }
  return value;
}

/**
 * Canonical text validation used by every mandatory code/name/description
 * field. Mirrors the DB `CHECK (x = btrim(x) and x <> '')` constraints.
 */
export function validateRequiredText(value: string, field: string): string {
  if (value !== value.trim() || value === "") {
    throw new CatalogValidationError(
      `Invalid ${field}: expected a non-blank, trimmed value but received "${value}"`
    );
  }
  return value;
}

/**
 * Optional text that must be trimmed and non-empty when provided (mirrors
 * `external_id is null or (external_id = btrim(external_id) and external_id <> '')`).
 * Returns null when the input is null/undefined/empty.
 */
export function normalizeOptionalText(
  value: string | null | undefined,
  field: string
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === "") {
    return null;
  }
  if (value !== value.trim()) {
    throw new CatalogValidationError(
      `Invalid ${field}: expected null or a non-blank, trimmed value but received "${value}"`
    );
  }
  return value;
}

export function assertPositiveNumber(
  value: number,
  field: string
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new CatalogValidationError(
      `Invalid ${field}: expected a number greater than zero but received ${String(value)}`
    );
  }
  return value;
}

export function assertNonNegativeNumber(
  value: number | null,
  field: string
): number | null {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new CatalogValidationError(
      `Invalid ${field}: expected null or a non-negative number but received ${String(value)}`
    );
  }
  return value;
}

export function assertNullablePositiveNumber(
  value: number | null,
  field: string
): number | null {
  if (value === null) {
    return null;
  }
  return assertPositiveNumber(value, field);
}

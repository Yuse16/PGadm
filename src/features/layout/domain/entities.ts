import { LayoutDataError, LayoutValidationError } from "./layout-errors";

export const LAYOUT_STATUSES = ["draft", "published", "archived"] as const;
export type LayoutStatus = (typeof LAYOUT_STATUSES)[number];

export const LAYOUT_ELEMENT_TYPES = [
  "m1",
  "galeria",
  "muro",
  "escaleras",
  "vanity",
  "banos",
  "griferia",
  "jacuzzi",
  "boiler",
  "parrillas",
  "mallas_fachaletas",
  "adhesivos",
  "ambiente",
  "mostrador",
  "caja",
  "zona",
  "otro",
] as const;
export type LayoutElementType = (typeof LAYOUT_ELEMENT_TYPES)[number];

export const LAYOUT_CHANGE_TYPES = [
  "created",
  "element_added",
  "element_changed",
  "element_moved",
  "element_rotated",
  "element_resized",
  "element_locked",
  "element_hidden",
  "element_duplicated",
  "product_assigned",
  "product_removed",
  "published",
  "restored",
] as const;
export type LayoutChangeType = (typeof LAYOUT_CHANGE_TYPES)[number];

export const LAYOUT_REVIEW_STATUSES = ["ok", "needs_review"] as const;
export type LayoutReviewStatus = (typeof LAYOUT_REVIEW_STATUSES)[number];

/**
 * Structured floor plan anchored to a store branch (D-L01). status drives the
 * editing workflow: edition happens on draft only (D-L04); archived is a soft
 * retirement, never a DELETE (D-L14). width/height are the logical canvas
 * scale used to interpret normalized 0-1 coordinates (D-L03).
 * `backgroundReference` is only a reference to the Canva plan, never the model
 * (D-L05).
 */
export interface Layout {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  status: LayoutStatus;
  version: number;
  width: number | null;
  height: number | null;
  backgroundReference: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture/zone inside a layout (D-L02/D-L09). code is the permanent
 * hierarchical location ID, unique per layout (LOCATION_ID_SYSTEM). Coordinates
 * are normalized 0-1 (D-L03); rotation in degrees [0, 360). locked blocks
 * move/rotate/resize via the use cases (LA-11). `metadata` carries per-type
 * composition rules (e.g. M1 rail capacities 3/3/2) as recommendation, not as a
 * hardcoded CHECK (D-L08). Hiding is stored as `metadata.hidden` because the
 * model has no dedicated column (LAYOUT_EDITING_RULES).
 */
export interface LayoutElement {
  id: string;
  organizationId: string;
  layoutId: string;
  elementType: LayoutElementType;
  code: string;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  zIndex: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Display position inside an element (D-L02/D-L06). variant_id references the
 * exact 1C catalog variant; NULL = empty position. review_status marks
 * positions whose assigned stock changed (D-L07): the layout NEVER
 * auto-reassigns the product.
 */
export interface LayoutPosition {
  id: string;
  organizationId: string;
  elementId: string;
  positionCode: string;
  variantId: string | null;
  activeFrom: string | null;
  activeTo: string | null;
  reviewStatus: LayoutReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Append-only version/position history (D-L04/D-L06). product assignments keep
 * previous/new_variant_id so each position conserves its current + previous
 * products; restoring a version creates a 'restored' event and never deletes
 * the restored version (LA-13). origin/destination are the edit
 * source/destination (LAYOUT_EDITING_RULES); reason is the optional motive.
 */
export interface LayoutVersionEntry {
  id: string;
  organizationId: string;
  layoutId: string;
  version: number;
  changeType: LayoutChangeType;
  elementId: string | null;
  positionId: string | null;
  previousVariantId: string | null;
  newVariantId: string | null;
  origin: string | null;
  destination: string | null;
  reason: string | null;
  changedBy: string;
  createdAt: string;
}

export function isLayoutStatus(value: string): value is LayoutStatus {
  return (LAYOUT_STATUSES as readonly string[]).includes(value);
}

export function assertLayoutStatus(value: string): LayoutStatus {
  if (!isLayoutStatus(value)) {
    throw new LayoutDataError(`Invalid layout status: ${value}`);
  }
  return value;
}

export function isLayoutElementType(value: string): value is LayoutElementType {
  return (LAYOUT_ELEMENT_TYPES as readonly string[]).includes(value);
}

export function assertLayoutElementType(value: string): LayoutElementType {
  if (!isLayoutElementType(value)) {
    throw new LayoutDataError(`Invalid layout element type: ${value}`);
  }
  return value;
}

export function isLayoutChangeType(value: string): value is LayoutChangeType {
  return (LAYOUT_CHANGE_TYPES as readonly string[]).includes(value);
}

export function assertLayoutChangeType(value: string): LayoutChangeType {
  if (!isLayoutChangeType(value)) {
    throw new LayoutDataError(`Invalid layout change type: ${value}`);
  }
  return value;
}

export function isLayoutReviewStatus(value: string): value is LayoutReviewStatus {
  return (LAYOUT_REVIEW_STATUSES as readonly string[]).includes(value);
}

export function assertLayoutReviewStatus(value: string): LayoutReviewStatus {
  if (!isLayoutReviewStatus(value)) {
    throw new LayoutDataError(`Invalid layout review status: ${value}`);
  }
  return value;
}

/** Canonical text validation (DB CHECK x = btrim(x) and x <> ''). */
export function validateRequiredText(value: string, field: string): string {
  if (typeof value !== "string" || value === "" || value !== value.trim()) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected a non-blank, trimmed string but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

export function normalizeOptionalText(value: string | null | undefined, field: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return validateRequiredText(value, field);
}

/** Normalized canvas coordinate: 0-1 (D-L03, LA-10). */
export function assertUnitCoordinate(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected a number in [0, 1] but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

/** Non-negative normalized dimension (DB CHECK width >= 0 / height >= 0). */
export function assertNonNegativeDimension(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected a non-negative number but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

/** Rotation in degrees: [0, 360) (DB CHECK rotation >= 0 and rotation < 360). */
export function assertRotation(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 360) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected a number in [0, 360) but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

/** Optional logical canvas dimension: null or > 0 (DB CHECK width/height positive). */
export function assertNullablePositiveDimension(
  value: number | null | undefined,
  field: string
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected a positive number or null but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

export function assertPositiveVersion(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected an integer >= 1 but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

export function assertIntegerZIndex(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new LayoutValidationError(
      `Invalid ${field}: expected an integer but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

export function normalizeMetadata(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new LayoutValidationError("Invalid metadata: expected an object or null");
  }
  return value;
}

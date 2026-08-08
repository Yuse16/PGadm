import { CatalogDataError, CatalogValidationError } from "./catalog-errors";
import type { ReferenceStatus } from "./status";

export const UNIT_KINDS = [
  "count",
  "length",
  "area",
  "volume",
  "mass",
  "package",
] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export interface Unit {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  kind: UnitKind;
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UnitDraft {
  code: string;
  name: string;
  kind: UnitKind;
}

export function isUnitKind(value: unknown): value is UnitKind {
  return (
    typeof value === "string" && (UNIT_KINDS as readonly string[]).includes(value)
  );
}

export function assertUnitKind(value: unknown, context: string): UnitKind {
  if (!isUnitKind(value)) {
    throw new CatalogDataError(`Invalid unit kind in ${context}: ${String(value)}`);
  }
  return value;
}

export function validateUnitKind(value: unknown, field: string): UnitKind {
  if (!isUnitKind(value)) {
    throw new CatalogValidationError(
      `Invalid ${field}: expected one of ${UNIT_KINDS.join(", ")} but received ${String(value)}`
    );
  }
  return value;
}

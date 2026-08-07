import { InventoryDataError, InventoryValidationError } from "./inventory-errors";

export const INVENTORY_SNAPSHOT_SOURCES = ["excel", "cube", "manual", "intelisis"] as const;
export type InventorySnapshotSource = (typeof INVENTORY_SNAPSHOT_SOURCES)[number];

export const INVENTORY_CHANGE_TYPES = [
  "increase",
  "decrease",
  "zeroed",
  "recovered",
  "new_product",
  "missing_product",
] as const;
export type InventoryChangeType = (typeof INVENTORY_CHANGE_TYPES)[number];

export const INVENTORY_OBSERVATION_TYPES = [
  "physical_count",
  "damaged",
  "reserved",
  "wrong_location",
  "missing_label",
  "difference",
] as const;
export type InventoryObservationType = (typeof INVENTORY_OBSERVATION_TYPES)[number];

export const IMPORT_TEMPLATE_STATUSES = ["active", "inactive"] as const;
export type ImportTemplateStatus = (typeof IMPORT_TEMPLATE_STATUSES)[number];

/**
 * Column mapping for an import template (D-I07): the file column names that a
 * load must/should carry. `required` must cover the four logical fields
 * (code/description/warehouse/existence); a file missing any required column
 * is never imported silently. Optional columns (quantity, boxes,
 * square_meters) map derived fields. Shape mirrors the seeded jsonb
 * `{"required": [...], "optional": [...]}` (1D.2).
 */
export interface ImportColumnMapping {
  required: string[];
  optional: string[];
}

/**
 * Optional rule linking a detected warehouse to an existing 1B.2 warehouse
 * (D-I08). `warehouseId` is the organization-scoped warehouses.id.
 */
export interface WarehouseRule {
  detected: string;
  warehouseId: string;
}

/**
 * Logical photo of an approved inventory load, per warehouse (D-I02/D-I08).
 * `reportDate` keeps the exact source date; stock shown as "existencia
 * reportada" with that date (D-I04).
 */
export interface InventorySnapshot {
  id: string;
  organizationId: string;
  warehouseId: string;
  source: InventorySnapshotSource;
  sourceFile: string | null;
  reportDate: string;
  importedAt: string;
  importedBy: string | null;
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reported existence per variant inside a snapshot (D-I01). Immutable once the
 * snapshot is approved. boxes/squareMeters stay null unless confirmed
 * conversion factors exist (D-I09).
 */
export interface InventorySnapshotItem {
  id: string;
  organizationId: string;
  snapshotId: string;
  variantId: string;
  quantity: number;
  boxes: number | null;
  squareMeters: number | null;
  createdAt: string;
}

/**
 * Difference between two snapshots, only for variants whose value changed
 * (D-I03). Append-only history. `difference` = newQuantity - previousQuantity
 * (test IA-18). missing_product means absent from the file, not stock zero
 * (D-I05).
 */
export interface InventoryChange {
  id: string;
  organizationId: string;
  variantId: string;
  warehouseId: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  changeType: InventoryChangeType;
  detectedAt: string;
  sourceSnapshotId: string;
  createdAt: string;
}

/**
 * Manual observation (physical count, damage, reservation, ...). Never mutates
 * the official stock (D-I06). evidence_url is URL text only; Storage upload is
 * deferred (D-C17).
 */
export interface InventoryObservation {
  id: string;
  organizationId: string;
  variantId: string;
  warehouseId: string;
  observationType: InventoryObservationType;
  observedQuantity: number | null;
  note: string | null;
  evidenceUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Column mapping per file type (D-I07). Deactivated via status, never deleted.
 */
export interface ImportTemplate {
  id: string;
  organizationId: string;
  name: string;
  sheetName: string | null;
  columnMapping: ImportColumnMapping;
  warehouseRules: WarehouseRule[] | null;
  status: ImportTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export function isInventorySnapshotSource(value: string): value is InventorySnapshotSource {
  return (INVENTORY_SNAPSHOT_SOURCES as readonly string[]).includes(value);
}

export function assertInventorySnapshotSource(value: string): InventorySnapshotSource {
  if (!isInventorySnapshotSource(value)) {
    throw new InventoryDataError(`Invalid snapshot source: ${value}`);
  }
  return value;
}

export function isInventoryChangeType(value: string): value is InventoryChangeType {
  return (INVENTORY_CHANGE_TYPES as readonly string[]).includes(value);
}

export function assertInventoryChangeType(value: string): InventoryChangeType {
  if (!isInventoryChangeType(value)) {
    throw new InventoryDataError(`Invalid change type: ${value}`);
  }
  return value;
}

export function isInventoryObservationType(value: string): value is InventoryObservationType {
  return (INVENTORY_OBSERVATION_TYPES as readonly string[]).includes(value);
}

export function assertInventoryObservationType(value: string): InventoryObservationType {
  if (!isInventoryObservationType(value)) {
    throw new InventoryDataError(`Invalid observation type: ${value}`);
  }
  return value;
}

export function isImportTemplateStatus(value: string): value is ImportTemplateStatus {
  return (IMPORT_TEMPLATE_STATUSES as readonly string[]).includes(value);
}

export function assertImportTemplateStatus(value: string): ImportTemplateStatus {
  if (!isImportTemplateStatus(value)) {
    throw new InventoryDataError(`Invalid import template status: ${value}`);
  }
  return value;
}

/** Canonical text validation (DB CHECK x = btrim(x) and x <> ''). */
export function validateRequiredText(value: string, field: string): string {
  if (typeof value !== "string" || value === "" || value !== value.trim()) {
    throw new InventoryValidationError(
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

export function assertNonNegativeNumber(value: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InventoryValidationError(
      `Invalid ${field}: expected a non-negative number but received ${JSON.stringify(value)}`
    );
  }
  return value;
}

export function assertNullableNonNegativeNumber(
  value: number | null | undefined,
  field: string
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return assertNonNegativeNumber(value, field);
}

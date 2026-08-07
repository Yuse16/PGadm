import { randomUUID } from "node:crypto";
import type { InventoryReferenceCatalog } from "../domain";
import { InventoryValidationError } from "../domain";

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Normalizes and validates an ISO report date (exact source date, D-I02/D-I04). */
export function validateReportDate(value: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InventoryValidationError(
      `Invalid report_date: expected an ISO date string but received ${JSON.stringify(value)}`
    );
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new InventoryValidationError(
      `Invalid report_date: not a parseable date (${value})`
    );
  }
  return new Date(parsed.toISOString()).toISOString();
}

export async function requireVariantReference(
  references: InventoryReferenceCatalog,
  organizationId: string,
  variantId: string
): Promise<void> {
  const variant = await references.findVariantById(organizationId, variantId);
  if (variant === null) {
    throw new InventoryValidationError(
      `Invalid variant_id: variant does not exist in organization ${organizationId}`
    );
  }
}

export async function requireWarehouseReference(
  references: InventoryReferenceCatalog,
  organizationId: string,
  warehouseId: string
): Promise<void> {
  const warehouse = await references.findWarehouseById(organizationId, warehouseId);
  if (warehouse === null) {
    throw new InventoryValidationError(
      `Invalid warehouse_id: warehouse does not exist in organization ${organizationId}`
    );
  }
}

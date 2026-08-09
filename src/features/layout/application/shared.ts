import { randomUUID } from "node:crypto";
import type { LayoutReferenceCatalog } from "../domain";
import { LayoutValidationError } from "../domain";

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Validates and normalizes an ISO timestamp. */
export function validateIsoTimestamp(value: string, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LayoutValidationError(
      `Invalid ${field}: expected an ISO timestamp string but received ${JSON.stringify(value)}`
    );
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new LayoutValidationError(
      `Invalid ${field}: not a parseable date (${value})`
    );
  }
  return new Date(parsed.toISOString()).toISOString();
}

/** The layout anchors to a store branch (branch_type='store', D-L01). */
export async function requireStoreBranchReference(
  references: LayoutReferenceCatalog,
  organizationId: string,
  branchId: string
): Promise<void> {
  const branch = await references.findBranchById(organizationId, branchId);
  if (branch === null || branch.branchType !== "store") {
    throw new LayoutValidationError(
      `Invalid branch_id: expected a store branch (branch_type='store') in organization ${organizationId}`
    );
  }
}

export async function requireVariantReference(
  references: LayoutReferenceCatalog,
  organizationId: string,
  variantId: string
): Promise<void> {
  const variant = await references.findVariantById(organizationId, variantId);
  if (variant === null) {
    throw new LayoutValidationError(
      `Invalid variant_id: variant does not exist in organization ${organizationId}`
    );
  }
}

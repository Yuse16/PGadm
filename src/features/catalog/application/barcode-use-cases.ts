import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso } from "./shared";
import type { Barcode, CatalogActor } from "../domain";
import {
  CATALOG_CREATE,
  CATALOG_UPDATE,
  CatalogUnsupportedOperationError,
  CatalogValidationError,
  requireEntity,
  validateRequiredText,
} from "../domain";

export interface AddBarcodeInput {
  actor: CatalogActor;
  organizationId: string;
  variantId: string;
  barcode: string;
  isPrimary: boolean;
}

export async function addBarcode(
  context: CatalogContext,
  input: AddBarcodeInput
): Promise<Barcode> {
  const { actor, organizationId, variantId, isPrimary } = input;
  actor.requirePermission(CATALOG_CREATE);
  assertActorOrganization(actor, organizationId);

  requireEntity(
    await context.productRepository.findVariantById(organizationId, variantId),
    "variant",
    variantId
  );

  const value = validateRequiredText(input.barcode, "barcode");
  const existing = await context.productRepository.findBarcodeByValue(
    organizationId,
    value
  );
  if (existing !== null) {
    throw new CatalogValidationError(`Duplicate barcode: ${value}`);
  }

  if (isPrimary) {
    const barcodes = await context.productRepository.listBarcodesByVariant(
      organizationId,
      variantId
    );
    if (barcodes.some((barcode) => barcode.isPrimary)) {
      throw new CatalogValidationError(
        "Variant already has a primary barcode; use changePrimaryBarcode"
      );
    }
  }

  const createdAt = nowIso();
  const entity: Barcode = {
    id: newId(),
    organizationId,
    variantId,
    barcode: value,
    isPrimary,
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.productRepository.insertBarcode(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "barcode",
    entityId: created.id,
    detail: created.barcode,
  });

  return created;
}

export interface ChangePrimaryBarcodeInput {
  actor: CatalogActor;
  organizationId: string;
  variantId: string;
  barcodeId: string;
}

export async function changePrimaryBarcode(
  context: CatalogContext,
  input: ChangePrimaryBarcodeInput
): Promise<Barcode> {
  const { actor, organizationId, variantId, barcodeId } = input;
  actor.requirePermission(CATALOG_UPDATE);
  assertActorOrganization(actor, organizationId);

  requireEntity(
    await context.productRepository.findVariantById(organizationId, variantId),
    "variant",
    variantId
  );

  const barcodes = await context.productRepository.listBarcodesByVariant(
    organizationId,
    variantId
  );
  const target = requireEntity(
    barcodes.find((barcode) => barcode.id === barcodeId) ?? null,
    "barcode",
    barcodeId
  );

  if (target.isPrimary) {
    return target;
  }

  const currentPrimary = barcodes.find((barcode) => barcode.isPrimary);
  if (currentPrimary !== undefined && currentPrimary.id !== target.id) {
    await context.productRepository.updateBarcode({
      ...currentPrimary,
      isPrimary: false,
      updatedAt: nowIso(),
    });
  }

  const promoted: Barcode = { ...target, isPrimary: true, updatedAt: nowIso() };
  const saved = await context.productRepository.updateBarcode(promoted);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "update",
    entityType: "barcode",
    entityId: saved.id,
    detail: saved.barcode,
  });

  return saved;
}

export interface RemoveBarcodeInput {
  actor: CatalogActor;
  organizationId: string;
  variantId: string;
  barcodeId: string;
}

/**
 * The data model does not support removing a barcode: `product_barcodes` has
 * no status column (no soft delete) and D-C14 forbids physical DELETE. A
 * barcode can only be re-pointed via changePrimaryBarcode. This guard exists
 * so callers get a typed, testable error instead of a silent no-op.
 */
export async function removeBarcode(
  _context: CatalogContext,
  input: RemoveBarcodeInput
): Promise<never> {
  const { actor, organizationId } = input;
  actor.requirePermission(CATALOG_UPDATE);
  assertActorOrganization(actor, organizationId);
  throw new CatalogUnsupportedOperationError(
    "RemoveBarcode is not supported: product_barcodes has no status column and D-C14 forbids physical DELETE"
  );
}

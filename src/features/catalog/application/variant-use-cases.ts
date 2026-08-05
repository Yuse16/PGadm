import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, normalizeVariantDraft } from "./shared";
import type { CatalogActor, ProductStatus, Variant, VariantDraft } from "../domain";
import {
  CATALOG_ARCHIVE,
  CATALOG_CREATE,
  CATALOG_MANAGE,
  CATALOG_UPDATE,
  CatalogValidationError,
  requireEntity,
} from "../domain";

export interface CreateVariantInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  variant: VariantDraft;
}

export async function createVariant(
  context: CatalogContext,
  input: CreateVariantInput
): Promise<Variant> {
  const { actor, organizationId, productId } = input;
  actor.requirePermission(CATALOG_CREATE);
  assertActorOrganization(actor, organizationId);

  requireEntity(
    await context.productRepository.findProductById(organizationId, productId),
    "product",
    productId
  );

  const draft = await normalizeVariantDraft(context, organizationId, input.variant);
  await assertSkuAvailable(context, organizationId, draft.sku, null);

  const createdAt = nowIso();
  const entity: Variant = {
    id: newId(),
    organizationId,
    productId,
    sku: draft.sku,
    displayName: draft.displayName,
    format: draft.format,
    finish: draft.finish,
    baseUnitId: draft.baseUnitId,
    saleUnitId: draft.saleUnitId,
    baseUnitsPerSaleUnit: draft.baseUnitsPerSaleUnit,
    piecesPerBox: draft.piecesPerBox,
    squareMetersPerBox: draft.squareMetersPerBox,
    referencePrice: draft.referencePrice,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.productRepository.insertVariant(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "variant",
    entityId: created.id,
    detail: created.sku,
  });

  return created;
}

export interface UpdateVariantInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  variantId: string;
  variant: VariantDraft;
  /** Optional status transition (active <-> inactive only; discontinued uses Archive/Restore). */
  status?: "active" | "inactive";
}

export async function updateVariant(
  context: CatalogContext,
  input: UpdateVariantInput
): Promise<Variant> {
  const { actor, organizationId, productId, variantId } = input;
  actor.requirePermission(CATALOG_UPDATE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await findVariantOrNull(context, organizationId, productId, variantId),
    "variant",
    variantId
  );
  if (existing.status === "discontinued") {
    throw new CatalogValidationError(
      "Cannot edit a discontinued variant; restore it first"
    );
  }

  const draft = await normalizeVariantDraft(context, organizationId, input.variant);
  await assertSkuAvailable(context, organizationId, draft.sku, existing.id);

  const targetStatus = await resolveVariantEditableStatus(
    context,
    organizationId,
    productId,
    existing,
    input.status
  );

  const updated: Variant = {
    ...existing,
    sku: draft.sku,
    displayName: draft.displayName,
    format: draft.format,
    finish: draft.finish,
    baseUnitId: draft.baseUnitId,
    saleUnitId: draft.saleUnitId,
    baseUnitsPerSaleUnit: draft.baseUnitsPerSaleUnit,
    piecesPerBox: draft.piecesPerBox,
    squareMetersPerBox: draft.squareMetersPerBox,
    referencePrice: draft.referencePrice,
    status: targetStatus,
    updatedAt: nowIso(),
  };

  const saved = await context.productRepository.updateVariant(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "update",
    entityType: "variant",
    entityId: saved.id,
    detail: saved.sku,
  });

  return saved;
}

export interface ArchiveVariantInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  variantId: string;
}

export async function archiveVariant(
  context: CatalogContext,
  input: ArchiveVariantInput
): Promise<Variant> {
  const { actor, organizationId, productId, variantId } = input;
  actor.requirePermission(CATALOG_ARCHIVE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await findVariantOrNull(context, organizationId, productId, variantId),
    "variant",
    variantId
  );
  if (existing.status === "discontinued") {
    throw new CatalogValidationError(`Variant is already discontinued: ${variantId}`);
  }

  await assertNotLastActiveVariant(context, organizationId, productId, existing);

  const updated: Variant = { ...existing, status: "discontinued", updatedAt: nowIso() };
  const saved = await context.productRepository.updateVariant(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "archive",
    entityType: "variant",
    entityId: saved.id,
    detail: saved.sku,
  });

  return saved;
}

export interface RestoreVariantInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  variantId: string;
  /** Defaults to "active" (safe: it only adds active variants). */
  status?: "active" | "inactive";
}

export async function restoreVariant(
  context: CatalogContext,
  input: RestoreVariantInput
): Promise<Variant> {
  const { actor, organizationId, productId, variantId } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await findVariantOrNull(context, organizationId, productId, variantId),
    "variant",
    variantId
  );
  if (existing.status !== "discontinued") {
    throw new CatalogValidationError(
      `Only discontinued variants can be restored: ${variantId}`
    );
  }

  const targetStatus: "active" | "inactive" = input.status ?? "active";
  const updated: Variant = { ...existing, status: targetStatus, updatedAt: nowIso() };
  const saved = await context.productRepository.updateVariant(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "restore",
    entityType: "variant",
    entityId: saved.id,
    detail: saved.sku,
  });

  return saved;
}

async function findVariantOrNull(
  context: CatalogContext,
  organizationId: string,
  productId: string,
  variantId: string
): Promise<Variant | null> {
  const variant = await context.productRepository.findVariantById(
    organizationId,
    variantId
  );
  if (variant === null || variant.productId !== productId) {
    return null;
  }
  return variant;
}

async function resolveVariantEditableStatus(
  context: CatalogContext,
  organizationId: string,
  productId: string,
  current: Variant,
  requested: "active" | "inactive" | undefined
): Promise<ProductStatus> {
  if (requested === undefined) {
    return current.status;
  }
  if (current.status === "discontinued") {
    throw new CatalogValidationError(
      "Cannot change status of a discontinued variant; restore it first"
    );
  }
  if (requested === "inactive" && current.status === "active") {
    await assertNotLastActiveVariant(context, organizationId, productId, current);
  }
  return requested;
}

/**
 * D-C13: the last active variant of an ACTIVE product cannot be retired.
 */
async function assertNotLastActiveVariant(
  context: CatalogContext,
  organizationId: string,
  productId: string,
  current: Variant
): Promise<void> {
  const product = await context.productRepository.findProductById(
    organizationId,
    productId
  );
  if (product === null || product.status !== "active") {
    return;
  }
  if (current.status !== "active") {
    return;
  }
  const variants = await context.productRepository.listVariantsByProduct(
    organizationId,
    productId
  );
  const otherActive = variants.some(
    (variant) => variant.id !== current.id && variant.status === "active"
  );
  if (!otherActive) {
    throw new CatalogValidationError(
      "Cannot retire the last active variant of an active product"
    );
  }
}

async function assertSkuAvailable(
  context: CatalogContext,
  organizationId: string,
  sku: string,
  excludeId: string | null
): Promise<void> {
  // SKU uniqueness is per organization (upper(trim(sku)) unique index), so it
  // must be checked across ALL variants, not just one product.
  const existing = await context.productRepository.findVariantBySku(
    organizationId,
    sku
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(`Duplicate variant sku: ${sku}`);
  }
}

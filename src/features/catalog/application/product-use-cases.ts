import type { CatalogContext } from "./catalog-context";
import {
  assertActorOrganization,
} from "./guards";
import { newId, nowIso, normalizeProductDraft } from "./shared";
import type {
  Barcode,
  CatalogActor,
  Product,
  ProductDraft,
  ProductListOptions,
  ProductStatus,
  Variant,
} from "../domain";
import {
  CATALOG_ARCHIVE,
  CATALOG_CREATE,
  CATALOG_MANAGE,
  CATALOG_READ,
  CATALOG_UPDATE,
  CatalogValidationError,
  requireEntity,
} from "../domain";

export interface ProductWithVariants {
  product: Product;
  variants: Array<{
    variant: Variant;
    barcodes: Barcode[];
  }>;
}

export interface CreateProductInput {
  actor: CatalogActor;
  organizationId: string;
  product: ProductDraft;
}

export async function createProduct(
  context: CatalogContext,
  input: CreateProductInput
): Promise<Product> {
  const { actor, organizationId, product } = input;
  actor.requirePermission(CATALOG_CREATE);
  assertActorOrganization(actor, organizationId);

  const draft = await normalizeProductDraft(context, organizationId, product);
  if (draft.externalId !== null) {
    await assertProductExternalIdAvailable(context, organizationId, draft.externalId, null);
  }

  const createdAt = nowIso();
  const entity: Product = {
    id: newId(),
    organizationId,
    externalId: draft.externalId,
    description: draft.description,
    shortName: draft.shortName,
    brandId: draft.brandId,
    categoryId: draft.categoryId,
    lineId: draft.lineId,
    technicalDescription: draft.technicalDescription,
    status: "inactive",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.productRepository.insertProduct(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "product",
    entityId: created.id,
    detail: created.externalId ?? created.description,
  });

  return created;
}

export interface UpdateProductInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  product: ProductDraft;
  /** Optional status transition (active <-> inactive only; discontinued uses Archive/Restore). */
  status?: "active" | "inactive";
}

export async function updateProduct(
  context: CatalogContext,
  input: UpdateProductInput
): Promise<Product> {
  const { actor, organizationId, productId } = input;
  actor.requirePermission(CATALOG_UPDATE);
  assertActorOrganization(actor, organizationId);

  const current = requireEntity(
    await context.productRepository.findProductById(organizationId, productId),
    "product",
    productId
  );
  if (current.status === "discontinued") {
    throw new CatalogValidationError(
      "Cannot edit a discontinued product; restore it first"
    );
  }

  const draft = await normalizeProductDraft(context, organizationId, input.product);
  if (draft.externalId !== null) {
    await assertProductExternalIdAvailable(
      context,
      organizationId,
      draft.externalId,
      current.id
    );
  }

  const targetStatus = await resolveEditableStatus(
    current.status,
    input.status,
    context,
    organizationId,
    productId
  );

  const updated: Product = {
    ...current,
    externalId: draft.externalId,
    description: draft.description,
    shortName: draft.shortName,
    brandId: draft.brandId,
    categoryId: draft.categoryId,
    lineId: draft.lineId,
    technicalDescription: draft.technicalDescription,
    status: targetStatus,
    updatedAt: nowIso(),
  };

  const saved = await context.productRepository.updateProduct(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "update",
    entityType: "product",
    entityId: saved.id,
    detail: saved.externalId ?? saved.description,
  });

  return saved;
}

export interface ArchiveProductInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
}

export async function archiveProduct(
  context: CatalogContext,
  input: ArchiveProductInput
): Promise<Product> {
  const { actor, organizationId, productId } = input;
  actor.requirePermission(CATALOG_ARCHIVE);
  assertActorOrganization(actor, organizationId);

  const current = requireEntity(
    await context.productRepository.findProductById(organizationId, productId),
    "product",
    productId
  );
  if (current.status === "discontinued") {
    throw new CatalogValidationError(`Product is already discontinued: ${productId}`);
  }

  const updated: Product = { ...current, status: "discontinued", updatedAt: nowIso() };
  const saved = await context.productRepository.updateProduct(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "archive",
    entityType: "product",
    entityId: saved.id,
    detail: saved.externalId ?? saved.description,
  });

  return saved;
}

export interface RestoreProductInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
  /** Defaults to "inactive" (a restore to "active" requires an active variant). */
  status?: "active" | "inactive";
}

export async function restoreProduct(
  context: CatalogContext,
  input: RestoreProductInput
): Promise<Product> {
  const { actor, organizationId, productId } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const current = requireEntity(
    await context.productRepository.findProductById(organizationId, productId),
    "product",
    productId
  );
  if (current.status !== "discontinued") {
    throw new CatalogValidationError(
      `Only discontinued products can be restored: ${productId}`
    );
  }

  const targetStatus: "active" | "inactive" = input.status ?? "inactive";
  if (targetStatus === "active") {
    await requireActiveVariant(context, organizationId, productId);
  }

  const updated: Product = { ...current, status: targetStatus, updatedAt: nowIso() };
  const saved = await context.productRepository.updateProduct(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "restore",
    entityType: "product",
    entityId: saved.id,
    detail: saved.externalId ?? saved.description,
  });

  return saved;
}

export interface GetProductInput {
  actor: CatalogActor;
  organizationId: string;
  productId: string;
}

export async function getProduct(
  context: CatalogContext,
  input: GetProductInput
): Promise<ProductWithVariants> {
  const { actor, organizationId, productId } = input;
  actor.requirePermission(CATALOG_READ);
  assertActorOrganization(actor, organizationId);

  const product = requireEntity(
    await context.productRepository.findProductById(organizationId, productId),
    "product",
    productId
  );

  const variants = await context.productRepository.listVariantsByProduct(
    organizationId,
    productId
  );
  const variantsWithBarcodes = await Promise.all(
    variants.map(async (variant) => ({
      variant,
      barcodes: await context.productRepository.listBarcodesByVariant(
        organizationId,
        variant.id
      ),
    }))
  );

  return { product, variants: variantsWithBarcodes };
}

export interface ListProductsInput {
  actor: CatalogActor;
  organizationId: string;
  options?: ProductListOptions;
}

export async function listProducts(
  context: CatalogContext,
  input: ListProductsInput
): Promise<Product[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(CATALOG_READ);
  assertActorOrganization(actor, organizationId);
  return context.productRepository.listProducts(organizationId, input.options);
}

export interface SearchProductsInput {
  actor: CatalogActor;
  organizationId: string;
  query: string;
}

export async function searchProducts(
  context: CatalogContext,
  input: SearchProductsInput
): Promise<Product[]> {
  const { actor, organizationId, query } = input;
  actor.requirePermission(CATALOG_READ);
  assertActorOrganization(actor, organizationId);
  const trimmed = query.trim();
  if (trimmed === "") {
    return [];
  }
  return context.productRepository.searchProducts(organizationId, trimmed);
}

async function resolveEditableStatus(
  currentStatus: ProductStatus,
  requested: "active" | "inactive" | undefined,
  context: CatalogContext,
  organizationId: string,
  productId: string
): Promise<ProductStatus> {
  if (requested === undefined) {
    return currentStatus;
  }
  if (currentStatus === "discontinued") {
    throw new CatalogValidationError(
      "Cannot change status of a discontinued product; restore it first"
    );
  }
  if (requested === "active") {
    await requireActiveVariant(context, organizationId, productId);
  }
  return requested;
}

export async function requireActiveVariant(
  context: CatalogContext,
  organizationId: string,
  productId: string
): Promise<void> {
  const variants = await context.productRepository.listVariantsByProduct(
    organizationId,
    productId
  );
  if (!variants.some((variant) => variant.status === "active")) {
    throw new CatalogValidationError(
      "An active product requires at least one active variant"
    );
  }
}

async function assertProductExternalIdAvailable(
  context: CatalogContext,
  organizationId: string,
  externalId: string,
  excludeId: string | null
): Promise<void> {
  const existing = await context.productRepository.findProductByExternalId(
    organizationId,
    externalId
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(
      `Duplicate product external_id: ${externalId}`
    );
  }
}

import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, referenceStatusAction } from "./shared";
import type { CatalogActor, ProductLine, ProductLineDraft } from "../domain";
import {
  CATALOG_MANAGE,
  CatalogValidationError,
  normalizeOptionalText,
  requireEntity,
  validateRequiredText,
} from "../domain";

export interface CreateProductLineInput {
  actor: CatalogActor;
  organizationId: string;
  productLine: ProductLineDraft;
}

export async function createProductLine(
  context: CatalogContext,
  input: CreateProductLineInput
): Promise<ProductLine> {
  const { actor, organizationId, productLine } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const name = validateRequiredText(productLine.name, "name");
  const externalId = normalizeOptionalText(productLine.externalId, "external_id");
  await assertProductLineExternalIdAvailable(
    context,
    organizationId,
    externalId,
    null
  );

  const createdAt = nowIso();
  const entity: ProductLine = {
    id: newId(),
    organizationId,
    externalId,
    name,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.productLineRepository.insertProductLine(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "line",
    entityId: created.id,
    detail: created.name,
  });

  return created;
}

export interface ProductLineChanges {
  externalId?: string | null;
  name?: string;
  status?: "active" | "inactive";
}

export interface UpdateProductLineInput {
  actor: CatalogActor;
  organizationId: string;
  lineId: string;
  changes: ProductLineChanges;
}

export async function updateProductLine(
  context: CatalogContext,
  input: UpdateProductLineInput
): Promise<ProductLine> {
  const { actor, organizationId, lineId, changes } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await context.productLineRepository.findProductLineById(
      organizationId,
      lineId
    ),
    "product_line",
    lineId
  );

  const name =
    changes.name === undefined ? existing.name : validateRequiredText(changes.name, "name");
  const externalId =
    changes.externalId === undefined
      ? existing.externalId
      : normalizeOptionalText(changes.externalId, "external_id");
  const status =
    changes.status === undefined ? existing.status : changes.status;
  if (status !== "active" && status !== "inactive") {
    throw new CatalogValidationError(`Invalid product_line status: ${String(status)}`);
  }
  await assertProductLineExternalIdAvailable(
    context,
    organizationId,
    externalId,
    lineId
  );

  const updated: ProductLine = {
    ...existing,
    externalId,
    name,
    status,
    updatedAt: nowIso(),
  };
  const saved = await context.productLineRepository.updateProductLine(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: referenceStatusAction(existing.status, saved.status),
    entityType: "line",
    entityId: saved.id,
    detail: saved.name,
  });

  return saved;
}

export async function assertProductLineExternalIdAvailable(
  context: CatalogContext,
  organizationId: string,
  externalId: string | null,
  excludeId: string | null
): Promise<void> {
  if (externalId === null) {
    return;
  }
  const existing = await context.productLineRepository.findProductLineByExternalId(
    organizationId,
    externalId
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(`Duplicate product_line external_id: ${externalId}`);
  }
}

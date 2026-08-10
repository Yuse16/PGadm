import type { LayoutContext } from "./layout-context";
import { assertActorOrganization } from "./guards";
import { requireEditablePosition } from "./editing";
import { newId, nowIso, requireVariantReference, validateIsoTimestamp } from "./shared";
import type {
  LayoutActor,
  LayoutPosition,
  PositionStock,
} from "../domain";
import {
  LAYOUT_EDIT,
  LAYOUT_READ,
  LayoutValidationError,
  normalizeOptionalText,
  requireLayoutEntity,
} from "../domain";

export interface AssignProductInput {
  actor: LayoutActor;
  organizationId: string;
  positionId: string;
  variantId: string;
  activeFrom?: string;
  reason?: string | null;
  origin?: string | null;
}

/**
 * Assigns an exact 1C catalog variant to a display position of a draft layout
 * (D-L06, LA-17). The previous variant is conserved in the version history via
 * previous_variant_id/new_variant_id. A fresh assignment clears any
 * needs_review flag (an explicit user action, never an auto-reassignment,
 * D-L07/LA-20).
 */
export async function assignProduct(
  context: LayoutContext,
  input: AssignProductInput
): Promise<LayoutPosition> {
  const { actor, organizationId, positionId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const { position, element, layout } = await requireEditablePosition(
    context,
    organizationId,
    positionId
  );
  await requireVariantReference(context.referenceCatalog, organizationId, input.variantId);

  const activeFrom = validateIsoTimestamp(input.activeFrom ?? nowIso(), "active_from");
  const reason = normalizeOptionalText(input.reason, "reason");
  const origin = normalizeOptionalText(input.origin, "origin");

  const previousVariantId = position.variantId;
  const now = nowIso();
  const updated: LayoutPosition = {
    ...position,
    variantId: input.variantId,
    activeFrom,
    activeTo: null,
    reviewStatus: "ok",
    updatedAt: now,
  };
  const saved = await context.layoutRepository.updatePosition(updated);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: layout.id,
    version: layout.version,
    changeType: "product_assigned",
    elementId: element.id,
    positionId: saved.id,
    previousVariantId,
    newVariantId: saved.variantId,
    origin,
    destination: saved.variantId ?? null,
    reason: reason ?? `Asignar producto a ${saved.positionCode}`,
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "product_assigned",
    entityType: "layout_position",
    entityId: saved.id,
    detail: `${saved.positionCode} <- ${saved.variantId}`,
  });

  return saved;
}

export interface RemoveProductInput {
  actor: LayoutActor;
  organizationId: string;
  positionId: string;
  reason?: string | null;
  origin?: string | null;
}

/**
 * Removes the product from a display position (LA-17). variant_id becomes NULL
 * (empty position) and the active window is closed. The removed variant is
 * conserved as previous_variant_id in the append-only history.
 */
export async function removeProduct(
  context: LayoutContext,
  input: RemoveProductInput
): Promise<LayoutPosition> {
  const { actor, organizationId, positionId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const { position, element, layout } = await requireEditablePosition(
    context,
    organizationId,
    positionId
  );
  if (position.variantId === null) {
    throw new LayoutValidationError(
      `Position ${positionId} is already empty; nothing to remove`
    );
  }

  const reason = normalizeOptionalText(input.reason, "reason");
  const origin = normalizeOptionalText(input.origin, "origin");
  const now = nowIso();
  const previousVariantId = position.variantId;

  const updated: LayoutPosition = {
    ...position,
    variantId: null,
    activeTo: now,
    updatedAt: now,
  };
  const saved = await context.layoutRepository.updatePosition(updated);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: layout.id,
    version: layout.version,
    changeType: "product_removed",
    elementId: element.id,
    positionId: saved.id,
    previousVariantId,
    newVariantId: null,
    origin,
    destination: null,
    reason: reason ?? `Retirar producto de ${saved.positionCode}`,
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "product_removed",
    entityType: "layout_position",
    entityId: saved.id,
    detail: `${saved.positionCode} producto retirado`,
  });

  return saved;
}

export interface MarkNeedsReviewInput {
  actor: LayoutActor;
  organizationId: string;
  positionId: string;
  reason?: string | null;
}

/**
 * Marks a position for review (review_status='needs_review') because a stock
 * change was detected (D-L07/LA-19). It NEVER reassigns the product; a
 * compatible replacement is only applied after confirmReplacement (LA-20).
 */
export async function markNeedsReview(
  context: LayoutContext,
  input: MarkNeedsReviewInput
): Promise<LayoutPosition> {
  const { actor, organizationId, positionId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const { position } = await requireEditablePosition(context, organizationId, positionId);

  const saved = await context.layoutRepository.updatePosition({
    ...position,
    reviewStatus: "needs_review",
    updatedAt: nowIso(),
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "element_edited",
    entityType: "layout_position",
    entityId: saved.id,
    detail: normalizeOptionalText(input.reason, "reason") ?? "Posición marcada para revisión (needs_review)",
  });

  return saved;
}

export interface ConfirmReplacementInput {
  actor: LayoutActor;
  organizationId: string;
  positionId: string;
  variantId?: string;
  reason?: string | null;
  origin?: string | null;
}

/**
 * Explicit user confirmation of a position review (LA-20): clears the
 * needs_review flag and, when a compatible replacement variant is provided and
 * differs from the current one, assigns it recording previous/new variants.
 * There is never a silent auto-reassignment (D-L07).
 */
export async function confirmReplacement(
  context: LayoutContext,
  input: ConfirmReplacementInput
): Promise<LayoutPosition> {
  const { actor, organizationId, positionId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const { position, element, layout } = await requireEditablePosition(
    context,
    organizationId,
    positionId
  );

  if (input.variantId !== undefined) {
    await requireVariantReference(context.referenceCatalog, organizationId, input.variantId);
  }

  const previousVariantId = position.variantId;
  const nextVariantId = input.variantId !== undefined ? input.variantId : position.variantId;
  const now = nowIso();
  const reason = normalizeOptionalText(input.reason, "reason");
  const origin = normalizeOptionalText(input.origin, "origin");

  const updated: LayoutPosition = {
    ...position,
    variantId: nextVariantId,
    activeFrom: position.activeFrom ?? now,
    activeTo: nextVariantId === null ? now : null,
    reviewStatus: "ok",
    updatedAt: now,
  };
  const saved = await context.layoutRepository.updatePosition(updated);

  if (previousVariantId !== nextVariantId) {
    await context.layoutRepository.insertVersionEntry({
      id: newId(),
      organizationId,
      layoutId: layout.id,
      version: layout.version,
      changeType: "product_assigned",
      elementId: element.id,
      positionId: saved.id,
      previousVariantId,
      newVariantId: saved.variantId,
      origin,
      destination: saved.variantId ?? null,
      reason: reason ?? `Confirmar reemplazo compatible en ${saved.positionCode}`,
      changedBy: actor.userId,
      createdAt: now,
    });

    await context.auditRepository.record({
      actorUserId: actor.userId,
      organizationId,
      action: "product_assigned",
      entityType: "layout_position",
      entityId: saved.id,
      detail: `${saved.positionCode}: reemplazo confirmado -> ${saved.variantId}`,
    });
  } else {
    await context.auditRepository.record({
      actorUserId: actor.userId,
      organizationId,
      action: "element_edited",
      entityType: "layout_position",
      entityId: saved.id,
      detail: `${saved.positionCode}: revisión confirmada, producto vigente`,
    });
  }

  return saved;
}

export interface ListPositionsWithStockInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  warehouseIds?: string[];
}

export interface PositionWithStock {
  position: LayoutPosition;
  stock: PositionStock[];
}

/**
 * Positions of a layout joined with the latest reported stock from 1D
 * (D-L13/LA-18). Store and CEDIS warehouses are kept separate and each stock is
 * presented as "existencia reportada" with its exact source date; a warehouse
 * without a snapshot yields no row (the UI shows "sin datos"). The layout only
 * reads inventory, it never writes it.
 */
export async function listPositionsWithStock(
  context: LayoutContext,
  input: ListPositionsWithStockInput
): Promise<PositionWithStock[]> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_READ);
  assertActorOrganization(actor, organizationId);

  const layout = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );

  const positions = await context.layoutRepository.listPositions(organizationId);

  const warehouses =
    input.warehouseIds !== undefined && input.warehouseIds.length > 0
      ? input.warehouseIds
      : (await context.referenceCatalog.findWarehousesForBranch(
          organizationId,
          layout.branchId
        )).map((warehouse) => warehouse.id);

  const byVariant = new Map<string, LayoutPosition[]>();
  for (const position of positions) {
    if (position.variantId !== null) {
      const bucket = byVariant.get(position.variantId) ?? [];
      bucket.push(position);
      byVariant.set(position.variantId, bucket);
    }
  }

  const stockByVariant = new Map<string, PositionStock[]>();
  await Promise.all(
    Array.from(byVariant.keys()).map(async (variantId) => {
      stockByVariant.set(
        variantId,
        await context.stockProvider.latestStockByVariant(organizationId, variantId, warehouses)
      );
    })
  );

  return positions.map((position) => ({
    position,
    stock: position.variantId === null ? [] : (stockByVariant.get(position.variantId) ?? []),
  }));
}

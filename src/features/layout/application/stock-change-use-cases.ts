import type { LayoutContext } from "./layout-context";
import { assertActorOrganization } from "./guards";
import { requireEditableLayout } from "./editing";
import { nowIso } from "./shared";
import type {
  LayoutActor,
  LayoutPosition,
  PositionStock,
  VariantReference,
} from "../domain";
import { LAYOUT_EDIT, LAYOUT_READ, requireLayoutEntity } from "../domain";

export interface DetectStockChangesInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
}

export interface DetectStockChangesResult {
  /** Positions that were just flagged for review by this run. */
  changed: LayoutPosition[];
  /** Total positions under review after this run (changed + already flagged). */
  underReview: number;
}

/**
 * Detects stock changes on a draft layout (D-L07/LA-19). A position whose
 * assigned variant reports zero existence across every warehouse of the branch
 * is flagged `needs_review` so a human can decide. The layout NEVER
 * auto-reassigns the product: confirmation is always explicit
 * (confirmReplacement, LA-20). Positions already under review are left alone.
 */
export async function detectStockChanges(
  context: LayoutContext,
  input: DetectStockChangesInput
): Promise<DetectStockChangesResult> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const layout = await requireEditableLayout(context, organizationId, layoutId);
  const positions = await context.layoutRepository.listPositions(organizationId);

  const warehouses = (
    await context.referenceCatalog.findWarehousesForBranch(
      organizationId,
      layout.branchId
    )
  ).map((warehouse) => warehouse.id);

  const stockByVariant = new Map<string, PositionStock[]>();
  const variantsWithStock = new Set<string>();
  for (const position of positions) {
    if (position.variantId !== null) {
      variantsWithStock.add(position.variantId);
    }
  }
  await Promise.all(
    Array.from(variantsWithStock).map(async (variantId) => {
      stockByVariant.set(
        variantId,
        await context.stockProvider.latestStockByVariant(
          organizationId,
          variantId,
          warehouses
        )
      );
    })
  );

  const changed: LayoutPosition[] = [];
  for (const position of positions) {
    if (
      position.variantId === null ||
      position.reviewStatus === "needs_review"
    ) {
      continue;
    }
    const stock = stockByVariant.get(position.variantId) ?? [];
    const reported = stock.reduce((total, row) => total + row.quantity, 0);
    if (reported > 0) {
      continue;
    }

    const saved = await context.layoutRepository.updatePosition({
      ...position,
      reviewStatus: "needs_review",
      updatedAt: nowIso(),
    });
    changed.push(saved);

    await context.auditRepository.record({
      actorUserId: actor.userId,
      organizationId,
      action: "element_edited",
      entityType: "layout_position",
      entityId: saved.id,
      detail: `Cambio de stock detectado: ${saved.positionCode} sin existencia reportada`,
    });
  }

  const underReview =
    changed.length +
    positions.filter((position) => position.reviewStatus === "needs_review").length;

  return { changed, underReview };
}

export interface SuggestCompatibleReplacementInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  positionId: string;
}

/**
 * First compatible candidate with reported stock for a position under review
 * (D-L07, LA-20): same product family (reference catalog) AND existence > 0 in
 * the branch warehouses (stock port). Read-only — it only suggests, the
 * replacement is applied by confirmReplacement.
 */
export async function suggestCompatibleReplacement(
  context: LayoutContext,
  input: SuggestCompatibleReplacementInput
): Promise<VariantReference | null> {
  const { actor, organizationId, layoutId, positionId } = input;
  actor.requirePermission(LAYOUT_READ);
  assertActorOrganization(actor, organizationId);

  const layout = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  const position = requireLayoutEntity(
    await context.layoutRepository.findPositionById(organizationId, positionId),
    "layout_position",
    positionId
  );
  if (position.variantId === null) {
    return null;
  }

  const warehouses = (
    await context.referenceCatalog.findWarehousesForBranch(
      organizationId,
      layout.branchId
    )
  ).map((warehouse) => warehouse.id);

  const candidates = await context.referenceCatalog.findCompatibleVariants(
    organizationId,
    position.variantId
  );

  for (const candidate of candidates) {
    const stock = await context.stockProvider.latestStockByVariant(
      organizationId,
      candidate.id,
      warehouses
    );
    const reported = stock.reduce((total, row) => total + row.quantity, 0);
    if (reported > 0) {
      return candidate;
    }
  }
  return null;
}

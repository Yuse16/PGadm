import type { CatalogContext } from "@/features/catalog/application";
import type {
  CatalogAuditAction,
  CatalogAuditEntityType,
  CatalogAuditEvent,
  Product,
  Variant,
} from "@/features/catalog/domain";

export const HISTORY_LIMIT = 30;

export interface ProductHistoryEntry {
  id: string;
  occurredAt: string;
  action: CatalogAuditAction;
  entityType: CatalogAuditEntityType;
  detail: string;
  actorUserId: string;
}

/**
 * Builds the history timeline for a product and its variants: all audit events
 * for the product row plus each of its variants (1C.5, D-C10), newest first.
 */
export async function getProductHistory(
  context: CatalogContext,
  organizationId: string,
  product: Product,
  variants: readonly Variant[]
): Promise<ProductHistoryEntry[]> {
  const events = await Promise.all([
    context.auditRepository.listEvents({
      organizationId,
      entityType: "product",
      entityId: product.id,
    }),
    ...variants.map((variant) =>
      context.auditRepository.listEvents({
        organizationId,
        entityType: "variant",
        entityId: variant.id,
      })
    ),
  ]);

  return events
    .flat()
    .map(toHistoryEntry)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, HISTORY_LIMIT);
}

function toHistoryEntry(event: CatalogAuditEvent): ProductHistoryEntry {
  return {
    id: event.id,
    occurredAt: event.occurredAt,
    action: event.action,
    entityType: event.entityType,
    detail: event.detail,
    actorUserId: event.actorUserId,
  };
}

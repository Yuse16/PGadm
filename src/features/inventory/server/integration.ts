import type { CatalogIntegrationSummary } from "@/features/catalog/domain/integrations";
import {
  inventoryActorFromIdentitySession,
  requireInventoryRead,
} from "@/features/inventory/application";
import { createInventoryContext } from "@/features/inventory/infrastructure";
import { InventoryCatalogIntegrationRepository } from "@/features/inventory/infrastructure/inventory-catalog-integration";

/**
 * Populates the 1C.5 integration port with real inventory (D-I14, Fase 1D.5):
 * stock shown on the catalog product detail is the "existencia reportada" of
 * the latest approved snapshot per warehouse for the product's variants.
 *
 * Requires `inventory.read` (every role in the matrix holds it), scoped to the
 * caller's active organization (D-C07).
 */
export async function getProductIntegrationSummary(
  variantIds: string[]
): Promise<CatalogIntegrationSummary> {
  const session = await requireInventoryRead();
  const actor = inventoryActorFromIdentitySession(session);
  const context = createInventoryContext();
  const repository = new InventoryCatalogIntegrationRepository({
    inventoryRepository: context.inventoryRepository,
    organizationId: actor.organizationId,
    variantIds,
  });
  return repository.getIntegrationSummary();
}

import type { InventoryContext } from "./inventory-context";
import { assertActorOrganization } from "./guards";
import type {
  InventoryActor,
  InventoryChange,
  InventoryObservation,
  InventorySnapshot,
} from "../domain";
import { INVENTORY_READ } from "../domain";

export interface GetInventoryHistoryInput {
  actor: InventoryActor;
  organizationId: string;
  warehouseId?: string;
  variantId?: string;
}

/**
 * Non-destructive history for the UI (IA-17): snapshots, changes and manual
 * observations scoped to the organization (and optional warehouse/variant).
 * Nothing is deleted when a new load is approved (D-I03).
 */
export async function getInventoryHistory(
  context: InventoryContext,
  input: GetInventoryHistoryInput
): Promise<{
  snapshots: InventorySnapshot[];
  changes: InventoryChange[];
  observations: InventoryObservation[];
}> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);

  const [snapshots, changes, observations] = await Promise.all([
    context.inventoryRepository.listSnapshots(organizationId, {
      warehouseId: input.warehouseId,
    }),
    context.inventoryRepository.listChanges(organizationId, {
      warehouseId: input.warehouseId,
      variantId: input.variantId,
    }),
    context.inventoryRepository.listObservations(organizationId, {
      warehouseId: input.warehouseId,
      variantId: input.variantId,
    }),
  ]);

  return { snapshots, changes, observations };
}

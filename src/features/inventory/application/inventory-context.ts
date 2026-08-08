import type {
  InventoryAuditRepository,
  InventoryReferenceCatalog,
  InventoryRepository,
} from "../domain";

/**
 * Shared dependency container for inventory use cases. Injected (never imported
 * globally) so tests can pass in-memory fakes; the production wiring lives in
 * `infrastructure/index.ts` and is selected deterministically by
 * `INVENTORY_DATA_SOURCE` (D-I12, D031: no silent fallback after a failed read).
 */
export interface InventoryContext {
  inventoryRepository: InventoryRepository;
  auditRepository: InventoryAuditRepository;
  referenceCatalog: InventoryReferenceCatalog;
}

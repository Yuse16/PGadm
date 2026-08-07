/**
 * Inventory permission codes (D-I10, F1D_RLS_PERMISSION_MATRIX).
 *
 * These match the `inventory.*` rows seeded in 1D.2
 * (`50000000-0000-0000-0000-000000000012..015`):
 *   - inventory.read     -> SELECT all inventory tables + audit events
 *   - inventory.import   -> validate/import files + manage import templates
 *   - inventory.approve  -> approve a load (snapshot + changes) + confirm observations
 *   - inventory.observe  -> register manual observations (never mutates stock)
 */
export const INVENTORY_READ = "inventory.read" as const;
export const INVENTORY_IMPORT = "inventory.import" as const;
export const INVENTORY_APPROVE = "inventory.approve" as const;
export const INVENTORY_OBSERVE = "inventory.observe" as const;

export const INVENTORY_PERMISSIONS = [
  INVENTORY_READ,
  INVENTORY_IMPORT,
  INVENTORY_APPROVE,
  INVENTORY_OBSERVE,
] as const;

export type InventoryPermission = (typeof INVENTORY_PERMISSIONS)[number];

export function isInventoryPermission(value: string): value is InventoryPermission {
  return (INVENTORY_PERMISSIONS as readonly string[]).includes(value);
}

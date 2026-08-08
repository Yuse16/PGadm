/**
 * Minimal org-scoped references the inventory use cases need to validate
 * inputs (D-C07/D-C08: "no referencias inválidas"). The demo implementation
 * carries the 1D.2 seed fixtures; the Supabase wiring reuses the catalog
 * variant repository plus a warehouse lookup (1D.4).
 */
export interface VariantReference {
  id: string;
  sku: string;
}

export interface WarehouseReference {
  id: string;
  code: string;
}

export interface InventoryReferenceCatalog {
  findVariantById(organizationId: string, variantId: string): Promise<VariantReference | null>;
  findWarehouseById(organizationId: string, warehouseId: string): Promise<WarehouseReference | null>;
}

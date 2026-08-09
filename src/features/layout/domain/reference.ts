/**
 * Minimal org-scoped references the layout use cases need to validate inputs
 * (D-C07/D-C08: "no referencias inválidas"). The demo implementation carries
 * the 3.2 seed fixtures; the Supabase wiring reuses the organization branch
 * repository, the catalog variant repository and the inventory warehouse
 * lookups (3.4).
 */
export interface BranchReference {
  id: string;
  code: string;
  branchType: string;
}

export interface VariantReference {
  id: string;
  sku: string;
}

export interface WarehouseReference {
  id: string;
  code: string;
  warehouseType: string;
}

export interface LayoutReferenceCatalog {
  /** Store branch only (branch_type='store'); other branch types are a miss (D-L01). */
  findBranchById(organizationId: string, branchId: string): Promise<BranchReference | null>;
  findVariantById(organizationId: string, variantId: string): Promise<VariantReference | null>;
  findWarehouseById(organizationId: string, warehouseId: string): Promise<WarehouseReference | null>;
  /** Warehouses that serve the layout stock view: store backroom + CEDIS, separated (D-L13). */
  findWarehousesForBranch(organizationId: string, branchId: string): Promise<WarehouseReference[]>;
}

import type {
  BranchReference,
  LayoutReferenceCatalog,
  VariantReference,
  WarehouseReference,
} from "../domain";
import {
  DEMO_BRANCH_NOG,
  DEMO_ORG_PGM,
  DEMO_WAREHOUSE_NOG_01,
  DEMO_WAREHOUSE_SAL_01,
} from "./demo-layout-repository";

const STORE_BRANCHES: BranchReference[] = [
  { id: DEMO_BRANCH_NOG, code: "NOG", branchType: "store" },
  { id: "20000000-0000-0000-0000-000000000002", code: "BSAL", branchType: "store" },
];

const VARIANTS: VariantReference[] = [
  { id: "70000000-0000-0000-0000-000000000051", sku: "7500000000017" },
  { id: "70000000-0000-0000-0000-000000000052", sku: "7500000000031" },
  { id: "70000000-0000-0000-0000-000000000053", sku: "7500000000048" },
];

const WAREHOUSES: WarehouseReference[] = [
  { id: DEMO_WAREHOUSE_NOG_01, code: "NOG-01", warehouseType: "store_backroom" },
  { id: DEMO_WAREHOUSE_SAL_01, code: "SAL-01", warehouseType: "distribution" },
];

/**
 * Demo reference catalog with the 3.2 fixtures (store branch NOG, catalog
 * variants 051/052/053, warehouses NOG-01 + SAL-01). Mirrors the org-scoped
 * contract: a foreign key to a different organization is a miss (D-C08). The
 * Supabase wiring reuses the organization/catalog/inventory repositories (3.4).
 */
export class DemoLayoutReferenceCatalog implements LayoutReferenceCatalog {
  async findBranchById(
    organizationId: string,
    branchId: string
  ): Promise<BranchReference | null> {
    if (organizationId !== DEMO_ORG_PGM && organizationId !== "20000000-0000-0000-0000-000000000001") {
      return null;
    }
    return STORE_BRANCHES.find((branch) => branch.id === branchId) ?? null;
  }

  async findVariantById(
    organizationId: string,
    variantId: string
  ): Promise<VariantReference | null> {
    if (organizationId !== DEMO_ORG_PGM) {
      return null;
    }
    return VARIANTS.find((variant) => variant.id === variantId) ?? null;
  }

  async findWarehouseById(
    organizationId: string,
    warehouseId: string
  ): Promise<WarehouseReference | null> {
    if (organizationId !== DEMO_ORG_PGM) {
      return null;
    }
    return WAREHOUSES.find((warehouse) => warehouse.id === warehouseId) ?? null;
  }

  async findWarehousesForBranch(
    organizationId: string,
    branchId: string
  ): Promise<WarehouseReference[]> {
    if (organizationId !== DEMO_ORG_PGM || branchId !== DEMO_BRANCH_NOG) {
      return [];
    }
    // Store backroom + CEDIS, kept separate in the stock view (D-L13).
    return WAREHOUSES;
  }
}

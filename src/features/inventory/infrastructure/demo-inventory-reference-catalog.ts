import type {
  InventoryReferenceCatalog,
  VariantReference,
  WarehouseReference,
} from "../domain";
import { DEMO_ORG_PGM, DEMO_WAREHOUSE_NOG_01 } from "./demo-inventory-repository";

const VARIANTS: VariantReference[] = [
  { id: "70000000-0000-0000-0000-000000000051", sku: "7500000000017" },
  { id: "70000000-0000-0000-0000-000000000052", sku: "7500000000031" },
  { id: "70000000-0000-0000-0000-000000000053", sku: "7500000000048" },
];

const WAREHOUSES: WarehouseReference[] = [
  { id: DEMO_WAREHOUSE_NOG_01, code: "NOG-01" },
];

/**
 * Demo reference catalog with the 1D.2 fixtures (catalog variants 051/052/053
 * and warehouse NOG-01). Mirrors the org-scoped contract: a foreign key to a
 * different organization is a miss (D-C08). The Supabase wiring reuses the
 * catalog/warehouse repositories directly (1D.4).
 */
export class DemoInventoryReferenceCatalog implements InventoryReferenceCatalog {
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
}

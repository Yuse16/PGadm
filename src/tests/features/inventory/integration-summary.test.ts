import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  DemoInventoryRepository,
  InventoryCatalogIntegrationRepository,
  latestSnapshotPerWarehouse,
  DEMO_ORG_PGM,
  DEMO_VARIANT_051,
  DEMO_VARIANT_053,
  DEMO_WAREHOUSE_NOG_01,
} from "@/features/inventory/infrastructure";
import type { InventorySnapshot } from "@/features/inventory/domain";

describe("InventoryCatalogIntegrationRepository (1D.5, real stock on the 1C.5 port)", () => {
  it("reports the current stock from the latest snapshot per warehouse", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository(),
      organizationId: DEMO_ORG_PGM,
    });
    const summary = await repository.getIntegrationSummary();

    expect(summary.status.integrated).toBe(true);
    expect(summary.inventory.currentStock).toBe(130);
    expect(summary.inventory.availableStock).toBe(130);
    expect(summary.inventory.reservedStock).toBeNull();
  });

  it("shows the existence as reported with the source date (D-I04)", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository(),
      organizationId: DEMO_ORG_PGM,
    });
    const summary = await repository.getIntegrationSummary();
    expect(summary.status.message).toBe(
      "Existencia reportada al 2026-08-06T09:00:00.000Z"
    );
  });

  it("filters the aggregation to the requested variants", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository(),
      organizationId: DEMO_ORG_PGM,
      variantIds: [DEMO_VARIANT_051],
    });
    expect((await repository.getIntegrationSummary()).inventory.currentStock).toBe(130);
  });

  it("treats a variant absent from the latest load as zero, not previous stock", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository(),
      organizationId: DEMO_ORG_PGM,
      variantIds: [DEMO_VARIANT_053],
    });
    expect((await repository.getIntegrationSummary()).inventory.currentStock).toBe(0);
  });

  it("keeps purchase and pricing integrations untouched (not integrated)", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository(),
      organizationId: DEMO_ORG_PGM,
      variantIds: [DEMO_VARIANT_051],
    });
    const summary = await repository.getIntegrationSummary();
    expect(summary.purchase).toEqual({
      lastSupplier: null,
      lastPurchaseAt: null,
      lastPurchaseCost: null,
    });
    expect(summary.pricing).toEqual({
      basePrice: null,
      suggestedPrice: null,
      salePrice: null,
      specialPrice: null,
      priceList: null,
    });
  });

  it("reports not integrated when no snapshot exists", async () => {
    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: new DemoInventoryRepository({ seed: false }),
      organizationId: DEMO_ORG_PGM,
    });
    const summary = await repository.getIntegrationSummary();
    expect(summary.status.integrated).toBe(false);
    expect(summary.status.message).toBe("Sin integración de inventario");
    expect(summary.inventory.currentStock).toBeNull();
    expect(summary.inventory.availableStock).toBeNull();
  });

  it("sums stock across warehouses using the latest snapshot of each one", async () => {
    const repo = new DemoInventoryRepository();
    const otherWarehouse = "10000000-0000-0000-0000-000000000004";
    await repo.insertSnapshot(DEMO_ORG_PGM, {
      id: "90000000-0000-0000-0000-000000000003",
      organizationId: DEMO_ORG_PGM,
      warehouseId: otherWarehouse,
      source: "excel",
      sourceFile: null,
      reportDate: "2026-08-06T09:00:00.000Z",
      importedAt: "2026-08-06T12:00:00.000Z",
      importedBy: "30000000-0000-0000-0000-000000000006",
      isBaseline: false,
      createdAt: "2026-08-06T12:00:00.000Z",
      updatedAt: "2026-08-06T12:00:00.000Z",
    }, [
      {
        id: "90000000-0000-0000-0000-000000000016",
        organizationId: DEMO_ORG_PGM,
        snapshotId: "90000000-0000-0000-0000-000000000003",
        variantId: DEMO_VARIANT_051,
        quantity: 20,
        boxes: null,
        squareMeters: null,
        createdAt: "2026-08-06T12:00:00.000Z",
      },
    ]);

    const repository = new InventoryCatalogIntegrationRepository({
      inventoryRepository: repo,
      organizationId: DEMO_ORG_PGM,
      variantIds: [DEMO_VARIANT_051],
    });
    expect((await repository.getIntegrationSummary()).inventory.currentStock).toBe(150);
  });
});

describe("latestSnapshotPerWarehouse (deterministic selection)", () => {
  function snapshot(
    id: string,
    warehouseId: string,
    reportDate: string,
    importedAt: string
  ): InventorySnapshot {
    return {
      id,
      organizationId: DEMO_ORG_PGM,
      warehouseId,
      source: "excel",
      sourceFile: null,
      reportDate,
      importedAt,
      importedBy: null,
      isBaseline: false,
      createdAt: importedAt,
      updatedAt: importedAt,
    };
  }

  it("picks the most recent reportDate per warehouse", () => {
    const selected = latestSnapshotPerWarehouse([
      snapshot("a", DEMO_WAREHOUSE_NOG_01, "2026-08-03T09:00:00.000Z", "2026-08-03T10:00:00.000Z"),
      snapshot("b", DEMO_WAREHOUSE_NOG_01, "2026-08-06T09:00:00.000Z", "2026-08-06T10:00:00.000Z"),
    ]);
    expect(selected.get(DEMO_WAREHOUSE_NOG_01)?.id).toBe("b");
  });

  it("breaks equal report dates by importedAt and then id", () => {
    const selected = latestSnapshotPerWarehouse([
      snapshot("older-import", DEMO_WAREHOUSE_NOG_01, "2026-08-06T09:00:00.000Z", "2026-08-06T10:00:00.000Z"),
      snapshot("newer-import", DEMO_WAREHOUSE_NOG_01, "2026-08-06T09:00:00.000Z", "2026-08-06T11:00:00.000Z"),
    ]);
    expect(selected.get(DEMO_WAREHOUSE_NOG_01)?.id).toBe("newer-import");
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  DemoLayoutReferenceCatalog,
  DemoLayoutRepository,
  DemoLayoutStockProvider,
} from "@/features/layout/infrastructure";
import {
  DEMO_BRANCH_NOG,
  DEMO_ELEMENT_M1_01,
  DEMO_LAYOUT_NOGALERA,
  DEMO_ORG_PGM,
  DEMO_VARIANT_051,
  DEMO_VARIANT_052,
  DEMO_VARIANT_053,
  DEMO_WAREHOUSE_NOG_01,
  DEMO_WAREHOUSE_SAL_01,
} from "@/features/layout/infrastructure";

const ORG_B = "20000000-0000-0000-0000-000000000001";

describe("DemoLayoutRepository (mirrors the 3.2 seed)", () => {
  it("seeds the Nogalera layout with 14 elements and 35 positions (LA-15)", async () => {
    const repo = new DemoLayoutRepository();
    const layouts = await repo.listLayouts(DEMO_ORG_PGM);
    expect(layouts).toHaveLength(1);
    expect(layouts[0].id).toBe(DEMO_LAYOUT_NOGALERA);

    const elements = await repo.listElements(DEMO_ORG_PGM, DEMO_LAYOUT_NOGALERA);
    expect(elements).toHaveLength(14);

    const positions = await repo.listPositions(DEMO_ORG_PGM);
    expect(positions).toHaveLength(35);
  });

  it("stores the four M1 elements with 3/3/2 capacity metadata as recommendation (LA-15/LA-16)", async () => {
    const repo = new DemoLayoutRepository();
    const m1 = (await repo.listElements(DEMO_ORG_PGM, DEMO_LAYOUT_NOGALERA)).filter(
      (element) => element.elementType === "m1"
    );
    expect(m1).toHaveLength(4);
    expect(m1.map((element) => element.code)).toEqual(["M1-01", "M1-02", "M1-03", "M1-04"]);
    for (const element of m1) {
      expect(element.metadata).toEqual({
        capacidad_riel: { frontal: 3, intermedio: 3, posterior: 2 },
      });
    }
  });

  it("keeps the needs_review demo position without auto-reassignment (D-L07)", async () => {
    const repo = new DemoLayoutRepository();
    const review = (await repo.listPositions(DEMO_ORG_PGM, { reviewStatus: "needs_review" }));
    expect(review).toHaveLength(1);
    expect(review[0].positionCode).toBe("M1-01-RF-B01-P01");
    expect(review[0].variantId).toBe(DEMO_VARIANT_051);
  });

  it("seeds 6 append-only version-history rows (D-L06)", async () => {
    const repo = new DemoLayoutRepository();
    const history = await repo.listVersionHistory(DEMO_ORG_PGM, DEMO_LAYOUT_NOGALERA);
    expect(history).toHaveLength(6);
  });

  it("scopes reads to the organization (D-C07)", async () => {
    const repo = new DemoLayoutRepository();
    expect(await repo.listLayouts(ORG_B)).toHaveLength(0);
    expect(await repo.findLayoutById(ORG_B, DEMO_LAYOUT_NOGALERA)).toBeNull();
    expect(await repo.findElementById(ORG_B, DEMO_ELEMENT_M1_01)).toBeNull();
  });

  it("supports an empty state for create flows", async () => {
    const repo = new DemoLayoutRepository({ seed: false });
    expect(await repo.listLayouts(DEMO_ORG_PGM)).toHaveLength(0);
    expect(await repo.listPositions(DEMO_ORG_PGM)).toHaveLength(0);
  });
});

describe("DemoLayoutReferenceCatalog", () => {
  const catalog = new DemoLayoutReferenceCatalog();

  it("resolves the store branch NOG (branch_type='store')", async () => {
    const branch = await catalog.findBranchById(DEMO_ORG_PGM, DEMO_BRANCH_NOG);
    expect(branch?.branchType).toBe("store");
    expect(await catalog.findBranchById(DEMO_ORG_PGM, "10000000-0000-0000-0000-000000000099")).toBeNull();
  });

  it("resolves the exact catalog variants 051/052/053 (1C)", async () => {
    for (const variantId of [DEMO_VARIANT_051, DEMO_VARIANT_052, DEMO_VARIANT_053]) {
      expect(await catalog.findVariantById(DEMO_ORG_PGM, variantId)).not.toBeNull();
    }
    expect(await catalog.findVariantById(DEMO_ORG_PGM, "70000000-0000-0000-0000-000000000999")).toBeNull();
  });

  it("returns the store backroom + CEDIS warehouses for the branch (D-L13)", async () => {
    const warehouses = await catalog.findWarehousesForBranch(DEMO_ORG_PGM, DEMO_BRANCH_NOG);
    expect(warehouses.map((warehouse) => warehouse.id)).toEqual([
      DEMO_WAREHOUSE_NOG_01,
      DEMO_WAREHOUSE_SAL_01,
    ]);
  });
});

describe("DemoLayoutStockProvider", () => {
  const provider = new DemoLayoutStockProvider();

  it("reports the latest NOG-01 existence with its exact date (D-I04/D-L13)", async () => {
    const stock = await provider.latestStockByVariant(
      DEMO_ORG_PGM,
      DEMO_VARIANT_051,
      [DEMO_WAREHOUSE_NOG_01]
    );
    expect(stock).toHaveLength(1);
    expect(stock[0].quantity).toBe(130);
    expect(stock[0].reportDate).toMatch(/^2026-08-06/);
  });

  it("keeps CEDIS absent when no snapshot exists (sin datos)", async () => {
    const stock = await provider.latestStockByVariant(
      DEMO_ORG_PGM,
      DEMO_VARIANT_051,
      [DEMO_WAREHOUSE_NOG_01, DEMO_WAREHOUSE_SAL_01]
    );
    expect(stock.map((row) => row.warehouseId)).toEqual([DEMO_WAREHOUSE_NOG_01]);
  });

  it("returns nothing for an unknown variant or another org", async () => {
    expect(
      await provider.latestStockByVariant(DEMO_ORG_PGM, "70000000-0000-0000-0000-000000000999", [DEMO_WAREHOUSE_NOG_01])
    ).toHaveLength(0);
    expect(
      await provider.latestStockByVariant(ORG_B, DEMO_VARIANT_051, [DEMO_WAREHOUSE_NOG_01])
    ).toHaveLength(0);
  });
});

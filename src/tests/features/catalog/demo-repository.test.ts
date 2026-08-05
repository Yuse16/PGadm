import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  DemoBrandRepository,
  DemoCategoryRepository,
  DemoProductLineRepository,
  DemoProductRepository,
  DemoUnitRepository,
} from "@/features/catalog/infrastructure";
import { barcode, brand, category, line, ORG_A, ORG_B, product, unit, variant } from "./helpers";

describe("DemoProductRepository", () => {
  it("scopes finds by organization", async () => {
    const repo = new DemoProductRepository();
    repo.products.set(
      "product-1",
      product("product-1", { organizationId: ORG_B })
    );

    expect(await repo.findProductById(ORG_B, "product-1")).not.toBeNull();
    expect(await repo.findProductById(ORG_A, "product-1")).toBeNull();
  });

  it("finds by external_id within the organization", async () => {
    const repo = new DemoProductRepository();
    repo.products.set(
      "product-1",
      product("product-1", { externalId: "E-1" })
    );

    expect(await repo.findProductByExternalId(ORG_A, "E-1")).not.toBeNull();
    expect(await repo.findProductByExternalId(ORG_B, "E-1")).toBeNull();
  });

  it("lists variants by product and finds by sku", async () => {
    const repo = new DemoProductRepository();
    repo.variants.set("variant-1", variant("variant-1", { productId: "product-1" }));
    repo.variants.set(
      "variant-2",
      variant("variant-2", { productId: "product-2", sku: "SKU-2" })
    );

    const variantsByProduct = await repo.listVariantsByProduct(ORG_A, "product-1");
    expect(variantsByProduct).toHaveLength(1);

    expect((await repo.findVariantBySku(ORG_A, "TUB-PVC-100"))?.id).toBe("variant-1");
    expect(await repo.findVariantBySku(ORG_B, "TUB-PVC-100")).toBeNull();
  });

  it("searches products across description, short name and external id", async () => {
    const repo = new DemoProductRepository();
    repo.products.set("product-1", product("product-1", { description: "Tubo PVC" }));
    repo.products.set("product-2", product("product-2", { description: "Válvula" }));

    const results = await repo.searchProducts(ORG_A, "pvc");
    expect(results.map((item) => item.id)).toEqual(["product-1"]);
  });

  it("round-trips inserts and updates", async () => {
    const repo = new DemoProductRepository();
    const created = product("product-1");
    await repo.insertProduct(created);
    expect(await repo.findProductById(ORG_A, "product-1")).toEqual(created);

    const updated = { ...created, status: "active" as const };
    await repo.updateProduct(updated);
    expect((await repo.findProductById(ORG_A, "product-1"))?.status).toBe("active");
  });
});

describe("Demo reference repositories", () => {
  it("CategoryRepository enforces org scoping on find and list", async () => {
    const repo = new DemoCategoryRepository();
    repo.categories.set("cat-1", category("cat-1", { code: "A" }));
    repo.categories.set("cat-2", category("cat-2", { organizationId: ORG_B, code: "B" }));

    expect((await repo.findCategoryByCode(ORG_A, "A"))?.id).toBe("cat-1");
    expect(await repo.findCategoryByCode(ORG_A, "B")).toBeNull();
    expect(await repo.listCategories(ORG_A)).toHaveLength(1);
    expect(await repo.findCategoryById(ORG_B, "cat-2")).not.toBeNull();
  });

  it("BrandRepository enforces org scoping", async () => {
    const repo = new DemoBrandRepository();
    repo.brands.set("brand-1", brand("brand-1", { code: "TUB" }));

    expect((await repo.findBrandByCode(ORG_A, "TUB"))?.id).toBe("brand-1");
    expect(await repo.findBrandByCode(ORG_B, "TUB")).toBeNull();
  });

  it("ProductLineRepository enforces org scoping", async () => {
    const repo = new DemoProductLineRepository();
    repo.lines.set("line-1", line("line-1", { externalId: "L-1" }));

    expect((await repo.findProductLineByExternalId(ORG_A, "L-1"))?.id).toBe("line-1");
    expect(await repo.findProductLineByExternalId(ORG_B, "L-1")).toBeNull();
  });

  it("UnitRepository enforces org scoping", async () => {
    const repo = new DemoUnitRepository();
    repo.units.set("unit-1", unit("unit-1", { code: "PZA" }));

    expect((await repo.findUnitByCode(ORG_A, "PZA"))?.id).toBe("unit-1");
    expect(await repo.findUnitByCode(ORG_B, "PZA")).toBeNull();
  });

  it("BarcodeRepository scopes barcode lookups by organization", async () => {
    const repo = new DemoProductRepository();
    repo.barcodes.set("barcode-1", barcode("barcode-1", { barcode: "7501000000001" }));

    expect((await repo.findBarcodeByValue(ORG_A, "7501000000001"))?.id).toBe("barcode-1");
    expect(await repo.findBarcodeByValue(ORG_B, "7501000000001")).toBeNull();
    expect(await repo.listBarcodesByVariant(ORG_A, "variant-1")).toHaveLength(1);
  });
});

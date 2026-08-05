import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import type { Database } from "@/types/database";
import {
  mapBarcode,
  mapBrand,
  mapCategory,
  mapProduct,
  mapProductLine,
  mapUnit,
  mapVariant,
} from "@/features/catalog/infrastructure";
import { CatalogDataError } from "@/features/catalog/domain";

type ProductsRow = Database["public"]["Tables"]["products"]["Row"];
type ProductVariantsRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductBarcodesRow = Database["public"]["Tables"]["product_barcodes"]["Row"];
type ProductCategoriesRow =
  Database["public"]["Tables"]["product_categories"]["Row"];
type ProductBrandsRow = Database["public"]["Tables"]["product_brands"]["Row"];
type ProductLinesRow = Database["public"]["Tables"]["product_lines"]["Row"];
type UnitsOfMeasureRow = Database["public"]["Tables"]["units_of_measure"]["Row"];

describe("catalog mappers", () => {
  it("maps a product row to the domain entity", () => {
    const row: ProductsRow = {
      id: "product-1",
      organization_id: "org-1",
      external_id: "E-1",
      description: "Tubo PVC",
      short_name: "Tubo",
      brand_id: "brand-1",
      category_id: null,
      line_id: null,
      technical_description: "Sin plomo",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(mapProduct(row)).toEqual({
      id: "product-1",
      organizationId: "org-1",
      externalId: "E-1",
      description: "Tubo PVC",
      shortName: "Tubo",
      brandId: "brand-1",
      categoryId: null,
      lineId: null,
      technicalDescription: "Sin plomo",
      status: "active",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("rejects an unknown product status as a data error", () => {
    const row: ProductsRow = {
      id: "product-1",
      organization_id: "org-1",
      external_id: null,
      description: "Tubo",
      short_name: null,
      brand_id: null,
      category_id: null,
      line_id: null,
      technical_description: null,
      status: "bogus",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };
    expect(() => mapProduct(row)).toThrow(CatalogDataError);
  });

  it("maps a variant row", () => {
    const row: ProductVariantsRow = {
      id: "variant-1",
      organization_id: "org-1",
      product_id: "product-1",
      sku: "TUB-PVC-100",
      display_name: null,
      format: "1m",
      finish: null,
      base_unit_id: "unit-1",
      sale_unit_id: "unit-2",
      base_units_per_sale_unit: 10,
      pieces_per_box: null,
      square_meters_per_box: null,
      reference_price: 25.5,
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    const mapped = mapVariant(row);
    expect(mapped.sku).toBe("TUB-PVC-100");
    expect(mapped.baseUnitsPerSaleUnit).toBe(10);
    expect(mapped.referencePrice).toBe(25.5);
  });

  it("maps a barcode row", () => {
    const row: ProductBarcodesRow = {
      id: "barcode-1",
      organization_id: "org-1",
      variant_id: "variant-1",
      barcode: "7501000000001",
      is_primary: true,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(mapBarcode(row)).toMatchObject({
      variantId: "variant-1",
      barcode: "7501000000001",
      isPrimary: true,
    });
  });

  it("maps a category row", () => {
    const row: ProductCategoriesRow = {
      id: "category-1",
      organization_id: "org-1",
      parent_id: null,
      code: "TUB",
      name: "Tubería",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(mapCategory(row)).toMatchObject({
      parentId: null,
      code: "TUB",
      status: "active",
    });
  });

  it("maps a brand row and rejects a discontinued reference status", () => {
    const row: ProductBrandsRow = {
      id: "brand-1",
      organization_id: "org-1",
      code: "TUB",
      name: "Tubería",
      status: "discontinued",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(() => mapBrand(row)).toThrow(CatalogDataError);
  });

  it("maps a product line row", () => {
    const row: ProductLinesRow = {
      id: "line-1",
      organization_id: "org-1",
      external_id: "L-1",
      name: "Tubería",
      status: "inactive",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(mapProductLine(row)).toMatchObject({
      externalId: "L-1",
      status: "inactive",
    });
  });

  it("maps a unit row and rejects an unknown kind", () => {
    const row: UnitsOfMeasureRow = {
      id: "unit-1",
      organization_id: "org-1",
      code: "PZA",
      name: "Pieza",
      kind: "count",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    expect(mapUnit(row)).toMatchObject({ kind: "count" });
    expect(() => mapUnit({ ...row, kind: "bogus" })).toThrow(CatalogDataError);
  });
});

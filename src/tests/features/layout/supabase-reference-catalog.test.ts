import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import type { Variant } from "@/features/catalog/domain/variant";
import { SupabaseLayoutReferenceCatalog } from "@/features/layout/infrastructure";

const ORG_A = "10000000-0000-0000-0000-000000000001";

const VARIANT_051: Variant = {
  id: "70000000-0000-0000-0000-000000000051",
  organizationId: ORG_A,
  productId: "60000000-0000-0000-0000-000000000041",
  sku: "7500000000017",
  displayName: "Tubo PVC 1/2",
  format: null,
  finish: null,
  baseUnitId: "unit-m",
  saleUnitId: "unit-m",
  baseUnitsPerSaleUnit: 1,
  piecesPerBox: null,
  squareMetersPerBox: null,
  referencePrice: null,
  status: "active",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const VARIANT_052: Variant = {
  ...VARIANT_051,
  id: "70000000-0000-0000-0000-000000000052",
  sku: "7500000000031",
  status: "active",
};

const VARIANT_053_DISCONTINUED: Variant = {
  ...VARIANT_051,
  id: "70000000-0000-0000-0000-000000000053",
  sku: "7500000000048",
  status: "discontinued",
};

function makeStubRepository() {
  const findVariantById = vi.fn(
    async (organizationId: string, variantId: string): Promise<Variant | null> => {
      if (organizationId !== ORG_A) {
        return null;
      }
      const variant = [VARIANT_051, VARIANT_052, VARIANT_053_DISCONTINUED].find(
        (candidate) => candidate.id === variantId
      );
      return variant ?? null;
    }
  );
  const listVariantsByProduct = vi.fn(
    async (organizationId: string, productId: string): Promise<Variant[]> => {
      if (organizationId !== ORG_A) {
        return [];
      }
      return [VARIANT_051, VARIANT_052, VARIANT_053_DISCONTINUED].filter(
        (variant) => variant.productId === productId
      );
    }
  );
  return { findVariantById, listVariantsByProduct };
}

describe("SupabaseLayoutReferenceCatalog.findCompatibleVariants", () => {
  it("returns active siblings of the same product, excluding the source variant", async () => {
    const stub = makeStubRepository();
    const catalog = new SupabaseLayoutReferenceCatalog(stub);

    const candidates = await catalog.findCompatibleVariants(ORG_A, VARIANT_051.id);

    expect(candidates.map((candidate) => candidate.id)).toEqual([VARIANT_052.id]);
    expect(stub.findVariantById).toHaveBeenCalledWith(ORG_A, VARIANT_051.id);
    expect(stub.listVariantsByProduct).toHaveBeenCalledWith(ORG_A, VARIANT_051.productId);
  });

  it("never returns discontinued or inactive siblings", async () => {
    const stub = makeStubRepository();
    const catalog = new SupabaseLayoutReferenceCatalog(stub);

    const candidates = await catalog.findCompatibleVariants(ORG_A, VARIANT_052.id);

    // Only 051 is active in the family; 053 is discontinued and excluded.
    expect(candidates.map((candidate) => candidate.id)).toEqual([VARIANT_051.id]);
  });

  it("returns an empty list for an unknown variant", async () => {
    const stub = makeStubRepository();
    const catalog = new SupabaseLayoutReferenceCatalog(stub);

    const candidates = await catalog.findCompatibleVariants(
      ORG_A,
      "70000000-0000-0000-0000-000000000999"
    );

    expect(candidates).toEqual([]);
    expect(stub.listVariantsByProduct).not.toHaveBeenCalled();
  });

  it("is org-scoped: another organization yields nothing (D-C08)", async () => {
    const stub = makeStubRepository();
    const catalog = new SupabaseLayoutReferenceCatalog(stub);

    const candidates = await catalog.findCompatibleVariants(
      "20000000-0000-0000-0000-000000000001",
      VARIANT_051.id
    );

    expect(candidates).toEqual([]);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  archiveVariant,
  createVariant,
  restoreVariant,
  updateVariant,
} from "@/features/catalog/application";
import {
  CatalogNotFoundError,
  CatalogValidationError,
} from "@/features/catalog/domain";
import {
  actor,
  makeContext,
  ORG_A,
  ORG_B,
  product,
  READ_WRITER,
  standardReferences,
  variant,
} from "./helpers";

const DRAFT = {
  sku: "TUB-PVC-100",
  displayName: null,
  format: null,
  finish: null,
  baseUnitId: "unit-1",
  saleUnitId: "unit-2",
  baseUnitsPerSaleUnit: 10,
  piecesPerBox: null,
  squareMetersPerBox: null,
  referencePrice: null,
};

describe("createVariant", () => {
  it("creates an active variant and records an audit event", async () => {
    const context = makeContext({
      ...standardReferences(),
      products: [product("product-1", { status: "inactive" })],
    });

    const created = await createVariant(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      variant: DRAFT,
    });

    expect(created.status).toBe("active");
    expect(created.sku).toBe("TUB-PVC-100");
    expect(created.productId).toBe("product-1");
    expect(created.baseUnitsPerSaleUnit).toBe(10);
    expect(context.auditRepository.events[0].action).toBe("create");
    expect(context.auditRepository.events[0].entityType).toBe("variant");
  });

  it("rejects a duplicate SKU across the whole organization", async () => {
    const context = makeContext({
      ...standardReferences(),
      products: [
        product("product-1", { status: "inactive" }),
        product("product-2", { status: "inactive" }),
      ],
      variants: [
        variant("variant-1", { productId: "product-2", sku: "TUB-PVC-100" }),
      ],
    });

    await expect(
      createVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variant: DRAFT,
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("throws not found when the product is unknown", async () => {
    const context = makeContext(standardReferences());

    await expect(
      createVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "missing",
        variant: DRAFT,
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });

  it("rejects an invalid unit reference", async () => {
    const context = makeContext({
      ...standardReferences(),
      products: [product("product-1")],
    });

    await expect(
      createVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variant: { ...DRAFT, saleUnitId: "unit-99" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });
});

describe("updateVariant", () => {
  it("updates editable fields and keeps status when not requested", async () => {
    const context = makeContext({
      ...standardReferences(),
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1", sku: "OLD-SKU" })],
    });

    const updated = await updateVariant(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      variantId: "variant-1",
      variant: { ...DRAFT, sku: "NEW-SKU" },
    });

    expect(updated.sku).toBe("NEW-SKU");
    expect(updated.status).toBe("active");
    expect(context.auditRepository.events[0].action).toBe("update");
  });

  it("rejects a variant that does not belong to the product", async () => {
    const context = makeContext({
      products: [
        product("product-1", { status: "inactive" }),
        product("product-2", { status: "inactive" }),
      ],
      variants: [variant("variant-1", { productId: "product-2" })],
    });

    await expect(
      updateVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variantId: "variant-1",
        variant: DRAFT,
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });

  it("cannot edit a discontinued variant", async () => {
    const context = makeContext({
      products: [product("product-1")],
      variants: [
        variant("variant-1", { productId: "product-1", status: "discontinued" }),
      ],
    });

    await expect(
      updateVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variantId: "variant-1",
        variant: DRAFT,
      })
    ).rejects.toThrow(CatalogValidationError);
  });
});

describe("archiveVariant and restoreVariant", () => {
  it("archives a variant to discontinued", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1", status: "active" })],
    });

    const archived = await archiveVariant(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      variantId: "variant-1",
    });

    expect(archived.status).toBe("discontinued");
    expect(context.auditRepository.events[0].action).toBe("archive");
  });

  it("protects the last active variant of an active product", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "active" })],
      variants: [variant("variant-1", { productId: "product-1", status: "active" })],
    });

    await expect(
      archiveVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variantId: "variant-1",
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("allows archiving when another active variant exists", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "active" })],
      variants: [
        variant("variant-1", { productId: "product-1", status: "active" }),
        variant("variant-2", { productId: "product-1", status: "active", sku: "SKU-2" }),
      ],
    });

    const archived = await archiveVariant(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      variantId: "variant-1",
    });

    expect(archived.status).toBe("discontinued");
  });

  it("restores a variant to active by default", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [
        variant("variant-1", { productId: "product-1", status: "discontinued" }),
      ],
    });

    const restored = await restoreVariant(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      variantId: "variant-1",
    });

    expect(restored.status).toBe("active");
    expect(context.auditRepository.events[0].action).toBe("restore");
  });

  it("cannot restore a variant that is not discontinued", async () => {
    const context = makeContext({
      products: [product("product-1")],
      variants: [variant("variant-1", { productId: "product-1", status: "active" })],
    });

    await expect(
      restoreVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variantId: "variant-1",
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("ignores a variant from another organization", async () => {
    const context = makeContext({
      products: [product("product-1")],
      variants: [
        variant("variant-1", {
          productId: "product-1",
          organizationId: ORG_B,
          status: "discontinued",
        }),
      ],
    });

    await expect(
      restoreVariant(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        variantId: "variant-1",
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });
});

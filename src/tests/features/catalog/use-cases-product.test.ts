import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  restoreProduct,
  searchProducts,
  updateProduct,
} from "@/features/catalog/application";
import {
  CatalogNotFoundError,
  CatalogPermissionError,
  CatalogValidationError,
} from "@/features/catalog/domain";
import {
  actor,
  barcode,
  makeContext,
  ORG_A,
  ORG_B,
  product,
  READ_WRITER,
  standardReferences,
  variant,
} from "./helpers";

const DRAFT = {
  externalId: "INTELISIS-001",
  description: "Tubo de PVC de 100mm",
  shortName: "Tubo PVC 100",
  brandId: "brand-1",
  categoryId: "category-1",
  lineId: "line-1",
  technicalDescription: null,
};

describe("createProduct", () => {
  it("creates an inactive product and records an audit event", async () => {
    const context = makeContext(standardReferences());
    const created = await createProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      product: DRAFT,
    });

    expect(created.status).toBe("inactive");
    expect(created.description).toBe("Tubo de PVC de 100mm");
    expect(created.externalId).toBe("INTELISIS-001");
    expect(created.brandId).toBe("brand-1");

    const events = context.auditRepository.events;
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("create");
    expect(events[0].entityType).toBe("product");
    expect(events[0].entityId).toBe(created.id);
    expect(events[0].actorUserId).toBe(actor(READ_WRITER).userId);
  });

  it("rejects duplicate external_id within the organization", async () => {
    const existing = product("product-1", {
      organizationId: ORG_A,
      externalId: "INTELISIS-001",
      status: "inactive",
    });
    const context = makeContext({
      ...standardReferences(),
      products: [existing],
    });

    await expect(
      createProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        product: DRAFT,
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("requires catalog.create permission", async () => {
    const context = makeContext(standardReferences());
    await expect(
      createProduct(context, {
        actor: actor(["catalog.read"]),
        organizationId: ORG_A,
        product: DRAFT,
      })
    ).rejects.toThrow(CatalogPermissionError);
  });

  it("rejects a blank description", async () => {
    const context = makeContext(standardReferences());
    await expect(
      createProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        product: { ...DRAFT, description: "   " },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("rejects an invalid reference from another organization", async () => {
    const context = makeContext(standardReferences());
    await expect(
      createProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        product: { ...DRAFT, brandId: "brand-99" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("rejects a product created for a different organization than the actor", async () => {
    const context = makeContext(standardReferences());
    await expect(
      createProduct(context, {
        actor: actor(READ_WRITER, ORG_A),
        organizationId: ORG_B,
        product: DRAFT,
      })
    ).rejects.toThrow(CatalogPermissionError);
  });
});

describe("updateProduct", () => {
  it("updates editable fields and keeps status when not requested", async () => {
    const existing = product("product-1", { status: "inactive" });
    const context = makeContext({
      ...standardReferences(),
      products: [existing],
    });

    const updated = await updateProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      product: { ...DRAFT, description: "Tubo PVC 100 renovado" },
    });

    expect(updated.description).toBe("Tubo PVC 100 renovado");
    expect(updated.status).toBe("inactive");
    expect(context.auditRepository.events[0].action).toBe("update");
  });

  it("activates a product only when it has an active variant", async () => {
    const existing = product("product-1", { status: "inactive" });
    const context = makeContext({
      products: [existing],
      variants: [variant("variant-1", { productId: "product-1", status: "active" })],
    });

    const updated = await updateProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      product: { ...DRAFT, brandId: null, categoryId: null, lineId: null },
      status: "active",
    });

    expect(updated.status).toBe("active");
  });

  it("rejects activating a product without an active variant", async () => {
    const existing = product("product-1", { status: "inactive" });
    const context = makeContext({ products: [existing] });

    await expect(
      updateProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        product: { ...DRAFT, brandId: null, categoryId: null, lineId: null },
        status: "active",
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("cannot edit a discontinued product", async () => {
    const existing = product("product-1", { status: "discontinued" });
    const context = makeContext({ products: [existing] });

    await expect(
      updateProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
        product: DRAFT,
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("throws not found for an unknown product", async () => {
    const context = makeContext({});
    await expect(
      updateProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "missing",
        product: DRAFT,
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });
});

describe("archiveProduct and restoreProduct", () => {
  it("archives an active product to discontinued", async () => {
    const existing = product("product-1", { status: "inactive" });
    const context = makeContext({ products: [existing] });

    const archived = await archiveProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
    });

    expect(archived.status).toBe("discontinued");
    expect(context.auditRepository.events[0].action).toBe("archive");
  });

  it("rejects archiving an already discontinued product", async () => {
    const existing = product("product-1", { status: "discontinued" });
    const context = makeContext({ products: [existing] });

    await expect(
      archiveProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("requires catalog.archive permission", async () => {
    const existing = product("product-1");
    const context = makeContext({ products: [existing] });

    await expect(
      archiveProduct(context, {
        actor: actor(["catalog.read", "catalog.update"]),
        organizationId: ORG_A,
        productId: "product-1",
      })
    ).rejects.toThrow(CatalogPermissionError);
  });

  it("restores a discontinued product to inactive by default", async () => {
    const existing = product("product-1", { status: "discontinued" });
    const context = makeContext({ products: [existing] });

    const restored = await restoreProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
    });

    expect(restored.status).toBe("inactive");
    expect(context.auditRepository.events[0].action).toBe("restore");
  });

  it("restores directly to active when an active variant exists", async () => {
    const existing = product("product-1", { status: "discontinued" });
    const context = makeContext({
      products: [existing],
      variants: [variant("variant-1", { productId: "product-1", status: "active" })],
    });

    const restored = await restoreProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
      status: "active",
    });

    expect(restored.status).toBe("active");
  });

  it("cannot restore a product that is not discontinued", async () => {
    const existing = product("product-1", { status: "inactive" });
    const context = makeContext({ products: [existing] });

    await expect(
      restoreProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
      })
    ).rejects.toThrow(CatalogValidationError);
  });
});

describe("getProduct", () => {
  it("returns the aggregate with variants and barcodes", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "active" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [barcode("barcode-1", { variantId: "variant-1" })],
    });

    const result = await getProduct(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productId: "product-1",
    });

    expect(result.product.id).toBe("product-1");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].barcodes[0].barcode).toBe("7501000000001");
  });

  it("throws not found when the product belongs to another organization", async () => {
    const context = makeContext({
      products: [product("product-1", { organizationId: ORG_B })],
    });

    await expect(
      getProduct(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productId: "product-1",
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });

  it("requires catalog.read permission", async () => {
    const context = makeContext({
      products: [product("product-1")],
    });

    await expect(
      getProduct(context, {
        actor: actor([]),
        organizationId: ORG_A,
        productId: "product-1",
      })
    ).rejects.toThrow(CatalogPermissionError);
  });
});

describe("listProducts and searchProducts", () => {
  it("lists products of the organization", async () => {
    const context = makeContext({
      products: [
        product("product-1", { organizationId: ORG_A }),
        product("product-2", { organizationId: ORG_B }),
      ],
    });

    const result = await listProducts(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("product-1");
  });

  it("filters by status when requested", async () => {
    const context = makeContext({
      products: [
        product("product-1", { status: "active" }),
        product("product-2", { status: "inactive" }),
      ],
    });

    const result = await listProducts(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      options: { status: "active" },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("product-1");
  });

  it("returns an empty array for a blank search query", async () => {
    const context = makeContext({
      products: [product("product-1")],
    });

    const result = await searchProducts(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      query: "   ",
    });

    expect(result).toEqual([]);
  });

  it("searches by description text", async () => {
    const context = makeContext({
      products: [
        product("product-1", { description: "Tubo de PVC de 100mm" }),
        product("product-2", { description: "Válvula de globo" }),
      ],
    });

    const result = await searchProducts(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      query: "PVC",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("product-1");
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  addBarcode,
  changePrimaryBarcode,
  removeBarcode,
} from "@/features/catalog/application";
import {
  CatalogNotFoundError,
  CatalogUnsupportedOperationError,
  CatalogValidationError,
} from "@/features/catalog/domain";
import {
  actor,
  barcode,
  makeContext,
  ORG_A,
  product,
  READ_WRITER,
  variant,
} from "./helpers";

describe("addBarcode", () => {
  it("adds a barcode to a variant and records an audit event", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
    });

    const created = await addBarcode(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      variantId: "variant-1",
      barcode: "7501000000001",
      isPrimary: true,
    });

    expect(created.barcode).toBe("7501000000001");
    expect(created.isPrimary).toBe(true);
    expect(created.variantId).toBe("variant-1");
    expect(context.auditRepository.events[0].action).toBe("create");
    expect(context.auditRepository.events[0].entityType).toBe("barcode");
  });

  it("rejects a duplicate barcode value", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [barcode("barcode-1", { variantId: "variant-1", barcode: "7501000000001" })],
    });

    await expect(
      addBarcode(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        variantId: "variant-1",
        barcode: "7501000000001",
        isPrimary: false,
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("rejects a second primary barcode on the same variant", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [barcode("barcode-1", { variantId: "variant-1", isPrimary: true })],
    });

    await expect(
      addBarcode(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        variantId: "variant-1",
        barcode: "7501000000002",
        isPrimary: true,
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("throws not found for an unknown variant", async () => {
    const context = makeContext({
      products: [product("product-1")],
    });

    await expect(
      addBarcode(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        variantId: "missing",
        barcode: "7501000000001",
        isPrimary: false,
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });
});

describe("changePrimaryBarcode", () => {
  it("promotes a secondary barcode and demotes the current primary", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [
        barcode("barcode-1", { variantId: "variant-1", barcode: "7501000000001", isPrimary: true }),
        barcode("barcode-2", { variantId: "variant-1", barcode: "7501000000002", isPrimary: false }),
      ],
    });

    const promoted = await changePrimaryBarcode(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      variantId: "variant-1",
      barcodeId: "barcode-2",
    });

    expect(promoted.id).toBe("barcode-2");
    expect(promoted.isPrimary).toBe(true);

    const stored = await context.productRepository.listBarcodesByVariant(ORG_A, "variant-1");
    const primary = stored.filter((row) => row.isPrimary);
    expect(primary).toHaveLength(1);
    expect(primary[0].id).toBe("barcode-2");
    expect(context.auditRepository.events[0].action).toBe("update");
  });

  it("is a no-op when the target is already primary", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [
        barcode("barcode-1", { variantId: "variant-1", barcode: "7501000000001", isPrimary: true }),
      ],
    });

    const result = await changePrimaryBarcode(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      variantId: "variant-1",
      barcodeId: "barcode-1",
    });

    expect(result.id).toBe("barcode-1");
    expect(context.auditRepository.events).toHaveLength(0);
  });

  it("throws not found for a barcode that belongs to another variant", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [
        variant("variant-1", { productId: "product-1" }),
        variant("variant-2", { productId: "product-1", sku: "SKU-2" }),
      ],
      barcodes: [
        barcode("barcode-1", { variantId: "variant-1", isPrimary: true }),
        barcode("barcode-2", { variantId: "variant-2", isPrimary: false }),
      ],
    });

    await expect(
      changePrimaryBarcode(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        variantId: "variant-1",
        barcodeId: "barcode-2",
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });
});

describe("removeBarcode", () => {
  it("fails with a typed unsupported operation error", async () => {
    const context = makeContext({
      products: [product("product-1", { status: "inactive" })],
      variants: [variant("variant-1", { productId: "product-1" })],
      barcodes: [barcode("barcode-1", { variantId: "variant-1" })],
    });

    await expect(
      removeBarcode(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        variantId: "variant-1",
        barcodeId: "barcode-1",
      })
    ).rejects.toThrow(CatalogUnsupportedOperationError);
  });

  it("requires catalog.update permission before failing", async () => {
    const context = makeContext({});
    await expect(
      removeBarcode(context, {
        actor: actor(["catalog.read"]),
        organizationId: ORG_A,
        variantId: "variant-1",
        barcodeId: "barcode-1",
      })
    ).rejects.toThrow(/catalog\.update/);
  });
});

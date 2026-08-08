import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in demo mode");
  }),
}));

const ORG_ID = "10000000-0000-0000-0000-000000000001";
const UNIT_ID = "70000000-0000-0000-0000-000000000001";
const ALL_PERMS = [
  "catalog.read",
  "catalog.create",
  "catalog.update",
  "catalog.archive",
  "catalog.manage",
];

function makeSession(permissions: string[]) {
  return {
    user: {
      id: "30000000-0000-0000-0000-000000000001",
      email: "user.a@pgm.local",
      fullName: "Usuario A",
      status: "active" as const,
    },
    organizationId: ORG_ID,
    organizationName: "Plomería García",
    branchId: null,
    branchName: null,
    roles: [],
    permissions: permissions.map((code) => ({ code, description: null })),
    issuedAt: "2026-08-05T00:00:00.000Z",
    expiresAt: null,
  };
}

vi.mock("@/features/identity/application", () => {
  return {
    requirePermission: vi.fn(async () => makeSession(ALL_PERMS)),
  };
});

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Catalog server actions (demo data source)", () => {
  it("creates a product as inactive", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const result = await actions.createProductAction({
      externalId: "TEST-001",
      description: "Producto de prueba",
      shortName: "Prueba",
      brandId: null,
      categoryId: null,
      lineId: null,
      technicalDescription: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entity.description).toBe("Producto de prueba");
      expect(result.entity.status).toBe("inactive");
    }
  });

  it("returns an error envelope for a duplicate product external id", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const result = await actions.createProductAction({
      externalId: "TUB-PVC-100",
      description: "Duplicado",
      shortName: null,
      brandId: null,
      categoryId: null,
      lineId: null,
      technicalDescription: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Duplicate product external_id");
    }
  });

  it("creates a variant and rejects duplicate SKUs", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const productId = "70000000-0000-0000-0000-000000000041";

    const created = await actions.createVariantAction(productId, {
      sku: "TEST-VAR-001",
      displayName: "Variante de prueba",
      format: null,
      finish: null,
      baseUnitId: UNIT_ID,
      saleUnitId: UNIT_ID,
      baseUnitsPerSaleUnit: 1,
      piecesPerBox: null,
      squareMetersPerBox: null,
      referencePrice: 10,
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.entity.status).toBe("active");
    }

    const duplicate = await actions.createVariantAction(productId, {
      sku: "TUB-PVC-100-PZA",
      displayName: "Duplicado",
      format: null,
      finish: null,
      baseUnitId: UNIT_ID,
      saleUnitId: UNIT_ID,
      baseUnitsPerSaleUnit: 1,
      piecesPerBox: null,
      squareMetersPerBox: null,
      referencePrice: null,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error).toContain("Duplicate variant sku");
    }
  });

  it("duplicates a product with the (copia) suffix and no external id", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const result = await actions.duplicateProductAction(
      "70000000-0000-0000-0000-000000000041"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entity.description).toContain("(copia)");
      expect(result.entity.externalId).toBeNull();
      expect(result.entity.status).toBe("inactive");
    }
  });

  it("rejects a duplicate barcode with an error envelope", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const result = await actions.addBarcodeAction(
      "70000000-0000-0000-0000-000000000051",
      "7500000000017",
      false
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Duplicate barcode");
    }
  });

  it("creates a reference entity (brand) through the action", async () => {
    const actions = await import("@/features/catalog/server/actions");
    const result = await actions.createBrandAction({
      code: "TEST-MARCA",
      name: "Marca de prueba",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entity.code).toBe("TEST-MARCA");
      expect(result.entity.status).toBe("active");
    }
  });

  it("rethrows Next navigation redirects from the guards", async () => {
    const identity = await import("@/features/identity/application");
    vi.mocked(identity.requirePermission).mockImplementationOnce(
      async (code: string) => {
        if (code !== "catalog.read") {
          const error = new Error("forbidden") as Error & { digest: string };
          error.digest = "NEXT_REDIRECT";
          throw error;
        }
        return makeSession(ALL_PERMS);
      }
    );

    const actions = await import("@/features/catalog/server/actions");
    await expect(
      actions.createProductAction({
        externalId: "TEST-DENIED",
        description: "Sin permiso",
        shortName: null,
        brandId: null,
        categoryId: null,
        lineId: null,
        technicalDescription: null,
      })
    ).rejects.toMatchObject({ digest: "NEXT_REDIRECT" });
  });
});

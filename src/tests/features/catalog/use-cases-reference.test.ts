import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  archiveCategory,
  createBrand,
  createCategory,
  createProductLine,
  createUnit,
  updateBrand,
  updateCategory,
  updateProductLine,
  updateUnit,
} from "@/features/catalog/application";
import {
  CatalogNotFoundError,
  CatalogValidationError,
} from "@/features/catalog/domain";
import {
  actor,
  brand,
  category,
  line,
  makeContext,
  ORG_A,
  ORG_B,
  READ_WRITER,
  unit,
} from "./helpers";

describe("category use cases", () => {
  it("creates a root category", async () => {
    const context = makeContext({});

    const created = await createCategory(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      category: { parentId: null, code: "TUB", name: "Tubería" },
    });

    expect(created.status).toBe("active");
    expect(created.parentId).toBeNull();
    expect(context.auditRepository.events[0].action).toBe("create");
    expect(context.auditRepository.events[0].entityType).toBe("category");
  });

  it("rejects a duplicate category code", async () => {
    const context = makeContext({
      categories: [category("category-1", { code: "TUB" })],
    });

    await expect(
      createCategory(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        category: { parentId: null, code: "TUB", name: "Otra" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("rejects a child at depth beyond the maximum", async () => {
    const context = makeContext({
      categories: [
        category("category-1", { code: "A" }),
        category("category-2", { parentId: "category-1", code: "B" }),
        category("category-3", { parentId: "category-2", code: "C" }),
      ],
    });

    await expect(
      createCategory(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        category: { parentId: "category-3", code: "D", name: "Nivel 4" },
      })
    ).rejects.toThrow(/depth exceeds/);
  });

  it("rejects a category that is its own parent", async () => {
    const context = makeContext({
      categories: [category("category-1", { code: "A" })],
    });

    await expect(
      updateCategory(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        categoryId: "category-1",
        changes: { parentId: "category-1" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("detects a cycle when moving a parent under its own descendant", async () => {
    const context = makeContext({
      categories: [
        category("category-1", { code: "A" }),
        category("category-2", { parentId: "category-1", code: "B" }),
      ],
    });

    await expect(
      updateCategory(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        categoryId: "category-1",
        changes: { parentId: "category-2" },
      })
    ).rejects.toThrow(/cycle/);
  });

  it("archives a category and records the archive action", async () => {
    const context = makeContext({
      categories: [category("category-1", { code: "TUB" })],
    });

    const archived = await archiveCategory(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      categoryId: "category-1",
    });

    expect(archived.status).toBe("inactive");
    expect(context.auditRepository.events[0].action).toBe("archive");
  });

  it("rejects a category edit for another organization", async () => {
    const context = makeContext({
      categories: [category("category-1", { organizationId: ORG_B })],
    });

    await expect(
      updateCategory(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        categoryId: "category-1",
        changes: { name: "Renombrada" },
      })
    ).rejects.toThrow(CatalogNotFoundError);
  });
});

describe("brand use cases", () => {
  it("creates a brand and records an audit event", async () => {
    const context = makeContext({});
    const created = await createBrand(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      brand: { code: "TUB", name: "Tubería" },
    });

    expect(created.status).toBe("active");
    expect(context.auditRepository.events[0].entityType).toBe("brand");
  });

  it("rejects a duplicate brand code", async () => {
    const context = makeContext({ brands: [brand("brand-1", { code: "TUB" })] });
    await expect(
      createBrand(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        brand: { code: "TUB", name: "Otra" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("re-activating a brand records a restore action", async () => {
    const context = makeContext({
      brands: [brand("brand-1", { code: "TUB", status: "inactive" })],
    });

    const updated = await updateBrand(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      brandId: "brand-1",
      changes: { status: "active" },
    });

    expect(updated.status).toBe("active");
    expect(context.auditRepository.events[0].action).toBe("restore");
  });
});

describe("product line use cases", () => {
  it("creates a line with an external id", async () => {
    const context = makeContext({});
    const created = await createProductLine(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      productLine: { externalId: "LINEA-01", name: "Tubería" },
    });

    expect(created.externalId).toBe("LINEA-01");
    expect(context.auditRepository.events[0].entityType).toBe("line");
  });

  it("rejects a duplicate external id", async () => {
    const context = makeContext({
      lines: [line("line-1", { externalId: "LINEA-01" })],
    });

    await expect(
      createProductLine(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        productLine: { externalId: "LINEA-01", name: "Otra" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("updates a line and records the change", async () => {
    const context = makeContext({ lines: [line("line-1", { name: "Tubería" })] });

    const updated = await updateProductLine(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      lineId: "line-1",
      changes: { name: "Tubería y conexiones" },
    });

    expect(updated.name).toBe("Tubería y conexiones");
    expect(context.auditRepository.events[0].action).toBe("update");
  });
});

describe("unit use cases", () => {
  it("creates a unit and records an audit event", async () => {
    const context = makeContext({});
    const created = await createUnit(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      unit: { code: "M2", name: "Metro cuadrado", kind: "area" },
    });

    expect(created.kind).toBe("area");
    expect(context.auditRepository.events[0].entityType).toBe("unit");
  });

  it("rejects an invalid unit kind", async () => {
    const context = makeContext({});
    await expect(
      createUnit(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        unit: { code: "XYZ", name: "Rara", kind: "bogus" as never },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("rejects a duplicate unit code", async () => {
    const context = makeContext({ units: [unit("unit-1", { code: "PZA" })] });

    await expect(
      createUnit(context, {
        actor: actor(READ_WRITER),
        organizationId: ORG_A,
        unit: { code: "PZA", name: "Pieza", kind: "count" },
      })
    ).rejects.toThrow(CatalogValidationError);
  });

  it("archives a unit through a status transition", async () => {
    const context = makeContext({ units: [unit("unit-1", { code: "PZA" })] });

    const updated = await updateUnit(context, {
      actor: actor(READ_WRITER),
      organizationId: ORG_A,
      unitId: "unit-1",
      changes: { status: "inactive" },
    });

    expect(updated.status).toBe("inactive");
    expect(context.auditRepository.events[0].action).toBe("archive");
  });
});

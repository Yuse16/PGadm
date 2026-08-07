import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  createTemplate,
  deactivateTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  validateColumnMapping,
} from "@/features/inventory/application";
import {
  InventoryPermissionError,
  InventoryValidationError,
} from "@/features/inventory/domain";
import {
  IMPORTER,
  ORG_A,
  ORG_B,
  READER,
  actor,
  makeContext,
} from "./helpers";

const MAPPING = {
  required: ["codigo", "descripcion", "almacen", "existencia"],
  optional: ["cajas", "metros_cuadrados"],
};

describe("validateColumnMapping", () => {
  it("accepts a mapping with required and optional file columns (D-I07)", () => {
    expect(validateColumnMapping(MAPPING)).toEqual(MAPPING);
  });

  it("rejects an empty required list (IA-3)", () => {
    expect(() => validateColumnMapping({ required: [], optional: [] })).toThrow(
      InventoryValidationError
    );
  });

  it("rejects duplicate required column names", () => {
    expect(() =>
      validateColumnMapping({ required: ["codigo", "codigo"], optional: [] })
    ).toThrow(InventoryValidationError);
  });

  it("rejects blank column names", () => {
    expect(() =>
      validateColumnMapping({ required: ["codigo", "  "], optional: [] })
    ).toThrow(InventoryValidationError);
  });
});

describe("createTemplate", () => {
  it("creates an active template with the validated mapping", async () => {
    const context = makeContext();
    const created = await createTemplate(context, {
      actor: actor(IMPORTER),
      organizationId: ORG_A,
      name: "Plantilla test",
      sheetName: "Inventario",
      columnMapping: MAPPING,
      warehouseRules: [{ detected: "NOG-01", warehouseId: "10000000-0000-0000-0000-000000000003" }],
    });

    expect(created.status).toBe("active");
    expect(created.columnMapping).toEqual(MAPPING);
    expect(created.warehouseRules).toEqual([
      { detected: "NOG-01", warehouseId: "10000000-0000-0000-0000-000000000003" },
    ]);
    expect(created.organizationId).toBe(ORG_A);
  });

  it("denies creation without inventory.import", async () => {
    const context = makeContext();
    await expect(
      createTemplate(context, {
        actor: actor(READER),
        organizationId: ORG_A,
        name: "Plantilla",
        columnMapping: MAPPING,
      })
    ).rejects.toThrow(InventoryPermissionError);
  });

  it("rejects a blank template name (IA-33)", async () => {
    const context = makeContext();
    await expect(
      createTemplate(context, {
        actor: actor(IMPORTER),
        organizationId: ORG_A,
        name: "  ",
        columnMapping: MAPPING,
      })
    ).rejects.toThrow(InventoryValidationError);
  });

  it("denies cross-organization writes", async () => {
    const context = makeContext();
    await expect(
      createTemplate(context, {
        actor: actor(IMPORTER, ORG_B),
        organizationId: ORG_A,
        name: "Plantilla",
        columnMapping: MAPPING,
      })
    ).rejects.toThrow(InventoryPermissionError);
  });
});

describe("updateTemplate / deactivateTemplate", () => {
  it("updates name, sheet and mapping on the existing template", async () => {
    const context = makeContext();
    const updated = await updateTemplate(context, {
      actor: actor(IMPORTER),
      organizationId: ORG_A,
      templateId: "90000000-0000-0000-0000-000000000041",
      name: "Plantilla actualizada",
    });
    expect(updated.name).toBe("Plantilla actualizada");
    expect(updated.status).toBe("active");
    expect(await context.inventoryRepository.listTemplates(ORG_A)).toHaveLength(1);
  });

  it("deactivates a template via status, never deleting it (IA-34)", async () => {
    const context = makeContext();
    const deactivated = await deactivateTemplate(context, {
      actor: actor(IMPORTER),
      organizationId: ORG_A,
      templateId: "90000000-0000-0000-0000-000000000041",
    });
    expect(deactivated.status).toBe("inactive");
    expect(await context.inventoryRepository.listTemplates(ORG_A)).toHaveLength(1);
  });

  it("throws a typed not-found for a missing template", async () => {
    const context = makeContext();
    await expect(
      updateTemplate(context, {
        actor: actor(IMPORTER),
        organizationId: ORG_A,
        templateId: "90000000-0000-0000-0000-000000009999",
        name: "Nueva",
      })
    ).rejects.toThrow(/not found/i);
  });
});

describe("listTemplates / getTemplate", () => {
  it("lists templates for the organization", async () => {
    const context = makeContext();
    const templates = await listTemplates(context, { actor: actor(READER), organizationId: ORG_A });
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("Plantilla estandar Excel");
  });

  it("fetches a single template by id", async () => {
    const context = makeContext();
    const template = await getTemplate(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      templateId: "90000000-0000-0000-0000-000000000041",
    });
    expect(template.columnMapping.required).toContain("codigo");
  });

  it("requires inventory.read to list (IA-23)", async () => {
    const context = makeContext();
    await expect(
      listTemplates(context, { actor: actor([], ORG_A), organizationId: ORG_A })
    ).rejects.toThrow(InventoryPermissionError);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  assignProduct,
  confirmReplacement,
  listPositionsWithStock,
  markNeedsReview,
  removeProduct,
} from "@/features/layout/application";
import {
  LayoutPermissionError,
  LayoutValidationError,
} from "@/features/layout/domain";
import {
  EDITOR,
  LAYOUT_NOGALERA,
  ORG_A,
  ORG_B,
  POSITION_M1_01_RF_P01,
  POSITION_M1_01_RF_P03,
  POSITION_M1_01_RI_P01,
  POSITION_M1_02_RF_P01,
  POSITION_MOST_V01,
  READER,
  UNKNOWN_VARIANT,
  VARIANT_051,
  VARIANT_052,
  VARIANT_053,
  actor,
  makeContext,
} from "./helpers";

describe("assignProduct", () => {
  it("assigns an exact catalog variant and clears review (LA-17)", async () => {
    const context = makeContext();
    const assigned = await assignProduct(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_M1_01_RF_P03,
      variantId: VARIANT_051,
      reason: "Colocar tubo PVC en riel frontal",
    });

    expect(assigned.variantId).toBe(VARIANT_051);
    expect(assigned.reviewStatus).toBe("ok");
    expect(assigned.activeFrom).not.toBeNull();

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const entry = history.find(
      (item) => item.positionId === POSITION_M1_01_RF_P03 && item.changeType === "product_assigned"
    );
    expect(entry).toBeDefined();
    expect(entry?.previousVariantId).toBeNull();
    expect(entry?.newVariantId).toBe(VARIANT_051);

    expect(context.auditRepository.events.some((e) => e.action === "product_assigned")).toBe(true);
  });

  it("conserves the previous variant when reassigning (LA-17)", async () => {
    const context = makeContext();
    await assignProduct(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_M1_01_RF_P01,
      variantId: VARIANT_052,
    });

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const entry = history.find(
      (item) => item.positionId === POSITION_M1_01_RF_P01 && item.changeType === "product_assigned"
    );
    expect(entry?.previousVariantId).toBe(VARIANT_051);
    expect(entry?.newVariantId).toBe(VARIANT_052);
  });

  it("rejects an unknown catalog variant (LA-5: never invents product)", async () => {
    const context = makeContext();
    await expect(
      assignProduct(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        positionId: POSITION_M1_01_RF_P03,
        variantId: UNKNOWN_VARIANT,
      })
    ).rejects.toThrow(LayoutValidationError);
  });
});

describe("removeProduct", () => {
  it("empties the position, closes the window and records the removed variant", async () => {
    const context = makeContext();
    const removed = await removeProduct(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_M1_01_RI_P01,
      reason: "Retirar del display",
    });

    expect(removed.variantId).toBeNull();
    expect(removed.activeTo).not.toBeNull();

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const entry = history.find(
      (item) => item.positionId === POSITION_M1_01_RI_P01 && item.changeType === "product_removed"
    );
    expect(entry?.previousVariantId).toBe(VARIANT_053);
    expect(entry?.newVariantId).toBeNull();
  });

  it("rejects removing from an already-empty position", async () => {
    const context = makeContext();
    await expect(
      removeProduct(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        positionId: POSITION_M1_01_RF_P03,
      })
    ).rejects.toThrow(/already empty/i);
  });
});

describe("markNeedsReview / confirmReplacement (D-L07, LA-19/LA-20)", () => {
  it("marks a position needs_review without reassigning the product", async () => {
    const context = makeContext();
    const marked = await markNeedsReview(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_MOST_V01,
      reason: "Cambio de stock detectado",
    });

    expect(marked.reviewStatus).toBe("needs_review");
    expect(marked.variantId).toBe(VARIANT_051);
  });

  it("confirms a compatible replacement explicitly and clears the flag", async () => {
    const context = makeContext();
    await markNeedsReview(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_MOST_V01,
    });

    const confirmed = await confirmReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_MOST_V01,
      variantId: VARIANT_052,
      reason: "Reemplazo compatible confirmado por el usuario",
    });

    expect(confirmed.reviewStatus).toBe("ok");
    expect(confirmed.variantId).toBe(VARIANT_052);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const entry = history.find(
      (item) => item.positionId === POSITION_MOST_V01 && item.changeType === "product_assigned"
    );
    expect(entry?.previousVariantId).toBe(VARIANT_051);
    expect(entry?.newVariantId).toBe(VARIANT_052);
  });

  it("confirming the same product clears the flag without a new assignment", async () => {
    const context = makeContext();
    await markNeedsReview(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_MOST_V01,
    });

    const confirmed = await confirmReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      positionId: POSITION_MOST_V01,
    });
    expect(confirmed.reviewStatus).toBe("ok");
    expect(confirmed.variantId).toBe(VARIANT_051);
  });

  it("denies product mutations without layout.edit (LA-24)", async () => {
    const context = makeContext();
    await expect(
      assignProduct(context, {
        actor: actor(READER),
        organizationId: ORG_A,
        positionId: POSITION_M1_01_RF_P03,
        variantId: VARIANT_051,
      })
    ).rejects.toThrow(LayoutPermissionError);
  });
});

describe("listPositionsWithStock (D-L13, LA-18)", () => {
  it("joins positions with the latest reported stock, store and CEDIS separate", async () => {
    const context = makeContext();
    const rows = await listPositionsWithStock(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    expect(rows).toHaveLength(35);

    const assigned = rows.find((row) => row.position.id === POSITION_M1_01_RF_P01);
    expect(assigned?.position.variantId).toBe(VARIANT_051);
    expect(assigned?.stock).toHaveLength(1);
    expect(assigned?.stock[0].warehouseCode).toBe("NOG-01");
    expect(assigned?.stock[0].quantity).toBe(130);
    expect(assigned?.stock[0].reportDate).toMatch(/^2026-08-06/);

    const empty = rows.find((row) => row.position.id === POSITION_M1_01_RF_P03);
    expect(empty?.stock).toHaveLength(0);
  });

  it("keeps CEDIS absent when there is no snapshot (sin datos, never fabricated)", async () => {
    const context = makeContext();
    const rows = await listPositionsWithStock(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const assigned = rows.find((row) => row.position.id === POSITION_M1_02_RF_P01);
    const cedis = assigned?.stock.filter((stock) => stock.warehouseCode === "SAL-01");
    expect(cedis).toHaveLength(0);
  });

  it("requires layout.read (LA-22)", async () => {
    const context = makeContext();
    await expect(
      listPositionsWithStock(context, {
        actor: actor([], ORG_A),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(LayoutPermissionError);
  });

  it("never returns data for another organization (D-C07)", async () => {
    const context = makeContext();
    await expect(
      listPositionsWithStock(context, {
        actor: actor(READER, ORG_B),
        organizationId: ORG_B,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(/not found/i);
  });
});

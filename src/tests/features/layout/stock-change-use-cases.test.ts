import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  detectStockChanges,
  publishLayout,
  suggestCompatibleReplacement,
} from "@/features/layout/application";
import {
  LayoutPermissionError,
  LayoutValidationError,
} from "@/features/layout/domain";
import {
  DemoLayoutReferenceCatalog,
  DEMO_VARIANT_051,
  DEMO_VARIANT_052,
  DEMO_VARIANT_053,
} from "@/features/layout/infrastructure";
import {
  ADMIN,
  EDITOR,
  ORG_A,
  READER,
  actor,
  makeContext,
  POSITION_M1_01_RF_P01,
  POSITION_M1_01_RF_P02,
  POSITION_M1_01_RF_P03,
  POSITION_M1_01_RP_P01,
  POSITION_M1_01_RI_P01,
  POSITION_M1_03_RF_P01,
  POSITION_M1_03_RF_P02,
  VARIANT_051,
  LAYOUT_NOGALERA,
} from "./helpers";

describe("detectStockChanges (D-L07/LA-19)", () => {
  it("flags positions whose assigned variant reports zero existence, keeps the rest ok", async () => {
    const context = makeContext();
    const result = await detectStockChanges(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    // Variants 052/053 report 0 on the branch warehouses -> 4 positions flagged
    // (M1-01-RP, M1-03-RF-P01, M1-01-RI, M1-03-RF-P02).
    expect(result.changed.map((position) => position.id).sort()).toEqual(
      [
        POSITION_M1_01_RP_P01,
        POSITION_M1_03_RF_P01,
        POSITION_M1_01_RI_P01,
        POSITION_M1_03_RF_P02,
      ].sort()
    );
    // Variant 051 reports 130 -> those positions stay ok.
    expect(result.changed.some((position) => position.id === POSITION_M1_01_RF_P02)).toBe(false);
    // The already-flagged fixture position is not re-processed.
    expect(result.changed.some((position) => position.id === POSITION_M1_01_RF_P01)).toBe(false);
    // underReview = 4 newly flagged + 1 already flagged.
    expect(result.underReview).toBe(5);
  });

  it("is idempotent: a second run flags nothing", async () => {
    const context = makeContext();
    await detectStockChanges(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    const second = await detectStockChanges(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    expect(second.changed).toEqual([]);
    expect(second.underReview).toBe(5);
  });

  it("records one audit event per flagged position", async () => {
    const context = makeContext();
    await detectStockChanges(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    const flaggedIds = [
      POSITION_M1_01_RP_P01,
      POSITION_M1_03_RF_P01,
      POSITION_M1_01_RI_P01,
      POSITION_M1_03_RF_P02,
    ];
    for (const positionId of flaggedIds) {
      expect(
        context.auditRepository.events.some(
          (event) =>
            event.action === "element_edited" &&
            event.entityType === "layout_position" &&
            event.entityId === positionId
        )
      ).toBe(true);
    }
  });

  it("requires layout.edit permission", async () => {
    const context = makeContext();
    await expect(
      detectStockChanges(context, {
        actor: actor(READER),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toBeInstanceOf(LayoutPermissionError);
  });

  it("only runs on draft layouts (D-L04)", async () => {
    const context = makeContext();
    await publishLayout(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    await expect(
      detectStockChanges(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toBeInstanceOf(LayoutValidationError);
  });
});

describe("suggestCompatibleReplacement (D-L07/LA-20)", () => {
  it("suggests an active sibling variant with reported stock", async () => {
    const context = makeContext();
    const suggestion = await suggestCompatibleReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      positionId: POSITION_M1_01_RP_P01, // variant 052 (stock 0) -> sibling 051 (stock 130)
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.id).toBe(VARIANT_051);
  });

  it("returns null when every sibling reports zero existence", async () => {
    const context = makeContext();
    const suggestion = await suggestCompatibleReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      positionId: POSITION_M1_01_RF_P01, // variant 051 (already flagged) -> sibling 052 (stock 0)
    });

    expect(suggestion).toBeNull();
  });

  it("returns null when the variant has no sibling variants", async () => {
    const context = makeContext();
    const suggestion = await suggestCompatibleReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      positionId: POSITION_M1_01_RI_P01, // variant 053, only variant of its product
    });

    expect(suggestion).toBeNull();
  });

  it("returns null for an empty position", async () => {
    const context = makeContext();
    const suggestion = await suggestCompatibleReplacement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      positionId: POSITION_M1_01_RF_P03, // no variant assigned
    });

    expect(suggestion).toBeNull();
  });

  it("requires layout.read permission", async () => {
    const context = makeContext();
    await expect(
      suggestCompatibleReplacement(context, {
        actor: actor([]),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        positionId: POSITION_M1_01_RP_P01,
      })
    ).rejects.toBeInstanceOf(LayoutPermissionError);
  });
});

describe("DemoLayoutReferenceCatalog.findCompatibleVariants", () => {
  it("returns the sibling variants of the same product, excluding itself", async () => {
    const catalog = new DemoLayoutReferenceCatalog();
    const candidates = await catalog.findCompatibleVariants(ORG_A, DEMO_VARIANT_051);
    expect(candidates.map((candidate) => candidate.id)).toEqual([DEMO_VARIANT_052]);
  });

  it("returns an empty list when the variant is the only one of its product", async () => {
    const catalog = new DemoLayoutReferenceCatalog();
    const candidates = await catalog.findCompatibleVariants(ORG_A, DEMO_VARIANT_053);
    expect(candidates).toEqual([]);
  });

  it("returns an empty list for an unknown variant", async () => {
    const catalog = new DemoLayoutReferenceCatalog();
    const candidates = await catalog.findCompatibleVariants(
      ORG_A,
      "70000000-0000-0000-0000-000000000999"
    );
    expect(candidates).toEqual([]);
  });

  it("is org-scoped: no candidates for another organization (D-C08)", async () => {
    const catalog = new DemoLayoutReferenceCatalog();
    const candidates = await catalog.findCompatibleVariants(
      "20000000-0000-0000-0000-000000000001",
      DEMO_VARIANT_051
    );
    expect(candidates).toEqual([]);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  approveImport,
  computeChanges,
  getSnapshot,
  listChanges,
  listSnapshots,
} from "@/features/inventory/application";
import {
  InventoryPermissionError,
  InventoryValidationError,
} from "@/features/inventory/domain";
import type { InventoryChange } from "@/features/inventory/domain";
import {
  APPROVER,
  ORG_A,
  ORG_B,
  READER,
  UNKNOWN_VARIANT,
  UNKNOWN_WAREHOUSE,
  VARIANT_051,
  VARIANT_052,
  VARIANT_053,
  WAREHOUSE_NOG_01,
  actor,
  makeContext,
  makeEmptyContext,
} from "./helpers";

const BASELINE_DATE = "2026-08-03T09:00:00.000Z";

function load(items: Array<{ variantId: string; quantity: number }>) {
  return {
    actor: actor(APPROVER),
    organizationId: ORG_A,
    warehouseId: WAREHOUSE_NOG_01,
    source: "excel" as const,
    sourceFile: "inventario_test.xlsx",
    reportDate: BASELINE_DATE,
    items: items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  };
}

describe("approveImport — baseline", () => {
  it("approves the first load as the baseline with the exact source date (IA-12)", async () => {
    const context = makeEmptyContext();
    const result = await approveImport(context, load([
      { variantId: VARIANT_051, quantity: 100 },
      { variantId: VARIANT_052, quantity: 4 },
    ]));

    expect(result.snapshot.isBaseline).toBe(true);
    expect(result.snapshot.reportDate).toBe("2026-08-03T09:00:00.000Z");
    expect(result.snapshot.organizationId).toBe(ORG_A);
    expect(result.snapshot.warehouseId).toBe(WAREHOUSE_NOG_01);
    expect(result.snapshot.source).toBe("excel");
    expect(result.snapshot.importedBy).toBe(actor(APPROVER).userId);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.quantity).sort((a, b) => a - b)).toEqual([4, 100]);
    expect(result.changes).toHaveLength(0); // IA-13: no changes before a baseline
  });

  it("records an approve_import audit event (IA-35)", async () => {
    const context = makeEmptyContext();
    const result = await approveImport(context, load([{ variantId: VARIANT_051, quantity: 100 }]));

    const events = context.auditRepository.events;
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("approve_import");
    expect(events[0].entityType).toBe("inventory_snapshot");
    expect(events[0].entityId).toBe(result.snapshot.id);
    expect(events[0].actorUserId).toBe(actor(APPROVER).userId);
  });

  it("rejects a non-baseline first load (IA-13)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, { ...load([{ variantId: VARIANT_051, quantity: 100 }]), isBaseline: false })
    ).rejects.toThrow(InventoryValidationError);
  });

  it("rejects an empty load", async () => {
    const context = makeEmptyContext();
    await expect(approveImport(context, { ...load([]) })).rejects.toThrow(InventoryValidationError);
  });

  it("rejects an unknown variant (IA-7)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, load([{ variantId: UNKNOWN_VARIANT, quantity: 1 }]))
    ).rejects.toThrow(InventoryValidationError);
  });

  it("rejects an unknown warehouse (IA-5)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, { ...load([{ variantId: VARIANT_051, quantity: 1 }]), warehouseId: UNKNOWN_WAREHOUSE })
    ).rejects.toThrow(InventoryValidationError);
  });

  it("reports duplicate variants without summing them (IA-4)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, load([
        { variantId: VARIANT_051, quantity: 100 },
        { variantId: VARIANT_051, quantity: 5 },
      ]))
    ).rejects.toThrow(InventoryValidationError);
  });

  it("rejects a negative quantity (IA-6)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, load([{ variantId: VARIANT_051, quantity: -1 }]))
    ).rejects.toThrow(InventoryValidationError);
  });

  it("denies approval without inventory.approve (IA-25)", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, {
        ...load([{ variantId: VARIANT_051, quantity: 1 }]),
        actor: actor(READER),
      })
    ).rejects.toThrow(InventoryPermissionError);
  });

  it("denies a cross-organization write", async () => {
    const context = makeEmptyContext();
    await expect(
      approveImport(context, {
        ...load([{ variantId: VARIANT_051, quantity: 1 }]),
        actor: actor(APPROVER, ORG_B),
      })
    ).rejects.toThrow(InventoryPermissionError);
  });
});

describe("approveImport — second load and changes", () => {
  it("rejects a duplicate load for the same warehouse/date/source (IA-8)", async () => {
    const context = makeContext(); // seeded: baseline 08-03, non-baseline 08-06
    await expect(
      approveImport(context, {
        ...load([{ variantId: VARIANT_051, quantity: 130 }]),
        reportDate: "2026-08-06T09:00:00.000Z",
      })
    ).rejects.toThrow(/Duplicate load rejected/);
  });

  it("rejects an explicit baseline when one already exists (IA-12)", async () => {
    const context = makeContext();
    await expect(
      approveImport(context, {
        ...load([{ variantId: VARIANT_051, quantity: 130 }]),
        reportDate: "2026-08-09T09:00:00.000Z",
        isBaseline: true,
      })
    ).rejects.toThrow(/Baseline already exists/);
  });

  it("computes only-changes for the new load (IA-14/15/16/18)", async () => {
    const context = makeEmptyContext();
    await approveImport(context, load([
      { variantId: VARIANT_051, quantity: 100 },
      { variantId: VARIANT_052, quantity: 4 },
      { variantId: VARIANT_053, quantity: 12 },
    ]));

    const second = await approveImport(context, {
      ...load([
        { variantId: VARIANT_051, quantity: 130 }, // increase
        { variantId: VARIANT_052, quantity: 0 }, // zeroed
        // variant 053 absent from the file → missing_product
      ]),
      reportDate: "2026-08-06T09:00:00.000Z",
      isBaseline: false,
    });

    expect(second.snapshot.isBaseline).toBe(false);
    expect(second.changes).toHaveLength(3);

    const byVariant = new Map(second.changes.map((change) => [change.variantId, change]));
    const increase = byVariant.get(VARIANT_051)!;
    expect(increase.changeType).toBe("increase");
    expect(increase.difference).toBe(30); // IA-18: new - previous
    expect(increase.sourceSnapshotId).toBe(second.snapshot.id);

    const zeroed = byVariant.get(VARIANT_052)!;
    expect(zeroed.changeType).toBe("zeroed");
    expect(zeroed.difference).toBe(-4);

    const missing = byVariant.get(VARIANT_053)!;
    expect(missing.changeType).toBe("missing_product"); // IA-16
    expect(missing.previousQuantity).toBe(12);
    expect(missing.newQuantity).toBe(0);
    expect(missing.difference).toBe(-12);
  });

  it("writes no change for an unchanged variant (IA-15)", async () => {
    const context = makeEmptyContext();
    await approveImport(context, load([{ variantId: VARIANT_051, quantity: 100 }]));
    const second = await approveImport(context, {
      ...load([{ variantId: VARIANT_051, quantity: 100 }]),
      reportDate: "2026-08-06T09:00:00.000Z",
    });
    expect(second.changes).toHaveLength(0);
  });

  it("classifies recovered stock and new products", async () => {
    const context = makeEmptyContext();
    await approveImport(context, load([
      { variantId: VARIANT_051, quantity: 0 },
      { variantId: VARIANT_052, quantity: 4 },
    ]));
    const second = await approveImport(context, {
      ...load([
        { variantId: VARIANT_051, quantity: 6 }, // recovered
        { variantId: VARIANT_052, quantity: 4 }, // unchanged
        { variantId: VARIANT_053, quantity: 9 }, // new_product
      ]),
      reportDate: "2026-08-06T09:00:00.000Z",
    });
    const byVariant = new Map(second.changes.map((change) => [change.variantId, change]));
    expect(byVariant.get(VARIANT_051)?.changeType).toBe("recovered");
    expect(byVariant.get(VARIANT_053)?.changeType).toBe("new_product");
    expect(byVariant.get(VARIANT_053)?.previousQuantity).toBe(0);
    expect(byVariant.get(VARIANT_052)).toBeUndefined();
  });

  it("keeps previous snapshots and changes after a new load (IA-17)", async () => {
    const context = makeEmptyContext();
    const first = await approveImport(context, load([{ variantId: VARIANT_051, quantity: 100 }]));
    await approveImport(context, {
      ...load([{ variantId: VARIANT_051, quantity: 130 }]),
      reportDate: "2026-08-06T09:00:00.000Z",
    });

    const snapshots = await listSnapshots(context, { actor: actor(APPROVER), organizationId: ORG_A });
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((snapshot) => snapshot.id)).toContain(first.snapshot.id);
  });
});

describe("listSnapshots / getSnapshot / listChanges", () => {
  it("lists snapshots for the organization only", async () => {
    const context = makeContext();
    const snapshots = await listSnapshots(context, { actor: actor(APPROVER), organizationId: ORG_A });
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].reportDate).toBe("2026-08-06T09:00:00.000Z"); // newest first
  });

  it("requires inventory.read to list (IA-23)", async () => {
    const context = makeContext();
    await expect(
      listSnapshots(context, { actor: actor([]), organizationId: ORG_A })
    ).rejects.toThrow(InventoryPermissionError);
  });

  it("returns snapshot details with items and changes", async () => {
    const context = makeContext();
    const detail = await getSnapshot(context, {
      actor: actor(APPROVER),
      organizationId: ORG_A,
      snapshotId: "90000000-0000-0000-0000-000000000001",
    });
    expect(detail.snapshot.isBaseline).toBe(true);
    expect(detail.items).toHaveLength(3);
    expect(detail.changes).toHaveLength(0);
  });

  it("throws a typed not-found for a missing snapshot", async () => {
    const context = makeContext();
    await expect(
      getSnapshot(context, {
        actor: actor(APPROVER),
        organizationId: ORG_A,
        snapshotId: "90000000-0000-0000-0000-000000009999",
      })
    ).rejects.toThrow(/not found/i);
  });

  it("filters changes by warehouse and variant", async () => {
    const context = makeContext();
    const filtered = await listChanges(context, {
      actor: actor(APPROVER),
      organizationId: ORG_A,
      variantId: VARIANT_051,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].changeType).toBe("increase");
  });
});

describe("computeChanges (unit)", () => {
  function item(variantId: string, quantity: number) {
    return {
      id: `item-${variantId}`,
      organizationId: ORG_A,
      snapshotId: "snapshot-x",
      variantId,
      quantity,
      boxes: null,
      squareMeters: null,
      createdAt: "2026-08-01T00:00:00.000Z",
    };
  }

  it("computes missing_product for variants absent from the new file (IA-16)", () => {
    const changes = computeChanges(
      ORG_A,
      WAREHOUSE_NOG_01,
      "snapshot-2",
      "2026-08-06T09:00:00.000Z",
      [item(VARIANT_051, 100), item(VARIANT_052, 4)],
      [item(VARIANT_051, 100)]
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe("missing_product");
  });

  it("returns a deterministic sorted list", () => {
    const changes: InventoryChange[] = computeChanges(
      ORG_A,
      WAREHOUSE_NOG_01,
      "snapshot-2",
      "2026-08-06T09:00:00.000Z",
      [item(VARIANT_052, 4), item(VARIANT_051, 100)],
      [item(VARIANT_051, 130), item(VARIANT_052, 0)]
    );
    expect(changes.map((change) => change.variantId)).toEqual([VARIANT_051, VARIANT_052]);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import { DemoInventoryRepository } from "@/features/inventory/infrastructure";
import {
  DEMO_ORG_PGM,
  DEMO_SNAPSHOT_BASELINE,
  DEMO_SNAPSHOT_SECOND,
  DEMO_WAREHOUSE_NOG_01,
} from "@/features/inventory/infrastructure";

describe("DemoInventoryRepository (1D.2 fixtures)", () => {
  it("is seeded with the two snapshots (baseline + second load)", async () => {
    const repository = new DemoInventoryRepository();
    const snapshots = await repository.listSnapshots(DEMO_ORG_PGM);
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].id).toBe(DEMO_SNAPSHOT_SECOND);
    expect(snapshots[1].id).toBe(DEMO_SNAPSHOT_BASELINE);
    expect(snapshots[1].isBaseline).toBe(true);
  });

  it("finds the latest snapshot per warehouse", async () => {
    const repository = new DemoInventoryRepository();
    const latest = await repository.findLatestSnapshot(
      DEMO_ORG_PGM,
      DEMO_WAREHOUSE_NOG_01
    );
    expect(latest?.id).toBe(DEMO_SNAPSHOT_SECOND);
  });

  it("lists snapshot items sorted by variant id", async () => {
    const repository = new DemoInventoryRepository();
    const items = await repository.listSnapshotItems(DEMO_ORG_PGM, DEMO_SNAPSHOT_BASELINE);
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.variantId).sort()).toEqual(
      items.map((item) => item.variantId)
    );
  });

  it("exposes the seeded changes (increase/zeroed/missing_product)", async () => {
    const repository = new DemoInventoryRepository();
    const changes = await repository.listChanges(DEMO_ORG_PGM);
    expect(changes).toHaveLength(3);
    expect(new Set(changes.map((change) => change.changeType))).toEqual(
      new Set(["increase", "zeroed", "missing_product"])
    );
  });

  it("detects an existing non-baseline load (IA-8)", async () => {
    const repository = new DemoInventoryRepository();
    const duplicate = await repository.findExistingLoad(
      DEMO_ORG_PGM,
      DEMO_WAREHOUSE_NOG_01,
      "2026-08-06T09:00:00.000Z",
      "excel"
    );
    expect(duplicate?.id).toBe(DEMO_SNAPSHOT_SECOND);
  });

  it("treats another organization as a miss (D-C07)", async () => {
    const repository = new DemoInventoryRepository();
    const snapshots = await repository.listSnapshots("20000000-0000-0000-0000-000000000001");
    expect(snapshots).toHaveLength(0);
  });

  it("supports an empty state for baseline flows", async () => {
    const repository = new DemoInventoryRepository({ seed: false });
    expect(await repository.listSnapshots(DEMO_ORG_PGM)).toHaveLength(0);
    expect(await repository.listChanges(DEMO_ORG_PGM)).toHaveLength(0);
    const missing = await repository.findLatestSnapshot(DEMO_ORG_PGM, DEMO_WAREHOUSE_NOG_01);
    expect(missing).toBeNull();
  });
});

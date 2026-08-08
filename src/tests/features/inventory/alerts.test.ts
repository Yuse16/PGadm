import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  computeInventoryAlerts,
  DEFAULT_ALERT_THRESHOLDS,
  isInventoryAlertType,
} from "@/features/inventory/application";
import type {
  InventoryChange,
  InventorySnapshotItem,
} from "@/features/inventory/domain";
import {
  DEMO_VARIANT_051,
  DEMO_VARIANT_052,
  DEMO_VARIANT_053,
} from "@/features/inventory/infrastructure";

const WAREHOUSE = "10000000-0000-0000-0000-000000000003";

function change(
  variantId: string,
  changeType: InventoryChange["changeType"],
  previousQuantity: number,
  newQuantity: number
): InventoryChange {
  return {
    id: `change-${variantId}-${changeType}`,
    organizationId: "10000000-0000-0000-0000-000000000001",
    variantId,
    warehouseId: WAREHOUSE,
    previousQuantity,
    newQuantity,
    difference: newQuantity - previousQuantity,
    changeType,
    detectedAt: "2026-08-06T10:00:00.000Z",
    sourceSnapshotId: "90000000-0000-0000-0000-000000000002",
    createdAt: "2026-08-06T10:00:00.000Z",
  };
}

function item(
  variantId: string,
  quantity: number,
  id = `item-${variantId}`
): InventorySnapshotItem {
  return {
    id,
    organizationId: "10000000-0000-0000-0000-000000000001",
    snapshotId: "90000000-0000-0000-0000-000000000002",
    variantId,
    quantity,
    boxes: null,
    squareMeters: null,
    createdAt: "2026-08-06T10:00:00.000Z",
  };
}

describe("computeInventoryAlerts (D-I13, stock alerts)", () => {
  it("flags a missing product as absent from the file, never as stock zero (D-I05)", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_053, "missing_product", 12, 0)],
      latestItems: [],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("absent_from_file");
    expect(alerts[0].message).toContain("no es stock cero");
  });

  it("flags a zeroed product as zeroed stock", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_052, "zeroed", 4, 0)],
      latestItems: [],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      variantId: DEMO_VARIANT_052,
      alertType: "zeroed_stock",
      previousQuantity: 4,
      newQuantity: 0,
    });
  });

  it("flags a new product only when it arrives with high stock (threshold)", () => {
    const high = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_051, "new_product", 0, 60)],
      latestItems: [],
    });
    expect(high[0].alertType).toBe("high_new_stock");

    const low = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_051, "new_product", 0, 3)],
      latestItems: [],
    });
    expect(low).toHaveLength(0);
  });

  it("flags a difference between loads above the threshold", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_051, "increase", 100, 130)],
      latestItems: [],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("load_difference");
    expect(alerts[0].message).toContain("Diferencia entre cargas");
  });

  it("ignores small differences below the threshold", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_051, "increase", 100, 105)],
      latestItems: [],
    });
    expect(alerts).toHaveLength(0);
  });

  it("flags low stock for unchanged items within the low threshold", () => {
    const alerts = computeInventoryAlerts({
      changes: [],
      latestItems: [item(DEMO_VARIANT_051, 3)],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("low_stock");
  });

  it("does not flag low stock for items already flagged by a change", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_052, "zeroed", 4, 0)],
      latestItems: [item(DEMO_VARIANT_052, 0)],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("zeroed_stock");
  });

  it("applies custom thresholds per organization", () => {
    const alerts = computeInventoryAlerts({
      changes: [change(DEMO_VARIANT_051, "increase", 100, 106)],
      latestItems: [item(DEMO_VARIANT_052, 10)],
      thresholds: { difference: 5, lowStock: 10 },
    });
    expect(alerts.map((alert) => alert.alertType).sort()).toEqual([
      "load_difference",
      "low_stock",
    ]);
  });

  it("uses sensible defaults that match the demo fixtures", () => {
    expect(DEFAULT_ALERT_THRESHOLDS).toEqual({ lowStock: 5, highNewStock: 50, difference: 10 });
    const alerts = computeInventoryAlerts({
      changes: [
        change(DEMO_VARIANT_051, "increase", 100, 130),
        change(DEMO_VARIANT_052, "zeroed", 4, 0),
        change(DEMO_VARIANT_053, "missing_product", 12, 0),
      ],
      latestItems: [
        item(DEMO_VARIANT_051, 130),
        item(DEMO_VARIANT_052, 0),
      ],
    });
    expect(alerts.map((alert) => alert.alertType).sort()).toEqual([
      "absent_from_file",
      "load_difference",
      "zeroed_stock",
    ]);
  });

  it("sorts deterministically by variant id then alert type", () => {
    const alerts = computeInventoryAlerts({
      changes: [
        change(DEMO_VARIANT_053, "missing_product", 12, 0),
        change(DEMO_VARIANT_052, "increase", 4, 40),
      ],
      latestItems: [],
    });
    expect(alerts.map((alert) => alert.variantId)).toEqual([
      DEMO_VARIANT_052,
      DEMO_VARIANT_053,
    ]);
  });

  it("validates alert types", () => {
    expect(isInventoryAlertType("low_stock")).toBe(true);
    expect(isInventoryAlertType("load_difference")).toBe(true);
    expect(isInventoryAlertType("in_stock")).toBe(false);
  });
});

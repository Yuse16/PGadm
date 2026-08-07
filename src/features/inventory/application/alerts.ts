import type { InventoryChange, InventorySnapshotItem } from "../domain";

export const INVENTORY_ALERT_TYPES = [
  "load_difference",
  "absent_from_file",
  "zeroed_stock",
  "low_stock",
  "high_new_stock",
] as const;
export type InventoryAlertType = (typeof INVENTORY_ALERT_TYPES)[number];

/** Initial stock alerts (D-I13): computable from snapshot/change data alone. */
export interface InventoryAlert {
  variantId: string;
  alertType: InventoryAlertType;
  previousQuantity: number;
  newQuantity: number;
  message: string;
}

/**
 * Configurable thresholds (D-I13: "los umbrales deben configurarse y refinarse
 * con uso real"). All values are inclusive bounds. Defaults are conservative;
 * the caller may override per organization.
 */
export interface InventoryAlertThresholds {
  /** newQuantity in [1, lowStock] triggers `low_stock`. */
  lowStock: number;
  /** new_product with newQuantity >= highNewStock triggers `high_new_stock`. */
  highNewStock: number;
  /** |difference| >= difference triggers `load_difference`. */
  difference: number;
}

export const DEFAULT_ALERT_THRESHOLDS: InventoryAlertThresholds = {
  lowStock: 5,
  highNewStock: 50,
  difference: 10,
};

/**
 * Computes alerts from the changes of the latest load plus its snapshot items.
 * Missing_product is never treated as stock zero (D-I05): it becomes
 * `absent_from_file`. The tienda/CEDIS cross-check and the layout/sales-based
 * alerts (exhibido, comercialización, remate) depend on other modules and are
 * deferred (D-I14).
 */
export function computeInventoryAlerts(input: {
  changes: InventoryChange[];
  latestItems: InventorySnapshotItem[];
  thresholds?: Partial<InventoryAlertThresholds>;
}): InventoryAlert[] {
  const thresholds: InventoryAlertThresholds = {
    ...DEFAULT_ALERT_THRESHOLDS,
    ...input.thresholds,
  };
  const alerts: InventoryAlert[] = [];
  const flagged = new Set<string>();

  for (const change of input.changes) {
    const message = alertMessage(change, thresholds);
    if (message === null) {
      continue;
    }
    alerts.push({
      variantId: change.variantId,
      alertType: message.alertType,
      previousQuantity: change.previousQuantity,
      newQuantity: change.newQuantity,
      message: message.message,
    });
    flagged.add(change.variantId);
  }

  for (const item of input.latestItems) {
    if (flagged.has(item.variantId)) {
      continue;
    }
    if (item.quantity > 0 && item.quantity <= thresholds.lowStock) {
      alerts.push({
        variantId: item.variantId,
        alertType: "low_stock",
        previousQuantity: item.quantity,
        newQuantity: item.quantity,
        message: `Stock bajo: ${item.quantity} unidades reportadas`,
      });
    }
  }

  return alerts.sort((a, b) =>
    a.variantId === b.variantId
      ? a.alertType.localeCompare(b.alertType)
      : a.variantId.localeCompare(b.variantId)
  );
}

function alertMessage(
  change: InventoryChange,
  thresholds: InventoryAlertThresholds
): { alertType: InventoryAlertType; message: string } | null {
  const magnitude = Math.abs(change.difference);
  switch (change.changeType) {
    case "missing_product":
      return {
        alertType: "absent_from_file",
        message: `Producto ausente del archivo: ${change.previousQuantity} → 0 (no es stock cero, D-I05)`,
      };
    case "zeroed":
      return {
        alertType: "zeroed_stock",
        message: `Stock en cero: ${change.previousQuantity} → 0`,
      };
    case "new_product":
      if (change.newQuantity < thresholds.highNewStock) {
        return null;
      }
      return {
        alertType: "high_new_stock",
        message: `Producto nuevo con alto stock: ${change.newQuantity} unidades`,
      };
    default:
      if (magnitude >= thresholds.difference) {
        return {
          alertType: "load_difference",
          message: `Diferencia entre cargas: ${change.previousQuantity} → ${change.newQuantity} (${change.difference})`,
        };
      }
      return null;
  }
}

export function isInventoryAlertType(value: string): value is InventoryAlertType {
  return (INVENTORY_ALERT_TYPES as readonly string[]).includes(value);
}

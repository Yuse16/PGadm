import type {
  CatalogIntegrationRepository,
  CatalogIntegrationSummary,
} from "../../catalog/domain/integrations";
import type { InventoryRepository } from "../domain";

/**
 * Integration of the 1C.5 port with real inventory (D-I14, Fase 1D.5): the
 * catalog product detail renders the stock reported by the latest approved
 * inventory snapshot per warehouse ("existencia reportada", D-I04). Purchase
 * and pricing remain not integrated (1C.5 scope / 1D does not implement them).
 */
export const INTEGRATED_MESSAGE_PREFIX = "Existencia reportada al";

export interface InventoryCatalogIntegrationOptions {
  inventoryRepository: InventoryRepository;
  organizationId: string;
  /** Restrict the aggregation to specific variants (product detail). */
  variantIds?: readonly string[];
}

export class InventoryCatalogIntegrationRepository
  implements CatalogIntegrationRepository
{
  constructor(private readonly options: InventoryCatalogIntegrationOptions) {}

  async getIntegrationSummary(): Promise<CatalogIntegrationSummary> {
    const snapshots = await this.options.inventoryRepository.listSnapshots(
      this.options.organizationId
    );
    const latestPerWarehouse = latestSnapshotPerWarehouse(snapshots);

    if (latestPerWarehouse.size === 0) {
      return {
        inventory: emptyInventoryView(),
        purchase: emptyPurchaseView(),
        pricing: emptyPricingView(),
        status: { integrated: false, message: "Sin integración de inventario" },
      };
    }

    let currentStock = 0;
    let latestReportDate: string | null = null;
    for (const snapshot of latestPerWarehouse.values()) {
      const items = await this.options.inventoryRepository.listSnapshotItems(
        this.options.organizationId,
        snapshot.id
      );
      for (const item of items) {
        if (
          this.options.variantIds &&
          this.options.variantIds.length > 0 &&
          !this.options.variantIds.includes(item.variantId)
        ) {
          continue;
        }
        currentStock += item.quantity;
      }
      if (latestReportDate === null || snapshot.reportDate > latestReportDate) {
        latestReportDate = snapshot.reportDate;
      }
    }

    return {
      inventory: {
        currentStock,
        // Reserved stock requires the sales module (D-I14); none is reserved yet.
        reservedStock: null,
        availableStock: currentStock,
        averageCost: null,
        lastCost: null,
      },
      purchase: emptyPurchaseView(),
      pricing: emptyPricingView(),
      status: {
        integrated: true,
        message: `${INTEGRATED_MESSAGE_PREFIX} ${latestReportDate}`,
      },
    };
  }
}

/**
 * One snapshot per warehouse: the most recent by reportDate, ties broken by
 * importedAt (newest first) and then id, so aggregation is deterministic.
 */
export function latestSnapshotPerWarehouse(
  snapshots: { warehouseId: string; reportDate: string; importedAt: string; id: string }[]
): Map<string, { warehouseId: string; reportDate: string; importedAt: string; id: string }> {
  const latest = new Map<string, { warehouseId: string; reportDate: string; importedAt: string; id: string }>();
  for (const snapshot of snapshots) {
    const current = latest.get(snapshot.warehouseId);
    if (
      current === undefined ||
      snapshot.reportDate > current.reportDate ||
      (snapshot.reportDate === current.reportDate &&
        (snapshot.importedAt > current.importedAt ||
          (snapshot.importedAt === current.importedAt && snapshot.id > current.id)))
    ) {
      latest.set(snapshot.warehouseId, snapshot);
    }
  }
  return latest;
}

function emptyInventoryView() {
  return {
    currentStock: null,
    reservedStock: null,
    availableStock: null,
    averageCost: null,
    lastCost: null,
  };
}

function emptyPurchaseView() {
  return {
    lastSupplier: null,
    lastPurchaseAt: null,
    lastPurchaseCost: null,
  };
}

function emptyPricingView() {
  return {
    basePrice: null,
    suggestedPrice: null,
    salePrice: null,
    specialPrice: null,
    priceList: null,
  };
}

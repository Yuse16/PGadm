import type {
  CatalogIntegrationRepository,
  CatalogIntegrationSummary,
} from "../domain";

export const NOT_INTEGRATED_MESSAGE = "Sin integración de inventario";

/**
 * 1C.5 placeholder implementation for both data sources: inventory, purchases
 * and pricing are not implemented yet (Fase 1C.5 scope), so every field is
 * null and the summary reports the not-integrated state. A future phase
 * replaces this with a real implementation; the UI already renders the stable
 * integration points (current/reserved/available stock, average/last cost,
 * last supplier/purchase/purchase cost, base/suggested/sale/special price and
 * price list).
 */
export class NoopCatalogIntegrationRepository
  implements CatalogIntegrationRepository
{
  async getIntegrationSummary(): Promise<CatalogIntegrationSummary> {
    return {
      inventory: {
        currentStock: null,
        reservedStock: null,
        availableStock: null,
        averageCost: null,
        lastCost: null,
      },
      purchase: {
        lastSupplier: null,
        lastPurchaseAt: null,
        lastPurchaseCost: null,
      },
      pricing: {
        basePrice: null,
        suggestedPrice: null,
        salePrice: null,
        specialPrice: null,
        priceList: null,
      },
      status: {
        integrated: false,
        message: NOT_INTEGRATED_MESSAGE,
      },
    };
  }
}

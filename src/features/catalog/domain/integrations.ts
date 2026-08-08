/**
 * Integration points for inventory, purchasing and pricing (1C.5).
 *
 * Phase 1C.5 intentionally does NOT implement inventory, purchases, sales,
 * promotions or reports (Fase 1C.5 scope). These contracts expose the fields
 * that future phases will fill through a `CatalogIntegrationRepository`, so
 * the UI can render stable placeholders today and "Sin integración de
 * inventario" in demo mode. The current implementation always reports the
 * not-integrated state.
 */
export interface CatalogInventoryView {
  /** Existencia física actual (current_stock). */
  currentStock: number | null;
  /** Stock reservado por pedidos (reserved_stock). */
  reservedStock: number | null;
  /** currentStock - reservedStock (available_stock). */
  availableStock: number | null;
  /** Costo promedio ponderado (average_cost). */
  averageCost: number | null;
  /** Último costo de reposición (last_cost). */
  lastCost: number | null;
}

export interface CatalogPurchaseView {
  /** Último proveedor registrado (last_supplier). */
  lastSupplier: string | null;
  /** Fecha de la última compra (last_purchase). */
  lastPurchaseAt: string | null;
  /** Costo de la última compra (last_purchase_cost). */
  lastPurchaseCost: number | null;
}

export interface CatalogPricingView {
  /** Precio base de catálogo (base_price). */
  basePrice: number | null;
  /** Precio sugerido de venta (suggested_price). */
  suggestedPrice: number | null;
  /** Precio de venta vigente (sale_price). */
  salePrice: number | null;
  /** Precio especial / promoción (special_price). */
  specialPrice: number | null;
  /** Lista de precios aplicada (price_list). */
  priceList: string | null;
}

export interface CatalogIntegrationStatus {
  integrated: boolean;
  message: string;
}

export interface CatalogIntegrationSummary {
  inventory: CatalogInventoryView;
  purchase: CatalogPurchaseView;
  pricing: CatalogPricingView;
  status: CatalogIntegrationStatus;
}

export interface CatalogIntegrationRepository {
  /** Always reports the not-integrated state until a real source is wired. */
  getIntegrationSummary(): Promise<CatalogIntegrationSummary>;
}

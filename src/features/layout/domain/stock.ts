/**
 * Stock read port for the layout (D-L13, LA-18). The layout reads inventory
 * from 1D as "existencia reportada" with its date, per warehouse (store and
 * CEDIS kept separate). The layout NEVER writes stock/prices/observations.
 *
 * The demo implementation mirrors the 1D.2 fixtures; subphase 3.6 wires the
 * real 1C.5/1D integration port here.
 */
export interface PositionStock {
  variantId: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseType: string;
  /** Reported existence, never mutated by layout code (D-L13). */
  quantity: number;
  /** Exact source date of the reported existence (D-I04). */
  reportDate: string;
}

export interface LayoutStockProvider {
  /**
   * Latest reported stock for the variant across the given warehouses.
   * A variant/warehouse without a snapshot is absent from the map (the UI
   * shows "sin datos", never a fabricated value).
   */
  latestStockByVariant(
    organizationId: string,
    variantId: string,
    warehouseIds: string[]
  ): Promise<PositionStock[]>;
}

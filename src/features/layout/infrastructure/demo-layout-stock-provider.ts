import type { PositionStock } from "../domain";
import type { LayoutStockProvider } from "../domain";
import {
  DEMO_ORG_PGM,
  DEMO_VARIANT_051,
  DEMO_VARIANT_052,
  DEMO_VARIANT_053,
  DEMO_WAREHOUSE_NOG_01,
  DEMO_WAREHOUSE_SAL_01,
} from "./demo-layout-repository";

const REPORT_DATE = "2026-08-06T09:00:00.000Z";

/**
 * Latest reported existence per variant per warehouse, mirroring the 1D.2
 * fixtures (latest snapshot 2026-08-06 for warehouse NOG-01; CEDIS SAL-01 has
 * no snapshot yet, so it stays absent = "sin datos"). The layout only reads
 * stock, never writes it (D-L13); subphase 3.6 wires the real 1C.5/1D port
 * here.
 */
export class DemoLayoutStockProvider implements LayoutStockProvider {
  async latestStockByVariant(
    organizationId: string,
    variantId: string,
    warehouseIds: string[]
  ): Promise<PositionStock[]> {
    if (organizationId !== DEMO_ORG_PGM) {
      return [];
    }
    const quantity = this.latestQuantityFor(variantId);
    if (quantity === null) {
      return [];
    }
    const rows: PositionStock[] = [];
    if (warehouseIds.includes(DEMO_WAREHOUSE_NOG_01)) {
      rows.push({
        variantId,
        warehouseId: DEMO_WAREHOUSE_NOG_01,
        warehouseCode: "NOG-01",
        warehouseType: "store_backroom",
        quantity,
        reportDate: REPORT_DATE,
      });
    }
    if (warehouseIds.includes(DEMO_WAREHOUSE_SAL_01)) {
      // No snapshot for SAL-01 in the 1D.2 fixtures: no row (UI shows "sin datos").
    }
    return rows;
  }

  private latestQuantityFor(variantId: string): number | null {
    if (variantId === DEMO_VARIANT_051) {
      return 130;
    }
    if (variantId === DEMO_VARIANT_052) {
      return 0;
    }
    if (variantId === DEMO_VARIANT_053) {
      return 0;
    }
    return null;
  }
}

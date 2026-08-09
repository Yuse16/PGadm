import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { LayoutStockProvider, PositionStock } from "../domain";
import { RepositoryConfigurationError } from "../domain";

/**
 * Latest reported existence per variant per warehouse, read from the 1D schema
 * (`inventory_snapshots` + `inventory_snapshot_items`) through the RLS-scoped
 * server client (D-L13). One snapshot per warehouse: the most recent by
 * report_date, ties broken by imported_at and id, so the layout view is
 * deterministic. A variant/warehouse without a snapshot stays absent ("sin
 * datos"); the layout only reads stock, never writes it. Reading inventory
 * data through `authenticated` reuses the 1D grants (inventory.read).
 */
export class SupabaseLayoutStockProvider implements LayoutStockProvider {
  async latestStockByVariant(
    organizationId: string,
    variantId: string,
    warehouseIds: string[]
  ): Promise<PositionStock[]> {
    const client = await this.createClient();

    const { data: warehouses, error: warehousesError } = await client
      .from("warehouses")
      .select("id, code, warehouse_type")
      .eq("organization_id", organizationId)
      .in("id", warehouseIds);
    if (warehousesError) {
      throw new Error(`Failed to load layout stock warehouses: ${warehousesError.message}`);
    }

    const { data: snapshots, error: snapshotsError } = await client
      .from("inventory_snapshots")
      .select("id, warehouse_id, report_date, imported_at")
      .eq("organization_id", organizationId)
      .in("warehouse_id", warehouseIds)
      .order("report_date", { ascending: false });
    if (snapshotsError) {
      throw new Error(`Failed to load layout stock snapshots: ${snapshotsError.message}`);
    }

    const latestPerWarehouse = latestSnapshotPerWarehouse(
      snapshots.map((snapshot) => ({
        warehouseId: snapshot.warehouse_id,
        reportDate: snapshot.report_date,
        importedAt: snapshot.imported_at,
        id: snapshot.id,
      }))
    );
    const rows: PositionStock[] = [];

    for (const warehouse of warehouses) {
      const snapshot = latestPerWarehouse.get(warehouse.id);
      if (snapshot === undefined) {
        continue;
      }
      const { data: items, error: itemsError } = await client
        .from("inventory_snapshot_items")
        .select("quantity")
        .eq("organization_id", organizationId)
        .eq("snapshot_id", snapshot.id)
        .eq("variant_id", variantId)
        .maybeSingle();
      if (itemsError) {
        throw new Error(`Failed to load layout stock items: ${itemsError.message}`);
      }
      if (items === null) {
        continue;
      }
      rows.push({
        variantId,
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        warehouseType: warehouse.warehouse_type,
        quantity: items.quantity,
        reportDate: snapshot.reportDate,
      });
    }

    return rows;
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
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

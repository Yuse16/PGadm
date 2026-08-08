import { InventoryNotFoundError } from "./inventory-errors";
import type {
  ImportTemplate,
  InventoryChange,
  InventoryObservation,
  InventorySnapshot,
  InventorySnapshotItem,
} from "./entities";

export interface SnapshotListOptions {
  warehouseId?: string;
}

export interface ChangeListOptions {
  warehouseId?: string;
  variantId?: string;
}

export interface ObservationListOptions {
  warehouseId?: string;
  variantId?: string;
}

/**
 * Inventory aggregate repository (snapshots + items + changes + observations +
 * templates). All methods are org-scoped: callers must pass the organization
 * that owns the data; a mismatch is a not-found, never a cross-org read
 * (D-C07). In-memory demo and Supabase (RLS-scoped) implementations share this
 * contract; the DB re-checks org scoping via composite FKs + RLS.
 */
export interface InventoryRepository {
  // ---- snapshots + items ----------------------------------------------
  listSnapshots(organizationId: string, options?: SnapshotListOptions): Promise<InventorySnapshot[]>;
  findSnapshotById(organizationId: string, snapshotId: string): Promise<InventorySnapshot | null>;
  findLatestSnapshot(organizationId: string, warehouseId: string): Promise<InventorySnapshot | null>;
  /** True when a non-baseline load for the same warehouse/date/source already exists (IA-8). */
  findExistingLoad(
    organizationId: string,
    warehouseId: string,
    reportDate: string,
    source: string
  ): Promise<InventorySnapshot | null>;
  listSnapshotItems(organizationId: string, snapshotId: string): Promise<InventorySnapshotItem[]>;
  insertSnapshot(
    organizationId: string,
    snapshot: InventorySnapshot,
    items: InventorySnapshotItem[]
  ): Promise<{ snapshot: InventorySnapshot; items: InventorySnapshotItem[] }>;

  // ---- changes ---------------------------------------------------------
  listChanges(organizationId: string, options?: ChangeListOptions): Promise<InventoryChange[]>;
  listChangesBySnapshot(organizationId: string, snapshotId: string): Promise<InventoryChange[]>;
  insertChanges(organizationId: string, changes: InventoryChange[]): Promise<InventoryChange[]>;

  // ---- observations ----------------------------------------------------
  listObservations(organizationId: string, options?: ObservationListOptions): Promise<InventoryObservation[]>;
  findObservationById(organizationId: string, observationId: string): Promise<InventoryObservation | null>;
  insertObservation(observation: InventoryObservation): Promise<InventoryObservation>;
  updateObservation(observation: InventoryObservation): Promise<InventoryObservation>;

  // ---- import templates ------------------------------------------------
  listTemplates(organizationId: string): Promise<ImportTemplate[]>;
  findTemplateById(organizationId: string, templateId: string): Promise<ImportTemplate | null>;
  insertTemplate(template: ImportTemplate): Promise<ImportTemplate>;
  updateTemplate(template: ImportTemplate): Promise<ImportTemplate>;
}

export function requireInventoryEntity<T>(
  value: T | null,
  entity: string,
  id: string
): T {
  if (value === null) {
    throw new InventoryNotFoundError(entity, id);
  }
  return value;
}

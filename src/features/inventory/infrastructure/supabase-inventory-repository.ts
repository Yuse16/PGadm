import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database, Json } from "@/types/database";
import type {
  ChangeListOptions,
  ImportTemplate,
  InventoryChange,
  InventoryObservation,
  InventoryRepository,
  InventorySnapshot,
  InventorySnapshotItem,
  ObservationListOptions,
  SnapshotListOptions,
} from "../domain";
import { RepositoryConfigurationError, assertInventorySnapshotSource } from "../domain";

const SNAPSHOT_COLUMNS =
  "id, organization_id, warehouse_id, source, source_file, report_date, imported_at, imported_by, is_baseline, created_at, updated_at" as const;

const ITEM_COLUMNS =
  "id, organization_id, snapshot_id, variant_id, quantity, boxes, square_meters, created_at" as const;

const CHANGE_COLUMNS =
  "id, organization_id, variant_id, warehouse_id, previous_quantity, new_quantity, difference, change_type, detected_at, source_snapshot_id, created_at" as const;

const OBSERVATION_COLUMNS =
  "id, organization_id, variant_id, warehouse_id, observation_type, observed_quantity, note, evidence_url, created_by, created_at, updated_at" as const;

const TEMPLATE_COLUMNS =
  "id, organization_id, name, sheet_name, column_mapping, warehouse_rules, status, created_at, updated_at" as const;

type SnapshotsInsert = Database["public"]["Tables"]["inventory_snapshots"]["Insert"];
type SnapshotItemsInsert =
  Database["public"]["Tables"]["inventory_snapshot_items"]["Insert"];
type ChangesInsert = Database["public"]["Tables"]["inventory_changes"]["Insert"];
type ObservationsInsert =
  Database["public"]["Tables"]["inventory_observations"]["Insert"];
type ObservationsUpdate =
  Database["public"]["Tables"]["inventory_observations"]["Update"];
type TemplatesInsert = Database["public"]["Tables"]["import_templates"]["Insert"];
type TemplatesUpdate = Database["public"]["Tables"]["import_templates"]["Update"];

/**
 * Supabase implementation of the inventory aggregate repository (1D.2 schema,
 * migration 010). Every access goes through the RLS-scoped server client (the
 * user's own session, never service_role, D09/T09): the database re-checks org
 * scoping and permissions on each statement. Read methods use `inventory.read`,
 * writes are guarded by the grants in `supabase/seed.sql` plus the actor's
 * `requirePermission` in the use cases (defense in depth).
 */
export class SupabaseInventoryRepository implements InventoryRepository {
  async listSnapshots(
    organizationId: string,
    options?: SnapshotListOptions
  ): Promise<InventorySnapshot[]> {
    const client = await this.createClient();
    let query = client
      .from("inventory_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("organization_id", organizationId)
      .order("report_date", { ascending: false });
    if (options?.warehouseId !== undefined) {
      query = query.eq("warehouse_id", options.warehouseId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list inventory snapshots: ${error.message}`);
    }
    return data.map(mapSnapshot);
  }

  async findSnapshotById(
    organizationId: string,
    snapshotId: string
  ): Promise<InventorySnapshot | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", snapshotId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find inventory snapshot: ${error.message}`);
    }
    return data ? mapSnapshot(data) : null;
  }

  async findLatestSnapshot(
    organizationId: string,
    warehouseId: string
  ): Promise<InventorySnapshot | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("warehouse_id", warehouseId)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find latest inventory snapshot: ${error.message}`);
    }
    return data ? mapSnapshot(data) : null;
  }

  async findExistingLoad(
    organizationId: string,
    warehouseId: string,
    reportDate: string,
    source: string
  ): Promise<InventorySnapshot | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("warehouse_id", warehouseId)
      .eq("source", source)
      .eq("report_date", reportDate)
      .not("is_baseline", "is", true)
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find existing inventory load: ${error.message}`);
    }
    return data ? mapSnapshot(data) : null;
  }

  async listSnapshotItems(
    organizationId: string,
    snapshotId: string
  ): Promise<InventorySnapshotItem[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_snapshot_items")
      .select(ITEM_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("snapshot_id", snapshotId)
      .order("variant_id", { ascending: true });
    if (error) {
      throw new Error(`Failed to list inventory snapshot items: ${error.message}`);
    }
    return data.map(mapSnapshotItem);
  }

  async insertSnapshot(
    organizationId: string,
    snapshot: InventorySnapshot,
    items: InventorySnapshotItem[]
  ): Promise<{ snapshot: InventorySnapshot; items: InventorySnapshotItem[] }> {
    const client = await this.createClient();
    const snapshotRow: SnapshotsInsert = {
      id: snapshot.id,
      organization_id: organizationId,
      warehouse_id: snapshot.warehouseId,
      source: snapshot.source,
      source_file: snapshot.sourceFile,
      report_date: snapshot.reportDate,
      imported_at: snapshot.importedAt,
      imported_by: snapshot.importedBy,
      is_baseline: snapshot.isBaseline,
    };
    const { data: snapshotData, error: snapshotError } = await client
      .from("inventory_snapshots")
      .insert(snapshotRow)
      .select(SNAPSHOT_COLUMNS)
      .single();
    if (snapshotError) {
      throw new Error(`Failed to insert inventory snapshot: ${snapshotError.message}`);
    }
    const itemRows: SnapshotItemsInsert[] = items.map((item) => ({
      id: item.id,
      organization_id: organizationId,
      snapshot_id: snapshot.id,
      variant_id: item.variantId,
      quantity: item.quantity,
      boxes: item.boxes,
      square_meters: item.squareMeters,
    }));
    const { data: itemData, error: itemError } = await client
      .from("inventory_snapshot_items")
      .insert(itemRows)
      .select(ITEM_COLUMNS);
    if (itemError) {
      throw new Error(`Failed to insert inventory snapshot items: ${itemError.message}`);
    }
    return {
      snapshot: mapSnapshot(snapshotData),
      items: itemData.map(mapSnapshotItem),
    };
  }

  async listChanges(
    organizationId: string,
    options?: ChangeListOptions
  ): Promise<InventoryChange[]> {
    const client = await this.createClient();
    let query = client
      .from("inventory_changes")
      .select(CHANGE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("detected_at", { ascending: false });
    if (options?.warehouseId !== undefined) {
      query = query.eq("warehouse_id", options.warehouseId);
    }
    if (options?.variantId !== undefined) {
      query = query.eq("variant_id", options.variantId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list inventory changes: ${error.message}`);
    }
    return data.map(mapChange);
  }

  async listChangesBySnapshot(
    organizationId: string,
    snapshotId: string
  ): Promise<InventoryChange[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_changes")
      .select(CHANGE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("source_snapshot_id", snapshotId)
      .order("variant_id", { ascending: true });
    if (error) {
      throw new Error(`Failed to list inventory changes by snapshot: ${error.message}`);
    }
    return data.map(mapChange);
  }

  async insertChanges(
    organizationId: string,
    changes: InventoryChange[]
  ): Promise<InventoryChange[]> {
    if (changes.length === 0) {
      return [];
    }
    const client = await this.createClient();
    const rows: ChangesInsert[] = changes.map((change) => ({
      id: change.id,
      organization_id: organizationId,
      variant_id: change.variantId,
      warehouse_id: change.warehouseId,
      previous_quantity: change.previousQuantity,
      new_quantity: change.newQuantity,
      change_type: change.changeType,
      detected_at: change.detectedAt,
      source_snapshot_id: change.sourceSnapshotId,
    }));
    const { data, error } = await client
      .from("inventory_changes")
      .insert(rows)
      .select(CHANGE_COLUMNS);
    if (error) {
      throw new Error(`Failed to insert inventory changes: ${error.message}`);
    }
    return data.map(mapChange);
  }

  async listObservations(
    organizationId: string,
    options?: ObservationListOptions
  ): Promise<InventoryObservation[]> {
    const client = await this.createClient();
    let query = client
      .from("inventory_observations")
      .select(OBSERVATION_COLUMNS)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (options?.warehouseId !== undefined) {
      query = query.eq("warehouse_id", options.warehouseId);
    }
    if (options?.variantId !== undefined) {
      query = query.eq("variant_id", options.variantId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list inventory observations: ${error.message}`);
    }
    return data.map(mapObservation);
  }

  async findObservationById(
    organizationId: string,
    observationId: string
  ): Promise<InventoryObservation | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("inventory_observations")
      .select(OBSERVATION_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", observationId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find inventory observation: ${error.message}`);
    }
    return data ? mapObservation(data) : null;
  }

  async insertObservation(
    observation: InventoryObservation
  ): Promise<InventoryObservation> {
    const client = await this.createClient();
    const row: ObservationsInsert = {
      id: observation.id,
      organization_id: observation.organizationId,
      variant_id: observation.variantId,
      warehouse_id: observation.warehouseId,
      observation_type: observation.observationType,
      observed_quantity: observation.observedQuantity,
      note: observation.note,
      evidence_url: observation.evidenceUrl,
      created_by: observation.createdBy,
    };
    const { data, error } = await client
      .from("inventory_observations")
      .insert(row)
      .select(OBSERVATION_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert inventory observation: ${error.message}`);
    }
    return mapObservation(data);
  }

  async updateObservation(
    observation: InventoryObservation
  ): Promise<InventoryObservation> {
    const client = await this.createClient();
    const row: ObservationsUpdate = {
      observation_type: observation.observationType,
      observed_quantity: observation.observedQuantity,
      note: observation.note,
      evidence_url: observation.evidenceUrl,
    };
    const { data, error } = await client
      .from("inventory_observations")
      .update(row)
      .eq("organization_id", observation.organizationId)
      .eq("id", observation.id)
      .select(OBSERVATION_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update inventory observation: ${error.message}`);
    }
    return mapObservation(data);
  }

  async listTemplates(organizationId: string): Promise<ImportTemplate[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("import_templates")
      .select(TEMPLATE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });
    if (error) {
      throw new Error(`Failed to list import templates: ${error.message}`);
    }
    return data.map(mapTemplate);
  }

  async findTemplateById(
    organizationId: string,
    templateId: string
  ): Promise<ImportTemplate | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("import_templates")
      .select(TEMPLATE_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", templateId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find import template: ${error.message}`);
    }
    return data ? mapTemplate(data) : null;
  }

  async insertTemplate(template: ImportTemplate): Promise<ImportTemplate> {
    const client = await this.createClient();
    const row: TemplatesInsert = {
      id: template.id,
      organization_id: template.organizationId,
      name: template.name,
      sheet_name: template.sheetName,
      column_mapping: template.columnMapping as unknown as Json,
      warehouse_rules: template.warehouseRules as unknown as Json | null,
      status: template.status,
    };
    const { data, error } = await client
      .from("import_templates")
      .insert(row)
      .select(TEMPLATE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert import template: ${error.message}`);
    }
    return mapTemplate(data);
  }

  async updateTemplate(template: ImportTemplate): Promise<ImportTemplate> {
    const client = await this.createClient();
    const row: TemplatesUpdate = {
      name: template.name,
      sheet_name: template.sheetName,
      column_mapping: template.columnMapping as unknown as Json,
      warehouse_rules: template.warehouseRules as unknown as Json | null,
      status: template.status,
    };
    const { data, error } = await client
      .from("import_templates")
      .update(row)
      .eq("organization_id", template.organizationId)
      .eq("id", template.id)
      .select(TEMPLATE_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update import template: ${error.message}`);
    }
    return mapTemplate(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

function mapSnapshot(
  row: Database["public"]["Tables"]["inventory_snapshots"]["Row"]
): InventorySnapshot {
  return {
    id: row.id,
    organizationId: row.organization_id,
    warehouseId: row.warehouse_id,
    source: assertInventorySnapshotSource(row.source),
    sourceFile: row.source_file,
    reportDate: row.report_date,
    importedAt: row.imported_at,
    importedBy: row.imported_by ?? "",
    isBaseline: row.is_baseline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSnapshotItem(
  row: Database["public"]["Tables"]["inventory_snapshot_items"]["Row"]
): InventorySnapshotItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    snapshotId: row.snapshot_id,
    variantId: row.variant_id,
    quantity: row.quantity,
    boxes: row.boxes,
    squareMeters: row.square_meters,
    createdAt: row.created_at,
  };
}

function mapChange(
  row: Database["public"]["Tables"]["inventory_changes"]["Row"]
): InventoryChange {
  return {
    id: row.id,
    organizationId: row.organization_id,
    variantId: row.variant_id,
    warehouseId: row.warehouse_id,
    previousQuantity: row.previous_quantity,
    newQuantity: row.new_quantity,
    difference: row.difference,
    changeType: row.change_type as InventoryChange["changeType"],
    detectedAt: row.detected_at,
    sourceSnapshotId: row.source_snapshot_id,
    createdAt: row.created_at,
  };
}

function mapObservation(
  row: Database["public"]["Tables"]["inventory_observations"]["Row"]
): InventoryObservation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    variantId: row.variant_id,
    warehouseId: row.warehouse_id,
    observationType: row.observation_type as InventoryObservation["observationType"],
    observedQuantity: row.observed_quantity,
    note: row.note,
    evidenceUrl: row.evidence_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplate(
  row: Database["public"]["Tables"]["import_templates"]["Row"]
): ImportTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    sheetName: row.sheet_name,
    columnMapping: row.column_mapping as unknown as ImportTemplate["columnMapping"],
    warehouseRules: Array.isArray(row.warehouse_rules)
      ? (row.warehouse_rules as unknown as ImportTemplate["warehouseRules"])
      : null,
    status: row.status as ImportTemplate["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

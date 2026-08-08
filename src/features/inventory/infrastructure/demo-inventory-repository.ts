import type {
  ImportTemplate,
  InventoryChange,
  InventoryObservation,
  InventoryRepository,
  InventorySnapshot,
  InventorySnapshotItem,
} from "../domain";

/** Org PGM + warehouse NOG-01 + catalog variants 051/052/053 (1D.2 fixtures). */
export const DEMO_ORG_PGM = "10000000-0000-0000-0000-000000000001";
export const DEMO_WAREHOUSE_NOG_01 = "10000000-0000-0000-0000-000000000003";
export const DEMO_VARIANT_051 = "70000000-0000-0000-0000-000000000051";
export const DEMO_VARIANT_052 = "70000000-0000-0000-0000-000000000052";
export const DEMO_VARIANT_053 = "70000000-0000-0000-0000-000000000053";
export const DEMO_IMPORTED_BY = "30000000-0000-0000-0000-000000000006";

export const DEMO_SNAPSHOT_BASELINE = "90000000-0000-0000-0000-000000000001";
export const DEMO_SNAPSHOT_SECOND = "90000000-0000-0000-0000-000000000002";

function iso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

const SNAPSHOT_001: InventorySnapshot = {
  id: DEMO_SNAPSHOT_BASELINE,
  organizationId: DEMO_ORG_PGM,
  warehouseId: DEMO_WAREHOUSE_NOG_01,
  source: "excel",
  sourceFile: "inventario_nogalera_20260803.xlsx",
  reportDate: "2026-08-03T09:00:00.000Z",
  importedAt: iso("2026-08-03T10:00:00Z"),
  importedBy: DEMO_IMPORTED_BY,
  isBaseline: true,
  createdAt: iso("2026-08-03T10:00:00Z"),
  updatedAt: iso("2026-08-03T10:00:00Z"),
};

const SNAPSHOT_002: InventorySnapshot = {
  id: DEMO_SNAPSHOT_SECOND,
  organizationId: DEMO_ORG_PGM,
  warehouseId: DEMO_WAREHOUSE_NOG_01,
  source: "excel",
  sourceFile: "inventario_nogalera_20260806.xlsx",
  reportDate: "2026-08-06T09:00:00.000Z",
  importedAt: iso("2026-08-06T10:00:00Z"),
  importedBy: DEMO_IMPORTED_BY,
  isBaseline: false,
  createdAt: iso("2026-08-06T10:00:00Z"),
  updatedAt: iso("2026-08-06T10:00:00Z"),
};

const ITEMS: InventorySnapshotItem[] = [
  { id: "90000000-0000-0000-0000-000000000011", organizationId: DEMO_ORG_PGM, snapshotId: DEMO_SNAPSHOT_BASELINE, variantId: DEMO_VARIANT_051, quantity: 100, boxes: null, squareMeters: null, createdAt: iso("2026-08-03T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000012", organizationId: DEMO_ORG_PGM, snapshotId: DEMO_SNAPSHOT_BASELINE, variantId: DEMO_VARIANT_052, quantity: 4, boxes: null, squareMeters: null, createdAt: iso("2026-08-03T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000013", organizationId: DEMO_ORG_PGM, snapshotId: DEMO_SNAPSHOT_BASELINE, variantId: DEMO_VARIANT_053, quantity: 12, boxes: null, squareMeters: null, createdAt: iso("2026-08-03T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000014", organizationId: DEMO_ORG_PGM, snapshotId: DEMO_SNAPSHOT_SECOND, variantId: DEMO_VARIANT_051, quantity: 130, boxes: null, squareMeters: null, createdAt: iso("2026-08-06T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000015", organizationId: DEMO_ORG_PGM, snapshotId: DEMO_SNAPSHOT_SECOND, variantId: DEMO_VARIANT_052, quantity: 0, boxes: null, squareMeters: null, createdAt: iso("2026-08-06T10:00:00Z") },
];

const CHANGES: InventoryChange[] = [
  { id: "90000000-0000-0000-0000-000000000021", organizationId: DEMO_ORG_PGM, variantId: DEMO_VARIANT_051, warehouseId: DEMO_WAREHOUSE_NOG_01, previousQuantity: 100, newQuantity: 130, difference: 30, changeType: "increase", detectedAt: iso("2026-08-06T10:00:00Z"), sourceSnapshotId: DEMO_SNAPSHOT_SECOND, createdAt: iso("2026-08-06T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000022", organizationId: DEMO_ORG_PGM, variantId: DEMO_VARIANT_052, warehouseId: DEMO_WAREHOUSE_NOG_01, previousQuantity: 4, newQuantity: 0, difference: -4, changeType: "zeroed", detectedAt: iso("2026-08-06T10:00:00Z"), sourceSnapshotId: DEMO_SNAPSHOT_SECOND, createdAt: iso("2026-08-06T10:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000023", organizationId: DEMO_ORG_PGM, variantId: DEMO_VARIANT_053, warehouseId: DEMO_WAREHOUSE_NOG_01, previousQuantity: 12, newQuantity: 0, difference: -12, changeType: "missing_product", detectedAt: iso("2026-08-06T10:00:00Z"), sourceSnapshotId: DEMO_SNAPSHOT_SECOND, createdAt: iso("2026-08-06T10:00:00Z") },
];

const OBSERVATIONS: InventoryObservation[] = [
  { id: "90000000-0000-0000-0000-000000000031", organizationId: DEMO_ORG_PGM, variantId: DEMO_VARIANT_051, warehouseId: DEMO_WAREHOUSE_NOG_01, observationType: "physical_count", observedQuantity: 128, note: "Conteo fisico: 128 piezas en bodega", evidenceUrl: "https://storage.pgm.local/evidencia/nogalera-20260806.jpg", createdBy: DEMO_IMPORTED_BY, createdAt: iso("2026-08-06T11:00:00Z"), updatedAt: iso("2026-08-06T11:00:00Z") },
  { id: "90000000-0000-0000-0000-000000000032", organizationId: DEMO_ORG_PGM, variantId: DEMO_VARIANT_052, warehouseId: DEMO_WAREHOUSE_NOG_01, observationType: "damaged", observedQuantity: null, note: "3 piezas danadas en anaquel", evidenceUrl: null, createdBy: "30000000-0000-0000-0000-000000000001", createdAt: iso("2026-08-06T11:30:00Z"), updatedAt: iso("2026-08-06T11:30:00Z") },
];

const TEMPLATE_041: ImportTemplate = {
  id: "90000000-0000-0000-0000-000000000041",
  organizationId: DEMO_ORG_PGM,
  name: "Plantilla estandar Excel",
  sheetName: "Inventario",
  columnMapping: {
    required: ["codigo", "descripcion", "almacen", "existencia"],
    optional: ["cajas", "metros_cuadrados"],
  },
  warehouseRules: [{ detected: "NOG-01", warehouseId: DEMO_WAREHOUSE_NOG_01 }],
  status: "active",
  createdAt: iso("2026-08-01T09:00:00Z"),
  updatedAt: iso("2026-08-01T09:00:00Z"),
};

/**
 * In-memory inventory repository seeded with the 1D.2 fixtures (identical to
 * `supabase/seed.sql`). Org-scoped like every repository (D-C07). The demo
 * source is selected by default; `INVENTORY_DATA_SOURCE=demo` (D-I12).
 * Pass `{ seed: false }` for an empty state (tests exercise baseline flows).
 */
export class DemoInventoryRepository implements InventoryRepository {
  private snapshots: InventorySnapshot[];
  private items: InventorySnapshotItem[];
  private changes: InventoryChange[];
  private observations: InventoryObservation[];
  private templates: ImportTemplate[];

  constructor(options?: { seed?: boolean }) {
    const seed = options?.seed !== false;
    this.snapshots = seed ? [SNAPSHOT_001, SNAPSHOT_002] : [];
    this.items = seed ? [...ITEMS] : [];
    this.changes = seed ? [...CHANGES] : [];
    this.observations = seed ? [...OBSERVATIONS] : [];
    this.templates = seed ? [TEMPLATE_041] : [];
  }

  async listSnapshots(organizationId: string, options?: { warehouseId?: string }): Promise<InventorySnapshot[]> {
    return this.snapshots
      .filter((snapshot) => snapshot.organizationId === organizationId)
      .filter((snapshot) => options?.warehouseId === undefined || snapshot.warehouseId === options.warehouseId)
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }

  async findSnapshotById(organizationId: string, snapshotId: string): Promise<InventorySnapshot | null> {
    const snapshot = this.snapshots.find((entry) => entry.id === snapshotId);
    return snapshot?.organizationId === organizationId ? snapshot : null;
  }

  async findLatestSnapshot(organizationId: string, warehouseId: string): Promise<InventorySnapshot | null> {
    const matching = this.snapshots
      .filter((entry) => entry.organizationId === organizationId && entry.warehouseId === warehouseId)
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    return matching[0] ?? null;
  }

  async findExistingLoad(
    organizationId: string,
    warehouseId: string,
    reportDate: string,
    source: string
  ): Promise<InventorySnapshot | null> {
    const exact = this.snapshots.find(
      (entry) =>
        entry.organizationId === organizationId &&
        entry.warehouseId === warehouseId &&
        entry.source === source &&
        !entry.isBaseline &&
        entry.reportDate === reportDate
    );
    return exact ?? null;
  }

  async listSnapshotItems(organizationId: string, snapshotId: string): Promise<InventorySnapshotItem[]> {
    return this.items
      .filter((item) => item.organizationId === organizationId && item.snapshotId === snapshotId)
      .sort((a, b) => a.variantId.localeCompare(b.variantId));
  }

  async insertSnapshot(
    organizationId: string,
    snapshot: InventorySnapshot,
    items: InventorySnapshotItem[]
  ): Promise<{ snapshot: InventorySnapshot; items: InventorySnapshotItem[] }> {
    if (snapshot.organizationId !== organizationId) {
      throw new Error(`Cross-org snapshot insert rejected for ${organizationId}`);
    }
    this.snapshots.push(snapshot);
    this.items.push(...items);
    return { snapshot, items: [...items] };
  }

  async listChanges(organizationId: string, options?: { warehouseId?: string; variantId?: string }): Promise<InventoryChange[]> {
    return this.changes
      .filter((change) => change.organizationId === organizationId)
      .filter((change) => options?.warehouseId === undefined || change.warehouseId === options.warehouseId)
      .filter((change) => options?.variantId === undefined || change.variantId === options.variantId)
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }

  async listChangesBySnapshot(organizationId: string, snapshotId: string): Promise<InventoryChange[]> {
    return this.changes
      .filter((change) => change.organizationId === organizationId && change.sourceSnapshotId === snapshotId)
      .sort((a, b) => a.variantId.localeCompare(b.variantId));
  }

  async insertChanges(organizationId: string, changes: InventoryChange[]): Promise<InventoryChange[]> {
    for (const change of changes) {
      if (change.organizationId !== organizationId) {
        throw new Error(`Cross-org change insert rejected for ${organizationId}`);
      }
    }
    this.changes.push(...changes);
    return [...changes];
  }

  async listObservations(organizationId: string, options?: { warehouseId?: string; variantId?: string }): Promise<InventoryObservation[]> {
    return this.observations
      .filter((observation) => observation.organizationId === organizationId)
      .filter((observation) => options?.warehouseId === undefined || observation.warehouseId === options.warehouseId)
      .filter((observation) => options?.variantId === undefined || observation.variantId === options.variantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findObservationById(organizationId: string, observationId: string): Promise<InventoryObservation | null> {
    const observation = this.observations.find((entry) => entry.id === observationId);
    return observation?.organizationId === organizationId ? observation : null;
  }

  async insertObservation(observation: InventoryObservation): Promise<InventoryObservation> {
    this.observations.push(observation);
    return observation;
  }

  async updateObservation(observation: InventoryObservation): Promise<InventoryObservation> {
    const index = this.observations.findIndex(
      (entry) => entry.id === observation.id && entry.organizationId === observation.organizationId
    );
    if (index === -1) {
      throw new Error(`Observation not found: ${observation.id}`);
    }
    this.observations[index] = observation;
    return observation;
  }

  async listTemplates(organizationId: string): Promise<ImportTemplate[]> {
    return this.templates
      .filter((template) => template.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findTemplateById(organizationId: string, templateId: string): Promise<ImportTemplate | null> {
    const template = this.templates.find((entry) => entry.id === templateId);
    return template?.organizationId === organizationId ? template : null;
  }

  async insertTemplate(template: ImportTemplate): Promise<ImportTemplate> {
    this.templates.push(template);
    return template;
  }

  async updateTemplate(template: ImportTemplate): Promise<ImportTemplate> {
    const index = this.templates.findIndex(
      (entry) => entry.id === template.id && entry.organizationId === template.organizationId
    );
    if (index === -1) {
      throw new Error(`Template not found: ${template.id}`);
    }
    this.templates[index] = template;
    return template;
  }
}

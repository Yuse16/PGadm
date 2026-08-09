import type {
  Layout,
  LayoutElement,
  LayoutPosition,
  LayoutRepository,
  LayoutVersionEntry,
} from "../domain";

/** Org PGM + store branch NOG + demo layout fixtures (3.2 seed). */
export const DEMO_ORG_PGM = "10000000-0000-0000-0000-000000000001";
export const DEMO_BRANCH_NOG = "10000000-0000-0000-0000-000000000002";
export const DEMO_WAREHOUSE_NOG_01 = "10000000-0000-0000-0000-000000000003";
export const DEMO_WAREHOUSE_SAL_01 = "10000000-0000-0000-0000-000000000005";
export const DEMO_VARIANT_051 = "70000000-0000-0000-0000-000000000051";
export const DEMO_VARIANT_052 = "70000000-0000-0000-0000-000000000052";
export const DEMO_VARIANT_053 = "70000000-0000-0000-0000-000000000053";
export const DEMO_ADMIN_PGM = "30000000-0000-0000-0000-000000000006";

export const DEMO_LAYOUT_NOGALERA = "A0000000-0000-0000-0000-000000000001";
export const DEMO_ELEMENT_M1_01 = "A0000000-0000-0000-0000-000000000011";
export const DEMO_ELEMENT_M1_02 = "A0000000-0000-0000-0000-000000000012";
export const DEMO_ELEMENT_M1_03 = "A0000000-0000-0000-0000-000000000013";
export const DEMO_ELEMENT_M1_04 = "A0000000-0000-0000-0000-000000000014";
export const DEMO_ELEMENT_GALERIA = "A0000000-0000-0000-0000-000000000015";
export const DEMO_ELEMENT_MURO = "A0000000-0000-0000-0000-000000000016";
export const DEMO_ELEMENT_MOSTRADOR = "A0000000-0000-0000-0000-000000000022";
export const DEMO_ELEMENT_CAJA = "A0000000-0000-0000-0000-000000000023";

export const DEMO_POSITION_M1_01_RF_P01 = "A0000000-0000-0000-0000-000000000101";
export const DEMO_POSITION_M1_01_RF_P02 = "A0000000-0000-0000-0000-000000000102";
export const DEMO_POSITION_M1_01_RF_P03 = "A0000000-0000-0000-0000-000000000103";
export const DEMO_POSITION_M1_01_RI_P01 = "A0000000-0000-0000-0000-000000000104";
export const DEMO_POSITION_M1_01_RP_P01 = "A0000000-0000-0000-0000-000000000107";
export const DEMO_POSITION_M1_02_RF_P01 = "A0000000-0000-0000-0000-000000000111";
export const DEMO_POSITION_M1_03_RF_P01 = "A0000000-0000-0000-0000-000000000121";
export const DEMO_POSITION_M1_03_RF_P02 = "A0000000-0000-0000-0000-000000000122";
export const DEMO_POSITION_MOST_V01 = "A0000000-0000-0000-0000-000000000141";
export const DEMO_POSITION_MOST_V02 = "A0000000-0000-0000-0000-000000000142";
export const DEMO_POSITION_CAJ_P01 = "A0000000-0000-0000-0000-000000000143";

function iso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

const M1_METADATA: Record<string, unknown> = {
  capacidad_riel: { frontal: 3, intermedio: 3, posterior: 2 },
};

const LAYOUT: Layout = {
  id: DEMO_LAYOUT_NOGALERA,
  organizationId: DEMO_ORG_PGM,
  branchId: DEMO_BRANCH_NOG,
  name: "Nogalera",
  status: "draft",
  version: 1,
  width: 12,
  height: 6,
  backgroundReference: "https://canva.pgm.local/planos/nogalera-2026-08.png",
  createdAt: iso("2026-08-08T09:00:00Z"),
  updatedAt: iso("2026-08-08T09:00:00Z"),
};

const ELEMENTS: LayoutElement[] = [
  { id: DEMO_ELEMENT_M1_01, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "m1", code: "M1-01", label: "Mueble M1 01", x: 0.1, y: 0.1, width: 0.12, height: 0.06, rotation: 0, locked: true, zIndex: 1, metadata: M1_METADATA, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_M1_02, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "m1", code: "M1-02", label: "Mueble M1 02", x: 0.1, y: 0.22, width: 0.12, height: 0.06, rotation: 0, locked: true, zIndex: 1, metadata: M1_METADATA, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_M1_03, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "m1", code: "M1-03", label: "Mueble M1 03", x: 0.3, y: 0.1, width: 0.12, height: 0.06, rotation: 0, locked: true, zIndex: 1, metadata: M1_METADATA, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_M1_04, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "m1", code: "M1-04", label: "Mueble M1 04", x: 0.3, y: 0.22, width: 0.12, height: 0.06, rotation: 0, locked: true, zIndex: 1, metadata: M1_METADATA, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_GALERIA, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "galeria", code: "GAL-LAMOSA-01", label: "Galería Lamosa", x: 0.55, y: 0.1, width: 0.2, height: 0.12, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_MURO, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "muro", code: "MURO-VITROMEX-01", label: "Muro Vitromex", x: 0.8, y: 0.1, width: 0.1, height: 0.3, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000017", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "escaleras", code: "ESC-01", label: "Escaleras", x: 0.85, y: 0.6, width: 0.1, height: 0.2, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000018", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "vanity", code: "VAN-01", label: "Vanity", x: 0.1, y: 0.6, width: 0.12, height: 0.1, rotation: 0, locked: false, zIndex: 2, metadata: { paquete: "vanity-completo" }, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000019", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "griferia", code: "GRI-01", label: "Grifería", x: 0.3, y: 0.6, width: 0.12, height: 0.1, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000020", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "jacuzzi", code: "JAC-01", label: "Jacuzzi", x: 0.5, y: 0.6, width: 0.15, height: 0.15, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000021", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "boiler", code: "BOI-01", label: "Boiler", x: 0.7, y: 0.6, width: 0.1, height: 0.1, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_MOSTRADOR, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "mostrador", code: "MOST-01", label: "Mostrador", x: 0.1, y: 0.85, width: 0.25, height: 0.08, rotation: 0, locked: true, zIndex: 10, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: DEMO_ELEMENT_CAJA, organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "caja", code: "CAJ-01", label: "Caja", x: 0.7, y: 0.85, width: 0.12, height: 0.08, rotation: 0, locked: true, zIndex: 10, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000024", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, elementType: "parrillas", code: "PAR-01", label: "Parrillas", x: 0.85, y: 0.3, width: 0.1, height: 0.1, rotation: 0, locked: false, zIndex: 2, metadata: null, createdAt: iso("2026-08-08T09:00:00Z"), updatedAt: iso("2026-08-08T09:00:00Z") },
];

const ACTIVE_2026_08_01 = iso("2026-08-01T09:00:00Z");

function position(
  id: string,
  elementId: string,
  positionCode: string,
  variantId: string | null,
  reviewStatus: "ok" | "needs_review" = "ok"
): LayoutPosition {
  return {
    id,
    organizationId: DEMO_ORG_PGM,
    elementId,
    positionCode,
    variantId,
    activeFrom: variantId === null ? null : ACTIVE_2026_08_01,
    activeTo: null,
    reviewStatus,
    createdAt: iso("2026-08-08T09:00:00Z"),
    updatedAt: iso("2026-08-08T09:00:00Z"),
  };
}

const POSITIONS: LayoutPosition[] = [
  position(DEMO_POSITION_M1_01_RF_P01, DEMO_ELEMENT_M1_01, "M1-01-RF-B01-P01", DEMO_VARIANT_051, "needs_review"),
  position(DEMO_POSITION_M1_01_RF_P02, DEMO_ELEMENT_M1_01, "M1-01-RF-B01-P02", DEMO_VARIANT_051),
  position(DEMO_POSITION_M1_01_RF_P03, DEMO_ELEMENT_M1_01, "M1-01-RF-B01-P03", null),
  position(DEMO_POSITION_M1_01_RI_P01, DEMO_ELEMENT_M1_01, "M1-01-RI-B01-P01", DEMO_VARIANT_053),
  position("A0000000-0000-0000-0000-000000000105", DEMO_ELEMENT_M1_01, "M1-01-RI-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000106", DEMO_ELEMENT_M1_01, "M1-01-RI-B01-P03", null),
  position(DEMO_POSITION_M1_01_RP_P01, DEMO_ELEMENT_M1_01, "M1-01-RP-B01-P01", DEMO_VARIANT_052),
  position("A0000000-0000-0000-0000-000000000108", DEMO_ELEMENT_M1_01, "M1-01-RP-B01-P02", null),
  position(DEMO_POSITION_M1_02_RF_P01, DEMO_ELEMENT_M1_02, "M1-02-RF-B01-P01", DEMO_VARIANT_051),
  position("A0000000-0000-0000-0000-000000000112", DEMO_ELEMENT_M1_02, "M1-02-RF-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000113", DEMO_ELEMENT_M1_02, "M1-02-RF-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000114", DEMO_ELEMENT_M1_02, "M1-02-RI-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000115", DEMO_ELEMENT_M1_02, "M1-02-RI-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000116", DEMO_ELEMENT_M1_02, "M1-02-RI-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000117", DEMO_ELEMENT_M1_02, "M1-02-RP-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000118", DEMO_ELEMENT_M1_02, "M1-02-RP-B01-P02", null),
  position(DEMO_POSITION_M1_03_RF_P01, DEMO_ELEMENT_M1_03, "M1-03-RF-B01-P01", DEMO_VARIANT_052),
  position(DEMO_POSITION_M1_03_RF_P02, DEMO_ELEMENT_M1_03, "M1-03-RF-B01-P02", DEMO_VARIANT_053),
  position("A0000000-0000-0000-0000-000000000123", DEMO_ELEMENT_M1_03, "M1-03-RF-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000124", DEMO_ELEMENT_M1_03, "M1-03-RI-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000125", DEMO_ELEMENT_M1_03, "M1-03-RI-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000126", DEMO_ELEMENT_M1_03, "M1-03-RI-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000127", DEMO_ELEMENT_M1_03, "M1-03-RP-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000128", DEMO_ELEMENT_M1_03, "M1-03-RP-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000131", DEMO_ELEMENT_M1_04, "M1-04-RF-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000132", DEMO_ELEMENT_M1_04, "M1-04-RF-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000133", DEMO_ELEMENT_M1_04, "M1-04-RF-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000134", DEMO_ELEMENT_M1_04, "M1-04-RI-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000135", DEMO_ELEMENT_M1_04, "M1-04-RI-B01-P02", null),
  position("A0000000-0000-0000-0000-000000000136", DEMO_ELEMENT_M1_04, "M1-04-RI-B01-P03", null),
  position("A0000000-0000-0000-0000-000000000137", DEMO_ELEMENT_M1_04, "M1-04-RP-B01-P01", null),
  position("A0000000-0000-0000-0000-000000000138", DEMO_ELEMENT_M1_04, "M1-04-RP-B01-P02", null),
  position(DEMO_POSITION_MOST_V01, DEMO_ELEMENT_MOSTRADOR, "MOST-01-V01", DEMO_VARIANT_051),
  position(DEMO_POSITION_MOST_V02, DEMO_ELEMENT_MOSTRADOR, "MOST-01-V02", null),
  position(DEMO_POSITION_CAJ_P01, DEMO_ELEMENT_CAJA, "CAJ-01-P01", null),
];

const VERSION_HISTORY: LayoutVersionEntry[] = [
  { id: "A0000000-0000-0000-0000-000000000201", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "created", elementId: null, positionId: null, previousVariantId: null, newVariantId: null, origin: null, destination: null, reason: "Layout inicial Nogalera", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:00:00Z") },
  { id: "A0000000-0000-0000-0000-000000000202", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "element_added", elementId: DEMO_ELEMENT_M1_01, positionId: null, previousVariantId: null, newVariantId: null, origin: "library", destination: null, reason: "Agregar M1-01", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:05:00Z") },
  { id: "A0000000-0000-0000-0000-000000000203", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "element_added", elementId: DEMO_ELEMENT_GALERIA, positionId: null, previousVariantId: null, newVariantId: null, origin: "library", destination: null, reason: "Agregar galería", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:10:00Z") },
  { id: "A0000000-0000-0000-0000-000000000204", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "product_assigned", elementId: DEMO_ELEMENT_M1_01, positionId: DEMO_POSITION_M1_01_RF_P01, previousVariantId: null, newVariantId: DEMO_VARIANT_051, origin: "picking", destination: DEMO_VARIANT_051, reason: "Asignar tubo PVC", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:15:00Z") },
  { id: "A0000000-0000-0000-0000-000000000205", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "product_assigned", elementId: DEMO_ELEMENT_M1_01, positionId: DEMO_POSITION_M1_01_RI_P01, previousVariantId: null, newVariantId: DEMO_VARIANT_053, origin: "picking", destination: DEMO_VARIANT_053, reason: "Asignar válvula globo", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:20:00Z") },
  { id: "A0000000-0000-0000-0000-000000000206", organizationId: DEMO_ORG_PGM, layoutId: DEMO_LAYOUT_NOGALERA, version: 1, changeType: "product_removed", elementId: DEMO_ELEMENT_M1_01, positionId: DEMO_POSITION_M1_01_RF_P03, previousVariantId: DEMO_VARIANT_051, newVariantId: null, origin: "picking", destination: null, reason: "Retirar producto de la posición", changedBy: DEMO_ADMIN_PGM, createdAt: iso("2026-08-08T09:25:00Z") },
];

/**
 * In-memory layout repository seeded with the 3.2 fixtures (identical to
 * `supabase/seed.sql`). Org-scoped like every repository (D-C07). The demo
 * source is selected by default; `LAYOUT_DATA_SOURCE=demo` (D-L11). Version
 * history is append-only: this class exposes no update/delete for it (LA-28).
 */
export class DemoLayoutRepository implements LayoutRepository {
  private layouts: Layout[];
  private elements: LayoutElement[];
  private positions: LayoutPosition[];
  private versionHistory: LayoutVersionEntry[];

  constructor(options?: { seed?: boolean }) {
    const seed = options?.seed !== false;
    this.layouts = seed ? [LAYOUT] : [];
    this.elements = seed ? [...ELEMENTS] : [];
    this.positions = seed ? [...POSITIONS] : [];
    this.versionHistory = seed ? [...VERSION_HISTORY] : [];
  }

  async listLayouts(
    organizationId: string,
    options?: { branchId?: string; includeArchived?: boolean }
  ): Promise<Layout[]> {
    return this.layouts
      .filter((layout) => layout.organizationId === organizationId)
      .filter((layout) => options?.branchId === undefined || layout.branchId === options.branchId)
      .filter((layout) => options?.includeArchived === true || layout.status !== "archived")
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findLayoutById(organizationId: string, layoutId: string): Promise<Layout | null> {
    const layout = this.layouts.find((entry) => entry.id === layoutId);
    return layout?.organizationId === organizationId ? layout : null;
  }

  async findLayoutByBranchAndName(
    organizationId: string,
    branchId: string,
    name: string
  ): Promise<Layout | null> {
    const layout = this.layouts.find(
      (entry) =>
        entry.organizationId === organizationId &&
        entry.branchId === branchId &&
        entry.name === name
    );
    return layout ?? null;
  }

  async insertLayout(layout: Layout): Promise<Layout> {
    this.layouts.push(layout);
    return layout;
  }

  async updateLayout(layout: Layout): Promise<Layout> {
    const index = this.layouts.findIndex(
      (entry) => entry.id === layout.id && entry.organizationId === layout.organizationId
    );
    if (index === -1) {
      throw new Error(`Layout not found: ${layout.id}`);
    }
    this.layouts[index] = layout;
    return layout;
  }

  async listElements(organizationId: string, layoutId: string): Promise<LayoutElement[]> {
    return this.elements
      .filter(
        (element) => element.organizationId === organizationId && element.layoutId === layoutId
      )
      .sort((a, b) => a.zIndex - b.zIndex || a.code.localeCompare(b.code));
  }

  async findElementById(organizationId: string, elementId: string): Promise<LayoutElement | null> {
    const element = this.elements.find((entry) => entry.id === elementId);
    return element?.organizationId === organizationId ? element : null;
  }

  async findElementByCode(
    organizationId: string,
    layoutId: string,
    code: string
  ): Promise<LayoutElement | null> {
    const element = this.elements.find(
      (entry) =>
        entry.organizationId === organizationId &&
        entry.layoutId === layoutId &&
        entry.code === code
    );
    return element ?? null;
  }

  async insertElement(element: LayoutElement): Promise<LayoutElement> {
    this.elements.push(element);
    return element;
  }

  async updateElement(element: LayoutElement): Promise<LayoutElement> {
    const index = this.elements.findIndex(
      (entry) => entry.id === element.id && entry.organizationId === element.organizationId
    );
    if (index === -1) {
      throw new Error(`Element not found: ${element.id}`);
    }
    this.elements[index] = element;
    return element;
  }

  async listPositions(
    organizationId: string,
    options?: { elementId?: string; reviewStatus?: string }
  ): Promise<LayoutPosition[]> {
    return this.positions
      .filter((position) => position.organizationId === organizationId)
      .filter((position) => options?.elementId === undefined || position.elementId === options.elementId)
      .filter(
        (position) =>
          options?.reviewStatus === undefined || position.reviewStatus === options.reviewStatus
      )
      .sort((a, b) => a.positionCode.localeCompare(b.positionCode));
  }

  async findPositionById(organizationId: string, positionId: string): Promise<LayoutPosition | null> {
    const position = this.positions.find((entry) => entry.id === positionId);
    return position?.organizationId === organizationId ? position : null;
  }

  async findPositionByCode(
    organizationId: string,
    elementId: string,
    positionCode: string
  ): Promise<LayoutPosition | null> {
    const position = this.positions.find(
      (entry) =>
        entry.organizationId === organizationId &&
        entry.elementId === elementId &&
        entry.positionCode === positionCode
    );
    return position ?? null;
  }

  async insertPosition(position: LayoutPosition): Promise<LayoutPosition> {
    this.positions.push(position);
    return position;
  }

  async updatePosition(position: LayoutPosition): Promise<LayoutPosition> {
    const index = this.positions.findIndex(
      (entry) => entry.id === position.id && entry.organizationId === position.organizationId
    );
    if (index === -1) {
      throw new Error(`Position not found: ${position.id}`);
    }
    this.positions[index] = position;
    return position;
  }

  async listVersionHistory(organizationId: string, layoutId: string): Promise<LayoutVersionEntry[]> {
    return this.versionHistory
      .filter(
        (entry) => entry.organizationId === organizationId && entry.layoutId === layoutId
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async insertVersionEntry(entry: LayoutVersionEntry): Promise<LayoutVersionEntry> {
    this.versionHistory.push(entry);
    return entry;
  }
}

import type { InventoryContext } from "./inventory-context";
import {
  assertActorOrganization,
} from "./guards";
import { newId, nowIso, requireVariantReference, requireWarehouseReference, validateReportDate } from "./shared";
import type {
  InventoryActor,
  InventoryChange,
  InventoryChangeType,
  InventorySnapshot,
  InventorySnapshotItem,
  InventorySnapshotSource,
} from "../domain";
import {
  INVENTORY_APPROVE,
  INVENTORY_READ,
  InventoryValidationError,
  assertInventorySnapshotSource,
  assertNonNegativeNumber,
  assertNullableNonNegativeNumber,
  normalizeOptionalText,
  requireInventoryEntity,
} from "../domain";

export interface ApproveImportItemInput {
  variantId: string;
  quantity: number;
  boxes?: number | null;
  squareMeters?: number | null;
}

export interface ApproveImportInput {
  actor: InventoryActor;
  organizationId: string;
  warehouseId: string;
  source: InventorySnapshotSource;
  sourceFile?: string | null;
  reportDate: string;
  items: ApproveImportItemInput[];
  /** Explicit baseline flag. Defaults to true when the warehouse has no snapshot yet (IA-12/13). */
  isBaseline?: boolean;
}

export interface ApproveImportResult {
  snapshot: InventorySnapshot;
  items: InventorySnapshotItem[];
  changes: InventoryChange[];
}

interface NormalizedItem {
  variantId: string;
  quantity: number;
  boxes: number | null;
  squareMeters: number | null;
}

/**
 * Approves a load: creates an inventory snapshot (with the exact source date,
 * D-I02/D-I04) and, once the baseline exists, computes only-changes (D-I03)
 * with the 6 change types (IA-14/15/16/18). Writes the audit event
 * `approve_import` (D-I02). Never deletes history (IA-17).
 */
export async function approveImport(
  context: InventoryContext,
  input: ApproveImportInput
): Promise<ApproveImportResult> {
  const { actor, organizationId, warehouseId } = input;
  actor.requirePermission(INVENTORY_APPROVE);
  assertActorOrganization(actor, organizationId);

  const source = assertInventorySnapshotSource(input.source);
  const reportDate = validateReportDate(input.reportDate);
  const sourceFile = normalizeOptionalText(input.sourceFile, "source_file");

  await requireWarehouseReference(context.referenceCatalog, organizationId, warehouseId);

  const normalizedItems = await normalizeImportItems(context, organizationId, input.items);
  if (normalizedItems.length === 0) {
    throw new InventoryValidationError("Cannot approve an empty load: no items");
  }

  const latest = await context.inventoryRepository.findLatestSnapshot(
    organizationId,
    warehouseId
  );
  const isBaseline = resolveBaselineFlag(latest, input.isBaseline);

  if (!isBaseline) {
    const duplicate = await context.inventoryRepository.findExistingLoad(
      organizationId,
      warehouseId,
      reportDate,
      source
    );
    if (duplicate !== null) {
      throw new InventoryValidationError(
        `Duplicate load rejected: a snapshot for warehouse/date/source already exists (${reportDate}) (IA-8)`
      );
    }
  }

  const now = nowIso();
  const snapshotId = newId();
  const snapshot: InventorySnapshot = {
    id: snapshotId,
    organizationId,
    warehouseId,
    source,
    sourceFile,
    reportDate,
    importedAt: now,
    importedBy: actor.userId,
    isBaseline,
    createdAt: now,
    updatedAt: now,
  };

  const items: InventorySnapshotItem[] = normalizedItems
    .map((item) => ({
      id: newId(),
      organizationId,
      snapshotId,
      variantId: item.variantId,
      quantity: item.quantity,
      boxes: item.boxes,
      squareMeters: item.squareMeters,
      createdAt: now,
    }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));

  const { snapshot: savedSnapshot, items: savedItems } =
    await context.inventoryRepository.insertSnapshot(organizationId, snapshot, items);

  let changes: InventoryChange[] = [];
  if (!isBaseline && latest !== null) {
    const previousItems = await context.inventoryRepository.listSnapshotItems(
      organizationId,
      latest.id
    );
    changes = computeChanges(organizationId, warehouseId, snapshotId, now, previousItems, savedItems);
    if (changes.length > 0) {
      changes = await context.inventoryRepository.insertChanges(organizationId, changes);
    }
  }

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "approve_import",
    entityType: "inventory_snapshot",
    entityId: savedSnapshot.id,
    detail: sourceFile ?? `Carga ${reportDate} aprobada`,
  });

  return { snapshot: savedSnapshot, items: savedItems, changes };
}

export interface ListSnapshotsInput {
  actor: InventoryActor;
  organizationId: string;
  warehouseId?: string;
}

export async function listSnapshots(
  context: InventoryContext,
  input: ListSnapshotsInput
): Promise<InventorySnapshot[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);
  return context.inventoryRepository.listSnapshots(organizationId, {
    warehouseId: input.warehouseId,
  });
}

export interface GetSnapshotInput {
  actor: InventoryActor;
  organizationId: string;
  snapshotId: string;
}

export interface SnapshotDetail {
  snapshot: InventorySnapshot;
  items: InventorySnapshotItem[];
  changes: InventoryChange[];
}

export async function getSnapshot(
  context: InventoryContext,
  input: GetSnapshotInput
): Promise<SnapshotDetail> {
  const { actor, organizationId, snapshotId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);

  const snapshot = requireInventoryEntity(
    await context.inventoryRepository.findSnapshotById(organizationId, snapshotId),
    "inventory_snapshot",
    snapshotId
  );
  const [items, changes] = await Promise.all([
    context.inventoryRepository.listSnapshotItems(organizationId, snapshotId),
    context.inventoryRepository.listChangesBySnapshot(organizationId, snapshotId),
  ]);
  return { snapshot, items, changes };
}

export interface ListChangesInput {
  actor: InventoryActor;
  organizationId: string;
  warehouseId?: string;
  variantId?: string;
}

export async function listChanges(
  context: InventoryContext,
  input: ListChangesInput
): Promise<InventoryChange[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);
  return context.inventoryRepository.listChanges(organizationId, {
    warehouseId: input.warehouseId,
    variantId: input.variantId,
  });
}

async function normalizeImportItems(
  context: InventoryContext,
  organizationId: string,
  items: ApproveImportItemInput[]
): Promise<NormalizedItem[]> {
  const seen = new Set<string>();
  const normalized: NormalizedItem[] = [];
  for (const item of items) {
    if (seen.has(item.variantId)) {
      throw new InventoryValidationError(
        `Duplicate variant in load: ${item.variantId} (IA-4: duplicates are reported, never summed)`
      );
    }
    seen.add(item.variantId);
    await requireVariantReference(context.referenceCatalog, organizationId, item.variantId);
    normalized.push({
      variantId: item.variantId,
      quantity: assertNonNegativeNumber(item.quantity, "quantity"),
      boxes: assertNullableNonNegativeNumber(item.boxes, "boxes"),
      squareMeters: assertNullableNonNegativeNumber(item.squareMeters, "square_meters"),
    });
  }
  return normalized;
}

function resolveBaselineFlag(
  latest: InventorySnapshot | null,
  requested: boolean | undefined
): boolean {
  if (latest === null) {
    if (requested === false) {
      throw new InventoryValidationError(
        "Cannot approve a non-baseline load: approve the baseline first (IA-13)"
      );
    }
    return true;
  }
  if (requested === true) {
    throw new InventoryValidationError(
      "Baseline already exists for this warehouse; a load is only the baseline once (IA-12)"
    );
  }
  return false;
}

/** Computes only-changes between a previous snapshot and the new one (IA-14/15/16). */
export function computeChanges(
  organizationId: string,
  warehouseId: string,
  sourceSnapshotId: string,
  detectedAt: string,
  previousItems: InventorySnapshotItem[],
  newItems: InventorySnapshotItem[]
): InventoryChange[] {
  const previous = new Map(previousItems.map((item) => [item.variantId, item.quantity]));
  const incoming = new Map(newItems.map((item) => [item.variantId, item.quantity]));
  const changes: InventoryChange[] = [];

  for (const [variantId, previousQuantity] of previous) {
    const newQuantity = incoming.get(variantId);
    if (newQuantity === undefined) {
      changes.push(
        buildChange(organizationId, warehouseId, sourceSnapshotId, detectedAt, variantId, previousQuantity, 0, "missing_product")
      );
      continue;
    }
    const changeType = classifyChange(previousQuantity, newQuantity);
    if (changeType === null) {
      continue; // IA-15: unchanged variant, no change row
    }
    changes.push(
      buildChange(organizationId, warehouseId, sourceSnapshotId, detectedAt, variantId, previousQuantity, newQuantity, changeType)
    );
  }

  for (const [variantId, newQuantity] of incoming) {
    if (!previous.has(variantId)) {
      changes.push(
        buildChange(organizationId, warehouseId, sourceSnapshotId, detectedAt, variantId, 0, newQuantity, "new_product")
      );
    }
  }

  return changes.sort((a, b) => a.variantId.localeCompare(b.variantId));
}

function classifyChange(
  previousQuantity: number,
  newQuantity: number
): InventoryChangeType | null {
  if (newQuantity === previousQuantity) {
    return null;
  }
  if (newQuantity === 0) {
    return "zeroed";
  }
  if (previousQuantity === 0) {
    return "recovered";
  }
  return newQuantity > previousQuantity ? "increase" : "decrease";
}

function buildChange(
  organizationId: string,
  warehouseId: string,
  sourceSnapshotId: string,
  detectedAt: string,
  variantId: string,
  previousQuantity: number,
  newQuantity: number,
  changeType: InventoryChangeType
): InventoryChange {
  const now = detectedAt;
  return {
    id: newId(),
    organizationId,
    variantId,
    warehouseId,
    previousQuantity,
    newQuantity,
    difference: newQuantity - previousQuantity,
    changeType,
    detectedAt: now,
    sourceSnapshotId,
    createdAt: now,
  };
}

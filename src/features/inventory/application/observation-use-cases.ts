import type { InventoryContext } from "./inventory-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, requireVariantReference, requireWarehouseReference } from "./shared";
import type {
  InventoryActor,
  InventoryObservation,
  InventoryObservationType,
} from "../domain";
import {
  INVENTORY_APPROVE,
  INVENTORY_OBSERVE,
  INVENTORY_READ,
  assertInventoryObservationType,
  assertNullableNonNegativeNumber,
  normalizeOptionalText,
  requireInventoryEntity,
} from "../domain";

export interface CreateObservationInput {
  actor: InventoryActor;
  organizationId: string;
  variantId: string;
  warehouseId: string;
  observationType: InventoryObservationType;
  observedQuantity?: number | null;
  note?: string | null;
  evidenceUrl?: string | null;
}

export async function createObservation(
  context: InventoryContext,
  input: CreateObservationInput
): Promise<InventoryObservation> {
  const { actor, organizationId, variantId, warehouseId } = input;
  actor.requirePermission(INVENTORY_OBSERVE);
  assertActorOrganization(actor, organizationId);

  const observationType = assertInventoryObservationType(input.observationType);
  const observedQuantity = assertNullableNonNegativeNumber(
    input.observedQuantity,
    "observed_quantity"
  );
  const note = normalizeOptionalText(input.note, "note");
  const evidenceUrl = normalizeOptionalText(input.evidenceUrl, "evidence_url");

  await requireVariantReference(context.referenceCatalog, organizationId, variantId);
  await requireWarehouseReference(context.referenceCatalog, organizationId, warehouseId);

  const now = nowIso();
  const observation: InventoryObservation = {
    id: newId(),
    organizationId,
    variantId,
    warehouseId,
    observationType,
    observedQuantity,
    note,
    evidenceUrl,
    createdBy: actor.userId,
    createdAt: now,
    updatedAt: now,
  };

  const saved = await context.inventoryRepository.insertObservation(observation);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create_observation",
    entityType: "inventory_observation",
    entityId: saved.id,
    detail: note ?? `Observación ${observationType}`,
  });

  return saved;
}

export interface ConfirmObservationInput {
  actor: InventoryActor;
  organizationId: string;
  observationId: string;
  confirmationNote?: string | null;
}

/**
 * Confirms/closes an observation. Requires `inventory.approve` (IA-22). The
 * confirmation is recorded on the observation and an audit event is appended.
 * It never mutates snapshot quantities (IA-21).
 */
export async function confirmObservation(
  context: InventoryContext,
  input: ConfirmObservationInput
): Promise<InventoryObservation> {
  const { actor, organizationId, observationId } = input;
  actor.requirePermission(INVENTORY_APPROVE);
  assertActorOrganization(actor, organizationId);

  const current = requireInventoryEntity(
    await context.inventoryRepository.findObservationById(organizationId, observationId),
    "inventory_observation",
    observationId
  );

  const confirmationNote = normalizeOptionalText(input.confirmationNote, "confirmation_note");
  const updated: InventoryObservation = {
    ...current,
    note: confirmationNote ?? current.note,
    updatedAt: nowIso(),
  };
  const saved = await context.inventoryRepository.updateObservation(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "confirm_observation",
    entityType: "inventory_observation",
    entityId: saved.id,
    detail: saved.note ?? `Observación confirmada`,
  });

  return saved;
}

export interface ListObservationsInput {
  actor: InventoryActor;
  organizationId: string;
  warehouseId?: string;
  variantId?: string;
}

export async function listObservations(
  context: InventoryContext,
  input: ListObservationsInput
): Promise<InventoryObservation[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);
  return context.inventoryRepository.listObservations(organizationId, {
    warehouseId: input.warehouseId,
    variantId: input.variantId,
  });
}

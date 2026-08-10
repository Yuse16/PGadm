import type { LayoutContext } from "./layout-context";
import { assertActorOrganization } from "./guards";
import { requireEditableElement, requireEditableLayout } from "./editing";
import { newId, nowIso } from "./shared";
import type { LayoutActor, LayoutElement, LayoutElementType } from "../domain";
import {
  LAYOUT_EDIT,
  LayoutValidationError,
  assertIntegerZIndex,
  assertLayoutElementType,
  assertNonNegativeDimension,
  assertRotation,
  assertUnitCoordinate,
  normalizeMetadata,
  normalizeOptionalText,
  requireLayoutEntity,
  validateRequiredText,
} from "../domain";

function coordKey(x: number, y: number): string {
  return `${x},${y}`;
}

export interface AddElementInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  elementType: LayoutElementType;
  code: string;
  label?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
}

/**
 * Adds a furniture/zone element to a draft layout (LA-8). The `code` is the
 * permanent hierarchical location ID, unique per layout (D-L02/LA-3). Locked is
 * never forced at creation; the editor can lock later (LA-11).
 */
export async function addElement(
  context: LayoutContext,
  input: AddElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  await requireEditableLayout(context, organizationId, layoutId);

  const elementType = assertLayoutElementType(input.elementType);
  const code = validateRequiredText(input.code, "code");
  const x = assertUnitCoordinate(input.x ?? 0, "x");
  const y = assertUnitCoordinate(input.y ?? 0, "y");
  const width = assertNonNegativeDimension(input.width ?? 0, "width");
  const height = assertNonNegativeDimension(input.height ?? 0, "height");
  const rotation = assertRotation(input.rotation ?? 0, "rotation");
  const zIndex = assertIntegerZIndex(input.zIndex ?? 0, "z_index");
  const label = normalizeOptionalText(input.label, "label");
  const metadata = normalizeMetadata(input.metadata);
  const reason = normalizeOptionalText(input.reason, "reason");

  const existing = await context.layoutRepository.findElementByCode(
    organizationId,
    layoutId,
    code
  );
  if (existing !== null) {
    throw new LayoutValidationError(
      `Element code "${code}" already exists in layout ${layoutId} (UNIQUE organization_id, layout_id, code)`
    );
  }

  const now = nowIso();
  const element: LayoutElement = {
    id: newId(),
    organizationId,
    layoutId,
    elementType,
    code,
    label,
    x,
    y,
    width,
    height,
    rotation,
    locked: false,
    zIndex,
    metadata,
    createdAt: now,
    updatedAt: now,
  };
  const saved = await context.layoutRepository.insertElement(element);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId,
    version: (await context.layoutRepository.findLayoutById(organizationId, layoutId))?.version ?? 1,
    changeType: "element_added",
    elementId: saved.id,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: "library",
    destination: coordKey(saved.x, saved.y),
    reason: reason ?? `Agregar elemento ${saved.code}`,
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "element_edited",
    entityType: "layout_element",
    entityId: saved.id,
    detail: `Elemento ${saved.code} (${saved.elementType}) agregado`,
  });

  return saved;
}

export interface MoveElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  x: number;
  y: number;
  reason?: string | null;
}

/** Moves a draft element to normalized coordinates 0-1 (LA-8/LA-10). */
export async function moveElement(
  context: LayoutContext,
  input: MoveElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  assertNotLocked(element);

  const x = assertUnitCoordinate(input.x, "x");
  const y = assertUnitCoordinate(input.y, "y");
  const reason = normalizeOptionalText(input.reason, "reason");

  const updated: LayoutElement = {
    ...element,
    x,
    y,
    updatedAt: nowIso(),
  };
  const saved = await context.layoutRepository.updateElement(updated);

  await recordElementChange(context, actor, saved, "element_moved", {
    origin: coordKey(element.x, element.y),
    destination: coordKey(saved.x, saved.y),
    reason: reason ?? `Mover a ${coordKey(saved.x, saved.y)}`,
  });

  return saved;
}

export interface RotateElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  rotation: number;
  reason?: string | null;
}

/** Rotates a draft element (degrees [0, 360), LA-8). */
export async function rotateElement(
  context: LayoutContext,
  input: RotateElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  assertNotLocked(element);

  const rotation = assertRotation(input.rotation, "rotation");
  const reason = normalizeOptionalText(input.reason, "reason");

  const updated: LayoutElement = {
    ...element,
    rotation,
    updatedAt: nowIso(),
  };
  const saved = await context.layoutRepository.updateElement(updated);

  await recordElementChange(context, actor, saved, "element_rotated", {
    origin: String(element.rotation),
    destination: String(saved.rotation),
    reason: reason ?? `Rotar a ${saved.rotation}°`,
  });

  return saved;
}

export interface ResizeElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  width: number;
  height: number;
  reason?: string | null;
}

/** Resizes a draft element (non-negative normalized dimensions, LA-8). */
export async function resizeElement(
  context: LayoutContext,
  input: ResizeElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  assertNotLocked(element);

  const width = assertNonNegativeDimension(input.width, "width");
  const height = assertNonNegativeDimension(input.height, "height");
  const reason = normalizeOptionalText(input.reason, "reason");

  const updated: LayoutElement = {
    ...element,
    width,
    height,
    updatedAt: nowIso(),
  };
  const saved = await context.layoutRepository.updateElement(updated);

  await recordElementChange(context, actor, saved, "element_resized", {
    origin: `${element.width}x${element.height}`,
    destination: `${saved.width}x${saved.height}`,
    reason: reason ?? `Redimensionar a ${saved.width}x${saved.height}`,
  });

  return saved;
}

export interface LockElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  locked: boolean;
  reason?: string | null;
}

/** Locks/unlocks a draft element in the editor (LA-11). */
export async function lockElement(
  context: LayoutContext,
  input: LockElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  const reason = normalizeOptionalText(input.reason, "reason");

  const updated: LayoutElement = {
    ...element,
    locked: input.locked,
    updatedAt: nowIso(),
  };
  const saved = await context.layoutRepository.updateElement(updated);

  await recordElementChange(context, actor, saved, "element_locked", {
    origin: element.locked ? "locked" : "unlocked",
    destination: saved.locked ? "locked" : "unlocked",
    reason: reason ?? (saved.locked ? "Bloquear elemento" : "Desbloquear elemento"),
  });

  return saved;
}

export interface HideElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  hidden: boolean;
  reason?: string | null;
}

/**
 * Hides/shows a draft element (LAYOUT_EDITING_RULES). The model has no hidden
 * column, so the flag is stored in `metadata.hidden` (jsonb); the 'element_hidden'
 * change type is appended to the version history.
 */
export async function hideElement(
  context: LayoutContext,
  input: HideElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  const reason = normalizeOptionalText(input.reason, "reason");

  const hidden = Boolean(input.hidden);
  const updated: LayoutElement = {
    ...element,
    metadata: { ...(element.metadata ?? {}), hidden },
    updatedAt: nowIso(),
  };
  const saved = await context.layoutRepository.updateElement(updated);

  await recordElementChange(context, actor, saved, "element_hidden", {
    origin: element.metadata?.hidden ? "hidden" : "visible",
    destination: hidden ? "hidden" : "visible",
    reason: reason ?? (hidden ? "Ocultar elemento" : "Mostrar elemento"),
  });

  return saved;
}

export interface DuplicateElementInput {
  actor: LayoutActor;
  organizationId: string;
  elementId: string;
  code: string;
  x?: number;
  y?: number;
  reason?: string | null;
}

/**
 * Duplicates a draft element with a new permanent code (LA-8). Geometry, type,
 * label and metadata are copied; the copy is unlocked so it can be edited.
 */
export async function duplicateElement(
  context: LayoutContext,
  input: DuplicateElementInput
): Promise<LayoutElement> {
  const { actor, organizationId, elementId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const element = await requireEditableElement(context, organizationId, elementId);
  const code = validateRequiredText(input.code, "code");
  const x = assertUnitCoordinate(input.x ?? element.x, "x");
  const y = assertUnitCoordinate(input.y ?? element.y, "y");
  const reason = normalizeOptionalText(input.reason, "reason");

  const existing = await context.layoutRepository.findElementByCode(
    organizationId,
    element.layoutId,
    code
  );
  if (existing !== null) {
    throw new LayoutValidationError(
      `Element code "${code}" already exists in layout ${element.layoutId}`
    );
  }

  const now = nowIso();
  const copy: LayoutElement = {
    id: newId(),
    organizationId,
    layoutId: element.layoutId,
    elementType: element.elementType,
    code,
    label: element.label,
    x,
    y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    locked: false,
    zIndex: element.zIndex + 1,
    metadata: element.metadata,
    createdAt: now,
    updatedAt: now,
  };
  const saved = await context.layoutRepository.insertElement(copy);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: saved.layoutId,
    version: (await context.layoutRepository.findLayoutById(organizationId, saved.layoutId))
      ?.version ?? 1,
    changeType: "element_duplicated",
    elementId: saved.id,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: element.code,
    destination: saved.code,
    reason: reason ?? `Duplicar ${element.code} como ${saved.code}`,
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "element_edited",
    entityType: "layout_element",
    entityId: saved.id,
    detail: `Elemento ${element.code} duplicado como ${saved.code}`,
  });

  return saved;
}

function assertNotLocked(element: LayoutElement): void {
  if (element.locked) {
    throw new LayoutValidationError(
      `Element ${element.id} is locked; unlock it before moving/rotating/resizing (LA-11)`
    );
  }
}

interface ElementChangeDetail {
  origin: string;
  destination: string;
  reason: string;
}

async function recordElementChange(
  context: LayoutContext,
  actor: LayoutActor,
  saved: LayoutElement,
  changeType: "element_moved" | "element_rotated" | "element_resized" | "element_locked" | "element_hidden",
  detail: ElementChangeDetail
): Promise<void> {
  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId: saved.organizationId,
    layoutId: saved.layoutId,
    version: (await context.layoutRepository.findLayoutById(
      saved.organizationId,
      saved.layoutId
    ))?.version ?? 1,
    changeType,
    elementId: saved.id,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: detail.origin,
    destination: detail.destination,
    reason: detail.reason,
    changedBy: actor.userId,
    createdAt: saved.updatedAt,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId: saved.organizationId,
    action: "element_edited",
    entityType: "layout_element",
    entityId: saved.id,
    detail: `${changeType}: ${detail.reason}`,
  });
}

/** Helper exposed for element lookups outside the editor flow. */
export async function getElement(
  context: LayoutContext,
  actor: LayoutActor,
  organizationId: string,
  elementId: string
): Promise<LayoutElement> {
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);
  return requireLayoutEntity(
    await context.layoutRepository.findElementById(organizationId, elementId),
    "layout_element",
    elementId
  );
}

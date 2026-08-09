import type { LayoutContext } from "./layout-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, requireStoreBranchReference } from "./shared";
import type {
  Layout,
  LayoutActor,
  LayoutElement,
  LayoutPosition,
  LayoutVersionEntry,
} from "../domain";
import {
  LAYOUT_EDIT,
  LAYOUT_MANAGE,
  LAYOUT_PUBLISH,
  LAYOUT_READ,
  LayoutValidationError,
  assertLayoutStatus,
  assertNullablePositiveDimension,
  assertPositiveVersion,
  normalizeOptionalText,
  requireLayoutEntity,
  validateRequiredText,
} from "../domain";

export interface CreateLayoutInput {
  actor: LayoutActor;
  organizationId: string;
  branchId: string;
  name: string;
  width?: number | null;
  height?: number | null;
  backgroundReference?: string | null;
  reason?: string | null;
}

/**
 * Creates a new draft layout (version 1) anchored to a store branch (D-L01).
 * Requires layout.manage (the DB insert policy on `layouts` is manage-scoped).
 * One layout name per store (UNIQUE organization_id, branch_id, name); a
 * duplicate name is a validation error, never a silent overwrite.
 */
export async function createLayout(
  context: LayoutContext,
  input: CreateLayoutInput
): Promise<Layout> {
  const { actor, organizationId, branchId } = input;
  actor.requirePermission(LAYOUT_MANAGE);
  assertActorOrganization(actor, organizationId);

  const name = validateRequiredText(input.name, "name");
  const width = assertNullablePositiveDimension(input.width, "width");
  const height = assertNullablePositiveDimension(input.height, "height");
  const backgroundReference = normalizeOptionalText(
    input.backgroundReference,
    "background_reference"
  );
  const reason = normalizeOptionalText(input.reason, "reason");

  await requireStoreBranchReference(context.referenceCatalog, organizationId, branchId);

  const existing = await context.layoutRepository.findLayoutByBranchAndName(
    organizationId,
    branchId,
    name
  );
  if (existing !== null) {
    throw new LayoutValidationError(
      `Layout name "${name}" already exists for branch ${branchId} (UNIQUE organization_id, branch_id, name)`
    );
  }

  const now = nowIso();
  const layout: Layout = {
    id: newId(),
    organizationId,
    branchId,
    name,
    status: "draft",
    version: 1,
    width,
    height,
    backgroundReference,
    createdAt: now,
    updatedAt: now,
  };

  const saved = await context.layoutRepository.insertLayout(layout);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: saved.id,
    version: saved.version,
    changeType: "created",
    elementId: null,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: null,
    destination: null,
    reason: reason ?? "Layout inicial",
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "layout_created",
    entityType: "layout",
    entityId: saved.id,
    detail: `Layout "${saved.name}" creado (draft v1)`,
  });

  return saved;
}

export interface EditLayoutInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  name?: string;
  width?: number | null;
  height?: number | null;
  backgroundReference?: string | null;
  reason?: string | null;
}

/**
 * Edits the draft layout metadata (name/canvas size/background reference).
 * Editing is only allowed on drafts (LA-9). Layout-level edits are recorded in
 * the audit log (layout_edited); the version-history change_type catalog has no
 * layout-level value, so no version entry is appended for these changes.
 */
export async function editLayout(
  context: LayoutContext,
  input: EditLayoutInput
): Promise<Layout> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_EDIT);
  assertActorOrganization(actor, organizationId);

  const current = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  if (current.status !== "draft") {
    throw new LayoutValidationError(
      `Layout ${layoutId} is ${current.status}; editing is only allowed on draft layouts (D-L04)`
    );
  }

  const updated: Layout = {
    ...current,
    name: input.name !== undefined ? validateRequiredText(input.name, "name") : current.name,
    width:
      input.width !== undefined
        ? assertNullablePositiveDimension(input.width, "width")
        : current.width,
    height:
      input.height !== undefined
        ? assertNullablePositiveDimension(input.height, "height")
        : current.height,
    backgroundReference:
      input.backgroundReference !== undefined
        ? normalizeOptionalText(input.backgroundReference, "background_reference")
        : current.backgroundReference,
    updatedAt: nowIso(),
  };

  const saved = await context.layoutRepository.updateLayout(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "layout_edited",
    entityType: "layout",
    entityId: saved.id,
    detail: normalizeOptionalText(input.reason, "reason") ?? "Layout editado (draft)",
  });

  return saved;
}

export interface PublishLayoutInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  reason?: string | null;
}

/**
 * Publishes a draft layout: draft -> published, version + 1 (LA-12). Requires
 * layout.publish and conserves the previous version in the append-only history
 * (nothing is deleted).
 */
export async function publishLayout(
  context: LayoutContext,
  input: PublishLayoutInput
): Promise<Layout> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_PUBLISH);
  assertActorOrganization(actor, organizationId);

  const current = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  if (current.status === "archived") {
    throw new LayoutValidationError(
      `Layout ${layoutId} is archived and cannot be published`
    );
  }
  if (current.status !== "draft") {
    throw new LayoutValidationError(
      `Layout ${layoutId} is already ${current.status}; only draft layouts can be published (LA-12)`
    );
  }

  const nextVersion = current.version + 1;
  const reason = normalizeOptionalText(input.reason, "reason");
  const now = nowIso();

  const published: Layout = {
    ...current,
    status: "published",
    version: nextVersion,
    updatedAt: now,
  };
  const saved = await context.layoutRepository.updateLayout(published);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: saved.id,
    version: nextVersion,
    changeType: "published",
    elementId: null,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: "draft",
    destination: "published",
    reason: reason ?? "Publicación de versión",
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "layout_published",
    entityType: "layout",
    entityId: saved.id,
    detail: `Publicada versión ${nextVersion}`,
  });

  return saved;
}

export interface RestoreVersionInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  version: number;
  reason?: string | null;
}

/**
 * Restores a previous version: returns the layout to edition (draft) without
 * deleting the restored version or any history (LA-13). The 'restored' event is
 * appended at the current version; physical element/position rollback is left to
 * the editor (the history is event-based, not a full snapshot).
 */
export async function restoreVersion(
  context: LayoutContext,
  input: RestoreVersionInput
): Promise<Layout> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_PUBLISH);
  assertActorOrganization(actor, organizationId);

  const current = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  if (current.status === "archived") {
    throw new LayoutValidationError(
      `Layout ${layoutId} is archived and cannot be restored`
    );
  }
  const targetVersion = assertPositiveVersion(input.version, "version");
  if (targetVersion > current.version) {
    throw new LayoutValidationError(
      `Cannot restore version ${targetVersion}: layout ${layoutId} is at version ${current.version}`
    );
  }

  const reason = normalizeOptionalText(input.reason, "reason");
  const now = nowIso();

  const restored: Layout = {
    ...current,
    status: "draft",
    updatedAt: now,
  };
  const saved = await context.layoutRepository.updateLayout(restored);

  await context.layoutRepository.insertVersionEntry({
    id: newId(),
    organizationId,
    layoutId: saved.id,
    version: current.version,
    changeType: "restored",
    elementId: null,
    positionId: null,
    previousVariantId: null,
    newVariantId: null,
    origin: current.status,
    destination: "draft",
    reason: reason ?? `Restaurada versión ${targetVersion}`,
    changedBy: actor.userId,
    createdAt: now,
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "layout_restored",
    entityType: "layout",
    entityId: saved.id,
    detail: `Restaurada versión ${targetVersion}`,
  });

  return saved;
}

export interface ArchiveLayoutInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
  reason?: string | null;
}

/**
 * Soft-retires a layout: status -> archived (LA-14). Archived layouts leave the
 * active query; the history remains (no DELETE anywhere).
 */
export async function archiveLayout(
  context: LayoutContext,
  input: ArchiveLayoutInput
): Promise<Layout> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_MANAGE);
  assertActorOrganization(actor, organizationId);

  const current = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  if (current.status === "archived") {
    throw new LayoutValidationError(`Layout ${layoutId} is already archived`);
  }

  const saved = await context.layoutRepository.updateLayout({
    ...current,
    status: "archived",
    updatedAt: nowIso(),
  });

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "layout_archived",
    entityType: "layout",
    entityId: saved.id,
    detail: normalizeOptionalText(input.reason, "reason") ?? "Layout archivado",
  });

  return saved;
}

export interface ListLayoutsInput {
  actor: LayoutActor;
  organizationId: string;
  branchId?: string;
  includeArchived?: boolean;
}

export async function listLayouts(
  context: LayoutContext,
  input: ListLayoutsInput
): Promise<Layout[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(LAYOUT_READ);
  assertActorOrganization(actor, organizationId);
  return context.layoutRepository.listLayouts(organizationId, {
    branchId: input.branchId,
    includeArchived: input.includeArchived,
  });
}

export interface GetLayoutInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
}

export interface LayoutDetail {
  layout: Layout;
  elements: LayoutElement[];
  positions: LayoutPosition[];
}

export async function getLayout(
  context: LayoutContext,
  input: GetLayoutInput
): Promise<LayoutDetail> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_READ);
  assertActorOrganization(actor, organizationId);

  const layout = requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );

  const [elements, positions] = await Promise.all([
    context.layoutRepository.listElements(organizationId, layoutId),
    context.layoutRepository.listPositions(organizationId),
  ]);

  return {
    layout,
    elements,
    positions: positions.filter((position) =>
      elements.some((element) => element.id === position.elementId)
    ),
  };
}

export interface ListVersionHistoryInput {
  actor: LayoutActor;
  organizationId: string;
  layoutId: string;
}

export async function listVersionHistory(
  context: LayoutContext,
  input: ListVersionHistoryInput
): Promise<LayoutVersionEntry[]> {
  const { actor, organizationId, layoutId } = input;
  actor.requirePermission(LAYOUT_READ);
  assertActorOrganization(actor, organizationId);

  requireLayoutEntity(
    await context.layoutRepository.findLayoutById(organizationId, layoutId),
    "layout",
    layoutId
  );
  return context.layoutRepository.listVersionHistory(organizationId, layoutId);
}

/** Public status guard helper for UI composition. */
export function isLayoutDraft(status: string): boolean {
  return assertLayoutStatus(status) === "draft";
}

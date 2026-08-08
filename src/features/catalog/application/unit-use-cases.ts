import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, referenceStatusAction } from "./shared";
import type { CatalogActor, Unit, UnitDraft } from "../domain";
import {
  CATALOG_MANAGE,
  CatalogValidationError,
  requireEntity,
  validateRequiredText,
  validateUnitKind,
} from "../domain";

export interface CreateUnitInput {
  actor: CatalogActor;
  organizationId: string;
  unit: UnitDraft;
}

export async function createUnit(
  context: CatalogContext,
  input: CreateUnitInput
): Promise<Unit> {
  const { actor, organizationId, unit } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const code = validateRequiredText(unit.code, "code");
  const name = validateRequiredText(unit.name, "name");
  const kind = validateUnitKind(unit.kind, "kind");
  await assertUnitCodeAvailable(context, organizationId, code, null);

  const createdAt = nowIso();
  const entity: Unit = {
    id: newId(),
    organizationId,
    code,
    name,
    kind,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.unitRepository.insertUnit(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "unit",
    entityId: created.id,
    detail: created.code,
  });

  return created;
}

export interface UnitChanges {
  code?: string;
  name?: string;
  kind?: Unit["kind"];
  status?: "active" | "inactive";
}

export interface UpdateUnitInput {
  actor: CatalogActor;
  organizationId: string;
  unitId: string;
  changes: UnitChanges;
}

export async function updateUnit(
  context: CatalogContext,
  input: UpdateUnitInput
): Promise<Unit> {
  const { actor, organizationId, unitId, changes } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await context.unitRepository.findUnitById(organizationId, unitId),
    "unit",
    unitId
  );

  const code =
    changes.code === undefined ? existing.code : validateRequiredText(changes.code, "code");
  const name =
    changes.name === undefined ? existing.name : validateRequiredText(changes.name, "name");
  const kind =
    changes.kind === undefined ? existing.kind : validateUnitKind(changes.kind, "kind");
  const status =
    changes.status === undefined ? existing.status : changes.status;
  if (status !== "active" && status !== "inactive") {
    throw new CatalogValidationError(`Invalid unit status: ${String(status)}`);
  }
  await assertUnitCodeAvailable(context, organizationId, code, unitId);

  const updated: Unit = {
    ...existing,
    code,
    name,
    kind,
    status,
    updatedAt: nowIso(),
  };
  const saved = await context.unitRepository.updateUnit(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: referenceStatusAction(existing.status, saved.status),
    entityType: "unit",
    entityId: saved.id,
    detail: saved.code,
  });

  return saved;
}

export async function assertUnitCodeAvailable(
  context: CatalogContext,
  organizationId: string,
  code: string,
  excludeId: string | null
): Promise<void> {
  const existing = await context.unitRepository.findUnitByCode(
    organizationId,
    code
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(`Duplicate unit code: ${code}`);
  }
}

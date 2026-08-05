import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, referenceStatusAction } from "./shared";
import type { Brand, BrandDraft, CatalogActor } from "../domain";
import {
  CATALOG_MANAGE,
  CatalogValidationError,
  requireEntity,
  validateRequiredText,
} from "../domain";

export interface CreateBrandInput {
  actor: CatalogActor;
  organizationId: string;
  brand: BrandDraft;
}

export async function createBrand(
  context: CatalogContext,
  input: CreateBrandInput
): Promise<Brand> {
  const { actor, organizationId, brand } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const code = validateRequiredText(brand.code, "code");
  const name = validateRequiredText(brand.name, "name");
  await assertBrandCodeAvailable(context, organizationId, code, null);

  const createdAt = nowIso();
  const entity: Brand = {
    id: newId(),
    organizationId,
    code,
    name,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.brandRepository.insertBrand(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "brand",
    entityId: created.id,
    detail: created.code,
  });

  return created;
}

export interface BrandChanges {
  code?: string;
  name?: string;
  status?: "active" | "inactive";
}

export interface UpdateBrandInput {
  actor: CatalogActor;
  organizationId: string;
  brandId: string;
  changes: BrandChanges;
}

export async function updateBrand(
  context: CatalogContext,
  input: UpdateBrandInput
): Promise<Brand> {
  const { actor, organizationId, brandId, changes } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await context.brandRepository.findBrandById(organizationId, brandId),
    "brand",
    brandId
  );

  const code =
    changes.code === undefined ? existing.code : validateRequiredText(changes.code, "code");
  const name =
    changes.name === undefined ? existing.name : validateRequiredText(changes.name, "name");
  const status =
    changes.status === undefined ? existing.status : changes.status;
  if (status !== "active" && status !== "inactive") {
    throw new CatalogValidationError(`Invalid brand status: ${String(status)}`);
  }
  await assertBrandCodeAvailable(context, organizationId, code, brandId);

  const updated: Brand = {
    ...existing,
    code,
    name,
    status,
    updatedAt: nowIso(),
  };
  const saved = await context.brandRepository.updateBrand(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: referenceStatusAction(existing.status, saved.status),
    entityType: "brand",
    entityId: saved.id,
    detail: saved.code,
  });

  return saved;
}

export async function assertBrandCodeAvailable(
  context: CatalogContext,
  organizationId: string,
  code: string,
  excludeId: string | null
): Promise<void> {
  const existing = await context.brandRepository.findBrandByCode(
    organizationId,
    code
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(`Duplicate brand code: ${code}`);
  }
}

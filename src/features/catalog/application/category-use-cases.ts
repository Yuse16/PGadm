import type { CatalogContext } from "./catalog-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso, referenceStatusAction } from "./shared";
import type { CatalogActor, Category, CategoryDraft } from "../domain";
import {
  CATALOG_MANAGE,
  CATEGORY_MAX_DEPTH,
  CatalogValidationError,
  requireEntity,
  validateRequiredText,
} from "../domain";

export interface CreateCategoryInput {
  actor: CatalogActor;
  organizationId: string;
  category: CategoryDraft;
}

export async function createCategory(
  context: CatalogContext,
  input: CreateCategoryInput
): Promise<Category> {
  const { actor, organizationId, category } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const code = validateRequiredText(category.code, "code");
  const name = validateRequiredText(category.name, "name");
  await assertCategoryCodeAvailable(context, organizationId, code, null);

  if (category.parentId !== null) {
    await assertCategoryParent(context, organizationId, "new", category.parentId);
  }

  const createdAt = nowIso();
  const entity: Category = {
    id: newId(),
    organizationId,
    parentId: category.parentId,
    code,
    name,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  const created = await context.categoryRepository.insertCategory(entity);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "create",
    entityType: "category",
    entityId: created.id,
    detail: created.code,
  });

  return created;
}

export interface CategoryChanges {
  parentId?: string | null;
  code?: string;
  name?: string;
  status?: "active" | "inactive";
}

export interface UpdateCategoryInput {
  actor: CatalogActor;
  organizationId: string;
  categoryId: string;
  changes: CategoryChanges;
}

export async function updateCategory(
  context: CatalogContext,
  input: UpdateCategoryInput
): Promise<Category> {
  const { actor, organizationId, categoryId, changes } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await context.categoryRepository.findCategoryById(organizationId, categoryId),
    "category",
    categoryId
  );

  const code = changes.code === undefined ? existing.code : validateRequiredText(changes.code, "code");
  const name = changes.name === undefined ? existing.name : validateRequiredText(changes.name, "name");
  const status = changes.status === undefined ? existing.status : changes.status;
  if (status !== "active" && status !== "inactive") {
    throw new CatalogValidationError(`Invalid category status: ${String(status)}`);
  }
  await assertCategoryCodeAvailable(context, organizationId, code, categoryId);

  const parentId =
    changes.parentId === undefined ? existing.parentId : changes.parentId;
  if (parentId !== existing.parentId && parentId !== null) {
    await assertCategoryParent(context, organizationId, categoryId, parentId);
  }

  const updated: Category = {
    ...existing,
    parentId,
    code,
    name,
    status,
    updatedAt: nowIso(),
  };
  const saved = await context.categoryRepository.updateCategory(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: referenceStatusAction(existing.status, saved.status),
    entityType: "category",
    entityId: saved.id,
    detail: saved.code,
  });

  return saved;
}

export interface ArchiveCategoryInput {
  actor: CatalogActor;
  organizationId: string;
  categoryId: string;
}

export async function archiveCategory(
  context: CatalogContext,
  input: ArchiveCategoryInput
): Promise<Category> {
  const { actor, organizationId, categoryId } = input;
  actor.requirePermission(CATALOG_MANAGE);
  assertActorOrganization(actor, organizationId);

  const existing = requireEntity(
    await context.categoryRepository.findCategoryById(organizationId, categoryId),
    "category",
    categoryId
  );

  const updated: Category = { ...existing, status: "inactive", updatedAt: nowIso() };
  const saved = await context.categoryRepository.updateCategory(updated);

  await context.auditRepository.record({
    actorUserId: actor.userId,
    organizationId,
    action: "archive",
    entityType: "category",
    entityId: saved.id,
    detail: saved.code,
  });

  return saved;
}

export async function assertCategoryCodeAvailable(
  context: CatalogContext,
  organizationId: string,
  code: string,
  excludeId: string | null
): Promise<void> {
  const existing = await context.categoryRepository.findCategoryByCode(
    organizationId,
    code
  );
  if (existing !== null && existing.id !== excludeId) {
    throw new CatalogValidationError(`Duplicate category code: ${code}`);
  }
}

/**
 * Tree integrity (D-C01, `_catalog.enforce_category_tree`): no self-parent,
 * no cycles, max 3 levels, org-scoped.
 */
export async function assertCategoryParent(
  context: CatalogContext,
  organizationId: string,
  categoryId: string,
  parentId: string
): Promise<void> {
  if (parentId === categoryId) {
    throw new CatalogValidationError("Category cannot be its own parent");
  }
  const parent = await context.categoryRepository.findCategoryById(
    organizationId,
    parentId
  );
  if (parent === null) {
    throw new CatalogValidationError(
      `Invalid parent_id: category does not exist in organization ${organizationId}`
    );
  }

  let level = 1;
  let node: Category = parent;
  while (true) {
    if (node.id === categoryId) {
      throw new CatalogValidationError("Category tree cycle detected");
    }
    if (level >= CATEGORY_MAX_DEPTH) {
      throw new CatalogValidationError(
        `Category tree depth exceeds ${CATEGORY_MAX_DEPTH} levels`
      );
    }
    if (node.parentId === null) {
      return;
    }
    level += 1;
    const parentOf = await context.categoryRepository.findCategoryById(
      organizationId,
      node.parentId
    );
    if (parentOf === null) {
      throw new CatalogValidationError(
        `Invalid parent_id: category does not exist in organization ${organizationId}`
      );
    }
    node = parentOf;
  }
}

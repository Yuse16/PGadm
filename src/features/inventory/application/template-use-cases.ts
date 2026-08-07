import type { InventoryContext } from "./inventory-context";
import { assertActorOrganization } from "./guards";
import { newId, nowIso } from "./shared";
import type {
  ImportColumnMapping,
  ImportTemplate,
  InventoryActor,
  WarehouseRule,
} from "../domain";
import {
  INVENTORY_IMPORT,
  INVENTORY_READ,
  InventoryValidationError,
  normalizeOptionalText,
  requireInventoryEntity,
  validateRequiredText,
} from "../domain";

export interface CreateTemplateInput {
  actor: InventoryActor;
  organizationId: string;
  name: string;
  sheetName?: string | null;
  columnMapping: ImportColumnMapping;
  warehouseRules?: WarehouseRule[] | null;
}

export async function createTemplate(
  context: InventoryContext,
  input: CreateTemplateInput
): Promise<ImportTemplate> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_IMPORT);
  assertActorOrganization(actor, organizationId);

  const name = validateRequiredText(input.name, "name");
  const sheetName = normalizeOptionalText(input.sheetName, "sheet_name");
  const columnMapping = validateColumnMapping(input.columnMapping);

  const now = nowIso();
  const template: ImportTemplate = {
    id: newId(),
    organizationId,
    name,
    sheetName,
    columnMapping,
    warehouseRules: input.warehouseRules ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  return context.inventoryRepository.insertTemplate(template);
}

export interface UpdateTemplateInput {
  actor: InventoryActor;
  organizationId: string;
  templateId: string;
  name?: string;
  sheetName?: string | null;
  columnMapping?: ImportColumnMapping;
  warehouseRules?: WarehouseRule[] | null;
}

export async function updateTemplate(
  context: InventoryContext,
  input: UpdateTemplateInput
): Promise<ImportTemplate> {
  const { actor, organizationId, templateId } = input;
  actor.requirePermission(INVENTORY_IMPORT);
  assertActorOrganization(actor, organizationId);

  const current = requireInventoryEntity(
    await context.inventoryRepository.findTemplateById(organizationId, templateId),
    "import_template",
    templateId
  );

  const updated: ImportTemplate = {
    ...current,
    name: input.name !== undefined ? validateRequiredText(input.name, "name") : current.name,
    sheetName:
      input.sheetName !== undefined
        ? normalizeOptionalText(input.sheetName, "sheet_name")
        : current.sheetName,
    columnMapping:
      input.columnMapping !== undefined ? validateColumnMapping(input.columnMapping) : current.columnMapping,
    warehouseRules:
      input.warehouseRules !== undefined ? input.warehouseRules : current.warehouseRules,
    updatedAt: nowIso(),
  };
  return context.inventoryRepository.updateTemplate(updated);
}

export interface DeactivateTemplateInput {
  actor: InventoryActor;
  organizationId: string;
  templateId: string;
}

/**
 * Deactivates a template via status (soft deactivation, never a DELETE,
 * mirroring the DB: import_templates.status active|inactive).
 */
export async function deactivateTemplate(
  context: InventoryContext,
  input: DeactivateTemplateInput
): Promise<ImportTemplate> {
  const { actor, organizationId, templateId } = input;
  actor.requirePermission(INVENTORY_IMPORT);
  assertActorOrganization(actor, organizationId);

  const current = requireInventoryEntity(
    await context.inventoryRepository.findTemplateById(organizationId, templateId),
    "import_template",
    templateId
  );
  const updated: ImportTemplate = {
    ...current,
    status: "inactive",
    updatedAt: nowIso(),
  };
  return context.inventoryRepository.updateTemplate(updated);
}

export interface ListTemplatesInput {
  actor: InventoryActor;
  organizationId: string;
}

export async function listTemplates(
  context: InventoryContext,
  input: ListTemplatesInput
): Promise<ImportTemplate[]> {
  const { actor, organizationId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);
  return context.inventoryRepository.listTemplates(organizationId);
}

export interface GetTemplateInput {
  actor: InventoryActor;
  organizationId: string;
  templateId: string;
}

export async function getTemplate(
  context: InventoryContext,
  input: GetTemplateInput
): Promise<ImportTemplate> {
  const { actor, organizationId, templateId } = input;
  actor.requirePermission(INVENTORY_READ);
  assertActorOrganization(actor, organizationId);
  return requireInventoryEntity(
    await context.inventoryRepository.findTemplateById(organizationId, templateId),
    "import_template",
    templateId
  );
}

/**
 * Validates the column mapping (D-I07): `required` must be a non-empty list of
 * non-blank, trimmed file column names covering the four logical fields
 * (code/description/warehouse/existence). A file missing any required column
 * is never imported silently (IA-3).
 */
export function validateColumnMapping(mapping: ImportColumnMapping): ImportColumnMapping {
  if (typeof mapping !== "object" || mapping === null) {
    throw new InventoryValidationError("Invalid column_mapping: expected an object");
  }
  if (!Array.isArray(mapping.required) || mapping.required.length === 0) {
    throw new InventoryValidationError(
      "Invalid column_mapping.required: expected a non-empty list of required file columns (D-I07)"
    );
  }
  const required = mapping.required.map((column) =>
    validateRequiredText(column, "column_mapping.required")
  );
  const optional = (mapping.optional ?? []).map((column) =>
    validateRequiredText(column, "column_mapping.optional")
  );
  const uniqueRequired = new Set(required);
  if (uniqueRequired.size !== required.length) {
    throw new InventoryValidationError(
      "Invalid column_mapping.required: duplicate column names are not allowed"
    );
  }
  return { required, optional };
}

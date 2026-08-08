import { randomUUID } from "node:crypto";
import type { CatalogContext } from "./catalog-context";
import type {
  Brand,
  Category,
  ProductDraft,
  ProductLine,
  Unit,
  VariantDraft,
} from "../domain";
import {
  CatalogValidationError,
  normalizeOptionalText,
  assertNonNegativeNumber,
  assertNullablePositiveNumber,
  assertPositiveNumber,
  validateRequiredText,
  validateUnitKind,
} from "../domain";

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface NormalizedProductDraft {
  externalId: string | null;
  description: string;
  shortName: string | null;
  brandId: string | null;
  categoryId: string | null;
  lineId: string | null;
  technicalDescription: string | null;
}

/**
 * Validates the editable product DTO and confirms every reference belongs to
 * the same organization ("no referencias inválidas", D-C07/D-C08). Runs before
 * any repository write; the DB re-checks via composite FKs.
 */
export async function normalizeProductDraft(
  context: CatalogContext,
  organizationId: string,
  draft: ProductDraft
): Promise<NormalizedProductDraft> {
  const description = validateRequiredText(draft.description, "description");
  const externalId = normalizeOptionalText(draft.externalId, "external_id");
  const shortName = normalizeOptionalText(draft.shortName, "short_name");
  const technicalDescription = normalizeOptionalText(
    draft.technicalDescription,
    "technical_description"
  );

  if (draft.brandId !== null) {
    await requireReference<Brand>(
      context.brandRepository.findBrandById(organizationId, draft.brandId),
      "brand_id",
      organizationId
    );
  }
  if (draft.categoryId !== null) {
    await requireReference<Category>(
      context.categoryRepository.findCategoryById(organizationId, draft.categoryId),
      "category_id",
      organizationId
    );
  }
  if (draft.lineId !== null) {
    await requireReference<ProductLine>(
      context.productLineRepository.findProductLineById(organizationId, draft.lineId),
      "line_id",
      organizationId
    );
  }

  return {
    externalId,
    description,
    shortName,
    brandId: draft.brandId,
    categoryId: draft.categoryId,
    lineId: draft.lineId,
    technicalDescription,
  };
}

export async function requireReference<T>(
  promise: Promise<T | null>,
  field: string,
  organizationId: string
): Promise<T> {
  const value = await promise;
  if (value === null) {
    throw new CatalogValidationError(
      `Invalid ${field}: reference does not exist in organization ${organizationId}`
    );
  }
  return value;
}

export interface NormalizedVariantDraft {
  sku: string;
  displayName: string | null;
  format: string | null;
  finish: string | null;
  baseUnitId: string;
  saleUnitId: string;
  baseUnitsPerSaleUnit: number;
  piecesPerBox: number | null;
  squareMetersPerBox: number | null;
  referencePrice: number | null;
}

export async function normalizeVariantDraft(
  context: CatalogContext,
  organizationId: string,
  draft: VariantDraft
): Promise<NormalizedVariantDraft> {
  const sku = validateRequiredText(draft.sku, "sku");
  const displayName = normalizeOptionalText(draft.displayName, "display_name");
  const format = normalizeOptionalText(draft.format, "format");
  const finish = normalizeOptionalText(draft.finish, "finish");
  const baseUnitsPerSaleUnit = assertPositiveNumber(
    draft.baseUnitsPerSaleUnit,
    "base_units_per_sale_unit"
  );
  const piecesPerBox = assertNullablePositiveNumber(
    draft.piecesPerBox,
    "pieces_per_box"
  );
  const squareMetersPerBox = assertNullablePositiveNumber(
    draft.squareMetersPerBox,
    "square_meters_per_box"
  );
  const referencePrice = assertNonNegativeNumber(
    draft.referencePrice,
    "reference_price"
  );

  await requireReference<Unit>(
    context.unitRepository.findUnitById(organizationId, draft.baseUnitId),
    "base_unit_id",
    organizationId
  );
  await requireReference<Unit>(
    context.unitRepository.findUnitById(organizationId, draft.saleUnitId),
    "sale_unit_id",
    organizationId
  );

  return {
    sku,
    displayName,
    format,
    finish,
    baseUnitId: draft.baseUnitId,
    saleUnitId: draft.saleUnitId,
    baseUnitsPerSaleUnit,
    piecesPerBox,
    squareMetersPerBox,
    referencePrice,
  };
}

export function validateDraftUnitKind(kind: unknown): void {
  validateUnitKind(kind, "kind");
}

export type ReferenceStatusAction = "update" | "archive" | "restore";

/**
 * Auditable action for a reference-table status transition: inactive becomes
 * "archive", re-activation becomes "restore", anything else stays "update".
 */
export function referenceStatusAction(
  from: "active" | "inactive",
  to: "active" | "inactive"
): ReferenceStatusAction {
  if (from === "active" && to === "inactive") {
    return "archive";
  }
  if (from === "inactive" && to === "active") {
    return "restore";
  }
  return "update";
}

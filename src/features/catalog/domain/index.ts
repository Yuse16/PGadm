export {
  CatalogError,
  CatalogNotFoundError,
  CatalogValidationError,
  CatalogDataError,
  CatalogPermissionError,
  CatalogUnsupportedOperationError,
  RepositoryConfigurationError,
} from "./catalog-errors";
export { createCatalogActor, CatalogActorImpl } from "./actor";
export type { CatalogActor } from "./actor";
export {
  CATALOG_READ,
  CATALOG_CREATE,
  CATALOG_UPDATE,
  CATALOG_ARCHIVE,
  CATALOG_MANAGE,
  CATALOG_PERMISSIONS,
  isCatalogPermission,
} from "./catalog-permissions";
export type { CatalogPermission } from "./catalog-permissions";
export {
  PRODUCT_STATUSES,
  REFERENCE_STATUSES,
  isProductStatus,
  assertProductStatus,
  isReferenceStatus,
  assertReferenceStatus,
  validateRequiredText,
  normalizeOptionalText,
  assertPositiveNumber,
  assertNonNegativeNumber,
  assertNullablePositiveNumber,
} from "./status";
export type { ProductStatus, ReferenceStatus } from "./status";
export type { Product, ProductDraft, ProductListOptions } from "./product";
export type { Variant, VariantDraft } from "./variant";
export type { Barcode } from "./barcode";
export {
  CATEGORY_MAX_DEPTH,
} from "./category";
export type { Category, CategoryDraft } from "./category";
export type { Brand, BrandDraft } from "./brand";
export type { ProductLine, ProductLineDraft } from "./product-line";
export {
  UNIT_KINDS,
  isUnitKind,
  assertUnitKind,
  validateUnitKind,
} from "./unit";
export type { Unit, UnitDraft, UnitKind } from "./unit";
export { requireEntity } from "./catalog-repository";
export type {
  ProductRepository,
  CategoryRepository,
  BrandRepository,
  ProductLineRepository,
  UnitRepository,
} from "./catalog-repository";
export type {
  CatalogAuditAction,
  CatalogAuditEntityType,
  CatalogAuditEvent,
  CatalogAuditEventInput,
  CatalogAuditRepository,
} from "./audit";

export type { CatalogContext } from "./catalog-context";
export {
  requireCatalogPermission,
  requireCatalogRead,
  requireCatalogCreate,
  requireCatalogUpdate,
  requireCatalogArchive,
  requireCatalogManage,
  actorFromIdentitySession,
  assertActorOrganization,
} from "./guards";
export {
  newId,
  nowIso,
  normalizeProductDraft,
  normalizeVariantDraft,
  requireReference,
  validateDraftUnitKind,
  referenceStatusAction,
} from "./shared";
export type {
  NormalizedProductDraft,
  NormalizedVariantDraft,
  ReferenceStatusAction,
} from "./shared";

export {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  getProduct,
  listProducts,
  searchProducts,
  requireActiveVariant,
} from "./product-use-cases";
export type {
  ProductWithVariants,
  CreateProductInput,
  UpdateProductInput,
  ArchiveProductInput,
  RestoreProductInput,
  GetProductInput,
  ListProductsInput,
  SearchProductsInput,
} from "./product-use-cases";

export {
  createVariant,
  updateVariant,
  archiveVariant,
  restoreVariant,
} from "./variant-use-cases";
export type {
  CreateVariantInput,
  UpdateVariantInput,
  ArchiveVariantInput,
  RestoreVariantInput,
} from "./variant-use-cases";

export {
  addBarcode,
  changePrimaryBarcode,
  removeBarcode,
} from "./barcode-use-cases";
export type {
  AddBarcodeInput,
  ChangePrimaryBarcodeInput,
  RemoveBarcodeInput,
} from "./barcode-use-cases";

export {
  createCategory,
  updateCategory,
  archiveCategory,
} from "./category-use-cases";
export type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ArchiveCategoryInput,
  CategoryChanges,
} from "./category-use-cases";

export { createBrand, updateBrand } from "./brand-use-cases";
export type {
  CreateBrandInput,
  UpdateBrandInput,
  BrandChanges,
} from "./brand-use-cases";

export {
  createProductLine,
  updateProductLine,
} from "./product-line-use-cases";
export type {
  CreateProductLineInput,
  UpdateProductLineInput,
  ProductLineChanges,
} from "./product-line-use-cases";

export { createUnit, updateUnit } from "./unit-use-cases";
export type {
  CreateUnitInput,
  UpdateUnitInput,
  UnitChanges,
} from "./unit-use-cases";

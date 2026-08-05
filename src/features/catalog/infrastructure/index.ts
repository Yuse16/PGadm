export {
  DemoProductRepository,
  DemoCategoryRepository,
  DemoBrandRepository,
  DemoProductLineRepository,
  DemoUnitRepository,
  assertDemoNotNull,
} from "./demo-catalog-repository";
export { NoopCatalogAuditRepository } from "./noop-catalog-audit-repository";
export {
  SupabaseProductRepository,
  SupabaseCategoryRepository,
  SupabaseBrandRepository,
  SupabaseProductLineRepository,
  SupabaseUnitRepository,
} from "./supabase-catalog-repository";
export {
  CATALOG_DATA_SOURCES,
  CATALOG_DATA_SOURCE_LABELS,
  resolveCatalogDataSource,
  getCatalogDataSource,
  createCatalogRepositories,
  createCatalogContext,
} from "./repository-selection";
export type {
  CatalogDataSource,
  CatalogRepositories,
} from "./repository-selection";
export {
  mapProduct,
  mapVariant,
  mapBarcode,
  mapCategory,
  mapBrand,
  mapProductLine,
  mapUnit,
} from "./mappers";

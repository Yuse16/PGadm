import type {
  BrandRepository,
  CatalogAuditRepository,
  CategoryRepository,
  ProductLineRepository,
  ProductRepository,
  UnitRepository,
} from "../domain";

/**
 * Shared dependency container for catalog use cases. Injected (never imported
 * globally) so tests can pass in-memory fakes; the production wiring lives in
 * `infrastructure/index.ts` and is selected deterministically by
 * `CATALOG_DATA_SOURCE` (D031: no silent fallback after a failed read).
 */
export interface CatalogContext {
  productRepository: ProductRepository;
  categoryRepository: CategoryRepository;
  brandRepository: BrandRepository;
  productLineRepository: ProductLineRepository;
  unitRepository: UnitRepository;
  auditRepository: CatalogAuditRepository;
}

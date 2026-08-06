import type {
  BrandRepository,
  CatalogAuditRepository,
  CategoryRepository,
  ProductLineRepository,
  ProductRepository,
  UnitRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import type { CatalogContext } from "../application";
import {
  DemoBrandRepository,
  DemoCategoryRepository,
  DemoProductLineRepository,
  DemoProductRepository,
  DemoUnitRepository,
} from "./demo-catalog-repository";
import { NoopCatalogAuditRepository } from "./noop-catalog-audit-repository";
import {
  SupabaseBrandRepository,
  SupabaseCategoryRepository,
  SupabaseProductLineRepository,
  SupabaseProductRepository,
  SupabaseUnitRepository,
} from "./supabase-catalog-repository";
import { SupabaseCatalogAuditRepository } from "./supabase-catalog-audit-repository";

export const CATALOG_DATA_SOURCES = ["demo", "supabase"] as const;
export type CatalogDataSource = (typeof CATALOG_DATA_SOURCES)[number];

export const CATALOG_DATA_SOURCE_LABELS: Record<CatalogDataSource, string> = {
  demo: "Datos demo locales",
  supabase: "Base de datos",
};

/**
 * Phase 1C.3 default is "demo" (in-code fixtures / fakes), mirroring the
 * organization feature. The selection is deterministic: `CATALOG_DATA_SOURCE`
 * env var, or the documented default. It is never a silent runtime fallback
 * after a failed read (D031).
 */
const DEFAULT_DATA_SOURCE: CatalogDataSource = "demo";

export function resolveCatalogDataSource(
  value: string | undefined
): CatalogDataSource {
  if (value === "demo" || value === "supabase") {
    return value;
  }
  if (value === undefined || value === "") {
    return DEFAULT_DATA_SOURCE;
  }
  throw new RepositoryConfigurationError(
    `Invalid CATALOG_DATA_SOURCE "${value}". Expected one of: ${CATALOG_DATA_SOURCES.join(", ")}`
  );
}

export function getCatalogDataSource(): CatalogDataSource {
  return resolveCatalogDataSource(process.env.CATALOG_DATA_SOURCE);
}

export interface CatalogRepositories {
  productRepository: ProductRepository;
  categoryRepository: CategoryRepository;
  brandRepository: BrandRepository;
  productLineRepository: ProductLineRepository;
  unitRepository: UnitRepository;
  auditRepository: CatalogAuditRepository;
}

/**
 * Builds the full repository set for one data source. There is no partial
 * wiring: demo uses in-memory fakes, supabase uses the RLS-scoped clients.
 */
export function createCatalogRepositories(
  source: CatalogDataSource = getCatalogDataSource()
): CatalogRepositories {
  if (source === "demo") {
    return {
      productRepository: new DemoProductRepository(),
      categoryRepository: new DemoCategoryRepository(),
      brandRepository: new DemoBrandRepository(),
      productLineRepository: new DemoProductLineRepository(),
      unitRepository: new DemoUnitRepository(),
      auditRepository: new NoopCatalogAuditRepository(),
    };
  }
  return {
    productRepository: new SupabaseProductRepository(),
    categoryRepository: new SupabaseCategoryRepository(),
    brandRepository: new SupabaseBrandRepository(),
    productLineRepository: new SupabaseProductLineRepository(),
    unitRepository: new SupabaseUnitRepository(),
    auditRepository: new SupabaseCatalogAuditRepository(),
  };
}

export function createCatalogContext(
  source: CatalogDataSource = getCatalogDataSource()
): CatalogContext {
  return createCatalogRepositories(source);
}

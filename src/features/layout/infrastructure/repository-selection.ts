import type {
  LayoutAuditRepository,
  LayoutReferenceCatalog,
  LayoutRepository,
  LayoutStockProvider,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import type { LayoutContext } from "../application";
import { DemoLayoutRepository } from "./demo-layout-repository";
import { DemoLayoutReferenceCatalog } from "./demo-layout-reference-catalog";
import { DemoLayoutStockProvider } from "./demo-layout-stock-provider";
import { NoopLayoutAuditRepository } from "./noop-layout-audit-repository";
import { SupabaseLayoutAuditRepository } from "./supabase-layout-audit-repository";
import { SupabaseLayoutReferenceCatalog } from "./supabase-layout-reference-catalog";
import { SupabaseLayoutRepository } from "./supabase-layout-repository";
import { SupabaseLayoutStockProvider } from "./supabase-layout-stock-provider";

export const LAYOUT_DATA_SOURCES = ["demo", "supabase"] as const;
export type LayoutDataSource = (typeof LAYOUT_DATA_SOURCES)[number];

export const LAYOUT_DATA_SOURCE_LABELS: Record<LayoutDataSource, string> = {
  demo: "Datos demo locales",
  supabase: "Base de datos",
};

/**
 * 3.3 default is "demo" (in-code fixtures mirroring `supabase/seed.sql`),
 * matching the catalog/inventory features. The selection is deterministic:
 * `LAYOUT_DATA_SOURCE` env var, or the documented default. It is never a
 * silent runtime fallback after a failed read (D-L11/D031).
 */
const DEFAULT_DATA_SOURCE: LayoutDataSource = "demo";

export function resolveLayoutDataSource(
  value: string | undefined
): LayoutDataSource {
  if (value === "demo" || value === "supabase") {
    return value;
  }
  if (value === undefined || value === "") {
    return DEFAULT_DATA_SOURCE;
  }
  throw new RepositoryConfigurationError(
    `Invalid LAYOUT_DATA_SOURCE "${value}". Expected one of: ${LAYOUT_DATA_SOURCES.join(", ")}`
  );
}

export function getLayoutDataSource(): LayoutDataSource {
  return resolveLayoutDataSource(process.env.LAYOUT_DATA_SOURCE);
}

export interface LayoutRepositories {
  layoutRepository: LayoutRepository;
  auditRepository: LayoutAuditRepository;
  referenceCatalog: LayoutReferenceCatalog;
  stockProvider: LayoutStockProvider;
}

/**
 * Builds the full repository set for one data source. There is no partial
 * wiring: demo uses in-memory fakes seeded with the 3.2 fixtures; supabase
 * uses the RLS-scoped clients against the migration 011 schema.
 */
export function createLayoutRepositories(
  source: LayoutDataSource = getLayoutDataSource()
): LayoutRepositories {
  if (source === "demo") {
    return {
      layoutRepository: new DemoLayoutRepository(),
      auditRepository: new NoopLayoutAuditRepository(),
      referenceCatalog: new DemoLayoutReferenceCatalog(),
      stockProvider: new DemoLayoutStockProvider(),
    };
  }
  return {
    layoutRepository: new SupabaseLayoutRepository(),
    auditRepository: new SupabaseLayoutAuditRepository(),
    referenceCatalog: new SupabaseLayoutReferenceCatalog(),
    stockProvider: new SupabaseLayoutStockProvider(),
  };
}

export function createLayoutContext(
  source: LayoutDataSource = getLayoutDataSource()
): LayoutContext {
  return createLayoutRepositories(source);
}

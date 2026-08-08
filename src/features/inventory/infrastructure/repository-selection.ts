import type {
  InventoryAuditRepository,
  InventoryReferenceCatalog,
  InventoryRepository,
} from "../domain";
import { RepositoryConfigurationError } from "../domain";
import type { InventoryContext } from "../application";
import { DemoInventoryRepository } from "./demo-inventory-repository";
import { DemoInventoryReferenceCatalog } from "./demo-inventory-reference-catalog";
import { NoopInventoryAuditRepository } from "./noop-inventory-audit-repository";
import { SupabaseInventoryAuditRepository } from "./supabase-inventory-audit-repository";
import { SupabaseInventoryReferenceCatalog } from "./supabase-inventory-reference-catalog";
import { SupabaseInventoryRepository } from "./supabase-inventory-repository";

export const INVENTORY_DATA_SOURCES = ["demo", "supabase"] as const;
export type InventoryDataSource = (typeof INVENTORY_DATA_SOURCES)[number];

export const INVENTORY_DATA_SOURCE_LABELS: Record<InventoryDataSource, string> = {
  demo: "Datos demo locales",
  supabase: "Base de datos",
};

/**
 * 1D.3 default is "demo" (in-code fixtures mirroring `supabase/seed.sql`),
 * matching the catalog and organization features. The selection is
 * deterministic: `INVENTORY_DATA_SOURCE` env var, or the documented default.
 * It is never a silent runtime fallback after a failed read (D-I12/D031).
 */
const DEFAULT_DATA_SOURCE: InventoryDataSource = "demo";

export function resolveInventoryDataSource(
  value: string | undefined
): InventoryDataSource {
  if (value === "demo" || value === "supabase") {
    return value;
  }
  if (value === undefined || value === "") {
    return DEFAULT_DATA_SOURCE;
  }
  throw new RepositoryConfigurationError(
    `Invalid INVENTORY_DATA_SOURCE "${value}". Expected one of: ${INVENTORY_DATA_SOURCES.join(", ")}`
  );
}

export function getInventoryDataSource(): InventoryDataSource {
  return resolveInventoryDataSource(process.env.INVENTORY_DATA_SOURCE);
}

export interface InventoryRepositories {
  inventoryRepository: InventoryRepository;
  auditRepository: InventoryAuditRepository;
  referenceCatalog: InventoryReferenceCatalog;
}

/**
 * Builds the full repository set for one data source. There is no partial
 * wiring: demo uses in-memory fakes seeded with the 1D.2 fixtures; supabase
 * uses the RLS-scoped clients against the migration 010 schema.
 */
export function createInventoryRepositories(
  source: InventoryDataSource = getInventoryDataSource()
): InventoryRepositories {
  if (source === "demo") {
    return {
      inventoryRepository: new DemoInventoryRepository(),
      auditRepository: new NoopInventoryAuditRepository(),
      referenceCatalog: new DemoInventoryReferenceCatalog(),
    };
  }
  return {
    inventoryRepository: new SupabaseInventoryRepository(),
    auditRepository: new SupabaseInventoryAuditRepository(),
    referenceCatalog: new SupabaseInventoryReferenceCatalog(),
  };
}

export function createInventoryContext(
  source: InventoryDataSource = getInventoryDataSource()
): InventoryContext {
  return createInventoryRepositories(source);
}

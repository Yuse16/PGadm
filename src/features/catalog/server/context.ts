import { createCatalogContext, getCatalogDataSource } from "@/features/catalog/infrastructure";
import type { CatalogContext } from "@/features/catalog/application";
import { seedDemoCatalog } from "./demo-seed";

/**
 * Server-side catalog context for the UI.
 *
 * - `CATALOG_DATA_SOURCE=supabase`: a fresh context per call (stateless, the
 *   repositories talk to the RLS-scoped database).
 * - `CATALOG_DATA_SOURCE=demo` (default): a module-level singleton seeded with
 *   the PGM fixtures so the UI keeps working across requests during the dev
 *   server lifetime. The demo repositories themselves are unchanged; the seed
 *   only pushes rows through their insert API.
 */
let demoContextPromise: Promise<CatalogContext> | null = null;

function createDemoContext(): Promise<CatalogContext> {
  if (demoContextPromise === null) {
    demoContextPromise = (async () => {
      const context = createCatalogContext("demo");
      await seedDemoCatalog(context);
      return context;
    })();
  }
  return demoContextPromise;
}

export function getCatalogContext(): Promise<CatalogContext> {
  if (getCatalogDataSource() !== "demo") {
    return Promise.resolve(createCatalogContext("supabase"));
  }
  return createDemoContext();
}

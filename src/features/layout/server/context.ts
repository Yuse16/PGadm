import {
  createLayoutContext,
  getLayoutDataSource,
} from "@/features/layout/infrastructure";
import type { LayoutContext } from "@/features/layout/application";

/**
 * Server-side layout context for the UI.
 *
 * - `LAYOUT_DATA_SOURCE=supabase`: a fresh context per call (stateless, the
 *   repositories talk to the RLS-scoped database).
 * - `LAYOUT_DATA_SOURCE=demo` (default): a module-level singleton. The demo
 *   repositories are seeded in-memory with the 3.2 fixtures (mirroring the
 *   `supabase/seed.sql` layout rows), so the UI keeps working across requests
 *   during the dev server lifetime.
 */
let demoContextPromise: Promise<LayoutContext> | null = null;

function createDemoContext(): Promise<LayoutContext> {
  if (demoContextPromise === null) {
    demoContextPromise = Promise.resolve(createLayoutContext("demo"));
  }
  return demoContextPromise;
}

export function getLayoutContext(): Promise<LayoutContext> {
  if (getLayoutDataSource() !== "demo") {
    return Promise.resolve(createLayoutContext("supabase"));
  }
  return createDemoContext();
}

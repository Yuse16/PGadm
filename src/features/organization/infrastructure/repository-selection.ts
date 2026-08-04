import type { OrganizationRepository } from "../domain";
import { RepositoryConfigurationError } from "../domain";
import { DemoOrganizationRepository } from "./demo-organization-repository";
import { SupabaseOrganizationRepository } from "./supabase-organization-repository";

export const ORGANIZATION_DATA_SOURCES = ["demo", "supabase"] as const;
export type OrganizationDataSource = (typeof ORGANIZATION_DATA_SOURCES)[number];

export const ORGANIZATION_DATA_SOURCE_LABELS: Record<OrganizationDataSource, string> = {
  demo: "Datos demo locales",
  supabase: "Base de datos",
};

/**
 * Phase 1B.3D-2 explicit decision (D20 / decision log): the default data source
 * stays "demo" (in-code fixtures). "supabase" is now functional — migration
 * 007 enables RLS on the organization tables and grants authenticated SELECT
 * scoped to the session's active organizations — but flipping the default is an
 * ops decision documented in AGENT_STATE/1B.3D-2.
 *
 * The selection is deterministic: `ORGANIZATION_DATA_SOURCE` env var, or the
 * documented default. It is never a silent runtime fallback after a failed read.
 */
const DEFAULT_DATA_SOURCE: OrganizationDataSource = "demo";

export function resolveOrganizationDataSource(
  value: string | undefined
): OrganizationDataSource {
  if (value === "demo" || value === "supabase") {
    return value;
  }
  if (value === undefined || value === "") {
    return DEFAULT_DATA_SOURCE;
  }
  throw new RepositoryConfigurationError(
    `Invalid ORGANIZATION_DATA_SOURCE "${value}". Expected one of: ${ORGANIZATION_DATA_SOURCES.join(", ")}`
  );
}

export function getOrganizationDataSource(): OrganizationDataSource {
  return resolveOrganizationDataSource(process.env.ORGANIZATION_DATA_SOURCE);
}

export function createOrganizationRepository(
  source: OrganizationDataSource = getOrganizationDataSource()
): OrganizationRepository {
  if (source === "demo") {
    return new DemoOrganizationRepository();
  }
  return new SupabaseOrganizationRepository();
}

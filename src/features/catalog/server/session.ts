import type { CatalogContext } from "@/features/catalog/application";
import { actorFromIdentitySession, requireCatalogRead } from "@/features/catalog/application";
import type { CatalogPermissions } from "../components/permissions";
import type { CatalogActor } from "@/features/catalog/domain";
import { CatalogPermissionError } from "@/features/catalog/domain";
import type { IdentitySession } from "@/features/identity/domain";
import { getCatalogContext } from "./context";

export interface CatalogSessionAccess {
  session: IdentitySession;
  actor: CatalogActor;
  organizationId: string;
  context: CatalogContext;
  permissions: CatalogPermissions;
}

/**
 * Single server-side entry point for catalog pages: runs the read guard
 * (redirects when unauthenticated/forbidden), resolves the org-scoped actor,
 * and derives the UI permission flags from the RLS-scoped session. Server
 * actions re-guard on every mutation, so these flags only affect what is
 * shown, never what is allowed.
 */
export async function requireCatalogSession(): Promise<CatalogSessionAccess> {
  const session = await requireCatalogRead();
  const actor = actorFromIdentitySession(session);
  const organizationId = session.organizationId;
  if (organizationId === null) {
    throw new CatalogPermissionError("catalog.read");
  }
  const context = await getCatalogContext();
  return {
    session,
    actor,
    organizationId,
    context,
    permissions: permissionsFromSession(session),
  };
}

export function permissionsFromSession(session: IdentitySession): CatalogPermissions {
  const codes = new Set(session.permissions.map((permission) => permission.code));
  return {
    canCreate: codes.has("catalog.create"),
    canUpdate: codes.has("catalog.update"),
    canArchive: codes.has("catalog.archive"),
    canManage: codes.has("catalog.manage"),
  };
}

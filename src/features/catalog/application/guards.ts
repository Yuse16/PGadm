import type { IdentitySession } from "@/features/identity/domain";
import { requirePermission } from "@/features/identity/application";
import type { CatalogActor } from "../domain";
import { CatalogPermissionError, createCatalogActor } from "../domain";

/**
 * Server-side catalog guards. Reuse the existing identity guards
 * (F1B3D-2): authorization is decided server-side from the RLS-scoped session,
 * never from client payloads.
 */
export async function requireCatalogPermission(
  permissionCode: string
): Promise<IdentitySession> {
  return requirePermission(permissionCode);
}

export function requireCatalogRead(): Promise<IdentitySession> {
  return requirePermission("catalog.read");
}

export function requireCatalogCreate(): Promise<IdentitySession> {
  return requirePermission("catalog.create");
}

export function requireCatalogUpdate(): Promise<IdentitySession> {
  return requirePermission("catalog.update");
}

export function requireCatalogArchive(): Promise<IdentitySession> {
  return requirePermission("catalog.archive");
}

export function requireCatalogManage(): Promise<IdentitySession> {
  return requirePermission("catalog.manage");
}

/**
 * Builds a CatalogActor from an RLS-scoped identity session. Requires an
 * active organization context; every catalog operation is org-scoped (D-C07).
 */
export function actorFromIdentitySession(
  session: IdentitySession
): CatalogActor {
  if (session.organizationId === null) {
    throw new CatalogPermissionError("catalog.read");
  }
  return createCatalogActor({
    userId: session.user.id,
    organizationId: session.organizationId,
    permissions: session.permissions.map((permission) => permission.code),
  });
}

/** Catalog operations only ever run inside the actor's own organization. */
export function assertActorOrganization(
  actor: CatalogActor,
  organizationId: string
): void {
  if (actor.organizationId !== organizationId) {
    throw new CatalogPermissionError(`catalog scoped to ${actor.organizationId}`);
  }
}

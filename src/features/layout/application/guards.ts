import type { IdentitySession } from "@/features/identity/domain";
import { requirePermission } from "@/features/identity/application";
import type { LayoutActor } from "../domain";
import { LayoutPermissionError, createLayoutActor } from "../domain";

/**
 * Server-side layout guards. Reuse the existing identity guards
 * (F1B3D-2): authorization is decided server-side from the RLS-scoped session,
 * never from client payloads.
 */
export async function requireLayoutPermission(
  permissionCode: string
): Promise<IdentitySession> {
  return requirePermission(permissionCode);
}

export function requireLayoutRead(): Promise<IdentitySession> {
  return requirePermission("layout.read");
}

export function requireLayoutEdit(): Promise<IdentitySession> {
  return requirePermission("layout.edit");
}

export function requireLayoutPublish(): Promise<IdentitySession> {
  return requirePermission("layout.publish");
}

export function requireLayoutManage(): Promise<IdentitySession> {
  return requirePermission("layout.manage");
}

/**
 * Builds a LayoutActor from an RLS-scoped identity session. Requires an
 * active organization context; every layout operation is org-scoped (D-C07).
 */
export function layoutActorFromIdentitySession(
  session: IdentitySession
): LayoutActor {
  if (session.organizationId === null) {
    throw new LayoutPermissionError("layout.read");
  }
  return createLayoutActor({
    userId: session.user.id,
    organizationId: session.organizationId,
    permissions: session.permissions.map((permission) => permission.code),
  });
}

/** Layout operations only ever run inside the actor's own organization. */
export function assertActorOrganization(
  actor: LayoutActor,
  organizationId: string
): void {
  if (actor.organizationId !== organizationId) {
    throw new LayoutPermissionError(`layout scoped to ${actor.organizationId}`);
  }
}

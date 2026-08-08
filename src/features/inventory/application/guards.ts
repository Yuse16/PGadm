import type { IdentitySession } from "@/features/identity/domain";
import { requirePermission } from "@/features/identity/application";
import type { InventoryActor } from "../domain";
import { InventoryPermissionError, createInventoryActor } from "../domain";

/**
 * Server-side inventory guards. Reuse the existing identity guards
 * (F1B3D-2): authorization is decided server-side from the RLS-scoped session,
 * never from client payloads.
 */
export async function requireInventoryPermission(
  permissionCode: string
): Promise<IdentitySession> {
  return requirePermission(permissionCode);
}

export function requireInventoryRead(): Promise<IdentitySession> {
  return requirePermission("inventory.read");
}

export function requireInventoryImport(): Promise<IdentitySession> {
  return requirePermission("inventory.import");
}

export function requireInventoryApprove(): Promise<IdentitySession> {
  return requirePermission("inventory.approve");
}

export function requireInventoryObserve(): Promise<IdentitySession> {
  return requirePermission("inventory.observe");
}

/**
 * Builds an InventoryActor from an RLS-scoped identity session. Requires an
 * active organization context; every inventory operation is org-scoped (D-C07).
 */
export function inventoryActorFromIdentitySession(
  session: IdentitySession
): InventoryActor {
  if (session.organizationId === null) {
    throw new InventoryPermissionError("inventory.read");
  }
  return createInventoryActor({
    userId: session.user.id,
    organizationId: session.organizationId,
    permissions: session.permissions.map((permission) => permission.code),
  });
}

/** Inventory operations only ever run inside the actor's own organization. */
export function assertActorOrganization(
  actor: InventoryActor,
  organizationId: string
): void {
  if (actor.organizationId !== organizationId) {
    throw new InventoryPermissionError(`inventory scoped to ${actor.organizationId}`);
  }
}

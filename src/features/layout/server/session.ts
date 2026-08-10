import type { LayoutContext } from "@/features/layout/application";
import {
  layoutActorFromIdentitySession,
  requireLayoutRead,
} from "@/features/layout/application";
import { LayoutPermissionError } from "@/features/layout/domain";
import type { LayoutActor } from "@/features/layout/domain";
import type { IdentitySession } from "@/features/identity/domain";
import { getLayoutContext } from "./context";

export interface LayoutPermissions {
  canEdit: boolean;
  canPublish: boolean;
  canManage: boolean;
}

export interface LayoutSessionAccess {
  session: IdentitySession;
  actor: LayoutActor;
  organizationId: string;
  context: LayoutContext;
  permissions: LayoutPermissions;
}

/**
 * Single server-side entry point for layout pages: runs the read guard
 * (redirects when unauthenticated/forbidden), resolves the org-scoped actor,
 * and derives the UI permission flags from the RLS-scoped session. Server
 * actions re-guard on every mutation, so these flags only affect what is
 * shown, never what is allowed.
 */
export async function requireLayoutSession(): Promise<LayoutSessionAccess> {
  const session = await requireLayoutRead();
  const actor = layoutActorFromIdentitySession(session);
  const organizationId = session.organizationId;
  if (organizationId === null) {
    throw new LayoutPermissionError("layout.read");
  }
  const context = await getLayoutContext();
  return {
    session,
    actor,
    organizationId,
    context,
    permissions: permissionsFromSession(session),
  };
}

export function permissionsFromSession(session: IdentitySession): LayoutPermissions {
  const codes = new Set(session.permissions.map((permission) => permission.code));
  return {
    canEdit: codes.has("layout.edit"),
    canPublish: codes.has("layout.publish"),
    canManage: codes.has("layout.manage"),
  };
}

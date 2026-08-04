import { redirect } from "next/navigation";
import type { IdentitySession } from "@/features/identity/domain";
import { getIdentitySession } from "./session";

/**
 * Server-side guards (Phase 1B.3D-2). Authorization is decided on the server
 * from the RLS-scoped session; the client never supplies org/role claims
 * (F1B3_DECISION_MATRIX D12/D13, ACC-17).
 */
export async function requireIdentity(): Promise<IdentitySession> {
  const session = await getIdentitySession();
  if (session === null) {
    redirect("/login");
  }
  return session;
}

export async function requirePermission(
  permissionCode: string
): Promise<IdentitySession> {
  const session = await requireIdentity();
  const granted = session.permissions.some(
    (permission) => permission.code === permissionCode
  );
  if (!granted) {
    redirect("/unauthorized?reason=forbidden");
  }
  return session;
}

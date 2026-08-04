import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/schemas/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseIdentityRepository } from "@/features/identity/infrastructure";
import type { Database } from "@/types/database";
import type {
  IdentitySession,
  UserPermission,
  UserRoleSummary,
} from "@/features/identity/domain";

/**
 * Result of composing an identity session server-side. Authorization is
 * resolved from the database (RLS + effective-permissions RPC), never from
 * client payloads (F1B3_DECISION_MATRIX D12/D13, ACC-17).
 */
export type IdentityResolution =
  | { readonly status: "authenticated"; readonly session: IdentitySession }
  | { readonly status: "unauthenticated" }
  | { readonly status: "inactive" }
  | { readonly status: "error"; readonly message: string };

function decodeJwtTimes(
  token: string | undefined
): { issuedAt: string; expiresAt: string | null } {
  if (!token) {
    return { issuedAt: new Date().toISOString(), expiresAt: null };
  }
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")
    );
    const expiresAt =
      typeof payload.exp === "number"
        ? new Date(payload.exp * 1000).toISOString()
        : null;
    const issuedAt =
      typeof payload.iat === "number"
        ? new Date(payload.iat * 1000).toISOString()
        : new Date().toISOString();
    return { issuedAt, expiresAt };
  } catch {
    return { issuedAt: new Date().toISOString(), expiresAt: null };
  }
}

export async function resolveIdentitySession(
  client?: SupabaseClient<Database>
): Promise<IdentityResolution> {
  if (!hasSupabaseConfig()) {
    return { status: "unauthenticated" };
  }

  try {
    const supabase = client ?? (await createSupabaseServerClient());

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !user) {
      return { status: "unauthenticated" };
    }

    const repository = new SupabaseIdentityRepository(supabase);
    const profile = await repository.getProfile(user.id);
    if (!profile) {
      return { status: "unauthenticated" };
    }
    if (profile.status !== "active") {
      return { status: "inactive" };
    }

    const memberships = (await repository.getMemberships(user.id)).filter(
      (membership) => membership.status === "active"
    );
    const organizationId =
      memberships.length > 0 ? memberships[0].organizationId : null;

    let organizationName: string | null = null;
    if (organizationId !== null) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", organizationId)
        .maybeSingle();
      organizationName = org?.name ?? null;
    }

    const now = Date.now();
    const validAssignments = (organizationId
      ? await repository.getUserAssignments(organizationId, user.id)
      : []
    ).filter(
      (assignment) =>
        assignment.status === "active" &&
        assignment.validFrom.getTime() <= now &&
        (assignment.validTo === null || assignment.validTo.getTime() > now)
    );

    const roleCatalog = organizationId
      ? await repository.getRoles(organizationId)
      : [];
    const activeRoles = roleCatalog.filter((role) => role.status === "active");
    const roleById = new Map(activeRoles.map((role) => [role.id, role]));

    const roles: UserRoleSummary[] = validAssignments
      .filter((assignment) => roleById.has(assignment.roleId))
      .map((assignment) => {
        const role = roleById.get(assignment.roleId)!;
        return {
          code: role.code,
          name: role.name,
          organizationId: role.organizationId,
          branchId: assignment.branchId,
        };
      });

    const branchIds = Array.from(
      new Set(
        validAssignments
          .map((assignment) => assignment.branchId)
          .filter((branchId): branchId is string => branchId !== null)
      )
    ).sort();

    let branchName: string | null = null;
    if (branchIds.length > 0) {
      const { data: branches } = await supabase
        .from("branches")
        .select("id, name")
        .in("id", branchIds);
      const branch = branches?.find((row) => row.id === branchIds[0]) ?? null;
      branchName = branch?.name ?? null;
    }

    const { data: permissionRows } = await supabase.rpc(
      "current_user_permissions"
    );
    const permissions: UserPermission[] = (permissionRows ?? []).map((row) => ({
      code: row.code,
      description: row.description,
    }));

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { issuedAt, expiresAt } = decodeJwtTimes(session?.access_token);

    return {
      status: "authenticated",
      session: {
        user: {
          id: user.id,
          email: user.email ?? profile.email ?? "",
          fullName: profile.fullName,
          status: profile.status,
        },
        organizationId,
        organizationName,
        branchId: branchIds.length > 0 ? branchIds[0] : null,
        branchName,
        roles,
        permissions,
        issuedAt,
        expiresAt,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Error desconocido al resolver la sesión",
    };
  }
}

export async function getIdentitySession(): Promise<IdentitySession | null> {
  const resolution = await resolveIdentitySession();
  return resolution.status === "authenticated" ? resolution.session : null;
}

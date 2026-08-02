/**
 * Pure authorization view contracts for identity UI.
 * No React, no Supabase, no privilege escalation helpers.
 */

import type { SessionError } from "./errors";

export interface UserPermission {
  readonly code: string;
  readonly description: string | null;
}

export interface UserRoleSummary {
  readonly code: string;
  readonly name: string;
  readonly organizationId: string | null;
  readonly branchId: string | null;
}

export type AuthorizationState =
  | { readonly status: "loading" }
  | { readonly status: "unauthenticated" }
  | {
      readonly status: "authenticated";
      readonly roles: readonly UserRoleSummary[];
      readonly permissions: readonly UserPermission[];
    }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "inactive"; readonly message: string }
  | { readonly status: "expired"; readonly message: string }
  | { readonly status: "error"; readonly error: SessionError };

export function hasPermission(
  state: AuthorizationState,
  permissionCode: string
): boolean {
  if (state.status !== "authenticated") {
    return false;
  }
  return state.permissions.some((permission) => permission.code === permissionCode);
}

export function hasRole(state: AuthorizationState, roleCode: string): boolean {
  if (state.status !== "authenticated") {
    return false;
  }
  return state.roles.some((role) => role.code === roleCode);
}

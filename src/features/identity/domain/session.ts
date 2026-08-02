/**
 * Pure session contracts for identity UI and future auth integration.
 * No React, no Supabase, no credentials storage.
 */

import type { UserPermission, UserRoleSummary } from "./authorization";
import type { SessionError } from "./errors";

export type { SessionError };

export const SESSION_STATUSES = [
  "loading",
  "unauthenticated",
  "authenticated",
  "expired",
  "inactive",
  "forbidden",
  "error",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly status: "active" | "inactive";
}

export interface IdentitySession {
  readonly user: AuthenticatedUser;
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly branchId: string | null;
  readonly branchName: string | null;
  readonly roles: readonly UserRoleSummary[];
  readonly permissions: readonly UserPermission[];
  readonly issuedAt: string;
  readonly expiresAt: string | null;
}

export type SessionState =
  | { readonly status: "loading" }
  | { readonly status: "unauthenticated" }
  | { readonly status: "authenticated"; readonly session: IdentitySession }
  | { readonly status: "expired"; readonly message: string }
  | { readonly status: "inactive"; readonly message: string }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly error: SessionError };

export function isSessionStatus(value: string): value is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(value);
}

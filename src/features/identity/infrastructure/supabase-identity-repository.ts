import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  IdentityRepository,
  OrganizationMembership,
  Permission,
  Profile,
  Role,
  UserRoleAssignment,
} from "../domain";
import {
  mapOrganizationMembership,
  mapPermission,
  mapProfile,
  mapRole,
  mapUserRoleAssignment,
} from "./mappers";

const PROFILE_COLUMNS =
  "id, full_name, email, phone, status, created_at, updated_at" as const;

const MEMBERSHIP_COLUMNS =
  "organization_id, user_id, status, created_at, updated_at" as const;

const ROLE_COLUMNS =
  "id, organization_id, code, name, status, created_at, updated_at" as const;

const PERMISSION_COLUMNS =
  "id, code, description, status, created_at, updated_at" as const;

const ASSIGNMENT_COLUMNS =
  "id, organization_id, user_id, role_id, branch_id, status, valid_from, valid_to, created_at, updated_at" as const;

/**
 * IdentityRepository backed by Supabase. Every query runs through the anon-key
 * server client, so RLS scopes all reads to the current user
 * (`_access.current_user_id()`); the repository never trusts a client-supplied
 * scope. Queries are filtered by the passed ids only as defense in depth.
 */
export class SupabaseIdentityRepository implements IdentityRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data === null ? null : mapProfile(data);
  }

  async getMemberships(userId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await this.client
      .from("organization_memberships")
      .select(MEMBERSHIP_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch memberships: ${error.message}`);
    }

    return data.map(mapOrganizationMembership);
  }

  async getRoles(organizationId: string): Promise<Role[]> {
    const { data, error } = await this.client
      .from("roles")
      .select(ROLE_COLUMNS)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order("code", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return data.map(mapRole);
  }

  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await this.client
      .from("permissions")
      .select(PERMISSION_COLUMNS)
      .order("code", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return data.map(mapPermission);
  }

  async getUserAssignments(
    organizationId: string,
    userId: string
  ): Promise<UserRoleAssignment[]> {
    const { data, error } = await this.client
      .from("user_role_assignments")
      .select(ASSIGNMENT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .order("valid_from", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return data.map(mapUserRoleAssignment);
  }
}

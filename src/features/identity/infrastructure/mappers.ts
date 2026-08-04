import type { Database } from "@/types/database";
import type {
  OrganizationMembership,
  Permission,
  Profile,
  Role,
  UserRoleAssignment,
} from "../domain";

type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationMembershipsRow =
  Database["public"]["Tables"]["organization_memberships"]["Row"];
type RolesRow = Database["public"]["Tables"]["roles"]["Row"];
type PermissionsRow = Database["public"]["Tables"]["permissions"]["Row"];
type UserRoleAssignmentsRow =
  Database["public"]["Tables"]["user_role_assignments"]["Row"];

type Status = "active" | "inactive";

function assertStatus(value: string, column: string): Status {
  if (value === "active" || value === "inactive") {
    return value;
  }
  throw new Error(
    `Invalid ${column} value "${value}". Expected "active" or "inactive".`
  );
}

export function mapProfile(row: ProfilesRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: assertStatus(row.status, "profiles.status"),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapOrganizationMembership(
  row: OrganizationMembershipsRow
): OrganizationMembership {
  return {
    organizationId: row.organization_id,
    userId: row.user_id,
    status: assertStatus(row.status, "organization_memberships.status"),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRole(row: RolesRow): Role {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    status: assertStatus(row.status, "roles.status"),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapPermission(row: PermissionsRow): Permission {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    status: assertStatus(row.status, "permissions.status"),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapUserRoleAssignment(
  row: UserRoleAssignmentsRow
): UserRoleAssignment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    roleId: row.role_id,
    branchId: row.branch_id,
    status: assertStatus(row.status, "user_role_assignments.status"),
    validFrom: new Date(row.valid_from),
    validTo: row.valid_to ? new Date(row.valid_to) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

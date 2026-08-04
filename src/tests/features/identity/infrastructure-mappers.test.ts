import { describe, it, expect } from "vitest";
import {
  mapOrganizationMembership,
  mapPermission,
  mapProfile,
  mapRole,
  mapUserRoleAssignment,
} from "@/features/identity/infrastructure/mappers";

describe("identity infrastructure mappers", () => {
  it("maps a profiles row to the Profile domain model", () => {
    const profile = mapProfile({
      id: "30000000-0000-0000-0000-000000000001",
      full_name: "Usuario A",
      email: "user.a@pgm.local",
      phone: null,
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(profile).toEqual({
      id: "30000000-0000-0000-0000-000000000001",
      fullName: "Usuario A",
      email: "user.a@pgm.local",
      phone: null,
      status: "active",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    });
  });

  it("rejects an invalid profiles.status", () => {
    expect(() =>
      mapProfile({
        id: "30000000-0000-0000-0000-000000000001",
        full_name: null,
        email: null,
        phone: null,
        status: "bogus",
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
      })
    ).toThrow("profiles.status");
  });

  it("maps an organization_memberships row", () => {
    const membership = mapOrganizationMembership({
      organization_id: "10000000-0000-0000-0000-000000000001",
      user_id: "30000000-0000-0000-0000-000000000001",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(membership.organizationId).toBe(
      "10000000-0000-0000-0000-000000000001"
    );
    expect(membership.status).toBe("active");
  });

  it("maps a roles row preserving a global organization", () => {
    const role = mapRole({
      id: "40000000-0000-0000-0000-000000000001",
      organization_id: null,
      code: "administrator",
      name: "Administrador",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(role.organizationId).toBeNull();
    expect(role.code).toBe("administrator");
  });

  it("maps a permissions row", () => {
    const permission = mapPermission({
      id: "50000000-0000-0000-0000-000000000001",
      code: "organization.read",
      description: "Read own organization",
      status: "active",
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(permission.code).toBe("organization.read");
    expect(permission.description).toBe("Read own organization");
  });

  it("maps a user_role_assignments row with nullable branch and valid_to", () => {
    const assignment = mapUserRoleAssignment({
      id: "60000000-0000-0000-0000-000000000001",
      organization_id: "10000000-0000-0000-0000-000000000001",
      user_id: "30000000-0000-0000-0000-000000000001",
      role_id: "40000000-0000-0000-0000-000000000002",
      branch_id: "10000000-0000-0000-0000-000000000002",
      status: "active",
      valid_from: "2026-08-01T00:00:00.000Z",
      valid_to: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(assignment.branchId).toBe(
      "10000000-0000-0000-0000-000000000002"
    );
    expect(assignment.validTo).toBeNull();
  });
});

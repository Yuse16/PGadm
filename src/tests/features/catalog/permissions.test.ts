import { describe, it, expect, vi } from "vitest";
import type { IdentitySession } from "@/features/identity/domain";
import {
  CatalogPermissionError,
  createCatalogActor,
  isCatalogPermission,
} from "@/features/catalog/domain";
import {
  actorFromIdentitySession,
  assertActorOrganization,
  requireCatalogPermission,
  requireCatalogRead,
} from "@/features/catalog/application";

vi.mock("server-only", () => ({}));

vi.mock("@/features/identity/application", () => ({
  requirePermission: vi.fn((code: string) => {
    if (code === "catalog.read") {
      return Promise.resolve(sampleSession(["catalog.read"]));
    }
    return Promise.resolve(sampleSession(["catalog.read", code]));
  }),
}));

function sampleSession(permissionCodes: string[]): IdentitySession {
  return {
    user: {
      id: "30000000-0000-0000-0000-000000000001",
      email: "user.a@pgm.local",
      fullName: "Usuario A",
      status: "active",
    },
    organizationId: "10000000-0000-0000-0000-000000000001",
    organizationName: "Plomería García",
    branchId: null,
    branchName: null,
    roles: [],
    permissions: permissionCodes.map((code) => ({ code, description: null })),
    issuedAt: "2026-08-01T12:00:00.000Z",
    expiresAt: null,
  };
}

describe("CatalogActor", () => {
  it("checks permission codes from the session", () => {
    const actor = createCatalogActor({
      userId: "user-1",
      organizationId: "org-1",
      permissions: ["catalog.read", "catalog.create"],
    });

    expect(actor.hasPermission("catalog.read")).toBe(true);
    expect(actor.hasPermission("catalog.manage")).toBe(false);
    expect(() => actor.requirePermission("catalog.manage")).toThrow(
      CatalogPermissionError
    );
    expect(() => actor.requirePermission("catalog.read")).not.toThrow();
  });

  it("keeps the permissions read-only", () => {
    const actor = createCatalogActor({
      userId: "user-1",
      organizationId: "org-1",
      permissions: ["catalog.read"],
    });
    expect(actor.permissions).toEqual(["catalog.read"]);
  });
});

describe("catalog guards", () => {
  it("delegates permission checks to the identity guard", async () => {
    const session = await requireCatalogPermission("catalog.create");
    expect(session.permissions.map((p) => p.code)).toContain("catalog.create");
  });

  it("requireCatalogRead resolves the read permission", async () => {
    const session = await requireCatalogRead();
    expect(session.permissions.map((p) => p.code)).toContain("catalog.read");
  });

  it("builds an actor from a session with an organization", () => {
    const actor = actorFromIdentitySession(sampleSession(["catalog.read"]));
    expect(actor.organizationId).toBe("10000000-0000-0000-0000-000000000001");
    expect(actor.hasPermission("catalog.read")).toBe(true);
  });

  it("rejects a session without an active organization", () => {
    expect(() =>
      actorFromIdentitySession({ ...sampleSession([]), organizationId: null })
    ).toThrow(/Missing catalog permission: catalog\.read/);
  });

  it("assertActorOrganization rejects a foreign organization", () => {
    const actor = createCatalogActor({
      userId: "user-1",
      organizationId: "org-a",
      permissions: ["catalog.read"],
    });
    expect(() => assertActorOrganization(actor, "org-b")).toThrow(/scoped to org-a/);
    expect(() => assertActorOrganization(actor, "org-a")).not.toThrow();
  });
});

describe("permission catalog", () => {
  it("only knows the five catalog codes", () => {
    expect(isCatalogPermission("catalog.read")).toBe(true);
    expect(isCatalogPermission("catalog.write")).toBe(false);
    expect(isCatalogPermission("catalog.admin")).toBe(false);
  });
});

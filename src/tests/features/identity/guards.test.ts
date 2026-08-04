import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IdentitySession } from "@/features/identity/domain";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

vi.mock("@/features/identity/application/session", () => ({
  getIdentitySession: vi.fn(),
  resolveIdentitySession: vi.fn(),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

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

describe("server-side guards", () => {
  it("requireIdentity redirects to /login when unauthenticated", async () => {
    const sessionMod = await import(
      "@/features/identity/application/session"
    );
    vi.mocked(sessionMod.getIdentitySession).mockResolvedValue(null);

    const { requireIdentity } = await import(
      "@/features/identity/application/guards"
    );

    await expect(requireIdentity()).rejects.toThrow("REDIRECT /login");
  });

  it("requireIdentity returns the session when authenticated", async () => {
    const session = sampleSession([]);
    const sessionMod = await import(
      "@/features/identity/application/session"
    );
    vi.mocked(sessionMod.getIdentitySession).mockResolvedValue(session);

    const { requireIdentity } = await import(
      "@/features/identity/application/guards"
    );

    await expect(requireIdentity()).resolves.toBe(session);
  });

  it("requirePermission redirects to unauthorized when the permission is missing", async () => {
    const sessionMod = await import(
      "@/features/identity/application/session"
    );
    vi.mocked(sessionMod.getIdentitySession).mockResolvedValue(
      sampleSession(["branch.read"])
    );

    const { requirePermission } = await import(
      "@/features/identity/application/guards"
    );

    await expect(requirePermission("organization.write")).rejects.toThrow(
      "REDIRECT /unauthorized?reason=forbidden"
    );
  });

  it("requirePermission returns the session when the permission is granted", async () => {
    const session = sampleSession(["organization.write"]);
    const sessionMod = await import(
      "@/features/identity/application/session"
    );
    vi.mocked(sessionMod.getIdentitySession).mockResolvedValue(session);

    const { requirePermission } = await import(
      "@/features/identity/application/guards"
    );

    await expect(requirePermission("organization.write")).resolves.toBe(
      session
    );
  });
});

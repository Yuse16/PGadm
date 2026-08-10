import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  assertActorOrganization,
  layoutActorFromIdentitySession,
} from "@/features/layout/application";
import { LayoutPermissionError } from "@/features/layout/domain";
import { ORG_A, ORG_B, actor } from "./helpers";

const session = (permissionCodes: string[], organizationId: string | null) => ({
  user: {
    id: "30000000-0000-0000-0000-000000000001",
    email: "admin@pgm.local",
    fullName: "Admin PGM",
    status: "active" as const,
  },
  organizationId,
  organizationName: organizationId === null ? null : "PGM",
  branchId: null,
  branchName: null,
  roles: [],
  permissions: permissionCodes.map((code) => ({ code, description: code })),
  issuedAt: "2026-08-08T00:00:00.000Z",
  expiresAt: null,
});

describe("layoutActorFromIdentitySession", () => {
  it("builds an actor from the RLS-scoped identity session", () => {
    const layoutActor = layoutActorFromIdentitySession(
      session(["layout.read", "layout.edit"], ORG_A)
    );
    expect(layoutActor.organizationId).toBe(ORG_A);
    expect(layoutActor.hasPermission("layout.edit")).toBe(true);
  });

  it("rejects a session without an organization context", () => {
    expect(() => layoutActorFromIdentitySession(session([], null))).toThrow(
      LayoutPermissionError
    );
  });
});

describe("assertActorOrganization (D-C07)", () => {
  it("allows operations inside the actor's organization", () => {
    expect(() => assertActorOrganization(actor(["layout.read"], ORG_A), ORG_A)).not.toThrow();
  });

  it("rejects a different organization", () => {
    expect(() => assertActorOrganization(actor(["layout.read"], ORG_A), ORG_B)).toThrow(
      LayoutPermissionError
    );
  });
});

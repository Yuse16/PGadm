import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  assertActorOrganization,
  getInventoryHistory,
  inventoryActorFromIdentitySession,
} from "@/features/inventory/application";
import {
  InventoryPermissionError,
} from "@/features/inventory/domain";
import {
  ORG_A,
  ORG_B,
  READER,
  VARIANT_051,
  WAREHOUSE_NOG_01,
  actor,
  makeContext,
} from "./helpers";

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
  issuedAt: "2026-08-06T00:00:00.000Z",
  expiresAt: null,
});

describe("inventoryActorFromIdentitySession", () => {
  it("builds an actor from the RLS-scoped identity session", () => {
    const inventoryActor = inventoryActorFromIdentitySession(
      session(["inventory.read"], ORG_A)
    );
    expect(inventoryActor.organizationId).toBe(ORG_A);
    expect(inventoryActor.hasPermission("inventory.read")).toBe(true);
  });

  it("rejects a session without an organization context", () => {
    expect(() => inventoryActorFromIdentitySession(session([], null))).toThrow(
      InventoryPermissionError
    );
  });
});

describe("assertActorOrganization", () => {
  it("allows operations inside the actor's organization", () => {
    expect(() => assertActorOrganization(actor(READER, ORG_A), ORG_A)).not.toThrow();
  });

  it("rejects a different organization (D-C07)", () => {
    expect(() => assertActorOrganization(actor(READER, ORG_A), ORG_B)).toThrow(
      InventoryPermissionError
    );
  });
});

describe("getInventoryHistory", () => {
  it("returns snapshots, changes and observations scoped to the org (IA-17)", async () => {
    const context = makeContext();
    const history = await getInventoryHistory(context, {
      actor: actor(READER),
      organizationId: ORG_A,
    });
    expect(history.snapshots).toHaveLength(2);
    expect(history.changes).toHaveLength(3);
    expect(history.observations).toHaveLength(2);
  });

  it("filters by warehouse and variant", async () => {
    const context = makeContext();
    const history = await getInventoryHistory(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      warehouseId: WAREHOUSE_NOG_01,
      variantId: VARIANT_051,
    });
    expect(history.changes).toHaveLength(1);
    expect(history.observations).toHaveLength(1);
    expect(history.snapshots).toHaveLength(2);
  });

  it("requires inventory.read (IA-23)", async () => {
    const context = makeContext();
    await expect(
      getInventoryHistory(context, { actor: actor([], ORG_A), organizationId: ORG_A })
    ).rejects.toThrow(InventoryPermissionError);
  });
});

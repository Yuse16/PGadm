import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

type AnyRow = Record<string, unknown>;

interface FakeClientOptions {
  user?: AnyRow | null;
  accessToken?: string;
  profiles?: AnyRow[];
  memberships?: AnyRow[];
  organizations?: AnyRow[];
  roles?: AnyRow[];
  assignments?: AnyRow[];
  branches?: AnyRow[];
  permissionRows?: AnyRow[];
}

function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
    "utf8"
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${header}.${body}.sig`;
}

function fakeBuilder(rows: AnyRow[]): unknown {
  let single = false;
  const chain = {
    select: () => chain,
    eq: (_column: string, value: unknown) => {
      const filtered = rows.filter((row) => row[_column] === value);
      rows.splice(0, rows.length, ...filtered);
      return chain;
    },
    in: (_column: string, values: readonly unknown[]) => {
      const filtered = rows.filter((row) => values.includes(row[_column]));
      rows.splice(0, rows.length, ...filtered);
      return chain;
    },
    or: () => chain,
    order: () => chain,
    maybeSingle: () => {
      single = true;
      return chain;
    },
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data: single ? rows[0] ?? null : rows, error: null }),
  };
  return chain;
}

function fakeClient(options: FakeClientOptions): SupabaseClient<Database> {
  const tables: Record<string, AnyRow[]> = {
    profiles: options.profiles ?? [],
    organization_memberships: options.memberships ?? [],
    organizations: options.organizations ?? [],
    roles: options.roles ?? [],
    user_role_assignments: options.assignments ?? [],
    branches: options.branches ?? [],
  };

  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options.user ?? null },
        error: null,
      })),
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: options.accessToken ?? makeToken({}),
          },
        },
        error: null,
      })),
    },
    rpc: vi.fn(async () => ({
      data: options.permissionRows ?? [],
      error: null,
    })),
    from: vi.fn((table: string) => fakeBuilder(tables[table] ?? [])),
  };

  return client as unknown as SupabaseClient<Database>;
}

const PROFILE_A: AnyRow = {
  id: "30000000-0000-0000-0000-000000000001",
  full_name: "Usuario A",
  email: "user.a@pgm.local",
  phone: null,
  status: "active",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

describe("resolveIdentitySession (server-side compositor)", () => {
  it("is unauthenticated when there is no user", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const { resolveIdentitySession } = await import(
      "@/features/identity/application/session"
    );
    const result = await resolveIdentitySession(fakeClient({ user: null }));

    expect(result.status).toBe("unauthenticated");
  });

  it("is unauthenticated without a profile", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const { resolveIdentitySession } = await import(
      "@/features/identity/application/session"
    );
    const result = await resolveIdentitySession(
      fakeClient({
        user: { id: PROFILE_A.id, email: "user.a@pgm.local" },
        profiles: [],
      })
    );

    expect(result.status).toBe("unauthenticated");
  });

  it("is inactive when the profile is inactive", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const { resolveIdentitySession } = await import(
      "@/features/identity/application/session"
    );
    const result = await resolveIdentitySession(
      fakeClient({
        user: { id: PROFILE_A.id, email: "user.a@pgm.local" },
        profiles: [{ ...PROFILE_A, status: "inactive" }],
      })
    );

    expect(result.status).toBe("inactive");
  });

  it("composes the manager session with org, branch, roles and permissions", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const { resolveIdentitySession } = await import(
      "@/features/identity/application/session"
    );

    const result = await resolveIdentitySession(
      fakeClient({
        user: { id: PROFILE_A.id, email: "user.a@pgm.local" },
        accessToken: makeToken({ iat: 1723000000, exp: 1723003600 }),
        profiles: [PROFILE_A],
        memberships: [
          {
            organization_id: "10000000-0000-0000-0000-000000000001",
            user_id: PROFILE_A.id,
            status: "active",
            created_at: "2026-08-01T00:00:00.000Z",
            updated_at: "2026-08-01T00:00:00.000Z",
          },
        ],
        organizations: [
          { id: "10000000-0000-0000-0000-000000000001", name: "Plomería García" },
        ],
        roles: [
          {
            id: "40000000-0000-0000-0000-000000000002",
            organization_id: "10000000-0000-0000-0000-000000000001",
            code: "manager",
            name: "Gerente",
            status: "active",
          },
          {
            id: "40000000-0000-0000-0000-000000000001",
            organization_id: null,
            code: "administrator",
            name: "Administrador",
            status: "active",
          },
        ],
        assignments: [
          {
            id: "60000000-0000-0000-0000-000000000001",
            organization_id: "10000000-0000-0000-0000-000000000001",
            user_id: PROFILE_A.id,
            role_id: "40000000-0000-0000-0000-000000000002",
            branch_id: "10000000-0000-0000-0000-000000000002",
            status: "active",
            valid_from: "2026-08-01T00:00:00.000Z",
            valid_to: null,
          },
        ],
        branches: [
          {
            id: "10000000-0000-0000-0000-000000000002",
            name: "Nogalera",
          },
        ],
        permissionRows: [
          { code: "organization.read", description: "Read own organization" },
          { code: "branch.read", description: "Read branches of own organization" },
        ],
      })
    );

    expect(result.status).toBe("authenticated");
    if (result.status !== "authenticated") {
      return;
    }

    const session = result.session;
    expect(session.user.id).toBe(PROFILE_A.id);
    expect(session.user.email).toBe("user.a@pgm.local");
    expect(session.user.fullName).toBe("Usuario A");
    expect(session.user.status).toBe("active");
    expect(session.organizationId).toBe(
      "10000000-0000-0000-0000-000000000001"
    );
    expect(session.organizationName).toBe("Plomería García");
    expect(session.branchId).toBe("10000000-0000-0000-0000-000000000002");
    expect(session.branchName).toBe("Nogalera");
    expect(session.roles).toEqual([
      {
        code: "manager",
        name: "Gerente",
        organizationId: "10000000-0000-0000-0000-000000000001",
        branchId: "10000000-0000-0000-0000-000000000002",
      },
    ]);
    expect(session.permissions).toEqual([
      { code: "organization.read", description: "Read own organization" },
      { code: "branch.read", description: "Read branches of own organization" },
    ]);
    expect(session.expiresAt).toBe(
      new Date(1723003600 * 1000).toISOString()
    );
  });

  it("returns an authenticated but unscoped session without memberships", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const { resolveIdentitySession } = await import(
      "@/features/identity/application/session"
    );
    const result = await resolveIdentitySession(
      fakeClient({
        user: { id: "30000000-0000-0000-0000-000000000005", email: "user.nom@pgm.local" },
        profiles: [{ ...PROFILE_A, id: "30000000-0000-0000-0000-000000000005" }],
        memberships: [],
      })
    );

    expect(result.status).toBe("authenticated");
    if (result.status !== "authenticated") {
      return;
    }

    expect(result.session.organizationId).toBeNull();
    expect(result.session.branchId).toBeNull();
    expect(result.session.roles).toEqual([]);
    expect(result.session.permissions).toEqual([]);
  });
});

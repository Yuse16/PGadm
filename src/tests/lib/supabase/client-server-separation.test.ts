import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("client/server separation", () => {
  it("client module does not import server-only modules", async () => {
    const clientSource = await import("@/lib/supabase/client");
    expect(clientSource.getSupabaseClient).toBeDefined();

    const clientModuleStr = clientSource.getSupabaseClient.toString();
    expect(clientModuleStr).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("server module imports service role key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");

    const serverSource = await import("@/lib/supabase/server");
    expect(serverSource.getSupabaseServerClient).toBeDefined();

    const serverModuleStr = serverSource.getSupabaseServerClient.toString();
    expect(serverModuleStr).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("client uses anon key not service role key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-789");

    const config = await import("@/lib/supabase/config");
    const env = config.getClientEnv();

    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-789");
    expect(Object.keys(env)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});

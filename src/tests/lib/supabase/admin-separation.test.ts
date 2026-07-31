import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("server-only", () => ({}));

const ROOT = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("service role isolation", () => {
  it("admin module imports server-only", () => {
    const source = readSource("src/lib/supabase/admin.ts");
    expect(source).toContain('import "server-only"');
  });

  it("admin client is defined and uses the service role key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");

    const admin = await import("@/lib/supabase/admin");
    expect(admin.createSupabaseAdminClient).toBeDefined();

    const moduleStr = admin.createSupabaseAdminClient.toString();
    expect(moduleStr).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("no service role variable uses the NEXT_PUBLIC_ prefix", () => {
    const configSource = readSource("src/lib/supabase/config.ts");
    expect(configSource).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");

    const envSource = readSource("src/schemas/env.ts");
    expect(envSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("admin client cannot be imported from browser code", () => {
    const clientSource = readSource("src/lib/supabase/client.ts");
    expect(clientSource).not.toContain("createSupabaseAdminClient");
    expect(clientSource).not.toContain('from "./admin"');
  });

  it("server module imports server-only", () => {
    const source = readSource("src/lib/supabase/server.ts");
    expect(source).toContain('import "server-only"');
  });
});

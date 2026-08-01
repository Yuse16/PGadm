import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called without configuration");
  }),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SupabaseOrganizationRepository configuration guard", () => {
  it("throws a typed configuration error when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { SupabaseOrganizationRepository } = await import(
      "@/features/organization/infrastructure/supabase-organization-repository"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/organization/domain"
    );

    const repository = new SupabaseOrganizationRepository();

    await expect(repository.findOrganizationById("any-id")).rejects.toThrow(
      RepositoryConfigurationError
    );
  });
});

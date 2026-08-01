import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in demo mode");
  }),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("organization data source selection", () => {
  it("defaults to the demo data source when no env var is set", async () => {
    const { getOrganizationDataSource } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    expect(getOrganizationDataSource()).toBe("demo");
  });

  it("resolves an explicit demo source", async () => {
    const { resolveOrganizationDataSource } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    expect(resolveOrganizationDataSource("demo")).toBe("demo");
  });

  it("resolves an explicit supabase source", async () => {
    const { resolveOrganizationDataSource } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    expect(resolveOrganizationDataSource("supabase")).toBe("supabase");
  });

  it("rejects an unknown source with a typed configuration error", async () => {
    const { resolveOrganizationDataSource } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/organization/domain"
    );
    expect(() => resolveOrganizationDataSource("bogus")).toThrow(
      RepositoryConfigurationError
    );
  });

  it("reads the source from the ORGANIZATION_DATA_SOURCE env var", async () => {
    vi.stubEnv("ORGANIZATION_DATA_SOURCE", "supabase");
    const { getOrganizationDataSource } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    expect(getOrganizationDataSource()).toBe("supabase");
  });

  it("creates a demo repository for the demo source", async () => {
    const { createOrganizationRepository } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    const { DemoOrganizationRepository } = await import(
      "@/features/organization/infrastructure/demo-organization-repository"
    );
    expect(createOrganizationRepository("demo")).toBeInstanceOf(
      DemoOrganizationRepository
    );
  });

  it("creates a supabase repository for the supabase source", async () => {
    const { createOrganizationRepository } = await import(
      "@/features/organization/infrastructure/repository-selection"
    );
    const { SupabaseOrganizationRepository } = await import(
      "@/features/organization/infrastructure/supabase-organization-repository"
    );
    expect(createOrganizationRepository("supabase")).toBeInstanceOf(
      SupabaseOrganizationRepository
    );
  });

  it("never falls back to demo after a supabase read failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("ORGANIZATION_DATA_SOURCE", "supabase");

    const { getOrganizationDataSource, createOrganizationRepository } =
      await import(
        "@/features/organization/infrastructure/repository-selection"
      );
    const { RepositoryConfigurationError } = await import(
      "@/features/organization/domain"
    );
    const { DemoOrganizationRepository } = await import(
      "@/features/organization/infrastructure/demo-organization-repository"
    );

    expect(getOrganizationDataSource()).toBe("supabase");

    const repository = createOrganizationRepository("supabase");
    expect(repository).not.toBeInstanceOf(DemoOrganizationRepository);
    await expect(repository.findOrganizationById("any-id")).rejects.toThrow(
      RepositoryConfigurationError
    );
  });
});

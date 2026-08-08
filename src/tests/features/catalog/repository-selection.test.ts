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

describe("catalog data source selection", () => {
  it("defaults to the demo data source when no env var is set", async () => {
    const { getCatalogDataSource } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    expect(getCatalogDataSource()).toBe("demo");
  });

  it("resolves an explicit demo source", async () => {
    const { resolveCatalogDataSource } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    expect(resolveCatalogDataSource("demo")).toBe("demo");
  });

  it("resolves an explicit supabase source", async () => {
    const { resolveCatalogDataSource } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    expect(resolveCatalogDataSource("supabase")).toBe("supabase");
  });

  it("rejects an unknown source with a typed configuration error", async () => {
    const { resolveCatalogDataSource } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/catalog/domain"
    );
    expect(() => resolveCatalogDataSource("bogus")).toThrow(
      RepositoryConfigurationError
    );
  });

  it("reads the source from the CATALOG_DATA_SOURCE env var", async () => {
    vi.stubEnv("CATALOG_DATA_SOURCE", "supabase");
    const { getCatalogDataSource } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    expect(getCatalogDataSource()).toBe("supabase");
  });

  it("creates a demo repository set for the demo source", async () => {
    const { createCatalogRepositories } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    const { DemoProductRepository } = await import(
      "@/features/catalog/infrastructure/demo-catalog-repository"
    );
    const { NoopCatalogAuditRepository } = await import(
      "@/features/catalog/infrastructure/noop-catalog-audit-repository"
    );
    const { NoopCatalogIntegrationRepository } = await import(
      "@/features/catalog/infrastructure/noop-catalog-integration-repository"
    );
    const repos = createCatalogRepositories("demo");
    expect(repos.productRepository).toBeInstanceOf(DemoProductRepository);
    expect(repos.auditRepository).toBeInstanceOf(NoopCatalogAuditRepository);
    expect(repos.integrationRepository).toBeInstanceOf(
      NoopCatalogIntegrationRepository
    );
  });

  it("creates supabase repositories for the supabase source", async () => {
    const { createCatalogRepositories } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    const { SupabaseProductRepository } = await import(
      "@/features/catalog/infrastructure/supabase-catalog-repository"
    );
    const { SupabaseCatalogAuditRepository } = await import(
      "@/features/catalog/infrastructure/supabase-catalog-audit-repository"
    );
    const { NoopCatalogIntegrationRepository } = await import(
      "@/features/catalog/infrastructure/noop-catalog-integration-repository"
    );
    const repos = createCatalogRepositories("supabase");
    expect(repos.productRepository).toBeInstanceOf(SupabaseProductRepository);
    expect(repos.auditRepository).toBeInstanceOf(SupabaseCatalogAuditRepository);
    expect(repos.integrationRepository).toBeInstanceOf(
      NoopCatalogIntegrationRepository
    );
  });

  it("throws a typed error when recording an audit event without supabase config", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("CATALOG_DATA_SOURCE", "supabase");

    const { createCatalogRepositories } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/catalog/domain"
    );

    const repos = createCatalogRepositories("supabase");
    await expect(
      repos.auditRepository.record({
        actorUserId: "actor-1",
        organizationId: "org-1",
        action: "create",
        entityType: "product",
        entityId: "product-1",
        detail: "detail",
      })
    ).rejects.toThrow(RepositoryConfigurationError);
  });

  it("never falls back to demo after a supabase read failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("CATALOG_DATA_SOURCE", "supabase");

    const { getCatalogDataSource, createCatalogRepositories } = await import(
      "@/features/catalog/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/catalog/domain"
    );
    const { DemoProductRepository } = await import(
      "@/features/catalog/infrastructure/demo-catalog-repository"
    );

    expect(getCatalogDataSource()).toBe("supabase");

    const repos = createCatalogRepositories("supabase");
    expect(repos.productRepository).not.toBeInstanceOf(DemoProductRepository);
    await expect(repos.productRepository.findProductById("any", "any")).rejects.toThrow(
      RepositoryConfigurationError
    );
  });
});

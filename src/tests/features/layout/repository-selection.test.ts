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

describe("layout data source selection (D-L11, LA-34)", () => {
  it("defaults to the demo data source when no env var is set", async () => {
    const { getLayoutDataSource } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    expect(getLayoutDataSource()).toBe("demo");
  });

  it("resolves an explicit demo source", async () => {
    const { resolveLayoutDataSource } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    expect(resolveLayoutDataSource("demo")).toBe("demo");
  });

  it("resolves an explicit supabase source", async () => {
    const { resolveLayoutDataSource } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    expect(resolveLayoutDataSource("supabase")).toBe("supabase");
  });

  it("reads the source from the LAYOUT_DATA_SOURCE env var", async () => {
    vi.stubEnv("LAYOUT_DATA_SOURCE", "supabase");
    const { getLayoutDataSource } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    expect(getLayoutDataSource()).toBe("supabase");
  });

  it("rejects an unknown source with a typed configuration error (no silent fallback)", async () => {
    const { resolveLayoutDataSource } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/layout/domain"
    );
    expect(() => resolveLayoutDataSource("bogus")).toThrow(RepositoryConfigurationError);
  });

  it("creates a demo context by default with all four ports wired", async () => {
    const { createLayoutContext } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    const context = createLayoutContext("demo");
    expect(context.layoutRepository).toBeDefined();
    expect(context.auditRepository).toBeDefined();
    expect(context.referenceCatalog).toBeDefined();
    expect(context.stockProvider).toBeDefined();
  });

  it("does not silently fall back to demo for supabase in 3.3 (wired in 3.4)", async () => {
    const { createLayoutContext } = await import(
      "@/features/layout/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/layout/domain"
    );
    expect(() => createLayoutContext("supabase")).toThrow(RepositoryConfigurationError);
  });
});

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

describe("inventory data source selection", () => {
  it("defaults to the demo data source when no env var is set (D-I12)", async () => {
    const { getInventoryDataSource } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    expect(getInventoryDataSource()).toBe("demo");
  });

  it("resolves an explicit demo source", async () => {
    const { resolveInventoryDataSource } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    expect(resolveInventoryDataSource("demo")).toBe("demo");
  });

  it("resolves an explicit supabase source", async () => {
    const { resolveInventoryDataSource } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    expect(resolveInventoryDataSource("supabase")).toBe("supabase");
  });

  it("rejects an unknown source with a typed configuration error (D031)", async () => {
    const { resolveInventoryDataSource } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    const { RepositoryConfigurationError } = await import(
      "@/features/inventory/domain"
    );
    expect(() => resolveInventoryDataSource("bogus")).toThrow(
      RepositoryConfigurationError
    );
  });

  it("reads the source from the INVENTORY_DATA_SOURCE env var", async () => {
    vi.stubEnv("INVENTORY_DATA_SOURCE", "supabase");
    const { getInventoryDataSource } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    expect(getInventoryDataSource()).toBe("supabase");
  });

  it("creates a demo context by default", async () => {
    const { createInventoryContext } = await import(
      "@/features/inventory/infrastructure/repository-selection"
    );
    const context = createInventoryContext("demo");
    expect(context.inventoryRepository).toBeDefined();
    expect(context.auditRepository).toBeDefined();
    expect(context.referenceCatalog).toBeDefined();
  });
});

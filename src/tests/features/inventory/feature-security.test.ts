import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const INVENTORY_DIR = "src/features/inventory";

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

function listFeatureFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(resolve(ROOT, dir))) {
    const full = resolve(ROOT, dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...listFeatureFiles(join(dir, entry)));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      result.push(join(dir, entry));
    }
  }
  return result;
}

describe("inventory feature security", () => {
  const files = listFeatureFiles(INVENTORY_DIR);

  it("feature files do not import the admin service role client (IA-29)", () => {
    for (const file of files) {
      const source = readSource(file);
      expect(
        source,
        `${file} must not reference the admin client`
      ).not.toContain("createSupabaseAdminClient");
      expect(
        source,
        `${file} must not reference the service role key`
      ).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("the supabase repository uses the anon server client (IA-29)", () => {
    const source = readSource(
      "src/features/inventory/infrastructure/supabase-inventory-repository.ts"
    );
    expect(source).toContain("createSupabaseServerClient");
    expect(source).not.toContain("createSupabaseAdminClient");
  });

  it("the demo repositories are standalone and never touch the database", () => {
    const demoFiles = [
      "src/features/inventory/infrastructure/demo-inventory-repository.ts",
      "src/features/inventory/infrastructure/demo-inventory-reference-catalog.ts",
      "src/features/inventory/infrastructure/noop-inventory-audit-repository.ts",
    ];
    for (const file of demoFiles) {
      const source = readSource(file);
      expect(source).not.toContain("createSupabaseServerClient");
      expect(source).not.toContain("createSupabaseAdminClient");
      expect(source).not.toContain("process.env");
    }
  });

  it("the repository selection never falls back to demo after a failed read (D-I12/D031)", () => {
    const source = readSource(
      "src/features/inventory/infrastructure/repository-selection.ts"
    );
    expect(source).not.toContain("catch");
    expect(source).toContain("DEFAULT_DATA_SOURCE");
    expect(source).toContain("RepositoryConfigurationError");
  });

  it("the inventory guards reuse the identity requirePermission (IA-23/25/26)", () => {
    const source = readSource(
      "src/features/inventory/application/guards.ts"
    );
    expect(source).toContain("requirePermission");
    expect(source).not.toContain("request.jwt");
    expect(source).not.toContain("service_role");
  });

  it("every inventory write use case requires a permission before any mutation", () => {
    for (const file of [
      "src/features/inventory/application/import-use-cases.ts",
      "src/features/inventory/application/observation-use-cases.ts",
      "src/features/inventory/application/template-use-cases.ts",
    ]) {
      const source = readSource(file);
      expect(source, `${file} must call actor.requirePermission`).toContain(
        "actor.requirePermission("
      );
    }
  });
});

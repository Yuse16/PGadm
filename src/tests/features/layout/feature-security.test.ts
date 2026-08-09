import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const LAYOUT_DIR = "src/features/layout";

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

describe("layout feature security", () => {
  const files = listFeatureFiles(LAYOUT_DIR);

  it("feature files do not import the admin service role client (LA-25)", () => {
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

  it("the supabase repositories use the anon server client (LA-25)", () => {
    for (const file of [
      "src/features/layout/infrastructure/supabase-layout-repository.ts",
      "src/features/layout/infrastructure/supabase-layout-reference-catalog.ts",
      "src/features/layout/infrastructure/supabase-layout-audit-repository.ts",
      "src/features/layout/infrastructure/supabase-layout-stock-provider.ts",
    ]) {
      const source = readSource(file);
      expect(source).toContain("createSupabaseServerClient");
      expect(source).not.toContain("createSupabaseAdminClient");
    }
  });

  it("the demo repositories are standalone and never touch the database", () => {
    const demoFiles = [
      "src/features/layout/infrastructure/demo-layout-repository.ts",
      "src/features/layout/infrastructure/demo-layout-reference-catalog.ts",
      "src/features/layout/infrastructure/demo-layout-stock-provider.ts",
      "src/features/layout/infrastructure/noop-layout-audit-repository.ts",
    ];
    for (const file of demoFiles) {
      const source = readSource(file);
      expect(source).not.toContain("createSupabaseServerClient");
      expect(source).not.toContain("createSupabaseAdminClient");
      expect(source).not.toContain("process.env");
    }
  });

  it("the repository selection never falls back to demo after a failed read (D-L11/D031)", () => {
    const source = readSource(
      "src/features/layout/infrastructure/repository-selection.ts"
    );
    expect(source).not.toContain("catch");
    expect(source).toContain("DEFAULT_DATA_SOURCE");
    expect(source).toContain("RepositoryConfigurationError");
  });

  it("the layout guards reuse the identity requirePermission (LA-23/26)", () => {
    const source = readSource(
      "src/features/layout/application/guards.ts"
    );
    expect(source).toContain("requirePermission");
    expect(source).not.toContain("request.jwt");
    expect(source).not.toContain("service_role");
  });

  it("every layout write use case requires a permission before any mutation", () => {
    for (const file of [
      "src/features/layout/application/layout-use-cases.ts",
      "src/features/layout/application/element-use-cases.ts",
      "src/features/layout/application/position-use-cases.ts",
    ]) {
      const source = readSource(file);
      expect(source, `${file} must call actor.requirePermission`).toContain(
        "actor.requirePermission("
      );
    }
  });
});

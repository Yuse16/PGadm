import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const ORGANIZATION_DIR = "src/features/organization";

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

describe("organization feature security", () => {
  const files = listFeatureFiles(ORGANIZATION_DIR);

  it("feature files do not import the admin service role client", () => {
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

  it("the normal repository uses the anon server client", () => {
    const source = readSource(
      "src/features/organization/infrastructure/supabase-organization-repository.ts"
    );
    expect(source).toContain("createSupabaseServerClient");
    expect(source).not.toContain("createSupabaseAdminClient");
  });

  it("the demo repository is standalone and never touches the database", () => {
    const source = readSource(
      "src/features/organization/infrastructure/demo-organization-repository.ts"
    );
    expect(source).not.toContain("createSupabaseServerClient");
    expect(source).not.toContain("createSupabaseAdminClient");
    expect(source).not.toContain("process.env");
  });

  it("the repository selection never falls back to demo after a failed read", () => {
    const source = readSource(
      "src/features/organization/infrastructure/repository-selection.ts"
    );
    expect(source).not.toContain("catch");
    expect(source).toContain("DEFAULT_DATA_SOURCE");
  });

  it("the admin page does not leak environment variables to the client", () => {
    const source = readSource("src/app/admin/organization/page.tsx");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});

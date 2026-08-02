import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const IDENTITY_DIR = "src/features/identity";
const IDENTITY_APP_FILES = [
  "src/app/login/page.tsx",
  "src/app/unauthorized/page.tsx",
  "src/app/admin/identity-preview/page.tsx",
];

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
      result.push(join(dir, entry).replace(/\\/g, "/"));
    }
  }
  return result;
}

describe("identity feature security", () => {
  const componentFiles = listFeatureFiles(join(IDENTITY_DIR, "components"));
  const allIdentityFiles = [
    ...listFeatureFiles(IDENTITY_DIR),
    ...IDENTITY_APP_FILES,
  ];

  it("components do not import service_role or admin client", () => {
    for (const file of componentFiles) {
      const source = readSource(file);
      expect(source, `${file} must not reference service_role`).not.toMatch(
        /service_role/i
      );
      expect(source, `${file} must not import admin client`).not.toContain(
        "createSupabaseAdminClient"
      );
      expect(source, `${file} must not reference admin module`).not.toContain(
        "lib/supabase/admin"
      );
    }
  });

  it("login-form does not import Supabase", () => {
    const source = readSource(
      "src/features/identity/components/login-form.tsx"
    );
    expect(source).not.toMatch(/supabase/i);
    expect(source).not.toContain("@supabase");
  });

  it("does not expose NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", () => {
    for (const file of allIdentityFiles) {
      const source = readSource(file);
      expect(source).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    }

    const envExample = resolve(ROOT, ".env.example");
    if (existsSync(envExample)) {
      expect(readSource(".env.example")).not.toContain(
        "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"
      );
    }
  });

  it("does not console.log passwords", () => {
    for (const file of allIdentityFiles) {
      const source = readSource(file);
      expect(source, `${file} must not log password`).not.toMatch(
        /console\.log\([^\)]*password/i
      );
    }
  });

  it("does not modify SQL migration, seed or test files in this change set", () => {
    const diff = execSync("git diff --name-only HEAD", {
      cwd: ROOT,
      encoding: "utf-8",
    });
    const untracked = execSync("git ls-files --others --exclude-standard", {
      cwd: ROOT,
      encoding: "utf-8",
    });
    const changed = `${diff}\n${untracked}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => relative(ROOT, resolve(ROOT, line)).replace(/\\/g, "/"));

    const sqlTouched = changed.filter(
      (file) =>
        file.startsWith("supabase/migrations/") ||
        file === "supabase/seed.sql" ||
        file.startsWith("supabase/tests/")
    );

    expect(sqlTouched).toEqual([]);
  });
});

#!/usr/bin/env node

const { execSync } = await import("child_process");
const { existsSync, readFileSync, readdirSync } = await import("fs");
const { resolve } = await import("path");

const ROOT = resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");
const TESTS_DIR = resolve(ROOT, "supabase/tests");
const TYPES_PATH = resolve(ROOT, "src/types/database.ts");

let exitCode = 0;
const results = [];

function check(label, fn) {
  try {
    const result = fn();
    results.push({ label, status: result ? "PASS" : "FAIL", detail: "" });
    if (!result) exitCode = 1;
  } catch (e) {
    results.push({ label, status: "FAIL", detail: e.message });
    exitCode = 1;
  }
}

// 1. Docker available
check("Docker available", () => {
  try {
    execSync("docker --version", { stdio: "pipe", timeout: 5000 });
    return true;
  } catch {
    throw new Error("Docker not available. Install Docker Desktop to run Supabase locally.");
  }
});

// 2. Docker compose available
check("Docker Compose available", () => {
  execSync("docker compose version", { stdio: "pipe", timeout: 5000 });
  return true;
});

// 3. Migration files exist
check("Migration files present", () => {
  if (!existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  if (files.length === 0) {
    throw new Error("No migration SQL files found");
  }
  return true;
});

// 4. Seed file exists
check("Seed file present", () => {
  const seedPath = resolve(ROOT, "supabase/seed.sql");
  if (!existsSync(seedPath)) {
    throw new Error("Seed file not found: supabase/seed.sql");
  }
  const content = readFileSync(seedPath, "utf-8");
  if (content.trim().length === 0) {
    throw new Error("Seed file is empty");
  }
  return true;
});

// 5. Test files exist
check("Database test files present", () => {
  if (!existsSync(TESTS_DIR)) {
    throw new Error(`Tests directory not found: ${TESTS_DIR}`);
  }
  const files = readdirSync(TESTS_DIR).filter((f) => f.endsWith(".sql"));
  if (files.length === 0) {
    throw new Error("No test SQL files found");
  }
  return true;
});

// 6. Supabase config exists
check("supabase/config.toml exists", () => {
  const configPath = resolve(ROOT, "supabase/config.toml");
  if (!existsSync(configPath)) {
    throw new Error("Config file not found: supabase/config.toml");
  }
  return true;
});

// 7. Supabase local running (requires Docker)
check("Supabase local running", () => {
  try {
    execSync("npx supabase status", { stdio: "pipe", timeout: 15000 });
    return true;
  } catch {
    throw new Error("Supabase local not running. Run: npm run db:start");
  }
});

// 8. Migrations + seed apply cleanly (full local reset)
check("Migrations + seed apply cleanly (db reset)", () => {
  try {
    execSync("npx supabase db reset", { stdio: "inherit", timeout: 240000 });
    return true;
  } catch {
    throw new Error("Migration/seed application failed. See output above.");
  }
});

// 9. Database tests pass (pgTAP + ci_verify) — real execution, failures propagate
check("Database tests pass (db test)", () => {
  try {
    execSync("npx supabase db test", { stdio: "inherit", timeout: 240000 });
    return true;
  } catch {
    throw new Error("Database tests failed. See output above.");
  }
});

// 10. Generated types match the committed types (deterministic generation)
check("Generated database types in sync", () => {
  if (!existsSync(TYPES_PATH)) {
    throw new Error(`Committed types file not found: ${TYPES_PATH}. Run: npm run db:types`);
  }
  const generated = execSync("npx supabase gen types typescript --local", {
    encoding: "utf8",
    timeout: 60000,
  });
  const committed = readFileSync(TYPES_PATH, "utf-8");
  const norm = (s) => s.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
  if (norm(generated) !== norm(committed)) {
    throw new Error(
      "src/types/database.ts is out of sync with the local database. Run: npm run db:types"
    );
  }
  return true;
});

console.log("\n=== PGadm DB Verification ===\n");
for (const r of results) {
  const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "→";
  console.log(` ${icon} ${r.label}`);
  if (r.detail) console.log(`    ${r.detail}`);
}
console.log(`\nResult: ${exitCode === 0 ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`);
console.log(`Exit code: ${exitCode}\n`);

process.exit(exitCode);

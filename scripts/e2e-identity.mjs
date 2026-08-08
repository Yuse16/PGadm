#!/usr/bin/env node
/**
 * PGadm — 1B.3D-2 local Identity/RBAC/RLS E2E (real GoTrue + PostgREST).
 *
 * Multi-user / multi-organization validation on the running Supabase stack,
 * using ONLY the anon key for every client call (no service_role):
 *
 *   1. signup 5 fresh fixture users via GoTrue (auto-confirmed)    -> auth.users
 *   2. provision profiles/memberships/role-assignments (psql)      -> RLS fixtures
 *   3. password sign-in each user                                  -> user JWT
 *   4. `current_user_permissions` RPC via PostgREST                -> effective perms
 *   5. RLS scoping via PostgREST: org/branch/warehouse reads       -> own org only
 *   6. negative cross-org: INSERT into a foreign org is blocked     -> HTTP >= 400
 *   7. logout invalidates the refresh token                        -> refresh rejected
 *   8. cleanup via auth admin (cascades to profiles + assignments)
 *
 * App-layer cookie/session behavior (sb-127-auth-token chunking, @supabase/ssr)
 * is covered by Vitest; the API-level assertions here validate the RLS and
 * permission contracts the session compositor relies on.
 *
 * Run: npm run e2e:identity   (requires: npx supabase start, Docker)
 */

import { createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = readFileSync(resolve(ROOT, "supabase/config.toml"), "utf-8");

const DEFAULT_JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";
const ANON_EXP = 1983834349; // matches the CLI-generated anon key exp

function configValue(section, key) {
  const block = CONFIG.split(/\[(?:api|auth|auth\.email|db|local_smtp|studio|storage|edge_runtime|analytics|experimental)\]/)
    .find((b) => b.trimStart().startsWith(section));
  if (!block) return undefined;
  const m = block.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"));
  return m ? m[1] : undefined;
}

const JWT_SECRET = configValue("auth", "jwt_secret") ?? DEFAULT_JWT_SECRET;

const projectIdMatch = CONFIG.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
const PROJECT_ID = projectIdMatch ? projectIdMatch[1] : "organization-foundation";
const DB_CONTAINER = `supabase_db_${PROJECT_ID}`;

const API_URL = process.env.PGADM_API_URL ?? "http://127.0.0.1:54321";

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = b64u(JSON.stringify({ iss: "supabase-demo", role: "anon", exp: ANON_EXP }));
const signature = b64u(createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest());
const ANON_KEY = `${header}.${payload}.${signature}`;

// Seed fixture ids (supabase/seed.sql)
const ORG_PGM = "10000000-0000-0000-0000-000000000001";
const ORG_DEMO_B = "20000000-0000-0000-0000-000000000001";
const BRANCH_NOG = "10000000-0000-0000-0000-000000000002";
const BRANCH_BSAL = "20000000-0000-0000-0000-000000000002";
const ROLE_MANAGER = "40000000-0000-0000-0000-000000000002";
const ROLE_CASHIER = "40000000-0000-0000-0000-000000000003";
const ROLE_OPERATOR = "40000000-0000-0000-0000-000000000004";

const MANAGER_PERMS = ["branch.read", "catalog.create", "catalog.read", "catalog.update", "organization.read", "organization.write", "warehouse.read"];
const CASHIER_PERMS = ["branch.read", "catalog.read", "organization.read"];
const OPERATOR_PERMS = ["catalog.read", "organization.read"];

// Per-user scenario: what to provision, what effective permissions are expected,
// and what RLS should expose. RLS is enforced at the membership + profile-status
// level (_access.current_organization_ids(), migration 004): an inactive profile
// sees no organization data even with an active membership.
const SCENARIOS = [
  {
    key: "manager_PGM", fullName: "E2E Manager",
    orgId: ORG_PGM, branchId: BRANCH_NOG, roleId: ROLE_MANAGER,
    perms: MANAGER_PERMS,
    orgs: ["PGM"], branches: ["NOG", "SAL"], warehouses: ["NOG-01", "SAL-01"],
    products: ["TUB-PVC-100", "VAL-GLOBO-050"],
  },
  {
    key: "cashier_PGM", fullName: "E2E Cashier",
    orgId: ORG_PGM, branchId: BRANCH_NOG, roleId: ROLE_CASHIER,
    perms: CASHIER_PERMS,
    orgs: ["PGM"], branches: ["NOG", "SAL"], warehouses: ["NOG-01", "SAL-01"],
    products: ["TUB-PVC-100", "VAL-GLOBO-050"],
  },
  {
    key: "operator_DEMO_B", fullName: "E2E Operator",
    orgId: ORG_DEMO_B, branchId: BRANCH_BSAL, roleId: ROLE_OPERATOR,
    perms: OPERATOR_PERMS,
    orgs: ["PGM-DEMO-B"], branches: ["BSAL"], warehouses: [],
    products: ["P-DEMO-B"],
  },
  {
    key: "inactive_PGM", fullName: "E2E Inactive",
    orgId: ORG_PGM, branchId: BRANCH_NOG, roleId: ROLE_CASHIER, inactive: true,
    perms: [],
    orgs: [], branches: [], warehouses: [],
    products: [],
  },
  {
    key: "no_membership", fullName: "E2E No Membership",
    orgId: null, branchId: null, roleId: null,
    perms: [],
    orgs: [], branches: [], warehouses: [],
    products: [],
  },
];

let failures = 0;
const createdUids = [];

function check(label, ok, detail = "") {
  const status = ok ? "PASS" : "FAIL";
  if (!ok) failures += 1;
  console.log(` ${status} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function jsonRequest(path, { method = "POST", body, headers = {}, expectStatus } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { apikey: ANON_KEY, ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`expected HTTP ${expectStatus}, got ${res.status}: ${text}`);
  }
  return { status: res.status, json, text };
}

function sql(sqlText, { authAdmin = false } = {}) {
  const args = authAdmin
    ? ["exec", "-e", "PGPASSWORD=postgres", "-i", DB_CONTAINER, "psql", "-U", "supabase_auth_admin", "-h", "127.0.0.1", "-p", "5432", "-d", "postgres", "-t", "-A"]
    : ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-t", "-A"];
  const r = spawnSync("docker", args, { encoding: "utf8", input: sqlText });
  if (r.status !== 0) {
    throw new Error(`psql failed (exit ${r.status}): ${(r.stderr || "").trim()}`);
  }
  return r.stdout.trim();
}

function provision(uid, scenario) {
  if (!scenario.orgId) return;
  const statements = [
    `update public.profiles set full_name = '${scenario.fullName}', status = '${scenario.inactive ? "inactive" : "active"}' where id = '${uid}';`,
    `insert into public.organization_memberships (organization_id, user_id, status) values ('${scenario.orgId}', '${uid}', 'active') on conflict do nothing;`,
    `insert into public.user_role_assignments (organization_id, user_id, role_id, branch_id, status) values ('${scenario.orgId}', '${uid}', '${scenario.roleId}', '${scenario.branchId}', 'active') on conflict do nothing;`,
  ];
  sql(statements.join("\n"));
}

async function userRpc(token, fn) {
  const res = await jsonRequest(`/rest/v1/rpc/${fn}`, {
    method: "POST",
    body: {},
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json ?? null;
}

async function userSelect(token, table, query) {
  const res = await jsonRequest(`/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) {
    throw new Error(`GET /rest/v1/${table} failed with HTTP ${res.status}: ${res.text}`);
  }
  return res.json ?? [];
}

const sortedCodes = (rows) => (rows ?? []).map((r) => r.code).sort();

console.log(`\nPGadm Identity/RBAC/RLS E2E (GoTrue @ ${API_URL}, db container ${DB_CONTAINER})\n`);

try {
  // ---- 0. GoTrue healthy -----------------------------------------------
  const health = await jsonRequest("/auth/v1/health", { method: "GET", expectStatus: 200 });
  check("GoTrue auth endpoint healthy", typeof health.json?.version === "string", health.json?.version);

  for (const scenario of SCENARIOS) {
    const email = `e2e-identity-${scenario.key}-${Date.now()}@pgm.e2e`;
    const password = "E2e-Pass-2026-1B3D2";

    // ---- 1. Real signup (anon key only) ---------------------------------
    const signup = await jsonRequest("/auth/v1/signup", {
      body: { email, password },
      expectStatus: 200,
    });
    const uid = signup.json?.user?.id;
    check(`[${scenario.key}] signup returns a user id`, typeof uid === "string" && uid.length === 36, email);
    createdUids.push(uid);

    // ---- 2. Provision RLS fixtures (membership + role assignment) -------
    provision(uid, scenario);

    // ---- 3. Password sign-in ----------------------------------------------
    const signin = await jsonRequest("/auth/v1/token?grant_type=password", {
      body: { email, password },
      expectStatus: 200,
    });
    const token = signin.json?.access_token;
    const refreshToken = signin.json?.refresh_token;
    check(`[${scenario.key}] sign-in returns a JWT`, typeof token === "string" && token.length > 20);

    // ---- 4. Effective permissions via the public RPC ----------------------
    const permRows = await userRpc(token, "current_user_permissions");
    const permCodes = (permRows ?? []).map((p) => p.code).sort();
    check(
      `[${scenario.key}] current_user_permissions = ${JSON.stringify(scenario.perms)}`,
      JSON.stringify(permCodes) === JSON.stringify(scenario.perms),
      JSON.stringify(permCodes)
    );

    // ---- 5. RLS scoping through PostgREST (own org only) ------------------
    const orgCodes = sortedCodes(await userSelect(token, "organizations", "select=code&order=code"));
    check(`[${scenario.key}] RLS organizations scoped`, JSON.stringify(orgCodes) === JSON.stringify(scenario.orgs), JSON.stringify(orgCodes));

    const branchCodes = sortedCodes(await userSelect(token, "branches", "select=code&order=code"));
    check(`[${scenario.key}] RLS branches scoped`, JSON.stringify(branchCodes) === JSON.stringify(scenario.branches), JSON.stringify(branchCodes));

    const warehouseCodes = sortedCodes(await userSelect(token, "warehouses", "select=code&order=code"));
    check(`[${scenario.key}] RLS warehouses scoped`, JSON.stringify(warehouseCodes) === JSON.stringify(scenario.warehouses), JSON.stringify(warehouseCodes));

    const productRows = await userSelect(token, "products", "select=external_id&order=external_id");
    const productExternals = (productRows ?? []).map((r) => r.external_id).sort();
    check(`[${scenario.key}] RLS products scoped`, JSON.stringify(productExternals) === JSON.stringify(scenario.products), JSON.stringify(productExternals));

    // ---- 6. Negative cross-org: INSERT into a foreign org is blocked ------
    if (scenario.orgId) {
      const foreignOrg = scenario.orgId === ORG_PGM ? ORG_DEMO_B : ORG_PGM;
      const insert = await jsonRequest("/rest/v1/branches", {
        method: "POST",
        body: { organization_id: foreignOrg, code: "E2E-FOREIGN", name: "E2E foreign", branch_type: "store", status: "active", country: "MX" },
        headers: { Authorization: `Bearer ${token}` },
      });
      check(`[${scenario.key}] cross-org INSERT blocked`, insert.status >= 400, `HTTP ${insert.status}`);
    }

    // ---- 7. Logout invalidates the refresh token ---------------------------
    if (scenario.key === "manager_PGM" && typeof refreshToken === "string") {
      const logout = await jsonRequest("/auth/v1/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      check("logout accepted by GoTrue", logout.status === 200 || logout.status === 204, `HTTP ${logout.status}`);

      const refresh = await jsonRequest("/auth/v1/token?grant_type=refresh_token", {
        body: { refresh_token: refreshToken },
      });
      check("refresh token rejected after logout", refresh.status >= 400, `HTTP ${refresh.status}`);
    }
  }
} catch (e) {
  failures += 1;
  console.log(` FAIL unhandled error — ${e.message}`);
} finally {
  // ---- 8. Cleanup -----------------------------------------------------------
  // user_role_assignments has a RESTRICT FK to organization_memberships, so
  // delete order matters: assignments -> memberships -> auth.users (cascades to
  // profiles via migration 005). Runs as superuser (postgres).
  if (createdUids.length > 0) {
    const ids = createdUids.map((id) => `'${id}'`).join(", ");
    sql(
      `begin;` +
        `delete from public.user_role_assignments where user_id in (${ids});` +
        `delete from public.organization_memberships where user_id in (${ids});` +
        `delete from auth.users where id in (${ids});` +
        `commit;`
    );
    const left = sql(
      `select (select count(*) from auth.users where id in (${ids})) || '|' ||
              (select count(*) from public.profiles where id in (${ids}))`
    );
    const [authLeft, profileLeft] = left.split("|");
    check("cleanup removed auth users", authLeft === "0");
    check("cleanup cascaded to profiles", profileLeft === "0");
  }
}

console.log(`\nE2E result: ${failures === 0 ? "PASS" : "FAIL"} (${failures} failure(s))\n`);
process.exitCode = failures === 0 ? 0 : 1;

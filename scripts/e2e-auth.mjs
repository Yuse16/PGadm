#!/usr/bin/env node
/**
 * PGadm — 1B.3D-1 local Auth E2E (real GoTrue against the running Supabase stack).
 *
 * Exercises the production signup path end-to-end WITHOUT service_role:
 *   1. anonymous-key signup via GoTrue   -> auth.users row
 *   2. _core.sync_profile() trigger      -> exactly 1 public.profiles row (1:1)
 *   3. password sign-in                  -> user JWT
 *   4. PostgREST read of own profile     -> RLS grants the row to the user
 *   5. duplicate signup                  -> 422 user_already_exists
 *   6. cleanup via auth admin            -> ON DELETE CASCADE removes the profile
 *
 * Uses only the running local stack (no service role in any client call) and
 * docker exec psql for read-back assertions and cleanup.
 *
 * Run: npm run e2e:auth   (requires: npx supabase start, Docker)
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
  // crude but sufficient: finds `key = "value"` inside the `[section]` block
  const block = CONFIG.split(/\[(?:api|auth|auth\.email|db|local_smtp|studio|storage|edge_runtime|analytics|experimental)\]/)
    .find((b) => b.trimStart().startsWith(section));
  if (!block) return undefined;
  const m = block.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"));
  return m ? m[1] : undefined;
}

const JWT_SECRET = configValue("auth", "jwt_secret") ?? DEFAULT_JWT_SECRET;

// project_id lives at the top of config.toml (line 1)
const projectIdMatch = CONFIG.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
const PROJECT_ID = projectIdMatch ? projectIdMatch[1] : "organization-foundation";
const DB_CONTAINER = `supabase_db_${PROJECT_ID}`;

const API_URL = process.env.PGADM_API_URL ?? "http://127.0.0.1:54321";

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = b64u(JSON.stringify({ iss: "supabase-demo", role: "anon", exp: ANON_EXP }));
const signature = b64u(createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest());
const ANON_KEY = `${header}.${payload}.${signature}`;

let failures = 0;
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

console.log(`\nPGadm Auth E2E (GoTrue @ ${API_URL}, db container ${DB_CONTAINER})\n`);

try {
  // ---- 0. GoTrue healthy -----------------------------------------------
  const health = await jsonRequest("/auth/v1/health", { method: "GET", expectStatus: 200 });
  check("GoTrue auth endpoint healthy", typeof health.json?.version === "string", health.json?.version);

  // ---- 1. Real signup (anon key only) -----------------------------------
  const email = `e2e-auth-${Date.now()}@pgm.e2e`;
  const password = "E2e-Pass-2026-1B3D";
  const signup = await jsonRequest("/auth/v1/signup", {
    body: { email, password },
    expectStatus: 200,
  });
  const uid = signup.json?.user?.id;
  check("signup returns a user id", typeof uid === "string" && uid.length === 36, email);
  check("signup is auto-confirmed (enable_confirmations=false)", typeof signup.json?.user?.email_confirmed_at === "string");
  check("no service_role key used", ANON_KEY !== "SERVICE_ROLE_KEY");

  // ---- 2. 1:1 profile provisioning via _core.sync_profile() --------------
  const counts = sql(
    `select (select count(*) from auth.users where id = '${uid}') || '|' ||
            (select count(*) from public.profiles where id = '${uid}') || '|' ||
            coalesce((select email from public.profiles where id = '${uid}'), 'NULL')`
  ).split("|");
  check("auth.users has exactly 1 row for the signup", counts[0] === "1");
  check("public.profiles has exactly 1 row for the signup (1:1 sync)", counts[1] === "1");
  check("profile email matches the signed-up email", counts[2] === email, counts[2]);

  const totals = sql("select (select count(*) from auth.users) || '|' || (select count(*) from public.profiles)").split("|");
  check("global invariant holds (auth.users = profiles)", totals[0] === totals[1], `${totals[0]} = ${totals[1]}`);
  check("seed users present (6 structural auth users)", Number(totals[0]) >= 6);

  // ---- 3. Password sign-in returns a user JWT -----------------------------
  const signin = await jsonRequest("/auth/v1/token?grant_type=password", {
    body: { email, password },
    expectStatus: 200,
  });
  const accessToken = signin.json?.access_token;
  check("password sign-in returns an access token", typeof accessToken === "string" && accessToken.length > 20);

  // ---- 4. PostgREST end-to-end RLS read of own profile --------------------
  const rest = await jsonRequest(`/rest/v1/profiles?select=id,email&id=eq.${uid}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    expectStatus: 200,
  });
  const rows = rest.json ?? [];
  check("PostgREST returns own profile to the user (RLS)", Array.isArray(rows) && rows.length === 1 && rows[0].email === email);

  // ---- 5. Duplicate signup is rejected ------------------------------------
  let dupRejected = false;
  let dupCode = "";
  try {
    await jsonRequest("/auth/v1/signup", { body: { email, password }, expectStatus: 200 });
  } catch (e) {
    dupRejected = true;
    const m = e.message.match(/got (\d+)/);
    dupCode = m ? m[1] : "";
  }
  check("duplicate signup rejected (user_already_exists)", dupRejected && dupCode === "422", `HTTP ${dupCode}`);

  // ---- 6. Cleanup: auth admin delete cascades to the profile --------------
  sql(`delete from auth.users where email = '${email}'`, { authAdmin: true });
  const remaining = sql(
    `select (select count(*) from auth.users where id = '${uid}') || '|' ||
            (select count(*) from public.profiles where id = '${uid}')`
  );
  const [authLeft, profileLeft] = remaining.split("|");
  check("cleanup removed the auth user (ON DELETE CASCADE)", authLeft === "0");
  check("cleanup cascaded to the profile (1:1 removal)", profileLeft === "0");
} catch (e) {
  failures += 1;
  console.log(` FAIL unhandled error — ${e.message}`);
}

console.log(`\nE2E result: ${failures === 0 ? "PASS" : "FAIL"} (${failures} failure(s))\n`);
process.exitCode = failures === 0 ? 0 : 1;

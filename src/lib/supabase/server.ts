import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getClientEnv } from "./config";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client wired to the Next.js cookie store via
 * `@supabase/ssr` (Phase 1B.3D-2). Uses the ANON key with the user's own
 * session cookies: every query is scoped by RLS to the current user
 * (`_access.current_user_id()`), never by service_role.
 *
 * Security decisions (F1B3_DECISION_MATRIX D17/D18, D09/T09):
 * - anon key only; service_role is never used from the app.
 * - PKCE forced; JWT carries identity only (`sub`), never org/role claims.
 * - `getUser()` (JWT verification) is authoritative for auth; `getSession()`
 *   is used only for non-authoritative session metadata (expiry display).
 */
export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const env = getClientEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Setting cookies during a Server Component render is not allowed;
            // safe to ignore here (server actions / route handlers can write).
          }
        },
      },
      auth: {
        flowType: "pkce",
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

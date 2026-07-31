import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "./config";
import type { Database } from "@/types/database";

export function createSupabaseServerClient() {
  const env = getClientEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

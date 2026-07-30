import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "./config";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (client) {
    return client;
  }

  const env = getClientEnv();

  client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

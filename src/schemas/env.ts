let cachedEnv: Record<string, string | undefined> | null = null;

function getEnv(): Record<string, string | undefined> {
  if (!cachedEnv) {
    if (typeof process !== "undefined" && process.env) {
      cachedEnv = { ...process.env };
    } else {
      cachedEnv = {};
    }
  }
  return cachedEnv;
}

export function resetEnvCache() {
  cachedEnv = null;
}

export function getSupabaseUrl(): string {
  const env = getEnv();
  const value = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    return "";
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const env = getEnv();
  const value = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    return "";
  }
  return value;
}

export function hasSupabaseConfig(): boolean {
  const env = getEnv();
  return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

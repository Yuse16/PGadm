const requiredServerVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const optionalServerVars = [
  "SUPABASE_JWT_SECRET",
] as const;

const requiredClientVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type ServerEnv = Record<(typeof requiredServerVars)[number], string> &
  Partial<Record<(typeof optionalServerVars)[number], string>>;

type ClientEnv = Record<(typeof requiredClientVars)[number], string>;

export function getServerEnv(): ServerEnv {
  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(", ")}`
    );
  }

  const env: Record<string, string | undefined> = {};
  for (const key of requiredServerVars) {
    env[key] = process.env[key]!;
  }
  for (const key of optionalServerVars) {
    if (process.env[key]) {
      env[key] = process.env[key]!;
    }
  }

  return env as ServerEnv;
}

export function getClientEnv(): ClientEnv {
  const missing: string[] = [];

  for (const key of requiredClientVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required client environment variables: ${missing.join(", ")}`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

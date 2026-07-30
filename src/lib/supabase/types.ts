export type SupabaseEnv =
  | { type: "client"; url: string; anonKey: string }
  | { type: "server"; url: string; serviceRoleKey: string; jwtSecret?: string };

export type SupabaseClientRole = "authenticated" | "anon" | "service_role";

export interface SupabaseConfig {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
}

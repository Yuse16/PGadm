import { describe, it, expect, beforeEach, vi } from "vitest";
import { getServerEnv, getClientEnv } from "@/lib/supabase/config";

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("getServerEnv", () => {
  it("throws when required server vars are missing", () => {
    expect(() => getServerEnv()).toThrow("Missing required server environment variables");
  });

  it("returns env when all required vars are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");

    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-key-123");
  });

  it("does not throw when optional vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");

    expect(() => getServerEnv()).not.toThrow();
  });

  it("includes optional vars when present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-456");

    const env = getServerEnv();
    expect(env.SUPABASE_JWT_SECRET).toBe("jwt-secret-456");
  });
});

describe("getClientEnv", () => {
  it("throws when client vars are missing", () => {
    expect(() => getClientEnv()).toThrow("Missing required client environment variables");
  });

  it("throws when only url is present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");

    expect(() => getClientEnv()).toThrow("Missing required client environment variables");
  });

  it("returns env when all client vars are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-789");

    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-789");
  });
});

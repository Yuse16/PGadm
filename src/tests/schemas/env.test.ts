import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig, resetEnvCache } from "@/schemas/env";

beforeEach(() => {
  resetEnvCache();
  vi.unstubAllEnvs();
});

describe("getSupabaseUrl", () => {
  it("returns empty string when env var is missing", () => {
    expect(getSupabaseUrl()).toBe("");
  });

  it("returns value when env var is present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });
});

describe("getSupabaseAnonKey", () => {
  it("returns empty string when env var is missing", () => {
    expect(getSupabaseAnonKey()).toBe("");
  });

  it("returns value when env var is present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-789");
    expect(getSupabaseAnonKey()).toBe("anon-key-789");
  });
});

describe("hasSupabaseConfig", () => {
  it("returns false when both vars are missing", () => {
    expect(hasSupabaseConfig()).toBe(false);
  });

  it("returns false when only url is present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(hasSupabaseConfig()).toBe(false);
  });

  it("returns true when both vars are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-789");
    expect(hasSupabaseConfig()).toBe(true);
  });

  it("handles empty string values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(hasSupabaseConfig()).toBe(false);
  });

  it("does not throw during build when no env is configured", () => {
    expect(() => hasSupabaseConfig()).not.toThrow();
    expect(() => getSupabaseUrl()).not.toThrow();
    expect(() => getSupabaseAnonKey()).not.toThrow();
  });
});

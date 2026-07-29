import { describe, it, expect } from "vitest";
import { cn, formatVersion } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, "b", null, undefined)).toBe("a b");
  });

  it("returns empty string for no classes", () => {
    expect(cn()).toBe("");
  });
});

describe("formatVersion", () => {
  it("prefixes with v", () => {
    expect(formatVersion("0.1.0")).toBe("v0.1.0");
  });
});

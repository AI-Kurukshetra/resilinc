import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/lib/auth/redirects";

describe("sanitizeNextPath", () => {
  it("returns fallback when next path is missing", () => {
    expect(sanitizeNextPath(undefined, "/overview")).toBe("/overview");
  });

  it("allows safe internal paths", () => {
    expect(sanitizeNextPath("/overview?tab=risk", "/overview")).toBe("/overview?tab=risk");
  });

  it("blocks external-looking paths", () => {
    expect(sanitizeNextPath("//evil.example.com", "/overview")).toBe("/overview");
  });

  it("blocks api paths", () => {
    expect(sanitizeNextPath("/api/auth/logout", "/overview")).toBe("/overview");
  });
});

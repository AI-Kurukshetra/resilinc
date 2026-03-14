import { describe, expect, it } from "vitest";
import {
  LoginRequestSchema,
  ResetPasswordRequestSchema,
  SignupRequestSchema,
} from "@/lib/validations/auth";

describe("auth validation schemas", () => {
  it("accepts valid login payload and normalizes email", () => {
    const parsed = LoginRequestSchema.safeParse({
      email: "USER@Example.COM ",
      password: "secret-value",
      next: "/overview",
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.email).toBe("user@example.com");
    }
  });

  it("rejects login payload without password", () => {
    const parsed = LoginRequestSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects signup payload when passwords do not match", () => {
    const parsed = SignupRequestSchema.safeParse({
      email: "user@example.com",
      password: "password-123",
      confirmPassword: "different-password",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects reset payload with invalid email", () => {
    const parsed = ResetPasswordRequestSchema.safeParse({
      email: "not-an-email",
    });

    expect(parsed.success).toBe(false);
  });
});

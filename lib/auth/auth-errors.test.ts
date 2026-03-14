import { describe, expect, it } from "vitest";
import { normalizeAuthError } from "@/lib/auth/auth-errors";

describe("normalizeAuthError", () => {
  it("maps rate-limit errors to AUTH_RATE_LIMITED", () => {
    const rateLimitedError = {
      name: "AuthApiError",
      message: "For security purposes, you can only request this once every 60 seconds",
      status: 429,
      code: "over_email_send_rate_limit",
    };

    const normalized = normalizeAuthError(rateLimitedError, "AUTH_RESET_FAILED", "Reset failed");

    expect(normalized.code).toBe("AUTH_RATE_LIMITED");
    expect(normalized.status).toBe(429);
    expect(normalized.retryAfterSeconds).toBe(60);
    expect(normalized.message).toContain("1 minute");
  });

  it("extracts minute-based wait values from provider messages", () => {
    const rateLimitedError = {
      name: "AuthApiError",
      message: "Please wait 2 minutes before trying again.",
      status: 429,
      code: "over_email_send_rate_limit",
    };

    const normalized = normalizeAuthError(rateLimitedError, "AUTH_RESET_FAILED", "Reset failed");

    expect(normalized.code).toBe("AUTH_RATE_LIMITED");
    expect(normalized.retryAfterSeconds).toBe(120);
    expect(normalized.message).toContain("2 minutes");
  });

  it("keeps fallback code/message for non-rate-limit errors", () => {
    const invalidEmailError = {
      name: "AuthApiError",
      message: "Invalid email",
      status: 400,
      code: "email_address_invalid",
    };

    const normalized = normalizeAuthError(invalidEmailError, "AUTH_RESET_FAILED", "Reset failed");

    expect(normalized.code).toBe("AUTH_RESET_FAILED");
    expect(normalized.status).toBe(400);
    expect(normalized.message).toBe("Invalid email");
  });
});

import { normalizeAuthError } from "@/lib/auth/auth-errors";
import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResetPasswordRequestSchema } from "@/lib/validations/auth";

function buildEmailRedirectTo(request: Request): string {
  const requestUrl = new URL(request.url);
  return `${requestUrl.origin}/auth/callback?next=/overview`;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = ResetPasswordRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        {
          code: "AUTH_VALIDATION_ERROR",
          message: "Invalid resend confirmation payload",
          fieldErrors: zodFieldErrors(parsed.error),
        },
        400,
      );
    }

    const supabase = await createServerSupabaseClient();
    const { email } = parsed.data;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildEmailRedirectTo(request),
      },
    });

    if (error) {
      const normalized = normalizeAuthError(
        error,
        "AUTH_RESEND_CONFIRMATION_FAILED",
        "Unable to resend confirmation email",
      );

      return apiError(
        {
          code: normalized.code,
          message: normalized.message,
          retryAfterSeconds: normalized.retryAfterSeconds,
        },
        normalized.status,
      );
    }

    return apiSuccess({
      message: "Confirmation email resent. Please check inbox/spam folders.",
    });
  } catch {
    return apiError(
      {
        code: "AUTH_RESEND_CONFIRMATION_SERVER_ERROR",
        message: "Resend failed due to an unexpected server error",
      },
      500,
    );
  }
}

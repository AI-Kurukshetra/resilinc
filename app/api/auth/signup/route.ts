import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { normalizeAuthError } from "@/lib/auth/auth-errors";
import {
  apiError,
  apiSuccess,
  readJsonBody,
  zodFieldErrors,
} from "@/lib/api/responses";
import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  sanitizeNextPath,
} from "@/lib/auth/redirects";
import { SignupRequestSchema } from "@/lib/validations/auth";

function buildEmailRedirectTo(request: Request): string {
  const requestUrl = new URL(request.url);
  return `${requestUrl.origin}/auth/callback?next=/overview`;
}

function shouldAutoConfirmDevSignup(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const isLocalHost =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const flagEnabled = process.env.AUTH_DEV_AUTO_CONFIRM_SIGNUP === "true";
  const isNonProduction = process.env.NODE_ENV !== "production";

  return isLocalHost && flagEnabled && isNonProduction;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = SignupRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        {
          code: "AUTH_VALIDATION_ERROR",
          message: "Invalid signup payload",
          fieldErrors: zodFieldErrors(parsed.error),
        },
        400,
      );
    }

    const supabase = await createServerSupabaseClient();
    const { email, password, next } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildEmailRedirectTo(request),
      },
    });

    if (error) {
      const hasConflict = error.message.toLowerCase().includes("already");
      const normalized = normalizeAuthError(
        error,
        hasConflict ? "AUTH_USER_EXISTS" : "AUTH_SIGNUP_FAILED",
        "Unable to create account",
      );
      return apiError(
        {
          code: normalized.code,
          message: normalized.message,
          retryAfterSeconds: normalized.retryAfterSeconds,
        },
        hasConflict ? 409 : normalized.status,
      );
    }

    const hasSession = Boolean(data.session);
    const createdUserId = data.user?.id ?? null;

    if (!hasSession && createdUserId && shouldAutoConfirmDevSignup(request)) {
      try {
        const adminSupabase = createServiceRoleSupabaseClient();
        const { error: confirmError } = await adminSupabase.auth.admin.updateUserById(
          createdUserId,
          { email_confirm: true },
        );

        if (!confirmError) {
          const signInResult = await supabase.auth.signInWithPassword({ email, password });

          if (!signInResult.error && signInResult.data.session) {
            return apiSuccess(
              {
                autoConfirmedForLocalDev: true,
                redirectTo: sanitizeNextPath(next, DEFAULT_AUTHENTICATED_REDIRECT),
                requiresEmailConfirmation: false,
              },
              201,
            );
          }
        }
      } catch {
        // Fallback to normal confirmation-required flow below.
      }
    }

    return apiSuccess(
      {
        autoConfirmedForLocalDev: false,
        redirectTo: hasSession
          ? sanitizeNextPath(next, DEFAULT_AUTHENTICATED_REDIRECT)
          : `/login?checkEmail=1&email=${encodeURIComponent(email)}`,
        requiresEmailConfirmation: !hasSession,
      },
      201,
    );
  } catch {
    return apiError(
      {
        code: "AUTH_SIGNUP_SERVER_ERROR",
        message: "Signup failed due to an unexpected server error",
      },
      500,
    );
  }
}

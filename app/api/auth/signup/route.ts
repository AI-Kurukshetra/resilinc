import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    });

    if (error) {
      const hasConflict = error.message.toLowerCase().includes("already");
      return apiError(
        {
          code: hasConflict ? "AUTH_USER_EXISTS" : "AUTH_SIGNUP_FAILED",
          message: error.message || "Unable to create account",
        },
        hasConflict ? 409 : 400,
      );
    }

    const hasSession = Boolean(data.session);

    return apiSuccess(
      {
        redirectTo: hasSession
          ? sanitizeNextPath(next, DEFAULT_AUTHENTICATED_REDIRECT)
          : "/login?checkEmail=1",
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

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
import { LoginRequestSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = LoginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        {
          code: "AUTH_VALIDATION_ERROR",
          message: "Invalid login payload",
          fieldErrors: zodFieldErrors(parsed.error),
        },
        400,
      );
    }

    const supabase = await createServerSupabaseClient();
    const { email, password, next } = parsed.data;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return apiError(
        {
          code: "AUTH_INVALID_CREDENTIALS",
          message: error.message || "Invalid email or password",
        },
        401,
      );
    }

    return apiSuccess({
      redirectTo: sanitizeNextPath(next, DEFAULT_AUTHENTICATED_REDIRECT),
    });
  } catch {
    return apiError(
      {
        code: "AUTH_LOGIN_FAILED",
        message: "Login failed due to an unexpected server error",
      },
      500,
    );
  }
}

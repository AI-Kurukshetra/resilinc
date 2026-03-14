import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  apiError,
  apiSuccess,
  readJsonBody,
  zodFieldErrors,
} from "@/lib/api/responses";
import { ResetPasswordRequestSchema } from "@/lib/validations/auth";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const parsed = ResetPasswordRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        {
          code: "AUTH_VALIDATION_ERROR",
          message: "Invalid reset-password payload",
          fieldErrors: zodFieldErrors(parsed.error),
        },
        400,
      );
    }

    const supabase = await createServerSupabaseClient();
    const redirectTo = `${request.nextUrl.origin}/login`;

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo,
    });

    if (error) {
      return apiError(
        {
          code: "AUTH_RESET_FAILED",
          message: error.message || "Failed to send reset email",
        },
        400,
      );
    }

    return apiSuccess({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch {
    return apiError(
      {
        code: "AUTH_RESET_SERVER_ERROR",
        message: "Reset password failed due to an unexpected server error",
      },
      500,
    );
  }
}

import { apiError, apiSuccess } from "@/lib/api/responses";
import { DEFAULT_UNAUTHENTICATED_REDIRECT } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError(
        {
          code: "AUTH_LOGOUT_FAILED",
          message: error.message || "Failed to sign out",
        },
        400,
      );
    }

    return apiSuccess({ redirectTo: DEFAULT_UNAUTHENTICATED_REDIRECT });
  } catch {
    return apiError(
      {
        code: "AUTH_LOGOUT_SERVER_ERROR",
        message: "Logout failed due to an unexpected server error",
      },
      500,
    );
  }
}

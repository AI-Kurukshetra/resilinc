import { apiError, apiSuccess } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { NotificationServiceError, getUnreadCount } from "@/lib/notifications/service";

export async function GET() {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { organizationId, supabase, actorUserId } = contextResult.context;
  try {
    const data = await getUnreadCount(supabase, organizationId, actorUserId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "NOTIFICATION_COUNT_FAILED", message: "Unexpected error getting unread count." }, 500);
  }
}

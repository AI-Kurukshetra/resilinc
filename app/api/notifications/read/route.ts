import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { NotificationServiceError, markAsRead, markAllAsRead } from "@/lib/notifications/service";
import { NotificationMarkReadSchema } from "@/lib/validations/notifications";

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = NotificationMarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid mark-read data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase, actorUserId } = contextResult.context;
  try {
    if (parsed.data.all && actorUserId) {
      const result = await markAllAsRead(supabase, organizationId, actorUserId);
      return apiSuccess(result);
    }

    if (parsed.data.notificationId) {
      const notification = await markAsRead(supabase, organizationId, parsed.data.notificationId);
      return apiSuccess(notification);
    }

    return apiError({ code: "VALIDATION_ERROR", message: "Either notificationId or all:true must be provided." }, 400);
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "NOTIFICATION_MARK_READ_FAILED", message: "Unexpected error marking notification as read." }, 500);
  }
}

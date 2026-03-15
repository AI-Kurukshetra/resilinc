import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { NotificationServiceError, listNotifications, createNotification } from "@/lib/notifications/service";
import { NotificationListQuerySchema, NotificationCreateSchema } from "@/lib/validations/notifications";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = NotificationListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listNotifications(supabase, organizationId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "NOTIFICATION_LIST_FAILED", message: "Unexpected error listing notifications." }, 500);
  }
}

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = NotificationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid notification data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const notification = await createNotification(supabase, organizationId, parsed.data);
    return apiSuccess(notification, 201);
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "NOTIFICATION_CREATE_FAILED", message: "Unexpected error creating notification." }, 500);
  }
}

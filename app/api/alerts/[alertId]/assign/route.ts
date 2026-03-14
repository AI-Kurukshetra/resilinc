import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { AlertServiceError, assignAlertOwner } from "@/lib/alerts/service";
import { AlertAssignSchema, AlertIdParamSchema } from "@/lib/validations/alerts";

interface AlertAssignRouteContext {
  params: Promise<{ alertId: string }>;
}

export async function POST(request: Request, { params }: AlertAssignRouteContext) {
  const paramParsed = AlertIdParamSchema.safeParse(await params);
  if (!paramParsed.success) {
    return apiError(
      {
        code: "ALERT_PATH_VALIDATION_ERROR",
        message: "Invalid alert id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = AlertAssignSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "ALERT_ASSIGN_VALIDATION_ERROR",
        message: "Invalid alert owner assignment payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { actorUserId, organizationId, supabase } = contextResult.context;

  try {
    const alert = await assignAlertOwner(supabase, {
      actorUserId,
      alertId: paramParsed.data.alertId,
      organizationId,
      ownerId: parsed.data.ownerId,
    });

    return apiSuccess(alert);
  } catch (error) {
    if (error instanceof AlertServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      { code: "ALERT_ASSIGN_FAILED", message: "Unexpected error assigning alert owner." },
      500,
    );
  }
}

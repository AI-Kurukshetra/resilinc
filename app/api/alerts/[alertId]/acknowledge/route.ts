import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { acknowledgeAlert, AlertServiceError } from "@/lib/alerts/service";
import { AlertAcknowledgeSchema, AlertIdParamSchema } from "@/lib/validations/alerts";

interface AlertAcknowledgeRouteContext {
  params: Promise<{ alertId: string }>;
}

export async function POST(request: Request, { params }: AlertAcknowledgeRouteContext) {
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
  const parsed = AlertAcknowledgeSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return apiError(
      {
        code: "ALERT_ACKNOWLEDGE_VALIDATION_ERROR",
        message: "Invalid alert acknowledge payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { actorUserId, organizationId, supabase } = contextResult.context;

  try {
    const alert = await acknowledgeAlert(supabase, {
      actorUserId,
      alertId: paramParsed.data.alertId,
      body: parsed.data,
      organizationId,
    });

    return apiSuccess(alert);
  } catch (error) {
    if (error instanceof AlertServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      { code: "ALERT_ACKNOWLEDGE_FAILED", message: "Unexpected error acknowledging alert." },
      500,
    );
  }
}

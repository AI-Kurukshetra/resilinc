import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { createIncidentFromAlert, IncidentServiceError } from "@/lib/incidents/service";
import { IncidentFromAlertSchema } from "@/lib/validations/incidents";

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = IncidentFromAlertSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "INCIDENT_FROM_ALERT_VALIDATION_ERROR",
        message: "Invalid incident-from-alert payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const result = await createIncidentFromAlert(supabase, {
      alertId: parsed.data.alertId,
      allowLowSeverity: parsed.data.allowLowSeverity,
      organizationId,
    });

    return apiSuccess(result, result.created ? 201 : 200);
  } catch (error) {
    if (error instanceof IncidentServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      {
        code: "INCIDENT_FROM_ALERT_FAILED",
        message: "Unexpected error creating incident from alert.",
      },
      500,
    );
  }
}

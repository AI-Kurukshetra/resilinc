import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  IncidentServiceError,
  updateIncidentActionStatus,
} from "@/lib/incidents/service";
import {
  IncidentActionPathSchema,
  IncidentActionStatusUpdateSchema,
} from "@/lib/validations/incidents";

interface IncidentActionStatusRouteContext {
  params: Promise<{ actionId: string; incidentId: string }>;
}

export async function POST(request: Request, { params }: IncidentActionStatusRouteContext) {
  const paramParsed = IncidentActionPathSchema.safeParse(await params);
  if (!paramParsed.success) {
    return apiError(
      {
        code: "INCIDENT_ACTION_PATH_VALIDATION_ERROR",
        message: "Invalid incident/action path parameters.",
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
  const parsed = IncidentActionStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "INCIDENT_ACTION_STATUS_VALIDATION_ERROR",
        message: "Invalid incident action status payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const result = await updateIncidentActionStatus(supabase, {
      actionId: paramParsed.data.actionId,
      incidentId: paramParsed.data.incidentId,
      nextStatus: parsed.data.status,
      organizationId,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof IncidentServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      {
        code: "INCIDENT_ACTION_STATUS_UPDATE_FAILED",
        message: "Unexpected error updating incident action status.",
      },
      500,
    );
  }
}

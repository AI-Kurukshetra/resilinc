import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { closeIncident, IncidentServiceError } from "@/lib/incidents/service";
import { IncidentCloseSchema, IncidentIdParamSchema } from "@/lib/validations/incidents";

interface IncidentCloseRouteContext {
  params: Promise<{ incidentId: string }>;
}

export async function POST(request: Request, { params }: IncidentCloseRouteContext) {
  const paramParsed = IncidentIdParamSchema.safeParse(await params);
  if (!paramParsed.success) {
    return apiError(
      {
        code: "INCIDENT_PATH_VALIDATION_ERROR",
        message: "Invalid incident id.",
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
  const parsed = IncidentCloseSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return apiError(
      {
        code: "INCIDENT_CLOSE_VALIDATION_ERROR",
        message: "Invalid incident close payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const result = await closeIncident(supabase, organizationId, paramParsed.data.incidentId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof IncidentServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      { code: "INCIDENT_CLOSE_FAILED", message: "Unexpected error closing incident." },
      500,
    );
  }
}

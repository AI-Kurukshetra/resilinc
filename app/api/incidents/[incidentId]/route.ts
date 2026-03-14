import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { getIncidentById, IncidentServiceError } from "@/lib/incidents/service";
import { IncidentIdParamSchema } from "@/lib/validations/incidents";

interface IncidentDetailRouteContext {
  params: Promise<{ incidentId: string }>;
}

export async function GET(_request: Request, { params }: IncidentDetailRouteContext) {
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

  const { organizationId, supabase } = contextResult.context;

  try {
    const data = await getIncidentById(supabase, organizationId, paramParsed.data.incidentId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof IncidentServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      { code: "INCIDENT_LOOKUP_FAILED", message: "Unexpected error fetching incident." },
      500,
    );
  }
}

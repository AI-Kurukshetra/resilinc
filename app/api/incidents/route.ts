import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { IncidentServiceError, listIncidents } from "@/lib/incidents/service";
import { IncidentListQuerySchema } from "@/lib/validations/incidents";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = IncidentListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "INCIDENT_QUERY_VALIDATION_ERROR",
        message: "Invalid incident list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const data = await listIncidents(supabase, organizationId, queryParsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof IncidentServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      { code: "INCIDENT_LIST_FAILED", message: "Unexpected error listing incidents." },
      500,
    );
  }
}

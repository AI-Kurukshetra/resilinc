import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { AlertServiceError, listAlerts } from "@/lib/alerts/service";
import { AlertListQuerySchema } from "@/lib/validations/alerts";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = AlertListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "ALERT_QUERY_VALIDATION_ERROR",
        message: "Invalid alert list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const data = await listAlerts(supabase, organizationId, queryParsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AlertServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError({ code: "ALERT_LIST_FAILED", message: "Unexpected error listing alerts." }, 500);
  }
}

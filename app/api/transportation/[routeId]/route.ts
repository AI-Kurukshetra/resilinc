import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { TransportationServiceError, getRouteById, updateRoute } from "@/lib/transportation/service";
import { RouteIdParamSchema, RouteUpdateSchema } from "@/lib/validations/transportation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const resolvedParams = await params;
  const paramParsed = RouteIdParamSchema.safeParse(resolvedParams);
  if (!paramParsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid route ID.", fieldErrors: zodFieldErrors(paramParsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const route = await getRouteById(supabase, organizationId, paramParsed.data.routeId);
    return apiSuccess(route);
  } catch (error) {
    if (error instanceof TransportationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ROUTE_LOOKUP_FAILED", message: "Unexpected error looking up route." }, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> },
) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const resolvedParams = await params;
  const paramParsed = RouteIdParamSchema.safeParse(resolvedParams);
  if (!paramParsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid route ID.", fieldErrors: zodFieldErrors(paramParsed.error) },
      400,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = RouteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid route update data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const route = await updateRoute(supabase, organizationId, paramParsed.data.routeId, parsed.data);
    return apiSuccess(route);
  } catch (error) {
    if (error instanceof TransportationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ROUTE_UPDATE_FAILED", message: "Unexpected error updating route." }, 500);
  }
}

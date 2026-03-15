import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { TransportationServiceError, listRoutes, createRoute } from "@/lib/transportation/service";
import { RouteListQuerySchema, RouteCreateSchema } from "@/lib/validations/transportation";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = RouteListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listRoutes(supabase, organizationId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof TransportationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ROUTE_LIST_FAILED", message: "Unexpected error listing routes." }, 500);
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

  const parsed = RouteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid route data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const route = await createRoute(supabase, organizationId, parsed.data);
    return apiSuccess(route, 201);
  } catch (error) {
    if (error instanceof TransportationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ROUTE_CREATE_FAILED", message: "Unexpected error creating route." }, 500);
  }
}

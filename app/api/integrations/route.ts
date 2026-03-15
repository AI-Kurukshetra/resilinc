import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { IntegrationServiceError, listIntegrations, createIntegration } from "@/lib/integrations/service";
import { IntegrationListQuerySchema, IntegrationCreateSchema } from "@/lib/validations/integrations";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = IntegrationListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listIntegrations(supabase, organizationId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof IntegrationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INTEGRATION_LIST_FAILED", message: "Unexpected error listing integrations." }, 500);
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

  const parsed = IntegrationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid integration data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const integration = await createIntegration(supabase, organizationId, parsed.data);
    return apiSuccess(integration, 201);
  } catch (error) {
    if (error instanceof IntegrationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INTEGRATION_CREATE_FAILED", message: "Unexpected error creating integration." }, 500);
  }
}

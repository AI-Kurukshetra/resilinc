import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { IntegrationServiceError, updateIntegration } from "@/lib/integrations/service";
import { IntegrationIdParamSchema, IntegrationUpdateSchema } from "@/lib/validations/integrations";

interface Params {
  params: Promise<{ integrationId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { integrationId } = await params;
  const paramParsed = IntegrationIdParamSchema.safeParse({ integrationId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_INTEGRATION_ID", message: "Invalid integration ID." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("integrations")
    .select("id, organization_id, name, type, status, config, last_sync_at, error_message, created_at")
    .eq("organization_id", organizationId)
    .eq("id", integrationId)
    .maybeSingle();

  if (error) {
    return apiError({ code: "INTEGRATION_GET_FAILED", message: error.message }, 500);
  }

  if (!data) {
    return apiError({ code: "INTEGRATION_NOT_FOUND", message: "Integration not found." }, 404);
  }

  return apiSuccess(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { integrationId } = await params;
  const paramParsed = IntegrationIdParamSchema.safeParse({ integrationId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_INTEGRATION_ID", message: "Invalid integration ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = IntegrationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid update data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const integration = await updateIntegration(supabase, organizationId, integrationId, parsed.data);
    return apiSuccess(integration);
  } catch (error) {
    if (error instanceof IntegrationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INTEGRATION_UPDATE_FAILED", message: "Unexpected error updating integration." }, 500);
  }
}

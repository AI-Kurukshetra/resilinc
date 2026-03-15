import { apiError, apiSuccess } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { IntegrationServiceError, testConnection } from "@/lib/integrations/service";
import { IntegrationIdParamSchema } from "@/lib/validations/integrations";

interface Params {
  params: Promise<{ integrationId: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { integrationId } = await params;
  const paramParsed = IntegrationIdParamSchema.safeParse({ integrationId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_INTEGRATION_ID", message: "Invalid integration ID." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const result = await testConnection(supabase, organizationId, integrationId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof IntegrationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "CONNECTION_TEST_FAILED", message: "Unexpected error testing connection." }, 500);
  }
}

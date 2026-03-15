import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { MitigationServiceError, updateActionStatus } from "@/lib/mitigation/service";
import {
  ActionIdParamSchema,
  MitigationActionStatusUpdateSchema,
} from "@/lib/validations/mitigation";

interface Params {
  params: Promise<{ planId: string; actionId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { planId, actionId } = await params;
  const paramParsed = ActionIdParamSchema.safeParse({ planId, actionId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_PARAMS", message: "Invalid plan or action ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = MitigationActionStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid status.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const action = await updateActionStatus(
      supabase,
      organizationId,
      planId,
      actionId,
      parsed.data.status,
    );
    return apiSuccess(action);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ACTION_UPDATE_FAILED", message: "Unexpected error updating action." }, 500);
  }
}

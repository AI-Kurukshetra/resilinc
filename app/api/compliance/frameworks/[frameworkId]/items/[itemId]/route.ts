import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { ComplianceServiceError, updateItemStatus } from "@/lib/compliance/service";
import {
  ComplianceItemStatusUpdateSchema,
  ItemIdParamSchema,
} from "@/lib/validations/compliance";

interface Params {
  params: Promise<{ frameworkId: string; itemId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { frameworkId, itemId } = await params;
  if (!ItemIdParamSchema.safeParse({ frameworkId, itemId }).success) {
    return apiError({ code: "INVALID_PARAMS", message: "Invalid framework or item ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = ComplianceItemStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid status update.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const item = await updateItemStatus(supabase, organizationId, frameworkId, itemId, parsed.data);
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof ComplianceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ITEM_UPDATE_FAILED", message: "Unexpected error updating item." }, 500);
  }
}

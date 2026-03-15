import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  MitigationServiceError,
  completePlan,
  getPlanDetail,
  updatePlan,
} from "@/lib/mitigation/service";
import {
  MitigationPlanUpdateSchema,
  PlanIdParamSchema,
} from "@/lib/validations/mitigation";

interface Params {
  params: Promise<{ planId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { planId } = await params;
  const paramParsed = PlanIdParamSchema.safeParse({ planId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_PLAN_ID", message: "Invalid plan ID." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const plan = await getPlanDetail(supabase, organizationId, planId);
    return apiSuccess(plan);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PLAN_GET_FAILED", message: "Unexpected error fetching plan." }, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { planId } = await params;
  const paramParsed = PlanIdParamSchema.safeParse({ planId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_PLAN_ID", message: "Invalid plan ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  // Handle complete action
  if (body && typeof body === "object" && (body as Record<string, unknown>).action === "complete") {
    const { organizationId, supabase } = contextResult.context;
    try {
      const plan = await completePlan(supabase, organizationId, planId);
      return apiSuccess(plan);
    } catch (error) {
      if (error instanceof MitigationServiceError) {
        return apiError({ code: error.code, message: error.message }, error.status);
      }
      return apiError({ code: "PLAN_COMPLETE_FAILED", message: "Unexpected error completing plan." }, 500);
    }
  }

  const parsed = MitigationPlanUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid plan update.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const plan = await updatePlan(supabase, organizationId, planId, parsed.data);
    return apiSuccess(plan);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PLAN_UPDATE_FAILED", message: "Unexpected error updating plan." }, 500);
  }
}

import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { MitigationServiceError, createPlan, listPlans } from "@/lib/mitigation/service";
import {
  MitigationPlanCreateSchema,
  MitigationPlanListQuerySchema,
} from "@/lib/validations/mitigation";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = MitigationPlanListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listPlans(supabase, organizationId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PLAN_LIST_FAILED", message: "Unexpected error listing plans." }, 500);
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

  const parsed = MitigationPlanCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid plan data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const plan = await createPlan(supabase, organizationId, parsed.data);
    return apiSuccess(plan, 201);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PLAN_CREATE_FAILED", message: "Unexpected error creating plan." }, 500);
  }
}

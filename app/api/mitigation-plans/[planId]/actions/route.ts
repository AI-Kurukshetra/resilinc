import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { MitigationServiceError, addAction } from "@/lib/mitigation/service";
import {
  MitigationActionCreateSchema,
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
  const { data, error } = await supabase
    .from("mitigation_actions")
    .select("id, plan_id, organization_id, title, status, owner_id, due_date, notes, created_at")
    .eq("organization_id", organizationId)
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  if (error) {
    return apiError({ code: "ACTION_LIST_FAILED", message: error.message }, 500);
  }

  return apiSuccess({ items: data ?? [] });
}

export async function POST(request: Request, { params }: Params) {
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

  const parsed = MitigationActionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid action data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const action = await addAction(supabase, organizationId, planId, parsed.data);
    return apiSuccess(action, 201);
  } catch (error) {
    if (error instanceof MitigationServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ACTION_CREATE_FAILED", message: "Unexpected error creating action." }, 500);
  }
}

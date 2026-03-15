import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { PerformanceServiceError, addPerformanceRecord } from "@/lib/performance/service";
import { PerformanceRecordCreateSchema, PerformanceListQuerySchema } from "@/lib/validations/performance";
import { listPerformanceHistory } from "@/lib/performance/service";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = PerformanceListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  const supplierId = parsed.data.supplierId;

  if (!supplierId) {
    return apiError({ code: "MISSING_SUPPLIER_ID", message: "supplierId query parameter is required for listing." }, 400);
  }

  try {
    const data = await listPerformanceHistory(supabase, organizationId, supplierId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof PerformanceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PERFORMANCE_LIST_FAILED", message: "Unexpected error listing performance records." }, 500);
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

  const parsed = PerformanceRecordCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid performance data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const record = await addPerformanceRecord(supabase, organizationId, parsed.data);
    return apiSuccess(record, 201);
  } catch (error) {
    if (error instanceof PerformanceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PERFORMANCE_CREATE_FAILED", message: "Unexpected error creating performance record." }, 500);
  }
}

import { apiError, apiSuccess } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { PerformanceServiceError, listPerformanceHistory, getPerformanceSummary } from "@/lib/performance/service";
import { SupplierIdParamSchema, PerformanceListQuerySchema } from "@/lib/validations/performance";

interface Params {
  params: Promise<{ supplierId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { supplierId } = await params;
  const paramParsed = SupplierIdParamSchema.safeParse({ supplierId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_SUPPLIER_ID", message: "Invalid supplier ID." }, 400);
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = PerformanceListQuerySchema.safeParse(searchParams);
  const query = queryParsed.success ? queryParsed.data : { limit: 25, offset: 0 };

  const { organizationId, supabase } = contextResult.context;

  try {
    // If ?summary=true, return summary instead of history
    if (new URL(request.url).searchParams.get("summary") === "true") {
      const summary = await getPerformanceSummary(supabase, organizationId, supplierId);
      if (!summary) {
        return apiError({ code: "NO_PERFORMANCE_DATA", message: "No performance records found for this supplier." }, 404);
      }
      return apiSuccess(summary);
    }

    const data = await listPerformanceHistory(supabase, organizationId, supplierId, query);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof PerformanceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "PERFORMANCE_GET_FAILED", message: "Unexpected error fetching performance data." }, 500);
  }
}

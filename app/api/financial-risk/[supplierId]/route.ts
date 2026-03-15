import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { FinancialRiskServiceError, getFinancialHealth, upsertFinancialHealth } from "@/lib/financial-risk/service";
import { FinancialHealthUpsertSchema, SupplierIdParamSchema } from "@/lib/validations/financial-risk";

interface Params {
  params: Promise<{ supplierId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { supplierId } = await params;
  const paramParsed = SupplierIdParamSchema.safeParse({ supplierId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_SUPPLIER_ID", message: "Invalid supplier ID." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const health = await getFinancialHealth(supabase, organizationId, supplierId);
    if (!health) {
      return apiError({ code: "FINANCIAL_NOT_FOUND", message: "No financial health data found for this supplier." }, 404);
    }
    return apiSuccess(health);
  } catch (error) {
    if (error instanceof FinancialRiskServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "FINANCIAL_GET_FAILED", message: "Unexpected error fetching financial health." }, 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { supplierId } = await params;
  const paramParsed = SupplierIdParamSchema.safeParse({ supplierId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_SUPPLIER_ID", message: "Invalid supplier ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = FinancialHealthUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid financial health data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const health = await upsertFinancialHealth(supabase, organizationId, supplierId, parsed.data);
    return apiSuccess(health);
  } catch (error) {
    if (error instanceof FinancialRiskServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "FINANCIAL_UPSERT_FAILED", message: "Unexpected error upserting financial health." }, 500);
  }
}

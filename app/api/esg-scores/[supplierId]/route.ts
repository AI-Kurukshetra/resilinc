import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { EsgServiceError, getEsgScore, upsertEsgScore } from "@/lib/esg/service";
import { EsgScoreUpsertSchema, SupplierIdParamSchema } from "@/lib/validations/esg";

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
    const score = await getEsgScore(supabase, organizationId, supplierId);
    if (!score) {
      return apiError({ code: "ESG_NOT_FOUND", message: "No ESG score found for this supplier." }, 404);
    }
    return apiSuccess(score);
  } catch (error) {
    if (error instanceof EsgServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ESG_GET_FAILED", message: "Unexpected error fetching ESG score." }, 500);
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

  const parsed = EsgScoreUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid ESG score data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const score = await upsertEsgScore(supabase, organizationId, supplierId, parsed.data);
    return apiSuccess(score);
  } catch (error) {
    if (error instanceof EsgServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ESG_UPSERT_FAILED", message: "Unexpected error upserting ESG score." }, 500);
  }
}

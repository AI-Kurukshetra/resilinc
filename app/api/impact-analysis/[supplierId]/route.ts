import { z } from "zod";
import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { calculateBusinessImpact } from "@/lib/impact-analysis/service";

const SupplierIdParamSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier id."),
});

interface ImpactAnalysisRouteContext {
  params: Promise<{ supplierId: string }>;
}

export async function GET(_request: Request, { params }: ImpactAnalysisRouteContext) {
  const paramParsed = SupplierIdParamSchema.safeParse(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "IMPACT_ANALYSIS_PATH_VALIDATION_ERROR",
        message: "Invalid supplier id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  try {
    const impact = await calculateBusinessImpact(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      paramParsed.data.supplierId,
    );

    return apiSuccess(impact);
  } catch (error) {
    return apiError(
      {
        code: "IMPACT_ANALYSIS_FAILED",
        message: error instanceof Error ? error.message : "Failed to calculate business impact.",
      },
      500,
    );
  }
}

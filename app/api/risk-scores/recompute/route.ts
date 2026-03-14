import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  recomputeSupplierRiskScores,
  RiskScoringServiceError,
} from "@/lib/risk-scoring/engine";
import { RiskScoreRecomputeSchema } from "@/lib/validations/risk-scoring";

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = RiskScoreRecomputeSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return apiError(
      {
        code: "RISK_SCORE_RECOMPUTE_VALIDATION_ERROR",
        message: "Invalid risk score recompute payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const scores = await recomputeSupplierRiskScores(
      supabase,
      organizationId,
      parsed.data.supplierIds,
    );

    return apiSuccess({
      items: scores,
      riskEventId: parsed.data.riskEventId ?? null,
      updated: scores.length,
    });
  } catch (error) {
    if (error instanceof RiskScoringServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      {
        code: "RISK_SCORE_RECOMPUTE_FAILED",
        message: "Unexpected error recomputing supplier risk scores.",
      },
      500,
    );
  }
}

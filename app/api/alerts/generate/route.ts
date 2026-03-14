import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  AlertServiceError,
  generateAlertsFromScores,
} from "@/lib/alerts/service";
import {
  ensureIncidentForAlert,
  IncidentServiceError,
} from "@/lib/incidents/service";
import {
  recomputeSupplierRiskScores,
  RiskScoringServiceError,
} from "@/lib/risk-scoring/engine";
import { AlertGenerateSchema } from "@/lib/validations/alerts";

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = AlertGenerateSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return apiError(
      {
        code: "ALERT_GENERATE_VALIDATION_ERROR",
        message: "Invalid alert generation payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { actorUserId, organizationId, supabase } = contextResult.context;

  try {
    const scores = await recomputeSupplierRiskScores(
      supabase,
      organizationId,
      parsed.data.supplierIds,
    );

    const outcomes = await generateAlertsFromScores(supabase, {
      actorUserId,
      organizationId,
      riskEventId: parsed.data.riskEventId,
      scores,
    });

    let incidentsCreated = 0;
    for (const outcome of outcomes) {
      if (!outcome.alert || outcome.evaluatedSeverity < 4) {
        continue;
      }

      if (outcome.action !== "created" && outcome.action !== "escalated") {
        continue;
      }

      const result = await ensureIncidentForAlert(supabase, organizationId, outcome.alert.id);
      if (result.created) {
        incidentsCreated += 1;
      }
    }

    return apiSuccess({
      incidentsCreated,
      outcomes,
      scoresUpdated: scores.length,
      summary: {
        alertsCreated: outcomes.filter((outcome) => outcome.action === "created").length,
        alertsEscalated: outcomes.filter((outcome) => outcome.action === "escalated").length,
        alertsEvaluated: outcomes.length,
      },
    });
  } catch (error) {
    if (
      error instanceof AlertServiceError ||
      error instanceof RiskScoringServiceError ||
      error instanceof IncidentServiceError
    ) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }

    return apiError(
      {
        code: "ALERT_GENERATE_FAILED",
        message: "Unexpected error generating alerts from supplier scores.",
      },
      500,
    );
  }
}

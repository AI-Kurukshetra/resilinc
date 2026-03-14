import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateAlertsFromScores,
  type AlertGenerationOutcome,
} from "@/lib/alerts/service";
import { ensureIncidentForAlert } from "@/lib/incidents/service";
import {
  recomputeSupplierRiskScores,
  type SupplierRiskScoreDTO,
} from "@/lib/risk-scoring/engine";

export interface RiskEventWorkflowSummary {
  alertsCreated: number;
  alertsEscalated: number;
  alertsEvaluated: number;
  incidentsCreated: number;
  scoresUpdated: number;
  warnings: string[];
}

export async function runRiskEventWorkflow(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    organizationId: string;
    riskEventId?: string;
    supplierIds: string[];
  },
): Promise<RiskEventWorkflowSummary> {
  const dedupedSupplierIds = [...new Set(input.supplierIds)];

  if (dedupedSupplierIds.length === 0) {
    return {
      alertsCreated: 0,
      alertsEscalated: 0,
      alertsEvaluated: 0,
      incidentsCreated: 0,
      scoresUpdated: 0,
      warnings: [],
    };
  }

  const warnings: string[] = [];

  let scores: SupplierRiskScoreDTO[] = [];
  try {
    scores = await recomputeSupplierRiskScores(supabase, input.organizationId, dedupedSupplierIds);
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Risk scoring failed after event ingestion: ${error.message}`
        : "Risk scoring failed after event ingestion.",
    );
  }

  let alertOutcomes: AlertGenerationOutcome[] = [];
  if (scores.length > 0) {
    try {
      alertOutcomes = await generateAlertsFromScores(supabase, {
        actorUserId: input.actorUserId,
        organizationId: input.organizationId,
        riskEventId: input.riskEventId,
        scores,
      });
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Alert generation failed after scoring: ${error.message}`
          : "Alert generation failed after scoring.",
      );
    }
  }

  let incidentsCreated = 0;
  for (const outcome of alertOutcomes) {
    if (!outcome.alert) {
      continue;
    }

    if (outcome.evaluatedSeverity < 4) {
      continue;
    }

    if (outcome.action !== "created" && outcome.action !== "escalated") {
      continue;
    }

    try {
      const incidentResult = await ensureIncidentForAlert(
        supabase,
        input.organizationId,
        outcome.alert.id,
      );
      if (incidentResult.created) {
        incidentsCreated += 1;
      }
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Incident automation failed for alert ${outcome.alert.id}: ${error.message}`
          : `Incident automation failed for alert ${outcome.alert.id}.`,
      );
    }
  }

  return {
    alertsCreated: alertOutcomes.filter((outcome) => outcome.action === "created").length,
    alertsEscalated: alertOutcomes.filter((outcome) => outcome.action === "escalated").length,
    alertsEvaluated: alertOutcomes.length,
    incidentsCreated,
    scoresUpdated: scores.length,
    warnings,
  };
}

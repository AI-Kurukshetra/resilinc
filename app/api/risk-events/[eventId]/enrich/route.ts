import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { RiskEventIdParamSchema } from "@/lib/validations/risk-events";
import { enrichRiskEvent, RiskEventServiceError } from "@/lib/risk-events/ingestion";
import { runRiskEventWorkflow } from "@/lib/risk-events/workflow";

interface EnrichRouteContext {
  params: Promise<{ eventId: string }>;
}

// POST /api/risk-events/[eventId]/enrich
// Runs web search + weather adapters on an existing event and persists enriched payload + confidence.
export async function POST(_request: Request, { params }: EnrichRouteContext) {
  const resolvedParams = await params;
  const paramParsed = RiskEventIdParamSchema.safeParse(resolvedParams);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "RISK_EVENT_PATH_VALIDATION_ERROR",
        message: "Invalid risk event id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const { actorUserId, organizationId, supabase } = contextResult.context;

  try {
    const event = await enrichRiskEvent(supabase, organizationId, paramParsed.data.eventId);
    const workflow = await runRiskEventWorkflow(supabase, {
      actorUserId,
      organizationId,
      riskEventId: event.id,
      supplierIds: event.supplierLinks.map((link) => link.supplierId),
    });
    return apiSuccess({ event, workflow });
  } catch (err) {
    if (err instanceof RiskEventServiceError) {
      return apiError({ code: err.code, message: err.message }, err.status);
    }
    return apiError(
      { code: "RISK_EVENT_ENRICH_FAILED", message: "Unexpected error enriching risk event." },
      500,
    );
  }
}

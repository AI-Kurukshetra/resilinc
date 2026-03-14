import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { RiskEventCreateSchema, RiskEventListQuerySchema } from "@/lib/validations/risk-events";
import {
  ingestRiskEvent,
  listRiskEvents,
  RiskEventServiceError,
  RiskEventSupplierValidationError,
} from "@/lib/risk-events/ingestion";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = RiskEventListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "RISK_EVENT_QUERY_VALIDATION_ERROR",
        message: "Invalid risk event list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const result = await listRiskEvents(supabase, organizationId, queryParsed.data);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof RiskEventServiceError) {
      return apiError({ code: err.code, message: err.message }, err.status);
    }
    return apiError(
      { code: "RISK_EVENT_LIST_FAILED", message: "Unexpected error listing risk events." },
      500,
    );
  }
}

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = RiskEventCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "RISK_EVENT_VALIDATION_ERROR",
        message: "Invalid risk event payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  try {
    const event = await ingestRiskEvent(supabase, organizationId, parsed.data);
    // 200 when dedup detected an existing event; 201 when newly created (M3.S3.a)
    return apiSuccess(event, event.isDuplicate ? 200 : 201);
  } catch (err) {
    if (err instanceof RiskEventSupplierValidationError) {
      return apiError(
        {
          code: "RISK_EVENT_INVALID_SUPPLIER_IDS",
          message: err.message,
          fieldErrors: { affectedSupplierIds: err.invalidSupplierIds },
        },
        422,
      );
    }
    if (err instanceof RiskEventServiceError) {
      return apiError({ code: err.code, message: err.message }, err.status);
    }
    return apiError(
      { code: "RISK_EVENT_INGEST_FAILED", message: "Unexpected error ingesting risk event." },
      500,
    );
  }
}

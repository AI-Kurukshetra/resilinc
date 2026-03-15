import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { getRiskEventTimeSeries, getScoreTrendHistory } from "@/lib/analytics/historical";
import { HistoricalQuerySchema } from "@/lib/validations/analytics";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const { organizationId, supabase } = contextResult.context;

  const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = HistoricalQuerySchema.safeParse(queryParams);

  if (!parsed.success) {
    return apiError(
      {
        code: "ANALYTICS_QUERY_VALIDATION_ERROR",
        message: "Invalid analytics query parameters.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  try {
    const [timeSeries, scoreTrends] = await Promise.all([
      getRiskEventTimeSeries(supabase, {
        organizationId,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        granularity: parsed.data.granularity,
        supplierId: parsed.data.supplierId,
      }),
      getScoreTrendHistory(supabase, organizationId),
    ]);

    return apiSuccess({
      timeSeries: timeSeries.buckets,
      totalEvents: timeSeries.totalEvents,
      scoreTrends: scoreTrends.points,
    });
  } catch (error) {
    return apiError(
      {
        code: "ANALYTICS_QUERY_FAILED",
        message: error instanceof Error ? error.message : "Failed to load analytics data.",
      },
      500,
    );
  }
}

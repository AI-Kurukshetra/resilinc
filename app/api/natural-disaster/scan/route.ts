import { apiError, apiSuccess } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { scanFacilityWeatherRisks } from "@/lib/natural-disaster/monitor";

export async function POST() {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { organizationId, supabase } = contextResult.context;
  try {
    const result = await scanFacilityWeatherRisks(supabase, { organizationId });
    return apiSuccess(result);
  } catch (error) {
    return apiError(
      {
        code: "WEATHER_SCAN_FAILED",
        message: error instanceof Error ? error.message : "Unexpected error during weather scan.",
      },
      500,
    );
  }
}

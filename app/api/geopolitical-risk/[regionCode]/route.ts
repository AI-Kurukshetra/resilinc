import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { GeoRiskServiceError, getGeoRiskByRegion, upsertGeoRiskProfile } from "@/lib/geopolitical/service";
import { GeoRiskProfileUpsertSchema, RegionCodeParamSchema } from "@/lib/validations/geopolitical";

interface Params {
  params: Promise<{ regionCode: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { regionCode } = await params;
  const paramParsed = RegionCodeParamSchema.safeParse({ regionCode });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_REGION_CODE", message: "Invalid region code." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const profile = await getGeoRiskByRegion(supabase, organizationId, regionCode);
    if (!profile) {
      return apiError({ code: "GEO_NOT_FOUND", message: "No geopolitical risk profile found for this region." }, 404);
    }
    return apiSuccess(profile);
  } catch (error) {
    if (error instanceof GeoRiskServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "GEO_GET_FAILED", message: "Unexpected error fetching geopolitical profile." }, 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { regionCode } = await params;
  const paramParsed = RegionCodeParamSchema.safeParse({ regionCode });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_REGION_CODE", message: "Invalid region code." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  // Merge regionCode from URL path into body
  const merged = { ...(typeof body === "object" && body !== null ? body : {}), regionCode };
  const parsed = GeoRiskProfileUpsertSchema.safeParse(merged);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid profile data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const profile = await upsertGeoRiskProfile(supabase, organizationId, parsed.data);
    return apiSuccess(profile);
  } catch (error) {
    if (error instanceof GeoRiskServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "GEO_UPSERT_FAILED", message: "Unexpected error upserting profile." }, 500);
  }
}

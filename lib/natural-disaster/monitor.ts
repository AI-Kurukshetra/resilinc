import type { SupabaseClient } from "@supabase/supabase-js";
import { WeatherRiskAdapter } from "@/lib/risk-events/enrichment";

interface FacilityRow {
  id: string;
  name: string;
  country_code: string;
  lat: number;
  lng: number;
  supplier_id: string;
}

interface ScanResult {
  eventsCreated: number;
  facilitiesScanned: number;
  summary: Array<{
    facilityName: string;
    regionCode: string;
    severity: number;
    condition: string;
  }>;
}

export async function scanFacilityWeatherRisks(
  supabase: SupabaseClient,
  input: { organizationId: string },
): Promise<ScanResult> {
  // Query all org facilities with non-null lat/lng
  const { data: facilities, error: facilityError } = await supabase
    .from("facilities")
    .select("id, name, country_code, lat, lng, supplier_id")
    .eq("organization_id", input.organizationId)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (facilityError) {
    throw new Error(facilityError.message || "Failed to query facilities for weather scan.");
  }

  const validFacilities = ((facilities ?? []) as FacilityRow[]).filter(
    (f) => f.country_code && f.lat && f.lng,
  );

  if (validFacilities.length === 0) {
    return { eventsCreated: 0, facilitiesScanned: 0, summary: [] };
  }

  const weatherAdapter = new WeatherRiskAdapter();
  const now = new Date().toISOString();
  const summary: ScanResult["summary"] = [];
  let eventsCreated = 0;

  for (const facility of validFacilities) {
    const result = await weatherAdapter.getRiskForRegion(facility.country_code, now);

    if (!result.weatherRisk || result.weatherRisk.severity < 2) {
      continue;
    }

    // Check for existing recent natural_disaster event for this region to avoid duplicates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("risk_events")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("event_type", "natural_disaster")
      .eq("region_code", facility.country_code)
      .gte("observed_at", oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (existing) {
      summary.push({
        facilityName: facility.name,
        regionCode: facility.country_code,
        severity: result.weatherRisk.severity,
        condition: result.weatherRisk.condition,
      });
      continue;
    }

    // Create risk event
    const { error: insertError } = await supabase.from("risk_events").insert({
      organization_id: input.organizationId,
      event_type: "natural_disaster",
      severity: result.weatherRisk.severity,
      confidence: 0.6,
      region_code: facility.country_code,
      source_url: null,
      source_name: "weather_risk_adapter",
      observed_at: now,
      summary: `Weather risk detected at ${facility.name} (${facility.country_code}): ${result.weatherRisk.condition}`,
      payload: {
        _provenance: {
          ingestedAt: now,
          adapter: "weather_scan",
          facilityId: facility.id,
          facilityName: facility.name,
        },
        weatherRisk: result.weatherRisk,
        sources: result.sources,
      },
    });

    if (!insertError) {
      eventsCreated++;
    }

    summary.push({
      facilityName: facility.name,
      regionCode: facility.country_code,
      severity: result.weatherRisk.severity,
      condition: result.weatherRisk.condition,
    });
  }

  return {
    eventsCreated,
    facilitiesScanned: validFacilities.length,
    summary,
  };
}

import type { Metadata } from "next";
import { RiskTrendChart } from "@/app/(dashboard)/analytics/_components/risk-trend-chart";
import { DisruptionTimeline } from "@/app/(dashboard)/analytics/_components/disruption-timeline";
import { GeoRiskMap } from "@/app/(dashboard)/analytics/_components/geo-risk-map";
import { WeatherRiskPanel } from "@/app/(dashboard)/analytics/_components/weather-risk-panel";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getRiskEventTimeSeries, getScoreTrendHistory } from "@/lib/analytics/historical";
import { listGeoRiskProfiles } from "@/lib/geopolitical/service";

export const metadata: Metadata = {
  title: "Analytics | Resilinc Lite",
};

export default async function AnalyticsPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Analytics data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  let timeSeries;
  let scoreTrends;
  let recentEvents: Array<{
    id: string;
    event_type: string;
    severity: number;
    observed_at: string;
    summary: string;
    region_code: string | null;
  }> = [];

  try {
    [timeSeries, scoreTrends] = await Promise.all([
      getRiskEventTimeSeries(supabase, {
        organizationId,
        startDate: threeMonthsAgo.toISOString(),
        endDate: now.toISOString(),
        granularity: "week",
      }),
      getScoreTrendHistory(supabase, organizationId),
    ]);
  } catch {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load analytics data.
      </main>
    );
  }

  try {
    const { data: eventRows } = await supabase
      .from("risk_events")
      .select("id, event_type, severity, observed_at, summary, region_code")
      .eq("organization_id", organizationId)
      .order("observed_at", { ascending: false })
      .limit(20);

    recentEvents = (eventRows ?? []) as Array<{
      id: string;
      event_type: string;
      severity: number;
      observed_at: string;
      summary: string;
      region_code: string | null;
    }>;
  } catch {
    recentEvents = [];
  }

  // M10.S3.e: Geopolitical risk profiles with supplier counts
  let geoProfiles: Array<{
    regionCode: string;
    riskLevel: string;
    stabilityIndex: number | null;
    sanctionsActive: boolean;
    supplierCount: number;
  }> = [];

  try {
    const geoResult = await listGeoRiskProfiles(supabase, organizationId, { limit: 50, offset: 0 });

    // Count suppliers per region
    const { data: supplierRegions } = await supabase
      .from("suppliers")
      .select("region_code")
      .eq("organization_id", organizationId)
      .not("region_code", "is", null);

    const regionCounts = new Map<string, number>();
    for (const row of (supplierRegions ?? []) as Array<{ region_code: string }>) {
      regionCounts.set(row.region_code, (regionCounts.get(row.region_code) ?? 0) + 1);
    }

    geoProfiles = geoResult.items.map((p) => ({
      regionCode: p.regionCode,
      riskLevel: p.riskLevel,
      stabilityIndex: p.stabilityIndex,
      sanctionsActive: p.sanctionsActive,
      supplierCount: regionCounts.get(p.regionCode) ?? 0,
    }));
  } catch {
    geoProfiles = [];
  }

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Risk Analytics</h1>
          <p className="text-sm text-slate-600">
            Historical risk event trends and supplier score analysis.
          </p>
        </div>
        <p className="mac-pill px-3 py-1 text-sm">
          {timeSeries.totalEvents} events (last 3 months)
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="mac-surface rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Risk Event Trends</h2>
          <RiskTrendChart
            buckets={timeSeries.buckets}
            scoreTrends={scoreTrends.points}
          />
        </div>

        <div className="mac-surface rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Disruption Timeline</h2>
          <DisruptionTimeline events={recentEvents} />
        </div>
      </section>

      <section>
        <WeatherRiskPanel
          initialEvents={
            recentEvents
              .filter((e) => e.event_type === "natural_disaster")
              .slice(0, 10)
          }
        />
      </section>

      <section className="mac-surface rounded-2xl p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Geopolitical Risk Summary</h2>
        <p className="mb-3 text-sm text-slate-600">
          Region-level risk profiles with stability index, sanctions status, and affected supplier count.
        </p>
        <GeoRiskMap profiles={geoProfiles} />
      </section>
    </main>
  );
}

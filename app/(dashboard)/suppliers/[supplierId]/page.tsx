import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SupplierRiskTrend } from "@/app/(dashboard)/suppliers/_components/supplier-risk-trend";
import { BusinessImpactSection } from "@/app/(dashboard)/suppliers/_components/business-impact-section";
import { EsgScoreCard } from "@/app/(dashboard)/suppliers/_components/esg-score-card";
import { FinancialHealthCard } from "@/app/(dashboard)/suppliers/_components/financial-health-card";
import { PerformanceChart } from "@/app/(dashboard)/suppliers/_components/performance-chart";
import { getDashboardContext } from "@/lib/dashboard/context";
import { calculateBusinessImpact } from "@/lib/impact-analysis/service";
import { getEsgScore } from "@/lib/esg/service";
import { getFinancialHealth } from "@/lib/financial-risk/service";
import { getSupplierGeoRisk } from "@/lib/geopolitical/service";
import { getPerformanceSummary } from "@/lib/performance/service";

export const metadata: Metadata = {
  title: "Supplier Detail | Resilinc Lite",
};

interface SupplierDetailRouteContext {
  params: Promise<{ supplierId: string }>;
}

interface SupplierRow {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
  created_at: string;
}

interface RiskScoreRow {
  score: number | string;
  trend: "up" | "down" | "flat";
  explanation: Record<string, unknown>;
  scored_at: string;
}

interface RiskEventSupplierLinkRow {
  risk_event_id: string;
  impact_level: number;
}

interface RiskEventRow {
  id: string;
  event_type: string;
  severity: number;
  confidence: number;
  observed_at: string;
  summary: string;
  source_name: string | null;
  source_url: string | null;
  payload: Record<string, unknown>;
}

interface SupplierAlertRow {
  id: string;
  title: string;
  severity: number;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function readEventCount(explanation: Record<string, unknown> | undefined): number | null {
  if (!explanation) {
    return null;
  }

  const value = explanation.eventCount;
  return typeof value === "number" ? value : null;
}

function readTrendReason(explanation: Record<string, unknown> | undefined): string | null {
  if (!explanation) {
    return null;
  }

  const value = explanation.trendReason;
  return typeof value === "string" ? value : null;
}

export default async function SupplierDetailPage({ params }: SupplierDetailRouteContext) {
  const { supplierId } = await params;
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Supplier detail is unavailable without a valid organization context.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: supplierData, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active, created_at")
    .eq("organization_id", organizationId)
    .eq("id", supplierId)
    .maybeSingle();

  if (supplierError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load supplier detail: {supplierError.message}
      </main>
    );
  }

  if (!supplierData) {
    notFound();
  }

  const supplier = supplierData as SupplierRow;

  const [{ data: riskScoreData }, { data: linkRows }, { data: alertRows }] = await Promise.all([
    supabase
      .from("supplier_risk_scores")
      .select("score, trend, explanation, scored_at")
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId)
      .maybeSingle(),
    supabase
      .from("risk_event_suppliers")
      .select("risk_event_id, impact_level")
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId),
    supabase
      .from("alerts")
      .select("id, title, severity, status, created_at")
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const riskScore = (riskScoreData as RiskScoreRow | null) ?? null;
  const eventLinks = (linkRows as RiskEventSupplierLinkRow[] | null) ?? [];
  const recentAlerts = (alertRows as SupplierAlertRow[] | null) ?? [];

  const impactByEventId = new Map(eventLinks.map((row) => [row.risk_event_id, row.impact_level]));

  let riskEvents: RiskEventRow[] = [];

  if (eventLinks.length > 0) {
    const { data: eventRows } = await supabase
      .from("risk_events")
      .select("id, event_type, severity, confidence, observed_at, summary, source_name, source_url, payload")
      .eq("organization_id", organizationId)
      .in(
        "id",
        [...new Set(eventLinks.map((row) => row.risk_event_id))],
      )
      .order("observed_at", { ascending: false })
      .limit(10);

    riskEvents = (eventRows as RiskEventRow[] | null) ?? [];
  }

  let businessImpact = null;
  try {
    businessImpact = await calculateBusinessImpact(supabase, organizationId, supplierId);
  } catch {
    // Business impact is optional — do not block the page on failure
  }

  // M10: Extended risk dimensions — all optional, do not block page on failure
  let esgScore = null;
  let financialHealth = null;
  let geoRisk = null;
  try {
    [esgScore, financialHealth, geoRisk] = await Promise.all([
      getEsgScore(supabase, organizationId, supplierId).catch(() => null),
      getFinancialHealth(supabase, organizationId, supplierId).catch(() => null),
      getSupplierGeoRisk(supabase, organizationId, supplierId).catch(() => null),
    ]);
  } catch {
    // Extended risk dimensions are optional
  }

  // M11: Supplier performance summary — optional
  let perfSummary = null;
  try {
    perfSummary = await getPerformanceSummary(supabase, organizationId, supplierId);
  } catch {
    // Performance data is optional
  }

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Supplier Detail</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{supplier.name}</h1>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <p className="text-slate-600">
            Region: <span className="font-medium text-slate-900">{supplier.region_code ?? "N/A"}</span>
          </p>
          <p className="text-slate-600">
            Criticality: <span className="font-medium text-slate-900">C{supplier.criticality}</span>
          </p>
          <p className="text-slate-600">
            Status: <span className="font-medium text-slate-900">{supplier.is_active ? "Active" : "Inactive"}</span>
          </p>
          <p className="text-slate-600">
            Scored at: <span className="font-medium text-slate-900">{riskScore?.scored_at ?? "N/A"}</span>
          </p>
        </div>
        <div className="mt-3">
          <SupplierRiskTrend
            score={riskScore ? toNumber(riskScore.score) : null}
            trend={riskScore?.trend ?? null}
          />
          {riskScore ? (
            <p className="mt-1 text-xs text-slate-600">
              {readTrendReason(riskScore.explanation) ?? "Trend reason unavailable."}
              {typeof readEventCount(riskScore.explanation) === "number"
                ? ` Signals: ${readEventCount(riskScore.explanation)}`
                : ""}
            </p>
          ) : null}
        </div>
      </header>

      {businessImpact && <BusinessImpactSection impact={businessImpact} />}

      {(esgScore || financialHealth) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {esgScore && (
            <EsgScoreCard
              environmentalScore={esgScore.environmentalScore}
              socialScore={esgScore.socialScore}
              governanceScore={esgScore.governanceScore}
              compositeScore={esgScore.compositeScore}
              assessmentDate={esgScore.assessmentDate}
              notes={esgScore.notes}
            />
          )}
          {financialHealth && (
            <FinancialHealthCard
              creditRating={financialHealth.creditRating}
              altmanZScore={financialHealth.altmanZScore}
              revenueTrend={financialHealth.revenueTrend}
              debtToEquity={financialHealth.debtToEquity}
              daysPayableOutstanding={financialHealth.daysPayableOutstanding}
              financialRiskLevel={financialHealth.financialRiskLevel}
              assessedAt={financialHealth.assessedAt}
              notes={financialHealth.notes}
            />
          )}
        </section>
      )}

      {geoRisk && (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Geopolitical Risk</h2>
          <p className="mt-1 text-xs text-slate-500">Region-level risk profile linked via supplier region code.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Region</p>
              <p className="font-semibold text-slate-900">{geoRisk.regionCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk Level</p>
              <p className="font-semibold text-slate-900 capitalize">{geoRisk.riskLevel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Stability Index</p>
              <p className="font-semibold text-slate-900">{geoRisk.stabilityIndex !== null ? geoRisk.stabilityIndex.toFixed(1) : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sanctions</p>
              <p className="font-semibold text-slate-900">{geoRisk.sanctionsActive ? "Active" : "None"}</p>
            </div>
          </div>
          {geoRisk.tradeRestrictionNotes && (
            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{geoRisk.tradeRestrictionNotes}</p>
          )}
        </article>
      )}

      {perfSummary && (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Supplier Performance</h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest period metrics ({perfSummary.periodCount} period{perfSummary.periodCount !== 1 ? "s" : ""} recorded)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Overall Rating</p>
              <p className="text-xl font-bold text-slate-900">{perfSummary.latestOverallRating.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">On-Time Delivery</p>
              <p className="text-xl font-bold text-blue-600">{perfSummary.latestDeliveryRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Quality Rejection</p>
              <p className="text-xl font-bold text-amber-600">{perfSummary.latestQualityRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Responsiveness</p>
              <p className="text-xl font-bold text-purple-600">{perfSummary.latestResponsiveness}/5</p>
            </div>
          </div>
          <div className="mt-4">
            <PerformanceChart supplierId={supplierId} />
          </div>
        </article>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
          {recentAlerts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No alerts linked to this supplier.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {alert.title}
                    </Link>
                    <span className="text-xs text-slate-500">S{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Status: {alert.status} • Created: {alert.created_at}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Source Evidence</h2>
          {riskEvents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No mapped risk events found in the scoring window.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {riskEvents.map((event) => (
                <li key={event.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{event.event_type}</p>
                    <p className="text-xs text-slate-500">
                      S{event.severity} • Impact L{impactByEventId.get(event.id) ?? "-"}
                    </p>
                  </div>
                  <p className="mt-1 text-slate-700">{event.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">Observed: {event.observed_at}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <span className="text-slate-600">Source: {event.source_name ?? "Unknown"}</span>
                    {event.source_url ? (
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-900 underline underline-offset-2"
                      >
                        Open source
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

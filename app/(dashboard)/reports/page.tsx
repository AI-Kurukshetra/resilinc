import type { Metadata } from "next";
import { ReportExportActions } from "@/app/(dashboard)/reports/_components/report-export-actions";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Reports | Resilinc Lite",
};

interface SupplierRow {
  id: string;
  name: string;
}

interface RiskScoreRow {
  supplier_id: string;
  score: number | string;
  trend: "up" | "down" | "flat";
}

interface IncidentRow {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  started_at: string;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function buildReportText(input: {
  generatedAt: string;
  highRiskSuppliers: number;
  openAlerts: number;
  openIncidents: number;
  recentIncidents: IncidentRow[];
  topSuppliers: Array<{ name: string; score: number; trend: string }>;
  totalRiskEvents30d: number;
}) {
  const lines = [
    "Resilinc Lite - Risk Summary Report",
    `Generated At: ${input.generatedAt}`,
    "",
    "Executive Snapshot",
    `- Open alerts: ${input.openAlerts}`,
    `- Open incidents: ${input.openIncidents}`,
    `- High-risk suppliers (score >= 65): ${input.highRiskSuppliers}`,
    `- Risk events in last 30 days: ${input.totalRiskEvents30d}`,
    "",
    "Top Supplier Risks",
    ...input.topSuppliers.map(
      (supplier, index) =>
        `${index + 1}. ${supplier.name} | Score ${supplier.score.toFixed(2)} | Trend ${supplier.trend}`,
    ),
    "",
    "Recent Incidents",
    ...input.recentIncidents.map(
      (incident, index) =>
        `${index + 1}. ${incident.title} | Status ${incident.status} | Started ${incident.started_at}`,
    ),
    "",
    "Prepared for demo export and operational standup.",
  ];

  return lines.join("\n");
}

export default async function ReportsPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Report summary is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;
  const generatedAt = new Date().toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    supplierResult,
    scoreResult,
    openAlertsCountResult,
    openIncidentsCountResult,
    riskEventsCountResult,
    incidentsResult,
  ] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("organization_id", organizationId),
    supabase
      .from("supplier_risk_scores")
      .select("supplier_id, score, trend")
      .eq("organization_id", organizationId),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "resolved"),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "closed"),
    supabase
      .from("risk_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("observed_at", since30d),
    supabase
      .from("incidents")
      .select("id, title, status, started_at")
      .eq("organization_id", organizationId)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const suppliers = (supplierResult.data as SupplierRow[] | null) ?? [];
  const scores = (scoreResult.data as RiskScoreRow[] | null) ?? [];
  const recentIncidents = (incidentsResult.data as IncidentRow[] | null) ?? [];

  const supplierNameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));

  const highRiskSuppliers = scores.filter((row) => toNumber(row.score) >= 65).length;
  const topSuppliers = scores
    .map((row) => ({
      name: supplierNameById.get(row.supplier_id) ?? row.supplier_id,
      score: toNumber(row.score),
      trend: row.trend,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  const reportText = buildReportText({
    generatedAt,
    highRiskSuppliers,
    openAlerts: openAlertsCountResult.count ?? 0,
    openIncidents: openIncidentsCountResult.count ?? 0,
    recentIncidents,
    topSuppliers,
    totalRiskEvents30d: riskEventsCountResult.count ?? 0,
  });

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Report Summary</h1>
          <p className="text-sm text-slate-600">
            Demo export view for executive risk snapshot and active disruption posture.
          </p>
        </div>
        <ReportExportActions generatedAt={generatedAt} reportText={reportText} />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="mac-surface rounded-2xl p-4">
          <p className="text-xs text-slate-500">Open alerts</p>
          <p className="text-2xl font-semibold text-slate-900">{openAlertsCountResult.count ?? 0}</p>
        </article>
        <article className="mac-surface rounded-2xl p-4">
          <p className="text-xs text-slate-500">Open incidents</p>
          <p className="text-2xl font-semibold text-slate-900">{openIncidentsCountResult.count ?? 0}</p>
        </article>
        <article className="mac-surface rounded-2xl p-4">
          <p className="text-xs text-slate-500">High-risk suppliers</p>
          <p className="text-2xl font-semibold text-slate-900">{highRiskSuppliers}</p>
        </article>
        <article className="mac-surface rounded-2xl p-4">
          <p className="text-xs text-slate-500">Risk events (30d)</p>
          <p className="text-2xl font-semibold text-slate-900">{riskEventsCountResult.count ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="mac-surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-slate-900">Top Supplier Risks</h2>
          {topSuppliers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No scored suppliers available.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {topSuppliers.map((supplier) => (
                <li key={supplier.name} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
                  <span className="font-medium text-slate-900">{supplier.name}</span>
                  <span className="text-slate-600">
                    {supplier.score.toFixed(2)} • {supplier.trend}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="mac-surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Incidents</h2>
          {recentIncidents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No incidents available.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recentIncidents.map((incident) => (
                <li key={incident.id} className="rounded-md border border-slate-200 p-2">
                  <p className="font-medium text-slate-900">{incident.title}</p>
                  <p className="text-xs text-slate-600">
                    Status: {incident.status} • Started: {incident.started_at}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mac-surface rounded-2xl p-4 print:border-none print:shadow-none">
        <h2 className="text-lg font-semibold text-slate-900">Export Preview</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {reportText}
        </pre>
      </section>
    </main>
  );
}

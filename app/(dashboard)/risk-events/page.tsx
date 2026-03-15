import type { Metadata } from "next";
import Link from "next/link";
import { RiskEventIntakeForm } from "@/app/(dashboard)/risk-events/_components/risk-event-intake-form";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Risk Events | Resilinc Lite",
};

interface RiskEventRow {
  id: string;
  event_type: string;
  severity: number;
  confidence: number | string;
  region_code: string | null;
  summary: string;
  source_name: string | null;
  source_url: string | null;
  observed_at: string;
}

interface RiskEventSupplierLink {
  risk_event_id: string;
  supplier_id: string;
}

interface SupplierRow {
  id: string;
  name: string;
}

interface PageProps {
  searchParams?: Promise<{
    severity?: string | string[];
  }>;
}

function readSingleParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

function parseSeverityFilter(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}

function formatDateTime(isoDateTime: string): string {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toConfidenceNumber(value: number | string): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export default async function RiskEventsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const minSeverity = parseSeverityFilter(readSingleParam(params?.severity));
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Risk event workspace is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const suppliersResult = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  let eventQuery = supabase
    .from("risk_events")
    .select("id, event_type, severity, confidence, region_code, summary, source_name, source_url, observed_at")
    .eq("organization_id", organizationId)
    .order("observed_at", { ascending: false })
    .limit(80);

  if (minSeverity !== null) {
    eventQuery = eventQuery.gte("severity", minSeverity);
  }

  const eventsResult = await eventQuery;
  const suppliers = (suppliersResult.data as SupplierRow[] | null) ?? [];
  const events = (eventsResult.data as RiskEventRow[] | null) ?? [];

  const eventIds = events.map((event) => event.id);
  const linksResult = eventIds.length
    ? await supabase
        .from("risk_event_suppliers")
        .select("risk_event_id, supplier_id")
        .eq("organization_id", organizationId)
        .in("risk_event_id", eventIds)
    : { data: [] as RiskEventSupplierLink[] | null };

  const supplierNameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const links = (linksResult.data as RiskEventSupplierLink[] | null) ?? [];
  const supplierIdsByEventId = new Map<string, string[]>();

  for (const link of links) {
    const existing = supplierIdsByEventId.get(link.risk_event_id) ?? [];
    existing.push(link.supplier_id);
    supplierIdsByEventId.set(link.risk_event_id, existing);
  }

  return (
    <main className="space-y-4">
      <header className="mac-surface rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Risk Event Hub</h1>
            <p className="text-sm text-slate-600">
              Intake, monitor, and validate disruption signals across your supplier network.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/risk-events"
              className={minSeverity === null ? "rounded-full bg-slate-900 px-3 py-1.5 text-white" : "mac-pill px-3 py-1.5"}
            >
              All
            </Link>
            <Link
              href="/risk-events?severity=4"
              className={minSeverity === 4 ? "rounded-full bg-slate-900 px-3 py-1.5 text-white" : "mac-pill px-3 py-1.5"}
            >
              Severity 4+
            </Link>
            <Link
              href="/risk-events?severity=5"
              className={minSeverity === 5 ? "rounded-full bg-slate-900 px-3 py-1.5 text-white" : "mac-pill px-3 py-1.5"}
            >
              Severity 5
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <RiskEventIntakeForm suppliers={suppliers} />

        <section className="mac-surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-slate-900">Latest Events</h2>
          <p className="text-sm text-slate-600">Showing {events.length} recent disruption signals.</p>

          {events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No risk events available for this filter.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {events.map((event) => {
                const linkedSupplierNames = (supplierIdsByEventId.get(event.id) ?? [])
                  .map((supplierId) => supplierNameById.get(supplierId))
                  .filter((name): name is string => Boolean(name))
                  .slice(0, 3);

                return (
                  <li key={event.id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                        S{event.severity}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-slate-600">{event.event_type}</span>
                      <span className="text-xs text-slate-500">
                        confidence {toConfidenceNumber(event.confidence).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-800">{event.summary}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {formatDateTime(event.observed_at)}
                      {event.region_code ? ` • ${event.region_code}` : ""}
                      {event.source_name ? ` • ${event.source_name}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Impacted suppliers:{" "}
                      {linkedSupplierNames.length > 0 ? linkedSupplierNames.join(", ") : "Global signal"}
                    </p>
                    {event.source_url ? (
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-slate-900 underline underline-offset-2"
                      >
                        Open source
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { isAuthBypassEnabled } from "@/lib/auth/feature-flags";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview | Resilinc Lite",
};

interface SupplierRow {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
  created_at: string;
}

interface FacilityRow {
  id: string;
  name: string;
  country_code: string | null;
  supplier_id: string;
  created_at: string;
}

interface PartRow {
  id: string;
  part_number: string;
  criticality: number;
  created_at: string;
}

interface RiskEventRow {
  id: string;
  event_type: string;
  severity: number;
  confidence: number;
  region_code: string | null;
  summary: string;
  observed_at: string;
  source_name: string | null;
  source_url: string | null;
}

interface RiskEventSupplierLinkRow {
  risk_event_id: string;
  supplier_id: string;
}

interface SupplierNameRow {
  id: string;
  name: string;
}

interface DisruptionFeedItem {
  id: string;
  eventType: string;
  severity: number;
  confidence: number;
  regionCode: string | null;
  summary: string;
  observedAt: string;
  sourceName: string | null;
  sourceUrl: string | null;
  impactedSupplierCount: number;
  impactedSupplierNames: string[];
}

interface SeverityCounts {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface OverviewData {
  actorName: string;
  disruptions: DisruptionFeedItem[];
  facilities: FacilityRow[];
  highRiskSuppliers: number;
  minSeverityFilter: number | null;
  openAlerts: number;
  openIncidents: number;
  parts: PartRow[];
  severityCounts: SeverityCounts;
  suppliers: SupplierRow[];
  totalFacilities: number;
  totalParts: number;
  totalRiskEvents: number;
  totalSuppliers: number;
}

type SupabaseReadClient =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

async function getOverviewData(minSeverityFilter: number | null): Promise<OverviewData | null> {
  const bypassEnabled = isAuthBypassEnabled();

  if (bypassEnabled) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let organizationId = organization?.id ?? null;

    if (!organizationId) {
      const { data: usersData } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      const demoUserId = usersData.users[0]?.id;

      if (!demoUserId) {
        return null;
      }

      await supabase.from("profiles").upsert(
        {
          user_id: demoUserId,
          full_name: "Akash Bhavsar",
        },
        { onConflict: "user_id" },
      );

      const { data: createdOrg } = await supabase
        .from("organizations")
        .insert({
          created_by: demoUserId,
          name: "Apex Devices Group",
        })
        .select("id")
        .single();

      organizationId = createdOrg?.id ?? null;

      if (!organizationId) {
        return null;
      }

      await supabase.from("organization_members").upsert(
        {
          organization_id: organizationId,
          role: "owner",
          user_id: demoUserId,
        },
        { onConflict: "organization_id,user_id" },
      );
    }

    return readOverviewDataForOrg(
      supabase,
      organizationId,
      "Akash Bhavsar",
      minSeverityFilter,
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    return null;
  }

  const actorName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "Authenticated User";

  return readOverviewDataForOrg(
    supabase,
    membership.organization_id,
    actorName,
    minSeverityFilter,
  );
}

async function readOverviewDataForOrg(
  supabase: SupabaseReadClient,
  organizationId: string,
  actorName: string,
  minSeverityFilter: number | null,
): Promise<OverviewData> {
  const [
    suppliersResult,
    facilitiesResult,
    partsResult,
    highRiskCountResult,
    openAlertsCountResult,
    openIncidentsCountResult,
    disruptionsResult,
    severityCounts,
  ] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name, region_code, criticality, is_active, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("facilities")
      .select("id, name, country_code, supplier_id, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("parts")
      .select("id, part_number, criticality, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("suppliers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("criticality", 4),
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
    readDisruptionsForOrg(supabase, organizationId, minSeverityFilter),
    readRiskEventSeverityCounts(supabase, organizationId),
  ]);

  return {
    actorName,
    disruptions: disruptionsResult.items,
    facilities: (facilitiesResult.data as FacilityRow[] | null) ?? [],
    highRiskSuppliers: highRiskCountResult.count ?? 0,
    minSeverityFilter,
    openAlerts: openAlertsCountResult.count ?? 0,
    openIncidents: openIncidentsCountResult.count ?? 0,
    parts: (partsResult.data as PartRow[] | null) ?? [],
    severityCounts,
    suppliers: (suppliersResult.data as SupplierRow[] | null) ?? [],
    totalFacilities: facilitiesResult.count ?? 0,
    totalParts: partsResult.count ?? 0,
    totalRiskEvents: disruptionsResult.total,
    totalSuppliers: suppliersResult.count ?? 0,
  };
}

async function readDisruptionsForOrg(
  supabase: SupabaseReadClient,
  organizationId: string,
  minSeverityFilter: number | null,
): Promise<{ items: DisruptionFeedItem[]; total: number }> {
  let riskEventQuery = supabase
    .from("risk_events")
    .select(
      "id, event_type, severity, confidence, region_code, summary, observed_at, source_name, source_url",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("observed_at", { ascending: false })
    .limit(12);

  if (minSeverityFilter !== null) {
    riskEventQuery = riskEventQuery.gte("severity", minSeverityFilter);
  }

  const { count, data: riskEventData } = await riskEventQuery;
  const riskEvents = (riskEventData as RiskEventRow[] | null) ?? [];

  if (riskEvents.length === 0) {
    return {
      items: [],
      total: count ?? 0,
    };
  }

  const eventIds = riskEvents.map((event) => event.id);
  const { data: supplierLinkData } = await supabase
    .from("risk_event_suppliers")
    .select("risk_event_id, supplier_id")
    .eq("organization_id", organizationId)
    .in("risk_event_id", eventIds);

  const supplierLinks = (supplierLinkData as RiskEventSupplierLinkRow[] | null) ?? [];
  const supplierIds = [
    ...new Set(supplierLinks.map((link) => link.supplier_id)),
  ];

  const supplierNameRows = supplierIds.length
    ? await supabase
        .from("suppliers")
        .select("id, name")
        .eq("organization_id", organizationId)
        .in("id", supplierIds)
    : { data: [] as SupplierNameRow[] | null };

  const supplierNameById = new Map(
    ((supplierNameRows.data as SupplierNameRow[] | null) ?? []).map((supplier) => [
      supplier.id,
      supplier.name,
    ]),
  );

  const supplierIdsByEventId = new Map<string, string[]>();

  for (const link of supplierLinks) {
    const existing = supplierIdsByEventId.get(link.risk_event_id) ?? [];
    existing.push(link.supplier_id);
    supplierIdsByEventId.set(link.risk_event_id, existing);
  }

  const disruptions = riskEvents.map((event) => {
    const impactedSupplierIds = supplierIdsByEventId.get(event.id) ?? [];
    const impactedSupplierNames = impactedSupplierIds
      .map((supplierId) => supplierNameById.get(supplierId))
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);

    return {
      id: event.id,
      eventType: event.event_type,
      severity: event.severity,
      confidence: event.confidence,
      regionCode: event.region_code,
      summary: event.summary,
      observedAt: event.observed_at,
      sourceName: event.source_name,
      sourceUrl: event.source_url,
      impactedSupplierCount: impactedSupplierIds.length,
      impactedSupplierNames,
    };
  });

  return {
    items: disruptions,
    total: count ?? disruptions.length,
  };
}

async function readRiskEventSeverityCounts(
  supabase: SupabaseReadClient,
  organizationId: string,
): Promise<SeverityCounts> {
  const severityValues: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];
  const countEntries = await Promise.all(
    severityValues.map(async (severity) => {
      const { count } = await supabase
        .from("risk_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("severity", severity);

      return [severity, count ?? 0] as const;
    }),
  );

  const counts = Object.fromEntries(countEntries) as Record<1 | 2 | 3 | 4 | 5, number>;

  return {
    1: counts[1] ?? 0,
    2: counts[2] ?? 0,
    3: counts[3] ?? 0,
    4: counts[4] ?? 0,
    5: counts[5] ?? 0,
  };
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

  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric < 1 || numeric > 5) {
    return null;
  }

  return numeric;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}

function severityBadgeClass(severity: number): string {
  if (severity >= 5) {
    return "bg-rose-100 text-rose-900 border-rose-200";
  }

  if (severity >= 4) {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }

  if (severity >= 3) {
    return "bg-orange-100 text-orange-900 border-orange-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

interface OverviewPageProps {
  searchParams?: Promise<{
    severity?: string | string[];
  }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const minSeverityFilter = parseSeverityFilter(readSingleParam(params?.severity));
  const actorName = isAuthBypassEnabled() ? "Akash Bhavsar" : "Authenticated User";
  const overviewData = await getOverviewData(minSeverityFilter);
  const activeFilter = overviewData?.minSeverityFilter ?? minSeverityFilter;

  return (
    <main className="space-y-4">
      <section className="mac-surface rounded-2xl p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Overview dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Active user:{" "}
          <span className="font-medium text-slate-900">
            {overviewData?.actorName ?? actorName}
          </span>
        </p>
      </section>
      {!overviewData ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Dashboard data is unavailable right now. Ensure seeded org data exists and
          `SUPABASE_SERVICE_ROLE_KEY` is set while bypass mode is enabled.
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="mac-surface rounded-2xl p-4">
              <p className="text-xs text-slate-500">Suppliers</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.totalSuppliers}</p>
            </article>
            <article className="mac-surface rounded-2xl p-4">
              <p className="text-xs text-slate-500">High-risk suppliers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {overviewData.highRiskSuppliers}
              </p>
            </article>
            <article className="mac-surface rounded-2xl p-4">
              <p className="text-xs text-slate-500">Open alerts</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.openAlerts}</p>
            </article>
            <article className="mac-surface rounded-2xl p-4">
              <p className="text-xs text-slate-500">Open incidents</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.openIncidents}</p>
            </article>
          </section>

          <section className="mac-surface rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Latest disruptions</h2>
                <p className="text-xs text-slate-600">
                  Filter by severity to focus active risk signals.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Showing {overviewData.disruptions.length} of {overviewData.totalRiskEvents}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link
                href="/overview"
                className={
                  activeFilter === null
                    ? "rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700"
                }
              >
                All ({Object.values(overviewData.severityCounts).reduce((sum, count) => sum + count, 0)})
              </Link>
              <Link
                href="/overview?severity=3"
                className={
                  activeFilter === 3
                    ? "rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700"
                }
              >
                Severity 3+ ({overviewData.severityCounts[3] + overviewData.severityCounts[4] + overviewData.severityCounts[5]})
              </Link>
              <Link
                href="/overview?severity=4"
                className={
                  activeFilter === 4
                    ? "rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700"
                }
              >
                Severity 4+ ({overviewData.severityCounts[4] + overviewData.severityCounts[5]})
              </Link>
              <Link
                href="/overview?severity=5"
                className={
                  activeFilter === 5
                    ? "rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 font-medium text-white"
                    : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-slate-700"
                }
              >
                Severity 5 ({overviewData.severityCounts[5]})
              </Link>
            </div>

            {overviewData.disruptions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No disruption events match the current filter.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {overviewData.disruptions.map((event) => (
                  <li key={event.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${severityBadgeClass(event.severity)}`}
                      >
                        Severity {event.severity}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
                        {event.eventType}
                      </span>
                      <span className="text-xs text-slate-500">
                        Confidence: {event.confidence.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-800">{event.summary}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Observed: {formatDateTime(event.observedAt)}
                      {event.regionCode ? ` • Region: ${event.regionCode}` : ""}
                      {event.sourceName ? ` • Source: ${event.sourceName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Impacted suppliers:{" "}
                      {event.impactedSupplierCount === 0
                        ? "Global signal"
                        : `${event.impactedSupplierCount} (${event.impactedSupplierNames.join(", ") || "linked suppliers"})`}
                    </p>
                    {event.sourceUrl ? (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-slate-900 underline underline-offset-2"
                      >
                        Open source link
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="mac-surface rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent suppliers</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.suppliers.length === 0 ? (
                  <li className="text-slate-500">No suppliers yet</li>
                ) : (
                  overviewData.suppliers.map((supplier) => (
                    <li key={supplier.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{supplier.name}</span>
                      <span className="text-xs text-slate-500">C{supplier.criticality}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
            <article className="mac-surface rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent facilities ({overviewData.totalFacilities})
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.facilities.length === 0 ? (
                  <li className="text-slate-500">No facilities yet</li>
                ) : (
                  overviewData.facilities.map((facility) => (
                    <li key={facility.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{facility.name}</span>
                      <span className="text-xs text-slate-500">
                        {facility.country_code ?? "N/A"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </article>
            <article className="mac-surface rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent parts ({overviewData.totalParts})
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.parts.length === 0 ? (
                  <li className="text-slate-500">No parts yet</li>
                ) : (
                  overviewData.parts.map((part) => (
                    <li key={part.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{part.part_number}</span>
                      <span className="text-xs text-slate-500">C{part.criticality}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

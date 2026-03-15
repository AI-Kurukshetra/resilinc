import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertActions } from "@/app/(dashboard)/alerts/_components/alert-actions";
import { AlertStatusBadge } from "@/app/(dashboard)/alerts/_components/alert-status-badge";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Alert Detail | Resilinc Lite",
};

interface AlertDetailRouteContext {
  params: Promise<{ alertId: string }>;
}

interface AlertRow {
  id: string;
  supplier_id: string | null;
  risk_event_id: string | null;
  title: string;
  severity: number;
  status: "open" | "acknowledged" | "resolved";
  owner_id?: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  created_at: string;
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

interface AlertEventRow {
  id: string;
  event_type: "generated" | "escalated" | "owner_assigned" | "acknowledged" | "resolved";
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface MemberRow {
  user_id: string;
  role: "owner" | "manager" | "analyst" | "viewer";
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

function readEvidenceSources(payload: Record<string, unknown> | undefined): Array<{ title: string; url?: string }> {
  if (!payload) {
    return [];
  }

  const enrichment = payload._enrichment;
  if (!enrichment || typeof enrichment !== "object") {
    return [];
  }

  const sources = (enrichment as Record<string, unknown>).sources;
  if (!Array.isArray(sources)) {
    return [];
  }

  const parsedSources: Array<{ title: string; url?: string }> = [];

  for (const entry of sources) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const source = entry as Record<string, unknown>;
    parsedSources.push({
      title: typeof source.title === "string" ? source.title : "Evidence",
      url: typeof source.url === "string" ? source.url : undefined,
    });
  }

  return parsedSources;
}

export default async function AlertDetailPage({ params }: AlertDetailRouteContext) {
  const { alertId } = await params;
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Alert detail is unavailable without a valid organization context.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: alertData, error: alertError } = await supabase
    .from("alerts")
    .select(
      "id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", alertId)
    .maybeSingle();

  if (alertError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load alert detail: {alertError.message}
      </main>
    );
  }

  if (!alertData) {
    notFound();
  }

  const alert = alertData as AlertRow;

  const [{ data: supplierData }, { data: riskEventData }, { data: timelineData }, { data: membersData }] =
    await Promise.all([
      alert.supplier_id
        ? supabase
            .from("suppliers")
            .select("id, name")
            .eq("organization_id", organizationId)
            .eq("id", alert.supplier_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      alert.risk_event_id
        ? supabase
            .from("risk_events")
            .select(
              "id, event_type, severity, confidence, observed_at, summary, source_name, source_url, payload",
            )
            .eq("organization_id", organizationId)
            .eq("id", alert.risk_event_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("alert_events")
        .select("id, event_type, actor_id, payload, created_at")
        .eq("organization_id", organizationId)
        .eq("alert_id", alert.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", organizationId),
    ]);

  const supplier = supplierData as { id: string; name: string } | null;
  const riskEvent = riskEventData as RiskEventRow | null;
  const timeline = (timelineData as AlertEventRow[] | null) ?? [];
  const members = (membersData as MemberRow[] | null) ?? [];

  const profileIds = [...new Set(members.map((member) => member.user_id))];
  const { data: profileData } = profileIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", profileIds)
    : { data: [] as ProfileRow[] };

  const profileNameById = new Map(
    ((profileData as ProfileRow[] | null) ?? []).map((profile) => [
      profile.user_id,
      profile.full_name ?? profile.user_id,
    ]),
  );

  const memberOptions = members
    .map((member) => ({
      label: `${profileNameById.get(member.user_id) ?? member.user_id} (${member.role})`,
      userId: member.user_id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const evidenceSources = readEvidenceSources(riskEvent?.payload);

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">{alert.title}</h1>
          <AlertStatusBadge status={alert.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p className="text-slate-600">Severity: <span className="font-medium text-slate-900">S{alert.severity}</span></p>
          <p className="text-slate-600">Supplier: <span className="font-medium text-slate-900">{supplier?.name ?? "Global"}</span></p>
          <p className="text-slate-600">Created: <span className="font-medium text-slate-900">{alert.created_at}</span></p>
          <p className="text-slate-600">Owner: <span className="font-medium text-slate-900">{alert.owner_id ? profileNameById.get(alert.owner_id) ?? alert.owner_id : "Unassigned"}</span></p>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Source Evidence</h2>
            {riskEvent ? (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-slate-700">{riskEvent.summary}</p>
                <p className="text-xs text-slate-600">
                  Event: {riskEvent.event_type} • Severity S{riskEvent.severity} • Confidence {riskEvent.confidence}
                </p>
                <p className="text-xs text-slate-600">Observed: {riskEvent.observed_at}</p>
                <p className="text-xs text-slate-600">Source: {riskEvent.source_name ?? "Unknown"}</p>
                {riskEvent.source_url ? (
                  <a
                    href={riskEvent.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-slate-900 underline underline-offset-2"
                  >
                    Open primary source
                  </a>
                ) : null}
                {evidenceSources.length > 0 ? (
                  <ul className="space-y-2">
                    {evidenceSources.map((source, index) => (
                      <li key={`${source.title}-${index}`} className="rounded-md border border-slate-200 p-2">
                        <p className="text-xs font-medium text-slate-800">{source.title}</p>
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-700 underline underline-offset-2"
                          >
                            Open evidence link
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No linked risk event evidence found.</p>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            {timeline.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No timeline events found.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {timeline.map((event) => (
                  <li key={event.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">{event.event_type}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Actor: {event.actor_id ? profileNameById.get(event.actor_id) ?? event.actor_id : "System"}
                    </p>
                    <p className="text-xs text-slate-600">At: {event.created_at}</p>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>

        <AlertActions
          alertId={alert.id}
          canAcknowledge={alert.status === "open"}
          canResolve={alert.status !== "resolved"}
          currentOwnerId={alert.owner_id ?? null}
          members={memberOptions}
        />
      </section>

      {alert.supplier_id ? (
        <p className="text-sm text-slate-600">
          Linked supplier: {" "}
          <Link href={`/suppliers/${alert.supplier_id}`} className="font-medium text-slate-900 underline underline-offset-2">
            {supplier?.name ?? alert.supplier_id}
          </Link>
        </p>
      ) : null}
    </main>
  );
}

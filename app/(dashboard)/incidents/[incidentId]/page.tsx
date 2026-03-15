import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IncidentActionEditor } from "@/app/(dashboard)/incidents/_components/incident-action-editor";
import { IncidentStatusBadge } from "@/app/(dashboard)/incidents/_components/incident-status-badge";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Incident Detail | Resilinc Lite",
};

interface IncidentDetailRouteContext {
  params: Promise<{ incidentId: string }>;
}

interface IncidentRow {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  owner_id: string | null;
  started_at: string;
  closed_at: string | null;
  alert_id: string | null;
}

interface IncidentActionRow {
  id: string;
  action_title: string;
  owner_id: string | null;
  due_at: string | null;
  status: "todo" | "doing" | "done" | "blocked";
  created_at: string;
}

interface AlertRow {
  id: string;
  title: string;
  status: "open" | "acknowledged" | "resolved";
  severity: number;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

export default async function IncidentDetailPage({ params }: IncidentDetailRouteContext) {
  const { incidentId } = await params;
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Incident detail is unavailable without a valid organization context.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: incidentData, error: incidentError } = await supabase
    .from("incidents")
    .select("id, title, status, owner_id, started_at, closed_at, alert_id")
    .eq("organization_id", organizationId)
    .eq("id", incidentId)
    .maybeSingle();

  if (incidentError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load incident detail: {incidentError.message}
      </main>
    );
  }

  if (!incidentData) {
    notFound();
  }

  const incident = incidentData as IncidentRow;

  const [{ data: actionRows }, { data: alertData }] = await Promise.all([
    supabase
      .from("incident_actions")
      .select("id, action_title, owner_id, due_at, status, created_at")
      .eq("organization_id", organizationId)
      .eq("incident_id", incident.id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    incident.alert_id
      ? supabase
          .from("alerts")
          .select("id, title, status, severity")
          .eq("organization_id", organizationId)
          .eq("id", incident.alert_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const actions = (actionRows as IncidentActionRow[] | null) ?? [];
  const alert = (alertData as AlertRow | null) ?? null;

  const profileIds = [incident.owner_id, ...actions.map((action) => action.owner_id)].filter(Boolean) as string[];
  const uniqueProfileIds = [...new Set(profileIds)];

  const { data: profileData } = uniqueProfileIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", uniqueProfileIds)
    : { data: [] as ProfileRow[] };

  const profileNameById = new Map(
    ((profileData as ProfileRow[] | null) ?? []).map((profile) => [
      profile.user_id,
      profile.full_name ?? profile.user_id,
    ]),
  );

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">{incident.title}</h1>
          <IncidentStatusBadge status={incident.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p className="text-slate-600">Started: <span className="font-medium text-slate-900">{incident.started_at}</span></p>
          <p className="text-slate-600">Closed: <span className="font-medium text-slate-900">{incident.closed_at ?? "Not closed"}</span></p>
          <p className="text-slate-600">Owner: <span className="font-medium text-slate-900">{incident.owner_id ? profileNameById.get(incident.owner_id) ?? incident.owner_id : "Unassigned"}</span></p>
          <p className="text-slate-600">Action items: <span className="font-medium text-slate-900">{actions.length}</span></p>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <IncidentActionEditor
          incidentId={incident.id}
          incidentStatus={incident.status}
          alertStatus={alert?.status ?? null}
          items={actions.map((action) => ({
            actionTitle: action.action_title,
            dueAt: action.due_at,
            id: action.id,
            ownerLabel: action.owner_id
              ? profileNameById.get(action.owner_id) ?? action.owner_id
              : "Unassigned",
            status: action.status,
          }))}
        />

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Linked Alert</h2>
          {alert ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-slate-900">{alert.title}</p>
              <p className="text-slate-600">Severity: S{alert.severity}</p>
              <p className="text-slate-600">Status: {alert.status}</p>
              <Link
                href={`/alerts/${alert.id}`}
                className="inline-block text-sm font-medium text-slate-900 underline underline-offset-2"
              >
                Open alert detail
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No linked alert on this incident.</p>
          )}
        </article>
      </section>
    </main>
  );
}

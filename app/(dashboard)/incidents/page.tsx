import type { Metadata } from "next";
import Link from "next/link";
import { IncidentStatusBadge } from "@/app/(dashboard)/incidents/_components/incident-status-badge";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Incidents | Resilinc Lite",
};

interface IncidentRow {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  owner_id: string | null;
  started_at: string;
  closed_at: string | null;
  alert_id: string | null;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

const BOARD_COLUMNS: Array<{ status: IncidentRow["status"]; title: string }> = [
  { status: "open", title: "Open" },
  { status: "in_progress", title: "In Progress" },
  { status: "closed", title: "Closed" },
];

export default async function IncidentsPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Incident board is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: incidentRows, error: incidentError } = await supabase
    .from("incidents")
    .select("id, title, status, owner_id, started_at, closed_at, alert_id")
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false });

  if (incidentError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load incidents: {incidentError.message}
      </main>
    );
  }

  const incidents = (incidentRows as IncidentRow[] | null) ?? [];

  const ownerIds = [...new Set(incidents.map((incident) => incident.owner_id).filter(Boolean))] as string[];
  const { data: ownerRows } = ownerIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds)
    : { data: [] as ProfileRow[] };

  const ownerNameById = new Map(
    ((ownerRows as ProfileRow[] | null) ?? []).map((owner) => [owner.user_id, owner.full_name ?? owner.user_id]),
  );

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Incident Board</h1>
          <p className="text-sm text-slate-600">
            Manage active disruptions with status progression and action-tracking handoff.
          </p>
        </div>
        <p className="text-sm text-slate-600">Total incidents: {incidents.length}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {BOARD_COLUMNS.map((column) => {
          const columnItems = incidents.filter((incident) => incident.status === column.status);

          return (
            <article key={column.status} className="mac-surface rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">{column.title}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {columnItems.length}
                </span>
              </div>

              {columnItems.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No incidents in this lane.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {columnItems.map((incident) => (
                    <li key={incident.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="font-medium text-slate-900 underline-offset-2 hover:underline"
                        >
                          {incident.title}
                        </Link>
                        <IncidentStatusBadge status={incident.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Owner: {incident.owner_id ? ownerNameById.get(incident.owner_id) ?? incident.owner_id : "Unassigned"}
                      </p>
                      <p className="text-xs text-slate-600">Started: {incident.started_at}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

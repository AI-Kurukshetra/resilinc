"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertStatusBadge } from "@/app/(dashboard)/alerts/_components/alert-status-badge";

type AlertStatus = "open" | "acknowledged" | "resolved";

interface AlertListItem {
  id: string;
  supplierId: string | null;
  title: string;
  severity: number;
  status: AlertStatus;
  ownerId: string | null;
  createdAt: string;
}

interface AlertsWorkbenchProps {
  alerts: AlertListItem[];
  supplierNameById: Record<string, string>;
  ownerNameById: Record<string, string>;
}

interface ApiFailurePayload {
  error?: {
    message?: string;
  };
}

type StatusFilter = "all" | AlertStatus;
type SeverityFilter = "all" | "3" | "4" | "5";

function formatCreatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

async function parseErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiFailurePayload | null;
  return payload?.error?.message ?? `Request failed (${response.status})`;
}

export function AlertsWorkbench({
  alerts,
  ownerNameById,
  supplierNameById,
}: AlertsWorkbenchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      if (statusFilter !== "all" && alert.status !== statusFilter) {
        return false;
      }

      if (severityFilter !== "all" && alert.severity < Number.parseInt(severityFilter, 10)) {
        return false;
      }

      if (normalizedQuery.length > 0) {
        const supplierName = alert.supplierId ? supplierNameById[alert.supplierId] ?? "" : "";
        const haystack = `${alert.title} ${supplierName}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, query, severityFilter, statusFilter, supplierNameById]);

  function runGenerate() {
    startTransition(async () => {
      setFeedback(null);
      setErrorMessage(null);

      const response = await fetch("/api/alerts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setErrorMessage(await parseErrorMessage(response));
        return;
      }

      const payload = (await response.json()) as {
        ok: true;
        data: {
          incidentsCreated: number;
          scoresUpdated: number;
          summary: {
            alertsCreated: number;
            alertsEscalated: number;
            alertsEvaluated: number;
          };
        };
      };

      setFeedback(
        `Scored ${payload.data.scoresUpdated} suppliers, evaluated ${payload.data.summary.alertsEvaluated} alerts, created ${payload.data.summary.alertsCreated}, escalated ${payload.data.summary.alertsEscalated}, incidents created ${payload.data.incidentsCreated}.`,
      );
      router.refresh();
    });
  }

  function runCreateIncident(alertId: string) {
    startTransition(async () => {
      setFeedback(null);
      setErrorMessage(null);

      const response = await fetch("/api/incidents/from-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId,
          allowLowSeverity: true,
        }),
      });

      if (!response.ok) {
        setErrorMessage(await parseErrorMessage(response));
        return;
      }

      const payload = (await response.json()) as {
        ok: true;
        data: {
          created: boolean;
          incident: {
            id: string;
          };
        };
      };

      setFeedback(
        payload.data.created
          ? `Incident created (${payload.data.incident.id.slice(0, 8)}...).`
          : `Incident already exists (${payload.data.incident.id.slice(0, 8)}...).`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mac-surface rounded-2xl p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Interactive Alert Operations</h2>
          <p className="text-sm text-slate-600">
            Filter, generate alerts from scores, and open incidents directly from this view.
          </p>
        </div>
        <button
          type="button"
          onClick={runGenerate}
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Running..." : "Generate From Scores"}
        </button>
      </div>

      {feedback ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {feedback}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Search alert/supplier</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
            placeholder="e.g. Flood, Apex..."
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-600">Min severity</span>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Showing {filteredAlerts.length} of {alerts.length} alerts.
      </div>

      {filteredAlerts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No alerts match current filters.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Alert</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {alert.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-700">S{alert.severity}</td>
                  <td className="px-3 py-3">
                    <AlertStatusBadge status={alert.status} />
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {alert.supplierId ? supplierNameById[alert.supplierId] ?? "Unknown" : "Global"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {alert.ownerId ? ownerNameById[alert.ownerId] ?? alert.ownerId : "Unassigned"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{formatCreatedAt(alert.createdAt)}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={isPending || alert.status === "resolved"}
                      onClick={() => runCreateIncident(alert.id)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                    >
                      Create Incident
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

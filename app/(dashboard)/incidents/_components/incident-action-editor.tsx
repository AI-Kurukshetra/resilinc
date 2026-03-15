"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface IncidentActionItem {
  actionTitle: string;
  id: string;
  ownerLabel: string;
  status: "todo" | "doing" | "done" | "blocked";
  dueAt: string | null;
}

interface IncidentActionEditorProps {
  alertStatus: "open" | "acknowledged" | "resolved" | null;
  incidentId: string;
  incidentStatus: "open" | "in_progress" | "closed";
  items: IncidentActionItem[];
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  throw new Error(payload?.error?.message || `Request failed (${response.status}).`);
}

export function IncidentActionEditor({
  alertStatus,
  incidentId,
  incidentStatus,
  items,
}: IncidentActionEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  const isClosed = incidentStatus === "closed";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Action Checklist</h2>
      <p className="mt-1 text-xs text-slate-600">
        Update action states and close incident after all actions are done and source alert is resolved.
      </p>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No actions were generated for this incident.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{item.actionTitle}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Owner: {item.ownerLabel} • Due: {item.dueAt ?? "No SLA due date"}
                  </p>
                </div>
                <select
                  value={item.status}
                  disabled={isPending || isClosed}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  onChange={(event) =>
                    run(() =>
                      postJson(`/api/incidents/${incidentId}/actions/${item.id}/status`, {
                        status: event.target.value,
                      }),
                    )
                  }
                >
                  <option value="todo">todo</option>
                  <option value="doing">doing</option>
                  <option value="done">done</option>
                  <option value="blocked">blocked</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-600">Source alert status: {alertStatus ?? "N/A"}</p>
        <button
          type="button"
          disabled={isPending || isClosed}
          onClick={() => run(() => postJson(`/api/incidents/${incidentId}/close`, {}))}
          className="mt-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClosed ? "Incident Closed" : "Close Incident"}
        </button>
      </div>
    </section>
  );
}

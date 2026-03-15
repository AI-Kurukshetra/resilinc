"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MitigationActionDTO } from "@/lib/mitigation/service";

interface PlanMeta {
  id: string;
  status: string;
}

interface Props {
  plan: PlanMeta;
  initialActions: MitigationActionDTO[];
  canComplete: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-400 line-through",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "completed",
  cancelled: "cancelled",
};

export function PlanActionList({ plan, initialActions, canComplete }: Props) {
  const router = useRouter();
  const [actions, setActions] = useState<MitigationActionDTO[]>(initialActions);
  const [completing, setCompleting] = useState(false);
  const [addingTitle, setAddingTitle] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  async function handleStatusClick(action: MitigationActionDTO) {
    const newStatus = NEXT_STATUS[action.status];
    if (!newStatus || newStatus === action.status) return;

    const res = await fetch(
      `/api/mitigation-plans/${plan.id}/actions/${action.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    if (res.ok) {
      const json = await res.json() as { ok: boolean; data?: MitigationActionDTO };
      if (json.ok && json.data) {
        setActions((prev) => prev.map((a) => (a.id === action.id ? json.data! : a)));
      }
    }
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!addingTitle.trim()) return;
    setSubmittingAdd(true);
    setAddError(null);

    const res = await fetch(`/api/mitigation-plans/${plan.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: addingTitle.trim() }),
    });

    const json = await res.json() as { ok: boolean; data?: MitigationActionDTO; error?: { message: string } };
    if (json.ok && json.data) {
      setActions((prev) => [...prev, json.data!]);
      setAddingTitle("");
    } else {
      setAddError(json.error?.message ?? "Failed to add action.");
    }
    setSubmittingAdd(false);
  }

  async function handleCompletePlan() {
    setCompleting(true);
    const res = await fetch(`/api/mitigation-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });

    if (res.ok) {
      router.refresh();
    }
    setCompleting(false);
  }

  const isEditable = plan.status !== "completed" && plan.status !== "archived";

  return (
    <div className="mac-surface space-y-4 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
        <span className="text-xs text-slate-400">
          {actions.filter((a) => a.status === "completed").length} / {actions.length} done
        </span>
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-slate-400">No actions yet. Add one below.</p>
      ) : (
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={action.id} className="flex items-center gap-3">
              {isEditable && action.status !== "completed" && action.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => handleStatusClick(action)}
                  className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 hover:border-slate-500"
                  title={`Mark as ${NEXT_STATUS[action.status]}`}
                />
              ) : (
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    action.status === "completed"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500",
                  )}
                >
                  {action.status === "completed" ? "✓" : "–"}
                </span>
              )}
              <span
                className={cn(
                  "flex-1 text-sm",
                  action.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-700",
                )}
              >
                {action.title}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                  STATUS_STYLES[action.status] ?? "bg-slate-100 text-slate-600",
                )}
              >
                {action.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isEditable && (
        <form onSubmit={handleAddAction} className="flex gap-2">
          <input
            value={addingTitle}
            onChange={(e) => setAddingTitle(e.target.value)}
            placeholder="Add action…"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={submittingAdd || !addingTitle.trim()}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submittingAdd ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {addError && <p className="text-xs text-rose-600">{addError}</p>}

      {canComplete && (
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handleCompletePlan}
            disabled={completing}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {completing ? "Completing…" : "Mark Plan as Completed"}
          </button>
        </div>
      )}
    </div>
  );
}

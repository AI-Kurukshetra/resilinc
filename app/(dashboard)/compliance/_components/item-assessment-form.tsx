"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplianceItemDTO } from "@/lib/compliance/service";
import type { ComplianceItemStatus } from "@/lib/validations/compliance";

interface Props {
  frameworkId: string;
  items: ComplianceItemDTO[];
  suppliers: { id: string; name: string }[];
}

const STATUS_OPTIONS: { value: ComplianceItemStatus; label: string }[] = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "compliant", label: "Compliant" },
  { value: "non_compliant", label: "Non-compliant" },
  { value: "partially_compliant", label: "Partially compliant" },
  { value: "exempted", label: "Exempted" },
];

export function ItemAssessmentForm({ frameworkId, items, suppliers }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "assess" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      requirement: form.get("requirement") as string,
      supplierId: (form.get("supplierId") as string) || undefined,
    };

    try {
      const res = await fetch(`/api/compliance/frameworks/${frameworkId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json() as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        setError(json.error?.message ?? "Failed to add requirement.");
        return;
      }

      setMode(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssessItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const itemId = form.get("itemId") as string;
    const body = {
      status: form.get("status") as string,
      evidenceNotes: (form.get("evidenceNotes") as string) || undefined,
      nextReviewDate: (form.get("nextReviewDate") as string)
        ? new Date(form.get("nextReviewDate") as string).toISOString()
        : undefined,
    };

    try {
      const res = await fetch(
        `/api/compliance/frameworks/${frameworkId}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const json = await res.json() as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        setError(json.error?.message ?? "Failed to update assessment.");
        return;
      }

      setMode(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mac-surface space-y-3 rounded-2xl p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "add" ? null : "add")}
          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          + Add Requirement
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setMode(mode === "assess" ? null : "assess")}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Update Assessment
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          {error}
        </div>
      )}

      {mode === "add" && (
        <form onSubmit={handleAddItem} className="space-y-3 rounded-xl border border-slate-100 p-3">
          <div className="space-y-1">
            <label htmlFor="requirement" className="block text-xs font-medium text-slate-700">
              Requirement <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="requirement"
              name="requirement"
              required
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Describe the compliance requirement…"
            />
          </div>

          {suppliers.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="supplierId" className="block text-xs font-medium text-slate-700">
                Supplier (optional)
              </label>
              <select
                id="supplierId"
                name="supplierId"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="">— None —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "assess" && items.length > 0 && (
        <form onSubmit={handleAssessItem} className="space-y-3 rounded-xl border border-slate-100 p-3">
          <div className="space-y-1">
            <label htmlFor="itemId" className="block text-xs font-medium text-slate-700">
              Requirement <span className="text-rose-500">*</span>
            </label>
            <select
              id="itemId"
              name="itemId"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">— Select —</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.requirement.length > 70 ? `${item.requirement.slice(0, 70)}…` : item.requirement}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="status" className="block text-xs font-medium text-slate-700">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="evidenceNotes" className="block text-xs font-medium text-slate-700">
              Evidence notes
            </label>
            <textarea
              id="evidenceNotes"
              name="evidenceNotes"
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Document evidence or justification…"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="nextReviewDate" className="block text-xs font-medium text-slate-700">
              Next review date
            </label>
            <input
              id="nextReviewDate"
              name="nextReviewDate"
              type="date"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Assessment"}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

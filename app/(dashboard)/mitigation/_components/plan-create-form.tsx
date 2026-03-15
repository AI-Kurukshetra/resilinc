"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  suppliers: { id: string; name: string }[];
  alerts: { id: string; title: string }[];
}

const STRATEGIES = [
  { value: "avoid", label: "Avoid" },
  { value: "mitigate", label: "Mitigate" },
  { value: "transfer", label: "Transfer" },
  { value: "accept", label: "Accept" },
] as const;

export function PlanCreateForm({ suppliers, alerts }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      strategy: form.get("strategy") as string,
      priority: Number(form.get("priority")),
      supplierId: (form.get("supplierId") as string) || undefined,
      alertId: (form.get("alertId") as string) || undefined,
      targetDate: (form.get("targetDate") as string) || undefined,
    };

    try {
      const res = await fetch("/api/mitigation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: { message: string } };

      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "Failed to create plan.");
        return;
      }

      router.push(`/mitigation/${json.data.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mac-surface space-y-4 rounded-2xl p-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="title" className="block text-xs font-medium text-slate-700">
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Describe the mitigation goal…"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-xs font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Provide additional context…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="strategy" className="block text-xs font-medium text-slate-700">
            Strategy <span className="text-rose-500">*</span>
          </label>
          <select
            id="strategy"
            name="strategy"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="priority" className="block text-xs font-medium text-slate-700">
            Priority (1 = low, 5 = critical)
          </label>
          <input
            id="priority"
            name="priority"
            type="range"
            min={1}
            max={5}
            defaultValue={3}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {suppliers.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="supplierId" className="block text-xs font-medium text-slate-700">
              Linked Supplier
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

        {alerts.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="alertId" className="block text-xs font-medium text-slate-700">
              Linked Alert
            </label>
            <select
              id="alertId"
              name="alertId"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">— None —</option>
              {alerts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title.length > 60 ? `${a.title.slice(0, 60)}…` : a.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="targetDate" className="block text-xs font-medium text-slate-700">
          Target date
        </label>
        <input
          id="targetDate"
          name="targetDate"
          type="date"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Plan"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "regulatory", label: "Regulatory" },
  { value: "industry", label: "Industry" },
  { value: "internal", label: "Internal" },
  { value: "esg", label: "ESG" },
] as const;

export function ComplianceFrameworkCreateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      description: form.get("description") as string,
      category: form.get("category") as string,
    };

    try {
      const res = await fetch("/api/compliance/frameworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json() as {
        ok: boolean;
        data?: { id: string };
        error?: { message: string };
      };

      if (!json.ok) {
        setError(json.error?.message ?? "Failed to create framework.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        + New Framework
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="fw-name" className="block text-xs font-medium text-slate-700">
          Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="fw-name"
          name="name"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="e.g. ISO 27001, SOC 2, GDPR…"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="fw-description" className="block text-xs font-medium text-slate-700">
          Description
        </label>
        <input
          id="fw-description"
          name="description"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Brief description…"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="fw-category" className="block text-xs font-medium text-slate-700">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          id="fw-category"
          name="category"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Framework"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

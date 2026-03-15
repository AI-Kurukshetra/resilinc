"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

interface ApiErrorPayload {
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export function SupplierCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [regionCode, setRegionCode] = useState("US");
  const [criticality, setCriticality] = useState("3");
  const [isActive, setIsActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setErrorMessage(null);
    setFieldErrors(null);

    const parsedCriticality = Number.parseInt(criticality, 10);

    startTransition(async () => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          criticality: parsedCriticality,
          isActive,
          name: name.trim(),
          regionCode: regionCode.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { id: string; name: string } }
        | { ok: false; error: ApiErrorPayload }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        setErrorMessage(payload && !payload.ok ? payload.error.message ?? "Failed to create supplier." : "Failed to create supplier.");
        setFieldErrors(payload && !payload.ok ? payload.error.fieldErrors ?? null : null);
        return;
      }

      setFeedback(`Supplier created: ${payload.data.name}`);
      setName("");
      router.refresh();
    });
  }

  return (
    <form className="mac-surface space-y-3 rounded-2xl p-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Create Supplier</h2>
        <span className="mac-pill px-2 py-0.5 text-[11px]">Registry</span>
      </div>

      {feedback ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
          {feedback}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <label className="space-y-1 text-xs">
        <span className="font-medium text-slate-700">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
          required
        />
        {fieldErrors?.name?.[0] ? (
          <span className="text-rose-700">{fieldErrors.name[0]}</span>
        ) : null}
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-700">Region</span>
          <input
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value.toUpperCase())}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
            placeholder="US"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-700">Criticality</span>
          <select
            value={criticality}
            onChange={(event) => setCriticality(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Mark supplier active
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Supplier"}
      </button>
    </form>
  );
}

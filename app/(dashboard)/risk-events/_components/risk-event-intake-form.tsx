"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

interface SupplierOption {
  id: string;
  name: string;
}

interface RiskEventIntakeFormProps {
  suppliers: SupplierOption[];
}

interface ApiErrorPayload {
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function toIsoDateTime(localDateTime: string): string | null {
  if (!localDateTime) {
    return null;
  }

  const parsed = new Date(localDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toLocalDateTime(isoDateTime: string): string {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function RiskEventIntakeForm({ suppliers }: RiskEventIntakeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [eventType, setEventType] = useState("natural_disaster");
  const [severity, setSeverity] = useState("4");
  const [confidence, setConfidence] = useState("0.9");
  const [regionCode, setRegionCode] = useState("US-CA");
  const [sourceName, setSourceName] = useState("Operations Desk");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [impactLevel, setImpactLevel] = useState("4");
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [observedAt, setObservedAt] = useState(toLocalDateTime(new Date().toISOString()));
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const supplierBuckets = useMemo(
    () => suppliers.sort((left, right) => left.name.localeCompare(right.name)).slice(0, 12),
    [suppliers],
  );

  function toggleSupplier(id: string, checked: boolean) {
    setSelectedSupplierIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((supplierId) => supplierId !== id);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setErrorMessage(null);
    setFieldErrors(null);

    const observedAtIso = toIsoDateTime(observedAt);
    if (!observedAtIso) {
      setErrorMessage("Observed time is invalid.");
      return;
    }

    const parsedSeverity = Number.parseInt(severity, 10);
    const parsedConfidence = Number.parseFloat(confidence);
    const parsedImpactLevel = Number.parseInt(impactLevel, 10);

    startTransition(async () => {
      const response = await fetch("/api/risk-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affectedSupplierIds: selectedSupplierIds,
          autoEnrich,
          confidence: parsedConfidence,
          eventType: eventType.trim(),
          impactLevel: parsedImpactLevel,
          observedAt: observedAtIso,
          regionCode: regionCode.trim() || undefined,
          severity: parsedSeverity,
          sourceName: sourceName.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          summary: summary.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; data: { event: { id: string }; workflow: { alertsCreated: number; incidentsCreated: number } } }
        | { ok: false; error: ApiErrorPayload }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        setErrorMessage(payload && !payload.ok ? payload.error.message ?? "Risk ingestion failed." : "Risk ingestion failed.");
        setFieldErrors(payload && !payload.ok ? payload.error.fieldErrors ?? null : null);
        return;
      }

      setSummary("");
      setSourceUrl("");
      setFeedback(
        `Risk event ingested. Alerts created: ${payload.data.workflow.alertsCreated}; incidents created: ${payload.data.workflow.incidentsCreated}.`,
      );
      router.refresh();
    });
  }

  return (
    <form className="mac-surface space-y-4 rounded-2xl p-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Ingest Risk Event</h2>
        <span className="mac-pill px-2.5 py-1 text-xs">Live pipeline</span>
      </div>

      {feedback ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {feedback}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Event type</span>
          <input
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Observed at</span>
          <input
            type="datetime-local"
            value={observedAt}
            onChange={(event) => setObservedAt(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Severity</span>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Confidence</span>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={confidence}
            onChange={(event) => setConfidence(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Region code</span>
          <input
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value.toUpperCase())}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
            placeholder="US-CA"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Impact level</span>
          <select
            value={impactLevel}
            onChange={(event) => setImpactLevel(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Source name</span>
          <input
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Source URL</span>
          <input
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
            placeholder="https://..."
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Summary</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
          required
        />
        {fieldErrors?.summary?.[0] ? (
          <span className="text-xs text-rose-700">{fieldErrors.summary[0]}</span>
        ) : null}
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Affected suppliers (optional)</p>
        <div className="grid gap-2 md:grid-cols-2">
          {supplierBuckets.length === 0 ? (
            <p className="text-sm text-slate-500">No suppliers available yet.</p>
          ) : (
            supplierBuckets.map((supplier) => (
              <label
                key={supplier.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSupplierIds.includes(supplier.id)}
                  onChange={(event) => toggleSupplier(supplier.id, event.target.checked)}
                />
                <span>{supplier.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={autoEnrich}
          onChange={(event) => setAutoEnrich(event.target.checked)}
        />
        Auto-enrich with weather and web evidence
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Ingesting..." : "Ingest Event"}
      </button>
    </form>
  );
}

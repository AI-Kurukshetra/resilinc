"use client";

import { useCallback, useState } from "react";

interface RiskEvent {
  id: string;
  event_type: string;
  severity: number;
  region_code: string | null;
  summary: string;
  observed_at: string;
}

interface ScanResult {
  eventsCreated: number;
  facilitiesScanned: number;
  summary: Array<{
    facilityName: string;
    regionCode: string;
    severity: number;
    condition: string;
  }>;
}

const SEVERITY_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-amber-100 text-amber-800",
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
  5: "bg-red-200 text-red-900",
};

export function WeatherRiskPanel({ initialEvents }: { initialEvents: RiskEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch("/api/natural-disaster/scan", { method: "POST" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        setError(json.error?.message ?? "Scan failed");
        return;
      }

      const json = (await res.json()) as { data?: ScanResult };
      setScanResult(json.data ?? null);

      // Refresh events
      const eventsRes = await fetch("/api/risk-events?eventType=natural_disaster&limit=10");
      if (eventsRes.ok) {
        const eventsJson = (await eventsRes.json()) as { data?: { items?: RiskEvent[] } };
        setEvents(eventsJson.data?.items ?? initialEvents);
      }
    } catch {
      setError("Network error during scan");
    } finally {
      setScanning(false);
    }
  }, [initialEvents]);

  return (
    <div className="mac-surface rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Natural Disaster Alerts</h3>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {scanning ? "Scanning..." : "Run Weather Scan"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</div>
      )}

      {scanResult && (
        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-medium">
            Scan complete: {scanResult.facilitiesScanned} facilities scanned, {scanResult.eventsCreated} new events created
          </p>
          {scanResult.summary.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {scanResult.summary.map((s, i) => (
                <li key={i}>
                  {s.facilityName} ({s.regionCode}) — {s.condition} (severity {s.severity})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-xs text-slate-400">No natural disaster risk events recorded.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_COLORS[event.severity] ?? SEVERITY_COLORS[1]}`}>
                S{event.severity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800 line-clamp-2">{event.summary}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {event.region_code ?? "—"} · {new Date(event.observed_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

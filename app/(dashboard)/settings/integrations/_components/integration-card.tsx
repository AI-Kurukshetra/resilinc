"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  type: "api_connector" | "webhook" | "data_feed" | "manual";
  status: "active" | "inactive" | "error";
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface IntegrationCardProps {
  integration: Integration;
}

const TYPE_ICONS: Record<string, string> = {
  api_connector: "🔌",
  webhook: "🔗",
  data_feed: "📡",
  manual: "📋",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  error: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number } | null>(null);

  const statusStyle = STATUS_STYLES[integration.status] ?? STATUS_STYLES.inactive;
  const typeIcon = TYPE_ICONS[integration.type] ?? "⚙️";

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/test`, { method: "POST" });
      const json = await res.json();
      setTestResult(json?.data ?? { success: false, latencyMs: 0 });
    } catch {
      setTestResult({ success: false, latencyMs: 0 });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcon}</span>
          <div>
            <h3 className="font-semibold text-slate-900">{integration.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{integration.type.replace(/_/g, " ")}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
          {integration.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p>Last sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : "Never"}</p>
        <p>Created: {new Date(integration.createdAt).toLocaleDateString()}</p>
        {integration.errorMessage && (
          <p className="text-rose-600">Error: {integration.errorMessage}</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        {testResult && (
          <span className={`text-xs font-medium ${testResult.success ? "text-emerald-600" : "text-rose-600"}`}>
            {testResult.success ? `OK (${testResult.latencyMs}ms)` : "Failed"}
          </span>
        )}
      </div>
    </div>
  );
}

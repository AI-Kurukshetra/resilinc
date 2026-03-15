"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TimeSeriesBucket, ScoreTrendPoint } from "@/lib/analytics/historical";

interface RiskTrendChartProps {
  buckets: TimeSeriesBucket[];
  scoreTrends: ScoreTrendPoint[];
}

function getSeverityColor(severity: number): string {
  switch (severity) {
    case 5: return "#ef4444";
    case 4: return "#f97316";
    case 3: return "#eab308";
    case 2: return "#3b82f6";
    default: return "#6b7280";
  }
}

export function RiskTrendChart({ buckets, scoreTrends }: RiskTrendChartProps) {
  if (buckets.length === 0 && scoreTrends.length === 0) {
    return <p className="text-sm text-slate-600">No risk event data available for the selected period.</p>;
  }

  const barData = buckets.map((bucket) => ({
    period: bucket.period,
    total: bucket.total,
    s5: bucket.bySeverity[5] ?? 0,
    s4: bucket.bySeverity[4] ?? 0,
    s3: bucket.bySeverity[3] ?? 0,
    s2: bucket.bySeverity[2] ?? 0,
    s1: bucket.bySeverity[1] ?? 0,
  }));

  return (
    <div className="space-y-6">
      {barData.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Events by Severity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="s5" name="S5 Critical" stackId="severity" fill={getSeverityColor(5)} />
              <Bar dataKey="s4" name="S4 High" stackId="severity" fill={getSeverityColor(4)} />
              <Bar dataKey="s3" name="S3 Medium" stackId="severity" fill={getSeverityColor(3)} />
              <Bar dataKey="s2" name="S2 Low" stackId="severity" fill={getSeverityColor(2)} />
              <Bar dataKey="s1" name="S1 Info" stackId="severity" fill={getSeverityColor(1)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {scoreTrends.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Supplier Risk Scores</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={scoreTrends.map((point) => ({
                name: point.supplierName,
                score: point.score,
                trend: point.trend,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

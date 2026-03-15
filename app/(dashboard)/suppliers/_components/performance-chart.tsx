"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerformanceRecord {
  periodEnd: string;
  onTimeDeliveryRate: number;
  qualityRejectionRate: number;
  overallRating: number;
}

interface PerformanceChartProps {
  supplierId: string;
}

export function PerformanceChart({ supplierId }: PerformanceChartProps) {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/performance/${supplierId}?limit=12`);
        if (!res.ok) {
          setRecords([]);
          return;
        }
        const json = await res.json();
        const items = json?.data?.items ?? [];
        setRecords(items.reverse());
      } catch {
        setError("Failed to load performance data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supplierId]);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }

  if (records.length === 0) {
    return <p className="text-sm text-slate-500">No performance history available.</p>;
  }

  const chartData = records.map((r) => ({
    period: r.periodEnd,
    delivery: r.onTimeDeliveryRate,
    quality: 100 - r.qualityRejectionRate,
    overall: r.overallRating,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="delivery" name="Delivery %" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="quality" name="Quality %" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="overall" name="Overall" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

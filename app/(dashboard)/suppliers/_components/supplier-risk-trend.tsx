import { cn } from "@/lib/utils";

interface SupplierRiskTrendProps {
  score: number | null;
  trend: "up" | "down" | "flat" | null;
}

export function SupplierRiskTrend({ score, trend }: SupplierRiskTrendProps) {
  if (score === null) {
    return <span className="text-xs text-slate-500">Not scored yet</span>;
  }

  const trendLabel = trend === "up" ? "Rising" : trend === "down" ? "Improving" : "Stable";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-slate-900">{score.toFixed(2)}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          trend === "up" && "bg-rose-100 text-rose-800",
          trend === "down" && "bg-emerald-100 text-emerald-800",
          trend === "flat" && "bg-slate-100 text-slate-700",
        )}
      >
        {trendLabel}
      </span>
    </div>
  );
}

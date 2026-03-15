"use client";

interface InventoryLevel {
  id: string;
  partId: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  maxStock: number | null;
  avgDailyConsumption: number;
  daysOfSupply: number | null;
  riskFlag: "adequate" | "low" | "critical" | "stockout";
  updatedAt: string;
}

interface StockLevelBarsProps {
  items: InventoryLevel[];
  partNames: Record<string, string>;
}

const FLAG_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  adequate: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  low: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  critical: { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500" },
  stockout: { bg: "bg-slate-100", text: "text-slate-900", bar: "bg-slate-900" },
};

export function StockLevelBars({ items, partNames }: StockLevelBarsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No inventory levels tracked yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const colors = FLAG_COLORS[item.riskFlag] ?? FLAG_COLORS.adequate;
        const maxRef = item.maxStock ?? Math.max(item.currentStock, item.reorderPoint * 2, 100);
        const pct = Math.min(100, Math.max(0, (item.currentStock / maxRef) * 100));

        return (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">
                {partNames[item.partId] ?? item.partId.slice(0, 8)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                {item.riskFlag}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${colors.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Stock: {item.currentStock}{item.maxStock ? ` / ${item.maxStock}` : ""}</span>
              <span>
                DoS: {item.daysOfSupply !== null ? `${item.daysOfSupply}d` : "N/A"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

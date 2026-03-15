import type { Metadata } from "next";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listInventoryLevels, getInventoryRiskSummary } from "@/lib/inventory/service";
import { StockLevelBars } from "@/app/(dashboard)/inventory/_components/stock-level-bars";

export const metadata: Metadata = {
  title: "Inventory | Resilinc Lite",
};

interface PartRow {
  id: string;
  name: string;
}

export default async function InventoryPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Inventory dashboard is unavailable without a valid organization context.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const [inventory, summary, { data: partsData }] = await Promise.all([
    listInventoryLevels(supabase, organizationId, { limit: 50, offset: 0 }),
    getInventoryRiskSummary(supabase, organizationId),
    supabase.from("parts").select("id, name").eq("organization_id", organizationId),
  ]);

  const partNames: Record<string, string> = {};
  for (const part of (partsData ?? []) as PartRow[]) {
    partNames[part.id] = part.name;
  }

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Inventory Risk Assessment</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Inventory Levels</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track part inventory, days-of-supply, and risk flags across your supply chain.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
          <p className="text-xs text-slate-500">Total Parts</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-700">{summary.adequate}</p>
          <p className="text-xs text-emerald-600">Adequate</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-700">{summary.low}</p>
          <p className="text-xs text-amber-600">Low</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-rose-700">{summary.critical}</p>
          <p className="text-xs text-rose-600">Critical</p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-900">{summary.stockout}</p>
          <p className="text-xs text-slate-600">Stockout</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Parts Inventory</h2>
        <div className="mt-4">
          <StockLevelBars items={inventory.items} partNames={partNames} />
        </div>
      </section>
    </main>
  );
}

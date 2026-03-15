import type { Metadata } from "next";
import { NetworkGraphView } from "@/app/(dashboard)/supply-chain/_components/network-graph-view";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listSupplierNetworkOverview } from "@/lib/supply-chain/mapping";

export const metadata: Metadata = {
  title: "Supply Chain | Resilinc Lite",
};

export default async function SupplyChainPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Supply chain data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  let nodes;
  try {
    nodes = await listSupplierNetworkOverview(supabase, organizationId, false);
  } catch {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load supply chain network data.
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Supply Chain Network</h1>
          <p className="text-sm text-slate-600">
            Interactive network graph of suppliers, tier links, and exposure profiles.
          </p>
        </div>
        <p className="mac-pill px-3 py-1 text-sm">Nodes: {nodes.length}</p>
      </header>

      <NetworkGraphView nodes={nodes} />
    </main>
  );
}

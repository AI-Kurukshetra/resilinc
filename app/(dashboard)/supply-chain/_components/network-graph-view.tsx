"use client";

import { useCallback, useState } from "react";
import { NetworkGraph } from "./network-graph";
import { ExposurePanel } from "./exposure-panel";
import type { SupplierNetworkNodeDTO } from "@/lib/supply-chain/mapping";

interface NetworkGraphViewProps {
  nodes: SupplierNetworkNodeDTO[];
}

export function NetworkGraphView({ nodes }: NetworkGraphViewProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleNodeClick = useCallback((supplierId: string) => {
    setSelectedSupplierId((prev) => (prev === supplierId ? null : supplierId));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedSupplierId(null);
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="mac-surface rounded-2xl p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Network Graph</h2>
        {nodes.length === 0 ? (
          <p className="text-sm text-slate-600">No suppliers found. Add suppliers to view the network.</p>
        ) : (
          <NetworkGraph
            nodes={nodes}
            selectedSupplierId={selectedSupplierId}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      <div className="mac-surface rounded-2xl p-4">
        {selectedSupplierId ? (
          <ExposurePanel supplierId={selectedSupplierId} onClose={handleClosePanel} />
        ) : (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-slate-700">Exposure Details</p>
            <p className="mt-1 text-xs text-slate-500">Click a supplier node to view exposure profile.</p>
          </div>
        )}
      </div>
    </section>
  );
}

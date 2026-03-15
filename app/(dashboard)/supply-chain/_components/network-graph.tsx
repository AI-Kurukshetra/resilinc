"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SupplierNetworkNodeDTO } from "@/lib/supply-chain/mapping";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
  criticality: number;
  regionCode: string | null;
  facilityCount: number;
  linkedPartCount: number;
  maxTierLevel: number;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface NetworkGraphProps {
  nodes: SupplierNetworkNodeDTO[];
  selectedSupplierId: string | null;
  onNodeClick: (supplierId: string) => void;
}

function getCriticalityColor(criticality: number): string {
  if (criticality >= 5) return "#ef4444";
  if (criticality >= 4) return "#f97316";
  if (criticality >= 3) return "#eab308";
  if (criticality >= 2) return "#3b82f6";
  return "#6b7280";
}

function buildGraphData(nodes: SupplierNetworkNodeDTO[]) {
  const hubId = "__hub__";

  const graphNodes: GraphNode[] = [
    {
      id: hubId,
      name: "Your Organization",
      criticality: 0,
      regionCode: null,
      facilityCount: 0,
      linkedPartCount: 0,
      maxTierLevel: 0,
      val: 12,
    },
    ...nodes.map((node) => ({
      id: node.supplierId,
      name: node.name,
      criticality: node.criticality,
      regionCode: node.regionCode,
      facilityCount: node.facilityCount,
      linkedPartCount: node.linkedPartCount,
      maxTierLevel: node.maxTierLevel,
      val: Math.max(3, node.criticality * 2 + node.linkedPartCount),
    })),
  ];

  const graphLinks: GraphLink[] = nodes.map((node) => ({
    source: hubId,
    target: node.supplierId,
  }));

  return { nodes: graphNodes, links: graphLinks };
}

export function NetworkGraph({ nodes, selectedSupplierId, onNodeClick }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(400, Math.min(600, entry.contentRect.width * 0.65)),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => buildGraphData(nodes), [nodes]);

  const nodeCanvasObject = useMemo(() => {
    return (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = (node as GraphNode & { x?: number }).x;
      const y = (node as GraphNode & { y?: number }).y;
      if (x === undefined || y === undefined) return;

      const isHub = node.id === "__hub__";
      const isSelected = node.id === selectedSupplierId;
      const nodeSize = isHub ? 8 : Math.max(4, node.val * 0.8);
      const fontSize = Math.max(10, 12 / globalScale);

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = isHub ? "#0f172a" : getCriticalityColor(node.criticality);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label
      ctx.font = `${isHub ? "bold " : ""}${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#334155";
      ctx.fillText(node.name, x, y + nodeSize + 2);
    };
  }, [selectedSupplierId]);

  return (
    <div ref={containerRef} className="relative min-h-[400px] w-full">
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject as never}
        nodePointerAreaPaint={((node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          const x = (node as GraphNode & { x?: number }).x;
          const y = (node as GraphNode & { y?: number }).y;
          if (x === undefined || y === undefined) return;
          const nodeSize = node.id === "__hub__" ? 8 : Math.max(4, node.val * 0.8);
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }) as never}
        onNodeClick={((node: GraphNode) => {
          if (node.id !== "__hub__") {
            onNodeClick(node.id);
          }
        }) as never}
        linkColor={() => "#cbd5e1"}
        linkWidth={1.5}
        cooldownTicks={80}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-xs">
        {[
          { label: "C5 Critical", color: "#ef4444" },
          { label: "C4 High", color: "#f97316" },
          { label: "C3 Medium", color: "#eab308" },
          { label: "C2 Low", color: "#3b82f6" },
          { label: "C1 Minimal", color: "#6b7280" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

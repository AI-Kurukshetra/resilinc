"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ExposureFacility {
  facilityId: string;
  name: string;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ExposurePart {
  partId: string;
  partNumber: string;
  description: string | null;
  criticality: number;
  tierLevel: number;
}

interface ExposureData {
  supplier: {
    id: string;
    name: string;
    regionCode: string | null;
    criticality: number;
    isActive: boolean;
  };
  facilities: ExposureFacility[];
  impactedParts: ExposurePart[];
  stats: {
    facilityCount: number;
    linkedPartCount: number;
    maxTierLevel: number;
  };
}

interface ExposurePanelProps {
  supplierId: string;
  onClose: () => void;
}

export function ExposurePanel({ supplierId, onClose }: ExposurePanelProps) {
  const [data, setData] = useState<ExposureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/supply-chain/exposure/${supplierId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load exposure data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [supplierId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Loading exposure...</p>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Close</button>
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-rose-700">Exposure Error</p>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Close</button>
        </div>
        <p className="text-xs text-rose-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Exposure Profile</p>
          <h3 className="text-lg font-semibold text-slate-900">{data.supplier.name}</h3>
        </div>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Close</button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-lg font-semibold text-slate-900">{data.stats.facilityCount}</p>
          <p className="text-xs text-slate-500">Facilities</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-lg font-semibold text-slate-900">{data.stats.linkedPartCount}</p>
          <p className="text-xs text-slate-500">Parts</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2">
          <p className="text-lg font-semibold text-slate-900">T{data.stats.maxTierLevel || "-"}</p>
          <p className="text-xs text-slate-500">Max Tier</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="mac-pill px-2 py-0.5">Region: {data.supplier.regionCode ?? "N/A"}</span>
        <span className="mac-pill px-2 py-0.5">C{data.supplier.criticality}</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${data.supplier.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
          {data.supplier.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {data.facilities.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700">Facilities</h4>
          <ul className="mt-1 space-y-1">
            {data.facilities.map((facility) => (
              <li key={facility.facilityId} className="rounded-md border border-slate-200 p-2 text-xs">
                <p className="font-medium text-slate-900">{facility.name}</p>
                <p className="text-slate-500">{facility.countryCode ?? "Unknown region"}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.impactedParts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700">Linked Parts</h4>
          <ul className="mt-1 space-y-1">
            {data.impactedParts.map((part) => (
              <li key={part.partId} className="rounded-md border border-slate-200 p-2 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-medium text-slate-900">{part.partNumber}</p>
                  <span className="text-slate-500">T{part.tierLevel} C{part.criticality}</span>
                </div>
                {part.description && <p className="mt-0.5 text-slate-600">{part.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/suppliers/${data.supplier.id}`}
        className="block rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-slate-800"
      >
        View Full Supplier Detail
      </Link>
    </div>
  );
}

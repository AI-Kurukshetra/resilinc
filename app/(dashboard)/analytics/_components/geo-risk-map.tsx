"use client";

interface GeoRiskProfile {
  regionCode: string;
  riskLevel: string;
  stabilityIndex: number | null;
  sanctionsActive: boolean;
  supplierCount: number;
}

interface GeoRiskMapProps {
  profiles: GeoRiskProfile[];
}

function riskLevelBadge(level: string): { bg: string; text: string } {
  switch (level) {
    case "low": return { bg: "bg-emerald-100", text: "text-emerald-800" };
    case "medium": return { bg: "bg-amber-100", text: "text-amber-800" };
    case "high": return { bg: "bg-orange-100", text: "text-orange-800" };
    case "critical": return { bg: "bg-rose-100", text: "text-rose-800" };
    default: return { bg: "bg-slate-100", text: "text-slate-800" };
  }
}

export function GeoRiskMap({ profiles }: GeoRiskMapProps) {
  if (profiles.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No geopolitical risk profiles configured. Create profiles via the API to see region risk data here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Risk Level</th>
            <th className="px-3 py-2">Stability</th>
            <th className="px-3 py-2">Sanctions</th>
            <th className="px-3 py-2">Suppliers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {profiles.map((profile) => {
            const badge = riskLevelBadge(profile.riskLevel);
            return (
              <tr key={profile.regionCode} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-900">{profile.regionCode}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}>
                    {profile.riskLevel.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {profile.stabilityIndex !== null ? profile.stabilityIndex.toFixed(1) : "N/A"}
                </td>
                <td className="px-3 py-2">
                  {profile.sanctionsActive ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-700">{profile.supplierCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

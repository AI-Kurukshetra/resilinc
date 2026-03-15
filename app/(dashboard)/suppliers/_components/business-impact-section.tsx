import type { BusinessImpactDTO } from "@/lib/impact-analysis/service";

interface BusinessImpactSectionProps {
  impact: BusinessImpactDTO;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BusinessImpactSection({ impact }: BusinessImpactSectionProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Business Impact Analysis</h2>
      <p className="mt-1 text-xs text-slate-500">
        Revenue at risk based on linked part financial profiles and supplier risk score.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(impact.totalAnnualSpend)}</p>
          <p className="text-xs text-slate-500">Total Annual Spend</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-semibold text-amber-900">{formatCurrency(impact.totalRevenueAtRisk)}</p>
          <p className="text-xs text-amber-700">Revenue at Risk</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center">
          <p className="text-2xl font-semibold text-rose-900">{formatCurrency(impact.estimatedDisruptionCost)}</p>
          <p className="text-xs text-rose-700">Est. Disruption Cost</p>
        </div>
      </div>

      {impact.riskScore !== null && (
        <p className="mt-2 text-xs text-slate-500">
          Risk score: {impact.riskScore.toFixed(1)} — disruption cost = annual spend x (score / 100)
        </p>
      )}

      {impact.linkedParts.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-slate-700">Linked Part Exposure</h3>
          <div className="mt-1 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-1">Part</th>
                  <th className="px-2 py-1">Annual Spend</th>
                  <th className="px-2 py-1">Revenue at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {impact.linkedParts.map((part) => (
                  <tr key={part.partId}>
                    <td className="px-2 py-1 font-medium text-slate-900">{part.partNumber}</td>
                    <td className="px-2 py-1 text-slate-700">{formatCurrency(part.annualSpend)}</td>
                    <td className="px-2 py-1 text-amber-700">{formatCurrency(part.revenueAtRisk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}

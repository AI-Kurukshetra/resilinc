"use client";

interface FinancialHealthCardProps {
  creditRating: string | null;
  altmanZScore: number | null;
  revenueTrend: string | null;
  debtToEquity: number | null;
  daysPayableOutstanding: number | null;
  financialRiskLevel: string;
  assessedAt: string;
  notes: string | null;
}

function riskLevelColor(level: string): string {
  switch (level) {
    case "low": return "bg-emerald-100 text-emerald-800";
    case "medium": return "bg-amber-100 text-amber-800";
    case "high": return "bg-orange-100 text-orange-800";
    case "critical": return "bg-rose-100 text-rose-800";
    default: return "bg-slate-100 text-slate-800";
  }
}

function ratingColor(rating: string): string {
  if (rating.startsWith("A")) return "bg-emerald-100 text-emerald-800";
  if (rating.startsWith("B")) return "bg-amber-100 text-amber-800";
  if (rating.startsWith("C") || rating === "D") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-800";
}

function trendArrow(trend: string | null): string {
  switch (trend) {
    case "growing": return "\u2191 Growing";
    case "stable": return "\u2192 Stable";
    case "declining": return "\u2193 Declining";
    case "unknown": return "? Unknown";
    default: return "N/A";
  }
}

export function FinancialHealthCard({
  creditRating,
  altmanZScore,
  revenueTrend,
  debtToEquity,
  daysPayableOutstanding,
  financialRiskLevel,
  assessedAt,
  notes,
}: FinancialHealthCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Financial Health</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskLevelColor(financialRiskLevel)}`}>
          {financialRiskLevel.toUpperCase()}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Assessed: {new Date(assessedAt).toLocaleDateString()}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          {creditRating ? (
            <span className={`inline-block rounded-full px-2 py-0.5 text-sm font-bold ${ratingColor(creditRating)}`}>
              {creditRating}
            </span>
          ) : (
            <span className="text-sm text-slate-400">N/A</span>
          )}
          <p className="mt-1 text-xs text-slate-500">Credit Rating</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <p className="text-lg font-semibold text-slate-900">
            {altmanZScore !== null ? altmanZScore.toFixed(2) : "N/A"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Altman Z-Score</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <p className="text-sm font-medium text-slate-900">{trendArrow(revenueTrend)}</p>
          <p className="mt-0.5 text-xs text-slate-500">Revenue Trend</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {debtToEquity !== null && (
          <span>D/E Ratio: <strong className="text-slate-900">{debtToEquity.toFixed(2)}</strong></span>
        )}
        {daysPayableOutstanding !== null && (
          <span>DPO: <strong className="text-slate-900">{daysPayableOutstanding} days</strong></span>
        )}
      </div>

      {notes && (
        <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{notes}</p>
      )}
    </article>
  );
}

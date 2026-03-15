"use client";

interface EsgScoreCardProps {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  compositeScore: number;
  assessmentDate: string;
  notes: string | null;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{score.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

function compositeColor(score: number): string {
  if (score >= 70) return "text-emerald-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-700";
}

export function EsgScoreCard({
  environmentalScore,
  socialScore,
  governanceScore,
  compositeScore,
  assessmentDate,
  notes,
}: EsgScoreCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">ESG Score</h2>
        <span className={`text-2xl font-bold ${compositeColor(compositeScore)}`}>
          {compositeScore.toFixed(1)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Composite = E(40%) + S(35%) + G(25%) | Assessed: {new Date(assessmentDate).toLocaleDateString()}
      </p>

      <div className="mt-3 space-y-2">
        <ScoreBar label="Environmental" score={environmentalScore} color="bg-emerald-500" />
        <ScoreBar label="Social" score={socialScore} color="bg-blue-500" />
        <ScoreBar label="Governance" score={governanceScore} color="bg-violet-500" />
      </div>

      {notes && (
        <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{notes}</p>
      )}
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getComplianceSummary } from "@/lib/compliance/service";
import { cn } from "@/lib/utils";
import { ComplianceFrameworkCreateForm } from "@/app/(dashboard)/compliance/_components/compliance-framework-create-form";

export const metadata: Metadata = {
  title: "Compliance | Resilinc Lite",
};

const CATEGORY_STYLES: Record<string, string> = {
  regulatory: "bg-rose-100 text-rose-800",
  industry: "bg-violet-100 text-violet-800",
  internal: "bg-blue-100 text-blue-800",
  esg: "bg-emerald-100 text-emerald-800",
};

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function CompliancePage() {
  const context = await getDashboardContext();
  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Compliance data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;
  const summaries = await getComplianceSummary(supabase, organizationId);

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Compliance</h1>
          <p className="text-sm text-slate-600">
            Track regulatory, industry, and internal compliance frameworks.
          </p>
        </div>
      </header>

      {summaries.length === 0 ? (
        <div className="mac-surface rounded-2xl p-6 text-center text-sm text-slate-500">
          No compliance frameworks yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {summaries.map((s) => (
            <Link
              key={s.frameworkId}
              href={`/compliance/${s.frameworkId}`}
              className="mac-surface group flex flex-col gap-3 rounded-2xl p-4 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                  {s.frameworkName}
                </h2>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    CATEGORY_STYLES[s.category] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {s.category}
                </span>
              </div>

              <ProgressBar value={s.percentageCompliant} />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{s.compliant} / {s.total} compliant</span>
                <span className="font-semibold text-slate-700">{s.percentageCompliant}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mac-surface rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Add Framework</h2>
        <ComplianceFrameworkCreateForm />
      </div>
    </main>
  );
}

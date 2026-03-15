import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getPlanDetail, MitigationServiceError } from "@/lib/mitigation/service";
import { PlanActionList } from "@/app/(dashboard)/mitigation/_components/plan-action-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mitigation Plan | Resilinc Lite",
};

interface PageProps {
  params: Promise<{ planId: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  archived: "bg-amber-100 text-amber-800",
};

const STRATEGY_STYLES: Record<string, string> = {
  avoid: "bg-rose-100 text-rose-800",
  mitigate: "bg-orange-100 text-orange-800",
  transfer: "bg-violet-100 text-violet-800",
  accept: "bg-slate-100 text-slate-700",
};

export default async function PlanDetailPage({ params }: PageProps) {
  const context = await getDashboardContext();
  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Plan data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { planId } = await params;
  const { organizationId, supabase } = context;

  let plan;
  try {
    plan = await getPlanDetail(supabase, organizationId, planId);
  } catch (error) {
    if (error instanceof MitigationServiceError && error.status === 404) notFound();
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load plan.
      </main>
    );
  }

  const allDone =
    (plan.actions ?? []).length > 0 &&
    (plan.actions ?? []).every((a) => a.status === "completed" || a.status === "cancelled");

  return (
    <main className="space-y-4">
      <div className="mac-surface rounded-2xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/mitigation" className="text-xs text-slate-400 hover:text-slate-600">
              ← Mitigation Plans
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{plan.title}</h1>
            {plan.description && (
              <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize",
                STATUS_STYLES[plan.status] ?? "bg-slate-100 text-slate-700",
              )}
            >
              {plan.status}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize",
                STRATEGY_STYLES[plan.strategy] ?? "bg-slate-100 text-slate-700",
              )}
            >
              {plan.strategy}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">Priority</dt>
            <dd className="font-medium text-slate-800">P{plan.priority}</dd>
          </div>
          {plan.targetDate && (
            <div>
              <dt className="text-slate-400">Target date</dt>
              <dd className="font-medium text-slate-800">
                {new Date(plan.targetDate).toLocaleDateString()}
              </dd>
            </div>
          )}
          {plan.completedAt && (
            <div>
              <dt className="text-slate-400">Completed</dt>
              <dd className="font-medium text-emerald-700">
                {new Date(plan.completedAt).toLocaleDateString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-slate-400">Created</dt>
            <dd className="font-medium text-slate-800">
              {new Date(plan.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <PlanActionList
        plan={{ id: plan.id, status: plan.status }}
        initialActions={plan.actions ?? []}
        canComplete={allDone && plan.status !== "completed" && plan.status !== "archived"}
      />
    </main>
  );
}

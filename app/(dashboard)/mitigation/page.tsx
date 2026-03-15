import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listPlans } from "@/lib/mitigation/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mitigation Plans | Resilinc Lite",
};

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

const PRIORITY_LABEL: Record<number, string> = {
  1: "P1",
  2: "P2",
  3: "P3",
  4: "P4",
  5: "P5",
};

const PRIORITY_COLOR: Record<number, string> = {
  1: "text-emerald-700",
  2: "text-blue-700",
  3: "text-slate-600",
  4: "text-amber-700",
  5: "text-rose-700",
};

const STATUS_FILTERS = ["all", "draft", "active", "completed", "archived"] as const;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MitigationPage({ searchParams }: PageProps) {
  const context = await getDashboardContext();
  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Mitigation data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;
  const { status } = await searchParams;

  const filterStatus =
    status && ["draft", "active", "completed", "archived"].includes(status)
      ? (status as "draft" | "active" | "completed" | "archived")
      : undefined;

  const { items: plans, pagination } = await listPlans(supabase, organizationId, {
    limit: 50,
    offset: 0,
    status: filterStatus,
  });

  // Load supplier names for plans that reference a supplier
  const supplierIds = [...new Set(plans.map((p) => p.supplierId).filter(Boolean))] as string[];
  const supplierNameById = new Map<string, string>();
  if (supplierIds.length > 0) {
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", supplierIds);
    for (const s of (suppliers ?? []) as { id: string; name: string }[]) {
      supplierNameById.set(s.id, s.name);
    }
  }

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mitigation Plans</h1>
          <p className="text-sm text-slate-600">Risk mitigation workflows with strategy classification and action checklists.</p>
        </div>
        <Link
          href="/mitigation/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New Plan
        </Link>
      </header>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/mitigation" : `/mitigation?status=${s}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
              (s === "all" && !filterStatus) || s === filterStatus
                ? "bg-slate-900 text-white"
                : "bg-white/60 text-slate-600 hover:bg-white",
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      {plans.length === 0 ? (
        <div className="mac-surface rounded-2xl p-8 text-center text-sm text-slate-500">
          No mitigation plans found.{" "}
          <Link href="/mitigation/new" className="text-slate-900 underline">
            Create your first plan.
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/mitigation/${plan.id}`}
              className="mac-surface group flex flex-col gap-3 rounded-2xl p-4 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                  {plan.title}
                </h2>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    STATUS_STYLES[plan.status] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {plan.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium capitalize",
                    STRATEGY_STYLES[plan.strategy] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {plan.strategy}
                </span>
                <span className={cn("font-semibold", PRIORITY_COLOR[plan.priority] ?? "text-slate-600")}>
                  {PRIORITY_LABEL[plan.priority] ?? `P${plan.priority}`}
                </span>
                {plan.supplierId && supplierNameById.has(plan.supplierId) && (
                  <span className="text-slate-500">
                    Supplier: <span className="font-medium text-slate-700">{supplierNameById.get(plan.supplierId)}</span>
                  </span>
                )}
              </div>

              {plan.description && (
                <p className="line-clamp-2 text-xs text-slate-500">{plan.description}</p>
              )}

              <div className="text-xs text-slate-400">
                Created {new Date(plan.createdAt).toLocaleDateString()}
                {plan.targetDate && (
                  <> · Target {new Date(plan.targetDate).toLocaleDateString()}</>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-right text-xs text-slate-400">
        {pagination.total} plan{pagination.total !== 1 ? "s" : ""}
      </p>
    </main>
  );
}

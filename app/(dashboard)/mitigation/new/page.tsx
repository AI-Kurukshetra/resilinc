import type { Metadata } from "next";
import { getDashboardContext } from "@/lib/dashboard/context";
import { PlanCreateForm } from "@/app/(dashboard)/mitigation/_components/plan-create-form";

export const metadata: Metadata = {
  title: "New Mitigation Plan | Resilinc Lite",
};

export default async function NewMitigationPlanPage() {
  const context = await getDashboardContext();
  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Unable to load context. Please sign in.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const [{ data: suppliers }, { data: alerts }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("alerts")
      .select("id, title")
      .eq("organization_id", organizationId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <main className="space-y-4">
      <header className="mac-surface rounded-2xl p-4">
        <h1 className="text-2xl font-semibold text-slate-900">New Mitigation Plan</h1>
        <p className="text-sm text-slate-600">Define a risk mitigation strategy and action plan.</p>
      </header>

      <PlanCreateForm
        suppliers={(suppliers ?? []) as { id: string; name: string }[]}
        alerts={(alerts ?? []) as { id: string; title: string }[]}
      />
    </main>
  );
}

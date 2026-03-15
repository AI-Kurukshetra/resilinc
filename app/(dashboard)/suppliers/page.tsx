import type { Metadata } from "next";
import Link from "next/link";
import { SupplierCreateForm } from "@/app/(dashboard)/suppliers/_components/supplier-create-form";
import { SupplierRiskTrend } from "@/app/(dashboard)/suppliers/_components/supplier-risk-trend";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Suppliers | Resilinc Lite",
};

interface SupplierRow {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
  created_at: string;
}

interface SupplierRiskScoreRow {
  supplier_id: string;
  score: number | string;
  trend: "up" | "down" | "flat";
}

interface SupplierAlertRow {
  supplier_id: string | null;
  severity: number;
  status: "open" | "acknowledged" | "resolved";
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export default async function SuppliersPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Supplier data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: supplierRows, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active, created_at")
    .eq("organization_id", organizationId)
    .order("criticality", { ascending: false })
    .order("name", { ascending: true });

  if (supplierError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load suppliers: {supplierError.message}
      </main>
    );
  }

  const suppliers = (supplierRows as SupplierRow[] | null) ?? [];
  const supplierIds = suppliers.map((supplier) => supplier.id);

  let scoreBySupplierId = new Map<string, SupplierRiskScoreRow>();
  let activeAlertSummaryBySupplierId = new Map<string, { count: number; maxSeverity: number }>();

  if (supplierIds.length > 0) {
    const [{ data: scoreRows }, { data: alertRows }] = await Promise.all([
      supabase
        .from("supplier_risk_scores")
        .select("supplier_id, score, trend")
        .eq("organization_id", organizationId)
        .in("supplier_id", supplierIds),
      supabase
        .from("alerts")
        .select("supplier_id, severity, status")
        .eq("organization_id", organizationId)
        .neq("status", "resolved")
        .in("supplier_id", supplierIds),
    ]);

    scoreBySupplierId = new Map<string, SupplierRiskScoreRow>(
      ((scoreRows as SupplierRiskScoreRow[] | null) ?? []).map((row) => [row.supplier_id, row]),
    );

    const alertRowsSafe = (alertRows as SupplierAlertRow[] | null) ?? [];
    for (const row of alertRowsSafe) {
      if (!row.supplier_id) {
        continue;
      }

      const existing = activeAlertSummaryBySupplierId.get(row.supplier_id) ?? {
        count: 0,
        maxSeverity: 0,
      };

      activeAlertSummaryBySupplierId.set(row.supplier_id, {
        count: existing.count + 1,
        maxSeverity: Math.max(existing.maxSeverity, row.severity),
      });
    }
  }

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Supplier Risk Registry</h1>
          <p className="text-sm text-slate-600">
            Prioritized supplier monitoring with live score trend and alert pressure.
          </p>
        </div>
        <p className="mac-pill px-3 py-1 text-sm">Total suppliers: {suppliers.length}</p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="mac-surface rounded-2xl p-4">
        {suppliers.length === 0 ? (
          <p className="text-sm text-slate-600">No suppliers found for this organization.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Criticality</th>
                  <th className="px-3 py-2">Risk score</th>
                  <th className="px-3 py-2">Open alerts</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => {
                  const scoreRow = scoreBySupplierId.get(supplier.id);
                  const alertSummary = activeAlertSummaryBySupplierId.get(supplier.id);

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-medium text-slate-900 underline-offset-2 hover:underline"
                        >
                          {supplier.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{supplier.region_code ?? "N/A"}</td>
                      <td className="px-3 py-3 text-slate-700">C{supplier.criticality}</td>
                      <td className="px-3 py-3">
                        <SupplierRiskTrend
                          score={scoreRow ? toNumber(scoreRow.score) : null}
                          trend={scoreRow?.trend ?? null}
                        />
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {alertSummary ? `${alertSummary.count} (max S${alertSummary.maxSeverity})` : "0"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            supplier.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {supplier.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
        <SupplierCreateForm />
      </section>
    </main>
  );
}

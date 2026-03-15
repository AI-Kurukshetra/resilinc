import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard/context";
import { ComplianceServiceError, listItems } from "@/lib/compliance/service";
import { ComplianceStatusBadge } from "@/app/(dashboard)/compliance/_components/compliance-status-badge";
import { ItemAssessmentForm } from "@/app/(dashboard)/compliance/_components/item-assessment-form";
import { cn } from "@/lib/utils";
import type { ComplianceItemDTO } from "@/lib/compliance/service";

export const metadata: Metadata = {
  title: "Compliance Framework | Resilinc Lite",
};

interface PageProps {
  params: Promise<{ frameworkId: string }>;
}

export default async function FrameworkDetailPage({ params }: PageProps) {
  const context = await getDashboardContext();
  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Compliance data unavailable. Ensure you are signed in.
      </main>
    );
  }

  const { frameworkId } = await params;
  const { organizationId, supabase } = context;

  // Load framework details
  const { data: frameworkRow, error: fwError } = await supabase
    .from("compliance_frameworks")
    .select("id, name, description, category, created_at")
    .eq("organization_id", organizationId)
    .eq("id", frameworkId)
    .maybeSingle();

  if (fwError || !frameworkRow) notFound();

  const framework = frameworkRow as {
    id: string;
    name: string;
    description: string;
    category: string;
    created_at: string;
  };

  let itemsData: ComplianceItemDTO[] = [];
  try {
    const result = await listItems(supabase, organizationId, frameworkId, {
      limit: 200,
      offset: 0,
    });
    itemsData = result.items;
  } catch (error) {
    if (error instanceof ComplianceServiceError) {
      return (
        <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Failed to load items: {error.message}
        </main>
      );
    }
  }

  // Load supplier names
  const supplierIds = [...new Set(itemsData.map((i) => i.supplierId).filter(Boolean))] as string[];
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

  // Group by supplier
  const grouped = new Map<string, ComplianceItemDTO[]>();
  for (const item of itemsData) {
    const key = item.supplierId ?? "__no_supplier__";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  // Load suppliers for adding items
  const { data: allSuppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(200);

  return (
    <main className="space-y-4">
      <div className="mac-surface rounded-2xl p-4">
        <Link href="/compliance" className="text-xs text-slate-400 hover:text-slate-600">
          ← Compliance
        </Link>
        <div className="mt-1 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{framework.name}</h1>
            {framework.description && (
              <p className="mt-1 text-sm text-slate-600">{framework.description}</p>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
            {framework.category}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {itemsData.length} requirement{itemsData.length !== 1 ? "s" : ""} ·{" "}
          {itemsData.filter((i) => i.status === "compliant").length} compliant
        </p>
      </div>

      {itemsData.length === 0 ? (
        <div className="mac-surface rounded-2xl p-6 text-center text-sm text-slate-500">
          No requirements yet. Add one below.
        </div>
      ) : (
        <div className="mac-surface space-y-6 rounded-2xl p-4">
          {[...grouped.entries()].map(([supplierKey, items]) => {
            const supplierName =
              supplierKey === "__no_supplier__"
                ? "No Supplier"
                : (supplierNameById.get(supplierKey) ?? supplierKey);
            return (
              <div key={supplierKey}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {supplierName}
                </h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="flex-1">
                        <p className="text-sm text-slate-800">{item.requirement}</p>
                        {item.evidenceNotes && (
                          <p className="mt-1 text-xs text-slate-500">{item.evidenceNotes}</p>
                        )}
                        {item.assessedAt && (
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Assessed {new Date(item.assessedAt).toLocaleDateString()}
                            {item.nextReviewDate && (
                              <> · Review {new Date(item.nextReviewDate).toLocaleDateString()}</>
                            )}
                          </p>
                        )}
                      </div>
                      <ComplianceStatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <ItemAssessmentForm
        frameworkId={frameworkId}
        items={itemsData}
        suppliers={(allSuppliers ?? []) as { id: string; name: string }[]}
      />
    </main>
  );
}

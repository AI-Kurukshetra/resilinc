import type { Metadata } from "next";
import { AlertsWorkbench } from "@/app/(dashboard)/alerts/_components/alerts-workbench";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata: Metadata = {
  title: "Alerts | Resilinc Lite",
};

interface AlertRow {
  id: string;
  supplier_id: string | null;
  title: string;
  severity: number;
  status: "open" | "acknowledged" | "resolved";
  owner_id?: string | null;
  created_at: string;
}

interface SupplierRow {
  id: string;
  name: string;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

export default async function AlertsPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Alert data is unavailable. Ensure dashboard session and organization context are active.
      </main>
    );
  }

  const { organizationId, supabase } = context;

  const { data: alertRows, error: alertError } = await supabase
    .from("alerts")
    .select("id, supplier_id, title, severity, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (alertError) {
    return (
      <main className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Failed to load alerts: {alertError.message}
      </main>
    );
  }

  const alerts = (alertRows as AlertRow[] | null) ?? [];

  const supplierIds = [...new Set(alerts.map((alert) => alert.supplier_id).filter(Boolean))] as string[];
  const ownerIds = [...new Set(alerts.map((alert) => alert.owner_id).filter(Boolean))] as string[];

  const [{ data: suppliers }, { data: owners }] = await Promise.all([
    supplierIds.length
      ? supabase
          .from("suppliers")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", supplierIds)
      : Promise.resolve({ data: [] as SupplierRow[] }),
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ownerIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
  ]);

  const supplierNameById = new Map(
    ((suppliers as SupplierRow[] | null) ?? []).map((supplier) => [supplier.id, supplier.name]),
  );
  const ownerNameById = new Map(
    ((owners as ProfileRow[] | null) ?? []).map((owner) => [owner.user_id, owner.full_name ?? owner.user_id]),
  );

  const alertItems = alerts.map((alert) => ({
    id: alert.id,
    supplierId: alert.supplier_id,
    title: alert.title,
    severity: alert.severity,
    status: alert.status,
    ownerId: alert.owner_id ?? null,
    createdAt: alert.created_at,
  }));

  const supplierNameByIdRecord = Object.fromEntries(
    [...supplierNameById.entries()].map(([id, name]) => [id, name]),
  );
  const ownerNameByIdRecord = Object.fromEntries(
    [...ownerNameById.entries()].map(([id, name]) => [id, name]),
  );

  return (
    <main className="space-y-4">
      <header className="mac-surface flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Alert Feed</h1>
          <p className="text-sm text-slate-600">
            Active and historical alerts with real-time operations controls.
          </p>
        </div>
        <p className="text-sm text-slate-600">Total alerts: {alerts.length}</p>
      </header>

      <AlertsWorkbench
        alerts={alertItems}
        supplierNameById={supplierNameByIdRecord}
        ownerNameById={ownerNameByIdRecord}
      />
    </main>
  );
}

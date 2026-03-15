import type { Metadata } from "next";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listIntegrations } from "@/lib/integrations/service";
import { IntegrationCard } from "@/app/(dashboard)/settings/integrations/_components/integration-card";

export const metadata: Metadata = {
  title: "Integrations | Resilinc Lite",
};

export default async function IntegrationsPage() {
  const context = await getDashboardContext();

  if (!context) {
    return (
      <main className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Integrations page is unavailable without a valid organization context.
      </main>
    );
  }

  const { organizationId, supabase } = context;
  const result = await listIntegrations(supabase, organizationId, { limit: 50, offset: 0 });

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Integrations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage external data connectors, webhooks, and data feeds for your supply chain intelligence platform.
        </p>
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">No integrations configured yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Integrations will appear here once configured via API or seed data.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
            />
          ))}
        </div>
      )}
    </main>
  );
}

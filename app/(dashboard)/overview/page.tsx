import type { Metadata } from "next";
import Link from "next/link";
import { isAuthBypassEnabled } from "@/lib/auth/feature-flags";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview | Resilinc Lite",
};

interface SupplierRow {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
  created_at: string;
}

interface FacilityRow {
  id: string;
  name: string;
  country_code: string | null;
  supplier_id: string;
  created_at: string;
}

interface PartRow {
  id: string;
  part_number: string;
  criticality: number;
  created_at: string;
}

interface OverviewData {
  actorName: string;
  facilities: FacilityRow[];
  highRiskSuppliers: number;
  openAlerts: number;
  openIncidents: number;
  parts: PartRow[];
  suppliers: SupplierRow[];
  totalFacilities: number;
  totalParts: number;
  totalSuppliers: number;
}

async function getOverviewData(): Promise<OverviewData | null> {
  const bypassEnabled = isAuthBypassEnabled();

  if (bypassEnabled) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let organizationId = organization?.id ?? null;

    if (!organizationId) {
      const { data: usersData } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      const demoUserId = usersData.users[0]?.id;

      if (!demoUserId) {
        return null;
      }

      await supabase.from("profiles").upsert(
        {
          user_id: demoUserId,
          full_name: "Akash Bhavsar",
        },
        { onConflict: "user_id" },
      );

      const { data: createdOrg } = await supabase
        .from("organizations")
        .insert({
          created_by: demoUserId,
          name: "Apex Devices Group",
        })
        .select("id")
        .single();

      organizationId = createdOrg?.id ?? null;

      if (!organizationId) {
        return null;
      }

      await supabase.from("organization_members").upsert(
        {
          organization_id: organizationId,
          role: "owner",
          user_id: demoUserId,
        },
        { onConflict: "organization_id,user_id" },
      );
    }

    return readOverviewDataForOrg(supabase, organizationId, "Akash Bhavsar");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    return null;
  }

  const actorName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "Authenticated User";

  return readOverviewDataForOrg(supabase, membership.organization_id, actorName);
}

async function readOverviewDataForOrg(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  actorName: string,
): Promise<OverviewData> {
  const [
    suppliersResult,
    facilitiesResult,
    partsResult,
    highRiskCountResult,
    openAlertsCountResult,
    openIncidentsCountResult,
  ] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name, region_code, criticality, is_active, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("facilities")
      .select("id, name, country_code, supplier_id, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("parts")
      .select("id, part_number, criticality, created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("suppliers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("criticality", 4),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "resolved"),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "closed"),
  ]);

  return {
    actorName,
    facilities: (facilitiesResult.data as FacilityRow[] | null) ?? [],
    highRiskSuppliers: highRiskCountResult.count ?? 0,
    openAlerts: openAlertsCountResult.count ?? 0,
    openIncidents: openIncidentsCountResult.count ?? 0,
    parts: (partsResult.data as PartRow[] | null) ?? [],
    suppliers: (suppliersResult.data as SupplierRow[] | null) ?? [],
    totalFacilities: facilitiesResult.count ?? 0,
    totalParts: partsResult.count ?? 0,
    totalSuppliers: suppliersResult.count ?? 0,
  };
}

export default async function OverviewPage() {
  const actorName = isAuthBypassEnabled() ? "Akash Bhavsar" : "Authenticated User";
  const overviewData = await getOverviewData();

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Overview dashboard</h1>
      <p className="text-sm text-slate-600">
        Active user:{" "}
        <span className="font-medium text-slate-900">
          {overviewData?.actorName ?? actorName}
        </span>
      </p>
      {!overviewData ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Dashboard data is unavailable right now. Ensure seeded org data exists and
          `SUPABASE_SERVICE_ROLE_KEY` is set while bypass mode is enabled.
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500">Suppliers</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.totalSuppliers}</p>
            </article>
            <article className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500">High-risk suppliers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {overviewData.highRiskSuppliers}
              </p>
            </article>
            <article className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500">Open alerts</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.openAlerts}</p>
            </article>
            <article className="rounded-lg border bg-white p-4">
              <p className="text-xs text-slate-500">Open incidents</p>
              <p className="text-2xl font-semibold text-slate-900">{overviewData.openIncidents}</p>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent suppliers</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.suppliers.length === 0 ? (
                  <li className="text-slate-500">No suppliers yet</li>
                ) : (
                  overviewData.suppliers.map((supplier) => (
                    <li key={supplier.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{supplier.name}</span>
                      <span className="text-xs text-slate-500">C{supplier.criticality}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
            <article className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent facilities ({overviewData.totalFacilities})
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.facilities.length === 0 ? (
                  <li className="text-slate-500">No facilities yet</li>
                ) : (
                  overviewData.facilities.map((facility) => (
                    <li key={facility.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{facility.name}</span>
                      <span className="text-xs text-slate-500">
                        {facility.country_code ?? "N/A"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </article>
            <article className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent parts ({overviewData.totalParts})
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {overviewData.parts.length === 0 ? (
                  <li className="text-slate-500">No parts yet</li>
                ) : (
                  overviewData.parts.map((part) => (
                    <li key={part.id} className="flex items-center justify-between">
                      <span className="text-slate-800">{part.part_number}</span>
                      <span className="text-xs text-slate-500">C{part.criticality}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </section>
        </>
      )}
      <Link
        href="/logout"
        className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Sign out
      </Link>
    </main>
  );
}

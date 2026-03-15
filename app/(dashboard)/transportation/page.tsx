import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isAuthBypassEnabled } from "@/lib/auth/feature-flags";
import { RouteCards } from "./_components/route-create-form";

interface RouteItem {
  id: string;
  organization_id: string;
  name: string;
  origin_facility_id: string | null;
  destination_name: string;
  transport_mode: string;
  estimated_transit_days: number;
  risk_level: string;
  active_disruptions: string | null;
  created_at: string;
  facilities: { name: string }[] | { name: string } | null;
}

const TRANSPORT_MODE_LABELS: Record<string, string> = {
  ocean: "Ocean",
  air: "Air",
  rail: "Rail",
  road: "Road",
  multimodal: "Multimodal",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const MODE_ICONS: Record<string, string> = {
  ocean: "\u{1F6A2}",
  air: "\u{2708}\u{FE0F}",
  rail: "\u{1F682}",
  road: "\u{1F69A}",
  multimodal: "\u{1F504}",
};

export default async function TransportationPage() {
  const supabase = isAuthBypassEnabled()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();

  let organizationId: string | null = null;

  if (isAuthBypassEnabled()) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    organizationId = org?.id ?? null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      organizationId = membership?.organization_id ?? null;
    }
  }

  let routes: RouteItem[] = [];
  if (organizationId) {
    const { data } = await supabase
      .from("transportation_routes")
      .select("id, organization_id, name, origin_facility_id, destination_name, transport_mode, estimated_transit_days, risk_level, active_disruptions, created_at, facilities(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);
    routes = (data ?? []) as RouteItem[];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Transportation Routes</h2>
          <p className="text-sm text-slate-500">{routes.length} route{routes.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <RouteCards />
      </div>

      {routes.length === 0 ? (
        <div className="mac-surface rounded-2xl p-8 text-center text-sm text-slate-400">
          No transportation routes configured yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <div key={route.id} className="mac-surface rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={route.transport_mode}>
                    {MODE_ICONS[route.transport_mode] ?? MODE_ICONS.multimodal}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{route.name}</h3>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_COLORS[route.risk_level] ?? RISK_COLORS.low}`}>
                  {route.risk_level}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mode</span>
                  <span>{TRANSPORT_MODE_LABELS[route.transport_mode] ?? route.transport_mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin</span>
                  <span>{Array.isArray(route.facilities) ? (route.facilities[0]?.name ?? "—") : (route.facilities?.name ?? "—")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination</span>
                  <span>{route.destination_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transit</span>
                  <span>{route.estimated_transit_days} day{route.estimated_transit_days !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {route.active_disruptions && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  {route.active_disruptions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

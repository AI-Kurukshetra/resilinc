import type { SupabaseClient } from "@supabase/supabase-js";
import type { RouteCreateInput, RouteUpdateInput, RouteListQuery } from "@/lib/validations/transportation";

// ─── Error ────────────────────────────────────────────────────────────────────

export class TransportationServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface RouteDTO {
  id: string;
  organizationId: string;
  name: string;
  originFacilityId: string | null;
  originFacilityName: string | null;
  destinationName: string;
  transportMode: "ocean" | "air" | "rail" | "road" | "multimodal";
  estimatedTransitDays: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  activeDisruptions: string | null;
  updatedAt: string;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface RouteRow {
  id: string;
  organization_id: string;
  name: string;
  origin_facility_id: string | null;
  destination_name: string;
  transport_mode: string;
  estimated_transit_days: number;
  risk_level: string;
  active_disruptions: string | null;
  updated_at: string;
  created_at: string;
  facilities?: { name: string }[] | { name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDTO(row: RouteRow): RouteDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    originFacilityId: row.origin_facility_id,
    originFacilityName: Array.isArray(row.facilities) ? (row.facilities[0]?.name ?? null) : (row.facilities?.name ?? null),
    destinationName: row.destination_name,
    transportMode: row.transport_mode as RouteDTO["transportMode"],
    estimatedTransitDays: row.estimated_transit_days,
    riskLevel: row.risk_level as RouteDTO["riskLevel"],
    activeDisruptions: row.active_disruptions,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, name, origin_facility_id, destination_name, transport_mode, estimated_transit_days, risk_level, active_disruptions, updated_at, created_at, facilities(name)";

const SELECT_NO_JOIN =
  "id, organization_id, name, origin_facility_id, destination_name, transport_mode, estimated_transit_days, risk_level, active_disruptions, updated_at, created_at";

// ─── Risk assessment stub ─────────────────────────────────────────────────────

export function assessRouteRisk(
  transportMode: string,
  estimatedTransitDays: number,
): "low" | "medium" | "high" | "critical" {
  if (transportMode === "ocean") return "medium";
  if (transportMode === "air") return "low";
  if (transportMode === "road" && estimatedTransitDays > 5) return "medium";
  if (transportMode === "rail") return estimatedTransitDays > 7 ? "medium" : "low";
  if (transportMode === "multimodal") return "medium";
  return "low";
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function listRoutes(
  supabase: SupabaseClient,
  organizationId: string,
  query: RouteListQuery,
): Promise<{ items: RouteDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("transportation_routes")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.transportMode) {
    dbQuery = dbQuery.eq("transport_mode", query.transportMode);
  }

  if (query.riskLevel) {
    dbQuery = dbQuery.eq("risk_level", query.riskLevel);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new TransportationServiceError(
      "ROUTE_LIST_FAILED",
      error.message || "Failed to list transportation routes.",
      500,
    );
  }

  return {
    items: ((data ?? []) as RouteRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function createRoute(
  supabase: SupabaseClient,
  organizationId: string,
  input: RouteCreateInput,
): Promise<RouteDTO> {
  const riskLevel = assessRouteRisk(input.transportMode, input.estimatedTransitDays);

  const { data, error } = await supabase
    .from("transportation_routes")
    .insert({
      organization_id: organizationId,
      name: input.name,
      origin_facility_id: input.originFacilityId ?? null,
      destination_name: input.destinationName,
      transport_mode: input.transportMode,
      estimated_transit_days: input.estimatedTransitDays,
      risk_level: riskLevel,
      active_disruptions: input.activeDisruptions ?? null,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new TransportationServiceError(
      "ROUTE_CREATE_FAILED",
      error?.message || "Failed to create transportation route.",
      500,
    );
  }

  return toDTO(data as RouteRow);
}

export async function getRouteById(
  supabase: SupabaseClient,
  organizationId: string,
  routeId: string,
): Promise<RouteDTO> {
  const { data, error } = await supabase
    .from("transportation_routes")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("id", routeId)
    .maybeSingle();

  if (error) {
    throw new TransportationServiceError(
      "ROUTE_LOOKUP_FAILED",
      error.message || "Failed to lookup route.",
      500,
    );
  }

  if (!data) {
    throw new TransportationServiceError("ROUTE_NOT_FOUND", "Transportation route not found.", 404);
  }

  return toDTO(data as RouteRow);
}

export async function updateRoute(
  supabase: SupabaseClient,
  organizationId: string,
  routeId: string,
  input: RouteUpdateInput,
): Promise<RouteDTO> {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.originFacilityId !== undefined) updatePayload.origin_facility_id = input.originFacilityId;
  if (input.destinationName !== undefined) updatePayload.destination_name = input.destinationName;
  if (input.transportMode !== undefined) updatePayload.transport_mode = input.transportMode;
  if (input.estimatedTransitDays !== undefined) updatePayload.estimated_transit_days = input.estimatedTransitDays;
  if (input.riskLevel !== undefined) updatePayload.risk_level = input.riskLevel;
  if (input.activeDisruptions !== undefined) updatePayload.active_disruptions = input.activeDisruptions;

  // Re-assess risk if mode or transit days changed and risk not explicitly set
  if (input.riskLevel === undefined && (input.transportMode !== undefined || input.estimatedTransitDays !== undefined)) {
    const existing = await getRouteById(supabase, organizationId, routeId);
    const mode = input.transportMode ?? existing.transportMode;
    const days = input.estimatedTransitDays ?? existing.estimatedTransitDays;
    updatePayload.risk_level = assessRouteRisk(mode, days);
  }

  const { data, error } = await supabase
    .from("transportation_routes")
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", routeId)
    .select(SELECT_NO_JOIN)
    .single();

  if (error || !data) {
    throw new TransportationServiceError(
      "ROUTE_UPDATE_FAILED",
      error?.message || "Failed to update transportation route.",
      500,
    );
  }

  return toDTO(data as RouteRow);
}

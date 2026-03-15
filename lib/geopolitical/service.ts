import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeoRiskProfileUpsertInput, GeoRiskProfileListQuery } from "@/lib/validations/geopolitical";

// ─── Error ────────────────────────────────────────────────────────────────────

export class GeoRiskServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface GeoRiskProfileDTO {
  id: string;
  organizationId: string;
  regionCode: string;
  riskLevel: string;
  stabilityIndex: number | null;
  sanctionsActive: boolean;
  tradeRestrictionNotes: string | null;
  updatedAt: string;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface GeoRow {
  id: string;
  organization_id: string;
  region_code: string;
  risk_level: string;
  stability_index: number | string | null;
  sanctions_active: boolean;
  trade_restriction_notes: string | null;
  updated_at: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumOrNull(v: number | string | null): number | null {
  if (v === null) return null;
  return typeof v === "number" ? v : Number(v);
}

function toDTO(row: GeoRow): GeoRiskProfileDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    regionCode: row.region_code,
    riskLevel: row.risk_level,
    stabilityIndex: toNumOrNull(row.stability_index),
    sanctionsActive: row.sanctions_active,
    tradeRestrictionNotes: row.trade_restriction_notes,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, region_code, risk_level, stability_index, sanctions_active, trade_restriction_notes, updated_at, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function upsertGeoRiskProfile(
  supabase: SupabaseClient,
  organizationId: string,
  input: GeoRiskProfileUpsertInput,
): Promise<GeoRiskProfileDTO> {
  const { data, error } = await supabase
    .from("geopolitical_risk_profiles")
    .upsert(
      {
        organization_id: organizationId,
        region_code: input.regionCode,
        risk_level: input.riskLevel,
        stability_index: input.stabilityIndex ?? null,
        sanctions_active: input.sanctionsActive,
        trade_restriction_notes: input.tradeRestrictionNotes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,region_code" },
    )
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new GeoRiskServiceError(
      "GEO_UPSERT_FAILED",
      error?.message || "Failed to upsert geopolitical risk profile.",
      500,
    );
  }

  return toDTO(data as GeoRow);
}

export async function listGeoRiskProfiles(
  supabase: SupabaseClient,
  organizationId: string,
  query: GeoRiskProfileListQuery,
): Promise<{ items: GeoRiskProfileDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  const { data, count, error } = await supabase
    .from("geopolitical_risk_profiles")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("risk_level", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new GeoRiskServiceError(
      "GEO_LIST_FAILED",
      error.message || "Failed to list geopolitical risk profiles.",
      500,
    );
  }

  return {
    items: ((data ?? []) as GeoRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function getGeoRiskByRegion(
  supabase: SupabaseClient,
  organizationId: string,
  regionCode: string,
): Promise<GeoRiskProfileDTO | null> {
  const { data, error } = await supabase
    .from("geopolitical_risk_profiles")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("region_code", regionCode)
    .maybeSingle();

  if (error) {
    throw new GeoRiskServiceError(
      "GEO_LOOKUP_FAILED",
      error.message || "Failed to lookup geopolitical risk profile.",
      500,
    );
  }

  return data ? toDTO(data as GeoRow) : null;
}

export async function getSupplierGeoRisk(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<GeoRiskProfileDTO | null> {
  // Join supplier.region_code to geopolitical profile
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("region_code")
    .eq("organization_id", organizationId)
    .eq("id", supplierId)
    .maybeSingle();

  if (supplierError || !supplier) {
    return null;
  }

  const regionCode = (supplier as { region_code: string | null }).region_code;
  if (!regionCode) return null;

  return getGeoRiskByRegion(supabase, organizationId, regionCode);
}

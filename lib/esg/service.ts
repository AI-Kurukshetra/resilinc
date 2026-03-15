import type { SupabaseClient } from "@supabase/supabase-js";
import type { EsgScoreUpsertInput, EsgScoreListQuery } from "@/lib/validations/esg";

// ─── Error ────────────────────────────────────────────────────────────────────

export class EsgServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface EsgScoreDTO {
  id: string;
  organizationId: string;
  supplierId: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  compositeScore: number;
  assessmentDate: string;
  notes: string | null;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface EsgRow {
  id: string;
  organization_id: string;
  supplier_id: string;
  environmental_score: number | string;
  social_score: number | string;
  governance_score: number | string;
  composite_score: number | string;
  assessment_date: string;
  notes: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

function computeComposite(env: number, social: number, gov: number): number {
  return Math.round((env * 0.4 + social * 0.35 + gov * 0.25) * 100) / 100;
}

function toDTO(row: EsgRow): EsgScoreDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    environmentalScore: toNum(row.environmental_score),
    socialScore: toNum(row.social_score),
    governanceScore: toNum(row.governance_score),
    compositeScore: toNum(row.composite_score),
    assessmentDate: row.assessment_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, supplier_id, environmental_score, social_score, governance_score, composite_score, assessment_date, notes, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function upsertEsgScore(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
  input: EsgScoreUpsertInput,
): Promise<EsgScoreDTO> {
  const composite = computeComposite(
    input.environmentalScore,
    input.socialScore,
    input.governanceScore,
  );

  const { data, error } = await supabase
    .from("supplier_esg_scores")
    .upsert(
      {
        organization_id: organizationId,
        supplier_id: supplierId,
        environmental_score: input.environmentalScore,
        social_score: input.socialScore,
        governance_score: input.governanceScore,
        composite_score: composite,
        assessment_date: new Date().toISOString(),
        notes: input.notes ?? null,
      },
      { onConflict: "organization_id,supplier_id" },
    )
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new EsgServiceError(
      "ESG_UPSERT_FAILED",
      error?.message || "Failed to upsert ESG score.",
      500,
    );
  }

  return toDTO(data as EsgRow);
}

export async function getEsgScore(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<EsgScoreDTO | null> {
  const { data, error } = await supabase
    .from("supplier_esg_scores")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (error) {
    throw new EsgServiceError(
      "ESG_LOOKUP_FAILED",
      error.message || "Failed to lookup ESG score.",
      500,
    );
  }

  return data ? toDTO(data as EsgRow) : null;
}

export async function listEsgScores(
  supabase: SupabaseClient,
  organizationId: string,
  query: EsgScoreListQuery,
): Promise<{ items: EsgScoreDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  const { data, count, error } = await supabase
    .from("supplier_esg_scores")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("composite_score", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new EsgServiceError(
      "ESG_LIST_FAILED",
      error.message || "Failed to list ESG scores.",
      500,
    );
  }

  return {
    items: ((data ?? []) as EsgRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

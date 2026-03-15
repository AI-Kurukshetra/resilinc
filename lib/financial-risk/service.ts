import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialHealthUpsertInput, FinancialHealthListQuery } from "@/lib/validations/financial-risk";

// ─── Error ────────────────────────────────────────────────────────────────────

export class FinancialRiskServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface FinancialHealthDTO {
  id: string;
  organizationId: string;
  supplierId: string;
  creditRating: string | null;
  altmanZScore: number | null;
  revenueTrend: string | null;
  debtToEquity: number | null;
  daysPayableOutstanding: number | null;
  financialRiskLevel: string;
  assessedAt: string;
  notes: string | null;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface FinancialRow {
  id: string;
  organization_id: string;
  supplier_id: string;
  credit_rating: string | null;
  altman_z_score: number | string | null;
  revenue_trend: string | null;
  debt_to_equity: number | string | null;
  days_payable_outstanding: number | null;
  financial_risk_level: string;
  assessed_at: string;
  notes: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumOrNull(v: number | string | null): number | null {
  if (v === null) return null;
  return typeof v === "number" ? v : Number(v);
}

function computeRiskLevelFromZ(z: number | undefined | null): string {
  if (z === undefined || z === null) return "medium";
  if (z < 1.8) return "critical";
  if (z < 2.7) return "high";
  if (z < 3.0) return "medium";
  return "low";
}

function toDTO(row: FinancialRow): FinancialHealthDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    creditRating: row.credit_rating,
    altmanZScore: toNumOrNull(row.altman_z_score),
    revenueTrend: row.revenue_trend,
    debtToEquity: toNumOrNull(row.debt_to_equity),
    daysPayableOutstanding: row.days_payable_outstanding,
    financialRiskLevel: row.financial_risk_level,
    assessedAt: row.assessed_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, supplier_id, credit_rating, altman_z_score, revenue_trend, debt_to_equity, days_payable_outstanding, financial_risk_level, assessed_at, notes, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function upsertFinancialHealth(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
  input: FinancialHealthUpsertInput,
): Promise<FinancialHealthDTO> {
  const riskLevel = computeRiskLevelFromZ(input.altmanZScore);

  const { data, error } = await supabase
    .from("supplier_financial_health")
    .upsert(
      {
        organization_id: organizationId,
        supplier_id: supplierId,
        credit_rating: input.creditRating ?? null,
        altman_z_score: input.altmanZScore ?? null,
        revenue_trend: input.revenueTrend ?? null,
        debt_to_equity: input.debtToEquity ?? null,
        days_payable_outstanding: input.daysPayableOutstanding ?? null,
        financial_risk_level: riskLevel,
        assessed_at: new Date().toISOString(),
        notes: input.notes ?? null,
      },
      { onConflict: "organization_id,supplier_id" },
    )
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new FinancialRiskServiceError(
      "FINANCIAL_UPSERT_FAILED",
      error?.message || "Failed to upsert financial health.",
      500,
    );
  }

  return toDTO(data as FinancialRow);
}

export async function getFinancialHealth(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<FinancialHealthDTO | null> {
  const { data, error } = await supabase
    .from("supplier_financial_health")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (error) {
    throw new FinancialRiskServiceError(
      "FINANCIAL_LOOKUP_FAILED",
      error.message || "Failed to lookup financial health.",
      500,
    );
  }

  return data ? toDTO(data as FinancialRow) : null;
}

export async function listFinancialHealth(
  supabase: SupabaseClient,
  organizationId: string,
  query: FinancialHealthListQuery,
): Promise<{ items: FinancialHealthDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  const { data, count, error } = await supabase
    .from("supplier_financial_health")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("assessed_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new FinancialRiskServiceError(
      "FINANCIAL_LIST_FAILED",
      error.message || "Failed to list financial health.",
      500,
    );
  }

  return {
    items: ((data ?? []) as FinancialRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PerformanceRecordCreateInput, PerformanceListQuery } from "@/lib/validations/performance";

// ─── Error ────────────────────────────────────────────────────────────────────

export class PerformanceServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface PerformanceRecordDTO {
  id: string;
  organizationId: string;
  supplierId: string;
  periodStart: string;
  periodEnd: string;
  onTimeDeliveryRate: number;
  qualityRejectionRate: number;
  leadTimeVarianceDays: number;
  responsivenessScore: number;
  overallRating: number;
  notes: string | null;
  createdAt: string;
}

export interface PerformanceSummaryDTO {
  supplierId: string;
  latestOverallRating: number;
  latestDeliveryRate: number;
  latestQualityRate: number;
  latestResponsiveness: number;
  periodCount: number;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface PerformanceRow {
  id: string;
  organization_id: string;
  supplier_id: string;
  period_start: string;
  period_end: string;
  on_time_delivery_rate: number | string;
  quality_rejection_rate: number | string;
  lead_time_variance_days: number;
  responsiveness_score: number;
  overall_rating: number | string;
  notes: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

/**
 * overall_rating = delivery*0.4 + (100-quality_rejection)*0.3 + max(0, 100-abs(lead_time_variance)*5)*0.15 + responsiveness*20*0.15
 */
export function computeOverallRating(
  delivery: number,
  qualityRejection: number,
  leadTimeVariance: number,
  responsiveness: number,
): number {
  const deliveryComponent = delivery * 0.4;
  const qualityComponent = (100 - qualityRejection) * 0.3;
  const leadTimeComponent = Math.max(0, 100 - Math.abs(leadTimeVariance) * 5) * 0.15;
  const responsivenessComponent = responsiveness * 20 * 0.15;
  return Math.round((deliveryComponent + qualityComponent + leadTimeComponent + responsivenessComponent) * 100) / 100;
}

function toDTO(row: PerformanceRow): PerformanceRecordDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    onTimeDeliveryRate: toNum(row.on_time_delivery_rate),
    qualityRejectionRate: toNum(row.quality_rejection_rate),
    leadTimeVarianceDays: row.lead_time_variance_days,
    responsivenessScore: row.responsiveness_score,
    overallRating: toNum(row.overall_rating),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, supplier_id, period_start, period_end, on_time_delivery_rate, quality_rejection_rate, lead_time_variance_days, responsiveness_score, overall_rating, notes, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function addPerformanceRecord(
  supabase: SupabaseClient,
  organizationId: string,
  input: PerformanceRecordCreateInput,
): Promise<PerformanceRecordDTO> {
  const overallRating = computeOverallRating(
    input.onTimeDeliveryRate,
    input.qualityRejectionRate,
    input.leadTimeVarianceDays,
    input.responsivenessScore,
  );

  const { data, error } = await supabase
    .from("supplier_performance_records")
    .insert({
      organization_id: organizationId,
      supplier_id: input.supplierId,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      on_time_delivery_rate: input.onTimeDeliveryRate,
      quality_rejection_rate: input.qualityRejectionRate,
      lead_time_variance_days: input.leadTimeVarianceDays,
      responsiveness_score: input.responsivenessScore,
      overall_rating: overallRating,
      notes: input.notes ?? null,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new PerformanceServiceError(
      "PERFORMANCE_INSERT_FAILED",
      error?.message || "Failed to insert performance record.",
      500,
    );
  }

  return toDTO(data as PerformanceRow);
}

export async function listPerformanceHistory(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
  query: PerformanceListQuery,
): Promise<{ items: PerformanceRecordDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  const { data, count, error } = await supabase
    .from("supplier_performance_records")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .order("period_end", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new PerformanceServiceError(
      "PERFORMANCE_LIST_FAILED",
      error.message || "Failed to list performance history.",
      500,
    );
  }

  return {
    items: ((data ?? []) as PerformanceRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function getPerformanceSummary(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<PerformanceSummaryDTO | null> {
  // Get the latest record and total count
  const [{ data: latestData, error: latestError }, { count, error: countError }] = await Promise.all([
    supabase
      .from("supplier_performance_records")
      .select(SELECT)
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("supplier_performance_records")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId),
  ]);

  if (latestError || countError) {
    throw new PerformanceServiceError(
      "PERFORMANCE_SUMMARY_FAILED",
      latestError?.message || countError?.message || "Failed to get performance summary.",
      500,
    );
  }

  if (!latestData) return null;

  const row = latestData as PerformanceRow;
  return {
    supplierId,
    latestOverallRating: toNum(row.overall_rating),
    latestDeliveryRate: toNum(row.on_time_delivery_rate),
    latestQualityRate: toNum(row.quality_rejection_rate),
    latestResponsiveness: row.responsiveness_score,
    periodCount: count ?? 0,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryLevelUpsertInput, InventoryListQuery } from "@/lib/validations/inventory";

// ─── Error ────────────────────────────────────────────────────────────────────

export class InventoryServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface InventoryLevelDTO {
  id: string;
  organizationId: string;
  partId: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  maxStock: number | null;
  avgDailyConsumption: number;
  daysOfSupply: number | null;
  riskFlag: "adequate" | "low" | "critical" | "stockout";
  updatedAt: string;
}

export interface InventoryRiskSummary {
  adequate: number;
  low: number;
  critical: number;
  stockout: number;
  total: number;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface InventoryRow {
  id: string;
  organization_id: string;
  part_id: string;
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  max_stock: number | null;
  avg_daily_consumption: number | string;
  days_of_supply: number | string | null;
  risk_flag: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

function toNullableNum(v: number | string | null): number | null {
  if (v === null) return null;
  return toNum(v);
}

export function computeRiskFlag(
  currentStock: number,
  safetyStock: number,
  reorderPoint: number,
): "adequate" | "low" | "critical" | "stockout" {
  if (currentStock <= 0) return "stockout";
  if (currentStock <= safetyStock) return "critical";
  if (currentStock <= reorderPoint) return "low";
  return "adequate";
}

export function computeDaysOfSupply(currentStock: number, avgDailyConsumption: number): number | null {
  if (avgDailyConsumption <= 0) return null;
  return Math.round((currentStock / avgDailyConsumption) * 100) / 100;
}

function toDTO(row: InventoryRow): InventoryLevelDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    partId: row.part_id,
    currentStock: row.current_stock,
    safetyStock: row.safety_stock,
    reorderPoint: row.reorder_point,
    maxStock: row.max_stock,
    avgDailyConsumption: toNum(row.avg_daily_consumption),
    daysOfSupply: toNullableNum(row.days_of_supply),
    riskFlag: row.risk_flag as InventoryLevelDTO["riskFlag"],
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, organization_id, part_id, current_stock, safety_stock, reorder_point, max_stock, avg_daily_consumption, days_of_supply, risk_flag, updated_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function upsertInventoryLevel(
  supabase: SupabaseClient,
  organizationId: string,
  input: InventoryLevelUpsertInput,
): Promise<InventoryLevelDTO> {
  const riskFlag = computeRiskFlag(input.currentStock, input.safetyStock, input.reorderPoint);
  const daysOfSupply = computeDaysOfSupply(input.currentStock, input.avgDailyConsumption);

  const { data, error } = await supabase
    .from("part_inventory_levels")
    .upsert(
      {
        organization_id: organizationId,
        part_id: input.partId,
        current_stock: input.currentStock,
        safety_stock: input.safetyStock,
        reorder_point: input.reorderPoint,
        max_stock: input.maxStock ?? null,
        avg_daily_consumption: input.avgDailyConsumption,
        days_of_supply: daysOfSupply,
        risk_flag: riskFlag,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,part_id" },
    )
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new InventoryServiceError(
      "INVENTORY_UPSERT_FAILED",
      error?.message || "Failed to upsert inventory level.",
      500,
    );
  }

  return toDTO(data as InventoryRow);
}

export async function listInventoryLevels(
  supabase: SupabaseClient,
  organizationId: string,
  query: InventoryListQuery,
): Promise<{ items: InventoryLevelDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let builder = supabase
    .from("part_inventory_levels")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId);

  if (query.riskFlag) {
    builder = builder.eq("risk_flag", query.riskFlag);
  }

  const { data, count, error } = await builder
    .order("risk_flag", { ascending: true })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new InventoryServiceError(
      "INVENTORY_LIST_FAILED",
      error.message || "Failed to list inventory levels.",
      500,
    );
  }

  return {
    items: ((data ?? []) as InventoryRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function getInventoryRiskSummary(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<InventoryRiskSummary> {
  const flags = ["adequate", "low", "critical", "stockout"] as const;
  const counts: Record<string, number> = { adequate: 0, low: 0, critical: 0, stockout: 0 };

  const results = await Promise.all(
    flags.map((flag) =>
      supabase
        .from("part_inventory_levels")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("risk_flag", flag),
    ),
  );

  for (let i = 0; i < flags.length; i++) {
    counts[flags[i]] = results[i].count ?? 0;
  }

  return {
    adequate: counts.adequate,
    low: counts.low,
    critical: counts.critical,
    stockout: counts.stockout,
    total: counts.adequate + counts.low + counts.critical + counts.stockout,
  };
}

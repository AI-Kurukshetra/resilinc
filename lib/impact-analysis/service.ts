import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartFinancialProfileCreate, PartFinancialProfileUpdate } from "@/lib/validations/impact-analysis";

interface PartFinancialProfileDTO {
  id: string;
  partId: string;
  partNumber: string;
  description: string | null;
  annualSpend: number;
  unitCost: number | null;
  annualVolume: number | null;
  leadTimeDays: number | null;
  currency: string;
  updatedAt: string;
}

interface BusinessImpactDTO {
  supplierId: string;
  supplierName: string;
  totalAnnualSpend: number;
  totalRevenueAtRisk: number;
  estimatedDisruptionCost: number;
  riskScore: number | null;
  linkedParts: Array<{
    partId: string;
    partNumber: string;
    annualSpend: number;
    revenueAtRisk: number;
  }>;
}

export async function calculateBusinessImpact(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<BusinessImpactDTO> {
  // Get supplier info
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("id", supplierId)
    .maybeSingle();

  if (supplierError || !supplier) {
    throw new Error(supplierError?.message ?? "Supplier not found.");
  }

  // Get risk score
  const { data: scoreRow } = await supabase
    .from("supplier_risk_scores")
    .select("score")
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  const riskScore = scoreRow
    ? typeof scoreRow.score === "number" ? scoreRow.score : Number(scoreRow.score)
    : null;

  // Get supplier-part links
  const { data: linkRows } = await supabase
    .from("supplier_parts")
    .select("part_id")
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId);

  const partIds = ((linkRows ?? []) as Array<{ part_id: string }>).map((r) => r.part_id);

  if (partIds.length === 0) {
    return {
      supplierId,
      supplierName: (supplier as { id: string; name: string }).name,
      totalAnnualSpend: 0,
      totalRevenueAtRisk: 0,
      estimatedDisruptionCost: 0,
      riskScore,
      linkedParts: [],
    };
  }

  // Get financial profiles for linked parts
  const { data: financialRows } = await supabase
    .from("part_financial_profiles")
    .select("part_id, annual_spend")
    .eq("organization_id", organizationId)
    .in("part_id", partIds);

  // Get part numbers
  const { data: partRows } = await supabase
    .from("parts")
    .select("id, part_number")
    .eq("organization_id", organizationId)
    .in("id", partIds);

  const partNumberById = new Map(
    ((partRows ?? []) as Array<{ id: string; part_number: string }>).map((r) => [r.id, r.part_number]),
  );

  const spendByPartId = new Map(
    ((financialRows ?? []) as Array<{ part_id: string; annual_spend: number | string }>).map((r) => [
      r.part_id,
      typeof r.annual_spend === "number" ? r.annual_spend : Number(r.annual_spend),
    ]),
  );

  let totalAnnualSpend = 0;
  const linkedParts: BusinessImpactDTO["linkedParts"] = [];

  for (const partId of partIds) {
    const annualSpend = spendByPartId.get(partId) ?? 0;
    const revenueAtRisk = riskScore !== null ? annualSpend * (riskScore / 100) : 0;

    totalAnnualSpend += annualSpend;
    linkedParts.push({
      partId,
      partNumber: partNumberById.get(partId) ?? "Unknown",
      annualSpend,
      revenueAtRisk,
    });
  }

  const totalRevenueAtRisk = riskScore !== null ? totalAnnualSpend * (riskScore / 100) : 0;
  const estimatedDisruptionCost = totalRevenueAtRisk;

  return {
    supplierId,
    supplierName: (supplier as { id: string; name: string }).name,
    totalAnnualSpend,
    totalRevenueAtRisk,
    estimatedDisruptionCost,
    riskScore,
    linkedParts,
  };
}

export async function getPartFinancialProfile(
  supabase: SupabaseClient,
  organizationId: string,
  partId: string,
): Promise<PartFinancialProfileDTO | null> {
  const { data, error } = await supabase
    .from("part_financial_profiles")
    .select("id, part_id, annual_spend, unit_cost, annual_volume, lead_time_days, currency, updated_at")
    .eq("organization_id", organizationId)
    .eq("part_id", partId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get financial profile: ${error.message}`);
  }

  if (!data) return null;

  const row = data as {
    id: string;
    part_id: string;
    annual_spend: number | string;
    unit_cost: number | string | null;
    annual_volume: number | null;
    lead_time_days: number | null;
    currency: string;
    updated_at: string;
  };

  // Get part number
  const { data: partRow } = await supabase
    .from("parts")
    .select("part_number, description")
    .eq("organization_id", organizationId)
    .eq("id", partId)
    .maybeSingle();

  const part = partRow as { part_number: string; description: string | null } | null;

  return {
    id: row.id,
    partId: row.part_id,
    partNumber: part?.part_number ?? "Unknown",
    description: part?.description ?? null,
    annualSpend: typeof row.annual_spend === "number" ? row.annual_spend : Number(row.annual_spend),
    unitCost: row.unit_cost !== null ? (typeof row.unit_cost === "number" ? row.unit_cost : Number(row.unit_cost)) : null,
    annualVolume: row.annual_volume,
    leadTimeDays: row.lead_time_days,
    currency: row.currency,
    updatedAt: row.updated_at,
  };
}

export async function upsertPartFinancialProfile(
  supabase: SupabaseClient,
  organizationId: string,
  input: PartFinancialProfileCreate,
): Promise<PartFinancialProfileDTO> {
  const { data, error } = await supabase
    .from("part_financial_profiles")
    .upsert(
      {
        organization_id: organizationId,
        part_id: input.partId,
        annual_spend: input.annualSpend,
        unit_cost: input.unitCost ?? null,
        annual_volume: input.annualVolume ?? null,
        lead_time_days: input.leadTimeDays ?? null,
        currency: input.currency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,part_id" },
    )
    .select("id, part_id, annual_spend, unit_cost, annual_volume, lead_time_days, currency, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert financial profile: ${error?.message ?? "Unknown error"}`);
  }

  const row = data as {
    id: string;
    part_id: string;
    annual_spend: number | string;
    unit_cost: number | string | null;
    annual_volume: number | null;
    lead_time_days: number | null;
    currency: string;
    updated_at: string;
  };

  const { data: partRow } = await supabase
    .from("parts")
    .select("part_number, description")
    .eq("organization_id", organizationId)
    .eq("id", input.partId)
    .maybeSingle();

  const part = partRow as { part_number: string; description: string | null } | null;

  return {
    id: row.id,
    partId: row.part_id,
    partNumber: part?.part_number ?? "Unknown",
    description: part?.description ?? null,
    annualSpend: typeof row.annual_spend === "number" ? row.annual_spend : Number(row.annual_spend),
    unitCost: row.unit_cost !== null ? (typeof row.unit_cost === "number" ? row.unit_cost : Number(row.unit_cost)) : null,
    annualVolume: row.annual_volume,
    leadTimeDays: row.lead_time_days,
    currency: row.currency,
    updatedAt: row.updated_at,
  };
}

export async function updatePartFinancialProfile(
  supabase: SupabaseClient,
  organizationId: string,
  partId: string,
  input: PartFinancialProfileUpdate,
): Promise<PartFinancialProfileDTO> {
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.annualSpend !== undefined) updateFields.annual_spend = input.annualSpend;
  if (input.unitCost !== undefined) updateFields.unit_cost = input.unitCost;
  if (input.annualVolume !== undefined) updateFields.annual_volume = input.annualVolume;
  if (input.leadTimeDays !== undefined) updateFields.lead_time_days = input.leadTimeDays;
  if (input.currency !== undefined) updateFields.currency = input.currency;

  const { data, error } = await supabase
    .from("part_financial_profiles")
    .update(updateFields)
    .eq("organization_id", organizationId)
    .eq("part_id", partId)
    .select("id, part_id, annual_spend, unit_cost, annual_volume, lead_time_days, currency, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update financial profile: ${error?.message ?? "Profile not found"}`);
  }

  const row = data as {
    id: string;
    part_id: string;
    annual_spend: number | string;
    unit_cost: number | string | null;
    annual_volume: number | null;
    lead_time_days: number | null;
    currency: string;
    updated_at: string;
  };

  const { data: partRow } = await supabase
    .from("parts")
    .select("part_number, description")
    .eq("organization_id", organizationId)
    .eq("id", partId)
    .maybeSingle();

  const part = partRow as { part_number: string; description: string | null } | null;

  return {
    id: row.id,
    partId: row.part_id,
    partNumber: part?.part_number ?? "Unknown",
    description: part?.description ?? null,
    annualSpend: typeof row.annual_spend === "number" ? row.annual_spend : Number(row.annual_spend),
    unitCost: row.unit_cost !== null ? (typeof row.unit_cost === "number" ? row.unit_cost : Number(row.unit_cost)) : null,
    annualVolume: row.annual_volume,
    leadTimeDays: row.lead_time_days,
    currency: row.currency,
    updatedAt: row.updated_at,
  };
}

export type { BusinessImpactDTO, PartFinancialProfileDTO };

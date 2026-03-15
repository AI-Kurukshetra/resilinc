import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ComplianceItemCreateInput,
  ComplianceItemListQuery,
  ComplianceItemStatus,
  ComplianceItemStatusUpdateInput,
  FrameworkCreateInput,
  FrameworkListQuery,
} from "@/lib/validations/compliance";

// ─── Error ────────────────────────────────────────────────────────────────────

export class ComplianceServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface FrameworkDTO {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  category: "regulatory" | "industry" | "internal" | "esg";
  createdAt: string;
}

export interface ComplianceItemDTO {
  id: string;
  frameworkId: string;
  organizationId: string;
  supplierId: string | null;
  requirement: string;
  status: ComplianceItemStatus;
  evidenceNotes: string | null;
  assessedAt: string | null;
  nextReviewDate: string | null;
  createdAt: string;
}

export interface ComplianceSummary {
  frameworkId: string;
  frameworkName: string;
  category: string;
  total: number;
  compliant: number;
  percentageCompliant: number;
}

// ─── Row types ────────────────────────────────────────────────────────────────

interface FrameworkRow {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  framework_id: string;
  organization_id: string;
  supplier_id: string | null;
  requirement: string;
  status: string;
  evidence_notes: string | null;
  assessed_at: string | null;
  next_review_date: string | null;
  created_at: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toFrameworkDTO(row: FrameworkRow): FrameworkDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category as FrameworkDTO["category"],
    createdAt: row.created_at,
  };
}

function toItemDTO(row: ItemRow): ComplianceItemDTO {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    requirement: row.requirement,
    status: row.status as ComplianceItemStatus,
    evidenceNotes: row.evidence_notes,
    assessedAt: row.assessed_at,
    nextReviewDate: row.next_review_date,
    createdAt: row.created_at,
  };
}

const FRAMEWORK_SELECT = "id, organization_id, name, description, category, created_at";
const ITEM_SELECT =
  "id, framework_id, organization_id, supplier_id, requirement, status, evidence_notes, assessed_at, next_review_date, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function createFramework(
  supabase: SupabaseClient,
  organizationId: string,
  input: FrameworkCreateInput,
): Promise<FrameworkDTO> {
  const { data, error } = await supabase
    .from("compliance_frameworks")
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description ?? "",
      category: input.category,
    })
    .select(FRAMEWORK_SELECT)
    .single();

  if (error || !data) {
    const isUnique =
      error?.code === "23505" || error?.message?.includes("compliance_frameworks_org_name_key");
    throw new ComplianceServiceError(
      isUnique ? "FRAMEWORK_NAME_CONFLICT" : "FRAMEWORK_CREATE_FAILED",
      isUnique
        ? "A framework with this name already exists."
        : (error?.message ?? "Failed to create framework."),
      isUnique ? 409 : 500,
    );
  }

  return toFrameworkDTO(data as FrameworkRow);
}

export async function listFrameworks(
  supabase: SupabaseClient,
  organizationId: string,
  query: FrameworkListQuery,
): Promise<{ items: FrameworkDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("compliance_frameworks")
    .select(FRAMEWORK_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.category) dbQuery = dbQuery.eq("category", query.category);

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new ComplianceServiceError(
      "FRAMEWORK_LIST_FAILED",
      error.message || "Failed to list frameworks.",
      500,
    );
  }

  return {
    items: ((data ?? []) as FrameworkRow[]).map(toFrameworkDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function createItem(
  supabase: SupabaseClient,
  organizationId: string,
  frameworkId: string,
  input: ComplianceItemCreateInput,
): Promise<ComplianceItemDTO> {
  // Verify framework belongs to org
  const { data: fw, error: fwError } = await supabase
    .from("compliance_frameworks")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", frameworkId)
    .maybeSingle();

  if (fwError || !fw) {
    throw new ComplianceServiceError("FRAMEWORK_NOT_FOUND", "Compliance framework not found.", 404);
  }

  const { data, error } = await supabase
    .from("compliance_items")
    .insert({
      framework_id: frameworkId,
      organization_id: organizationId,
      supplier_id: input.supplierId ?? null,
      requirement: input.requirement,
    })
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new ComplianceServiceError(
      "ITEM_CREATE_FAILED",
      error?.message ?? "Failed to create compliance item.",
      500,
    );
  }

  return toItemDTO(data as ItemRow);
}

export async function listItems(
  supabase: SupabaseClient,
  organizationId: string,
  frameworkId: string,
  query: ComplianceItemListQuery,
): Promise<{ items: ComplianceItemDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("compliance_items")
    .select(ITEM_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("framework_id", frameworkId)
    .order("created_at", { ascending: true })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) dbQuery = dbQuery.eq("status", query.status);
  if (query.supplierId) dbQuery = dbQuery.eq("supplier_id", query.supplierId);

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new ComplianceServiceError(
      "ITEM_LIST_FAILED",
      error.message || "Failed to list compliance items.",
      500,
    );
  }

  return {
    items: ((data ?? []) as ItemRow[]).map(toItemDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function updateItemStatus(
  supabase: SupabaseClient,
  organizationId: string,
  frameworkId: string,
  itemId: string,
  input: ComplianceItemStatusUpdateInput,
): Promise<ComplianceItemDTO> {
  const patch: Record<string, unknown> = {
    status: input.status,
    assessed_at: new Date().toISOString(),
  };

  if (input.evidenceNotes !== undefined) patch.evidence_notes = input.evidenceNotes;
  if (input.nextReviewDate !== undefined) patch.next_review_date = input.nextReviewDate;

  const { data, error } = await supabase
    .from("compliance_items")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("framework_id", frameworkId)
    .eq("id", itemId)
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new ComplianceServiceError(
      "ITEM_UPDATE_FAILED",
      error?.message ?? "Failed to update compliance item.",
      404,
    );
  }

  return toItemDTO(data as ItemRow);
}

export async function getComplianceSummary(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ComplianceSummary[]> {
  const { data: frameworks, error: fwError } = await supabase
    .from("compliance_frameworks")
    .select(FRAMEWORK_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (fwError) {
    throw new ComplianceServiceError(
      "FRAMEWORK_LIST_FAILED",
      fwError.message || "Failed to load frameworks for summary.",
      500,
    );
  }

  if (!frameworks || frameworks.length === 0) return [];

  const frameworkIds = (frameworks as FrameworkRow[]).map((f) => f.id);

  const { data: items, error: itemsError } = await supabase
    .from("compliance_items")
    .select("framework_id, status")
    .eq("organization_id", organizationId)
    .in("framework_id", frameworkIds);

  if (itemsError) {
    throw new ComplianceServiceError(
      "ITEM_LIST_FAILED",
      itemsError.message || "Failed to load items for summary.",
      500,
    );
  }

  const countsByFramework = new Map<string, { total: number; compliant: number }>();
  for (const fw of frameworks as FrameworkRow[]) {
    countsByFramework.set(fw.id, { total: 0, compliant: 0 });
  }

  for (const item of (items ?? []) as { framework_id: string; status: string }[]) {
    const counts = countsByFramework.get(item.framework_id);
    if (!counts) continue;
    counts.total += 1;
    if (item.status === "compliant") counts.compliant += 1;
  }

  return (frameworks as FrameworkRow[]).map((fw) => {
    const counts = countsByFramework.get(fw.id) ?? { total: 0, compliant: 0 };
    return {
      frameworkId: fw.id,
      frameworkName: fw.name,
      category: fw.category,
      total: counts.total,
      compliant: counts.compliant,
      percentageCompliant:
        counts.total === 0 ? 0 : Math.round((counts.compliant / counts.total) * 100),
    };
  });
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MitigationActionCreateInput,
  MitigationActionStatus,
  MitigationPlanCreateInput,
  MitigationPlanListQuery,
  MitigationPlanUpdateInput,
} from "@/lib/validations/mitigation";

// ─── Error ────────────────────────────────────────────────────────────────────

export class MitigationServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface MitigationActionDTO {
  id: string;
  planId: string;
  organizationId: string;
  title: string;
  status: MitigationActionStatus;
  ownerId: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MitigationPlanDTO {
  id: string;
  organizationId: string;
  supplierId: string | null;
  alertId: string | null;
  title: string;
  description: string;
  strategy: "avoid" | "mitigate" | "transfer" | "accept";
  status: "draft" | "active" | "completed" | "archived";
  priority: number;
  ownerId: string | null;
  targetDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actions?: MitigationActionDTO[];
}

// ─── Row types ────────────────────────────────────────────────────────────────

interface PlanRow {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  alert_id: string | null;
  title: string;
  description: string;
  strategy: string;
  status: string;
  priority: number;
  owner_id: string | null;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ActionRow {
  id: string;
  plan_id: string;
  organization_id: string;
  title: string;
  status: string;
  owner_id: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toPlanDTO(row: PlanRow, actions?: ActionRow[]): MitigationPlanDTO {
  const dto: MitigationPlanDTO = {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    alertId: row.alert_id,
    title: row.title,
    description: row.description,
    strategy: row.strategy as MitigationPlanDTO["strategy"],
    status: row.status as MitigationPlanDTO["status"],
    priority: row.priority,
    ownerId: row.owner_id,
    targetDate: row.target_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (actions !== undefined) {
    dto.actions = actions.map(toActionDTO);
  }

  return dto;
}

function toActionDTO(row: ActionRow): MitigationActionDTO {
  return {
    id: row.id,
    planId: row.plan_id,
    organizationId: row.organization_id,
    title: row.title,
    status: row.status as MitigationActionStatus,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const PLAN_SELECT =
  "id, organization_id, supplier_id, alert_id, title, description, strategy, status, priority, owner_id, target_date, completed_at, created_at, updated_at";

const ACTION_SELECT =
  "id, plan_id, organization_id, title, status, owner_id, due_date, notes, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function createPlan(
  supabase: SupabaseClient,
  organizationId: string,
  input: MitigationPlanCreateInput,
): Promise<MitigationPlanDTO> {
  const { data, error } = await supabase
    .from("mitigation_plans")
    .insert({
      organization_id: organizationId,
      supplier_id: input.supplierId ?? null,
      alert_id: input.alertId ?? null,
      title: input.title,
      description: input.description ?? "",
      strategy: input.strategy,
      priority: input.priority ?? 3,
      owner_id: input.ownerId ?? null,
      target_date: input.targetDate ?? null,
    })
    .select(PLAN_SELECT)
    .single();

  if (error || !data) {
    throw new MitigationServiceError(
      "PLAN_CREATE_FAILED",
      error?.message || "Failed to create mitigation plan.",
      500,
    );
  }

  return toPlanDTO(data as PlanRow);
}

export async function updatePlan(
  supabase: SupabaseClient,
  organizationId: string,
  planId: string,
  input: MitigationPlanUpdateInput,
): Promise<MitigationPlanDTO> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.strategy !== undefined) patch.strategy = input.strategy;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.status !== undefined) patch.status = input.status;
  if (input.supplierId !== undefined) patch.supplier_id = input.supplierId;
  if (input.alertId !== undefined) patch.alert_id = input.alertId;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("mitigation_plans")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .select(PLAN_SELECT)
    .single();

  if (error || !data) {
    throw new MitigationServiceError(
      "PLAN_UPDATE_FAILED",
      error?.message || "Failed to update mitigation plan.",
      500,
    );
  }

  return toPlanDTO(data as PlanRow);
}

export async function listPlans(
  supabase: SupabaseClient,
  organizationId: string,
  query: MitigationPlanListQuery,
): Promise<{ items: MitigationPlanDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("mitigation_plans")
    .select(PLAN_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) dbQuery = dbQuery.eq("status", query.status);
  if (query.priority !== undefined) dbQuery = dbQuery.eq("priority", query.priority);
  if (query.supplierId) dbQuery = dbQuery.eq("supplier_id", query.supplierId);

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new MitigationServiceError(
      "PLAN_LIST_FAILED",
      error.message || "Failed to list mitigation plans.",
      500,
    );
  }

  return {
    items: ((data ?? []) as PlanRow[]).map((row) => toPlanDTO(row)),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function getPlanDetail(
  supabase: SupabaseClient,
  organizationId: string,
  planId: string,
): Promise<MitigationPlanDTO> {
  const { data: planData, error: planError } = await supabase
    .from("mitigation_plans")
    .select(PLAN_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .maybeSingle();

  if (planError) {
    throw new MitigationServiceError(
      "PLAN_LOOKUP_FAILED",
      planError.message || "Failed to lookup plan.",
      500,
    );
  }

  if (!planData) {
    throw new MitigationServiceError("PLAN_NOT_FOUND", "Mitigation plan not found.", 404);
  }

  const { data: actionData, error: actionError } = await supabase
    .from("mitigation_actions")
    .select(ACTION_SELECT)
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  if (actionError) {
    throw new MitigationServiceError(
      "ACTION_LIST_FAILED",
      actionError.message || "Failed to load actions.",
      500,
    );
  }

  return toPlanDTO(planData as PlanRow, (actionData ?? []) as ActionRow[]);
}

export async function addAction(
  supabase: SupabaseClient,
  organizationId: string,
  planId: string,
  input: MitigationActionCreateInput,
): Promise<MitigationActionDTO> {
  // Verify plan belongs to org
  const { data: plan, error: planError } = await supabase
    .from("mitigation_plans")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .maybeSingle();

  if (planError || !plan) {
    throw new MitigationServiceError("PLAN_NOT_FOUND", "Mitigation plan not found.", 404);
  }

  const { data, error } = await supabase
    .from("mitigation_actions")
    .insert({
      plan_id: planId,
      organization_id: organizationId,
      title: input.title,
      owner_id: input.ownerId ?? null,
      due_date: input.dueDate ?? null,
      notes: input.notes ?? null,
    })
    .select(ACTION_SELECT)
    .single();

  if (error || !data) {
    throw new MitigationServiceError(
      "ACTION_CREATE_FAILED",
      error?.message || "Failed to create action.",
      500,
    );
  }

  return toActionDTO(data as ActionRow);
}

export async function updateActionStatus(
  supabase: SupabaseClient,
  organizationId: string,
  planId: string,
  actionId: string,
  status: MitigationActionStatus,
): Promise<MitigationActionDTO> {
  const { data, error } = await supabase
    .from("mitigation_actions")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("plan_id", planId)
    .eq("id", actionId)
    .select(ACTION_SELECT)
    .single();

  if (error || !data) {
    throw new MitigationServiceError(
      "ACTION_UPDATE_FAILED",
      error?.message || "Failed to update action status.",
      404,
    );
  }

  return toActionDTO(data as ActionRow);
}

export async function completePlan(
  supabase: SupabaseClient,
  organizationId: string,
  planId: string,
): Promise<MitigationPlanDTO> {
  // Validate all actions are completed or cancelled
  const { data: actions, error: actionsError } = await supabase
    .from("mitigation_actions")
    .select("id, status")
    .eq("plan_id", planId)
    .eq("organization_id", organizationId);

  if (actionsError) {
    throw new MitigationServiceError(
      "ACTION_LIST_FAILED",
      actionsError.message || "Failed to check actions.",
      500,
    );
  }

  const incompleteActions = ((actions ?? []) as { id: string; status: string }[]).filter(
    (a) => a.status !== "completed" && a.status !== "cancelled",
  );

  if (incompleteActions.length > 0) {
    throw new MitigationServiceError(
      "PLAN_ACTIONS_INCOMPLETE",
      `Cannot complete plan: ${incompleteActions.length} action(s) are not yet completed or cancelled.`,
      422,
    );
  }

  const { data, error } = await supabase
    .from("mitigation_plans")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", planId)
    .select(PLAN_SELECT)
    .single();

  if (error || !data) {
    throw new MitigationServiceError(
      "PLAN_COMPLETE_FAILED",
      error?.message || "Failed to complete plan.",
      500,
    );
  }

  return toPlanDTO(data as PlanRow);
}

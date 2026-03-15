import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IncidentActionStatus,
  IncidentListQuery,
} from "@/lib/validations/incidents";
import { buildPlaybookActions } from "@/lib/incidents/playbook";
import { createNotification } from "@/lib/notifications/service";

interface IncidentRow {
  id: string;
  organization_id: string;
  alert_id: string | null;
  title: string;
  status: "open" | "in_progress" | "closed";
  owner_id: string | null;
  started_at: string;
  closed_at: string | null;
}

interface IncidentActionRow {
  id: string;
  incident_id: string;
  organization_id: string;
  action_title: string;
  owner_id: string | null;
  due_at: string | null;
  status: IncidentActionStatus;
  created_at: string;
}

interface AlertSnapshotRow {
  id: string;
  title: string;
  severity: number;
  status: "open" | "acknowledged" | "resolved";
  supplier_id: string | null;
  owner_id?: string | null;
}

interface OrganizationMemberRow {
  user_id: string;
  role: "owner" | "manager" | "analyst" | "viewer";
  created_at: string;
}

export interface IncidentActionDTO {
  actionTitle: string;
  createdAt: string;
  dueAt: string | null;
  id: string;
  incidentId: string;
  organizationId: string;
  ownerId: string | null;
  status: IncidentActionStatus;
}

export interface IncidentDTO {
  alertId: string | null;
  closedAt: string | null;
  id: string;
  organizationId: string;
  ownerId: string | null;
  startedAt: string;
  status: "open" | "in_progress" | "closed";
  title: string;
}

export interface IncidentDetailDTO extends IncidentDTO {
  actions: IncidentActionDTO[];
  alert: {
    id: string;
    severity: number;
    status: "open" | "acknowledged" | "resolved";
    supplierId: string | null;
    title: string;
  } | null;
}

export interface IncidentCreateResult {
  created: boolean;
  incident: IncidentDetailDTO;
}

export class IncidentServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const INCIDENT_SELECT =
  "id, organization_id, alert_id, title, status, owner_id, started_at, closed_at";

function toIncidentDto(row: IncidentRow): IncidentDTO {
  return {
    alertId: row.alert_id,
    closedAt: row.closed_at,
    id: row.id,
    organizationId: row.organization_id,
    ownerId: row.owner_id,
    startedAt: row.started_at,
    status: row.status,
    title: row.title,
  };
}

function toIncidentActionDto(row: IncidentActionRow): IncidentActionDTO {
  return {
    actionTitle: row.action_title,
    createdAt: row.created_at,
    dueAt: row.due_at,
    id: row.id,
    incidentId: row.incident_id,
    organizationId: row.organization_id,
    ownerId: row.owner_id,
    status: row.status,
  };
}

const OWNER_PRIORITY: Record<OrganizationMemberRow["role"], number> = {
  analyst: 2,
  manager: 0,
  owner: 1,
  viewer: 3,
};

async function resolveIncidentOwner(
  supabase: SupabaseClient,
  organizationId: string,
  alertOwnerId: string | null,
): Promise<string | null> {
  if (alertOwnerId) {
    return alertOwnerId;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at")
    .eq("organization_id", organizationId);

  if (error) {
    throw new IncidentServiceError(
      "INCIDENT_OWNER_LOOKUP_FAILED",
      error.message || "Failed to resolve incident owner.",
      500,
    );
  }

  const members = ((data ?? []) as OrganizationMemberRow[]).sort((left, right) => {
    const roleOrder = OWNER_PRIORITY[left.role] - OWNER_PRIORITY[right.role];
    if (roleOrder !== 0) {
      return roleOrder;
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });

  return members[0]?.user_id ?? null;
}

export function canTransitionIncidentActionStatus(
  currentStatus: IncidentActionStatus,
  nextStatus: IncidentActionStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "todo") {
    return nextStatus === "doing" || nextStatus === "blocked";
  }

  if (currentStatus === "doing") {
    return nextStatus === "done" || nextStatus === "blocked";
  }

  if (currentStatus === "blocked") {
    return nextStatus === "doing" || nextStatus === "done";
  }

  return false;
}

async function getAlertSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  alertId: string,
): Promise<AlertSnapshotRow> {
  const { data, error } = await supabase
    .from("alerts")
    .select("id, title, severity, status, supplier_id")
    .eq("organization_id", organizationId)
    .eq("id", alertId)
    .maybeSingle();

  if (error) {
    throw new IncidentServiceError(
      "INCIDENT_ALERT_LOOKUP_FAILED",
      error.message || "Failed to load source alert.",
      500,
    );
  }

  if (!data) {
    throw new IncidentServiceError("INCIDENT_ALERT_NOT_FOUND", "Source alert not found.", 404);
  }

  return data as AlertSnapshotRow;
}

async function getIncidentActions(
  supabase: SupabaseClient,
  organizationId: string,
  incidentId: string,
): Promise<IncidentActionDTO[]> {
  const { data, error } = await supabase
    .from("incident_actions")
    .select("id, incident_id, organization_id, action_title, owner_id, due_at, status, created_at")
    .eq("organization_id", organizationId)
    .eq("incident_id", incidentId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new IncidentServiceError(
      "INCIDENT_ACTION_LIST_FAILED",
      error.message || "Failed to list incident actions.",
      500,
    );
  }

  return ((data ?? []) as IncidentActionRow[]).map((row) => toIncidentActionDto(row));
}

export async function listIncidents(
  supabase: SupabaseClient,
  organizationId: string,
  query: IncidentListQuery,
): Promise<{ items: IncidentDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("incidents")
    .select(INCIDENT_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) {
    dbQuery = dbQuery.eq("status", query.status);
  }

  if (query.ownerId) {
    dbQuery = dbQuery.eq("owner_id", query.ownerId);
  }

  if (query.alertId) {
    dbQuery = dbQuery.eq("alert_id", query.alertId);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new IncidentServiceError(
      "INCIDENT_LIST_FAILED",
      error.message || "Failed to list incidents.",
      500,
    );
  }

  const incidents = ((data ?? []) as IncidentRow[]).map((row) => toIncidentDto(row));

  return {
    items: incidents,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: count ?? incidents.length,
    },
  };
}

export async function getIncidentById(
  supabase: SupabaseClient,
  organizationId: string,
  incidentId: string,
): Promise<IncidentDetailDTO> {
  const { data, error } = await supabase
    .from("incidents")
    .select(INCIDENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", incidentId)
    .maybeSingle();

  if (error) {
    throw new IncidentServiceError(
      "INCIDENT_LOOKUP_FAILED",
      error.message || "Failed to lookup incident.",
      500,
    );
  }

  if (!data) {
    throw new IncidentServiceError("INCIDENT_NOT_FOUND", "Incident not found.", 404);
  }

  const incident = toIncidentDto(data as IncidentRow);
  const actions = await getIncidentActions(supabase, organizationId, incidentId);

  let alert: IncidentDetailDTO["alert"] = null;
  if (incident.alertId) {
    const alertSnapshot = await getAlertSnapshot(supabase, organizationId, incident.alertId);
    alert = {
      id: alertSnapshot.id,
      severity: alertSnapshot.severity,
      status: alertSnapshot.status,
      supplierId: alertSnapshot.supplier_id,
      title: alertSnapshot.title,
    };
  }

  return {
    ...incident,
    actions,
    alert,
  };
}

export async function createIncidentFromAlert(
  supabase: SupabaseClient,
  input: {
    allowLowSeverity: boolean;
    alertId: string;
    organizationId: string;
  },
): Promise<IncidentCreateResult> {
  const alert = await getAlertSnapshot(supabase, input.organizationId, input.alertId);

  if (alert.status === "resolved") {
    throw new IncidentServiceError(
      "INCIDENT_ALERT_RESOLVED",
      "Cannot create incident from a resolved alert.",
      409,
    );
  }

  if (alert.severity < 4 && !input.allowLowSeverity) {
    throw new IncidentServiceError(
      "INCIDENT_ALERT_SEVERITY_TOO_LOW",
      "Only severity 4+ alerts can auto-create incidents.",
      422,
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("incidents")
    .select(INCIDENT_SELECT)
    .eq("organization_id", input.organizationId)
    .eq("alert_id", input.alertId)
    .neq("status", "closed")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new IncidentServiceError(
      "INCIDENT_EXISTING_LOOKUP_FAILED",
      existingError.message || "Failed to check existing incidents for alert.",
      500,
    );
  }

  if (existing) {
    const existingDetail = await getIncidentById(supabase, input.organizationId, (existing as IncidentRow).id);
    return {
      created: false,
      incident: existingDetail,
    };
  }

  const ownerId = await resolveIncidentOwner(supabase, input.organizationId, alert.owner_id ?? null);
  const startedAt = new Date().toISOString();

  const { data: insertedIncident, error: incidentInsertError } = await supabase
    .from("incidents")
    .insert({
      alert_id: input.alertId,
      organization_id: input.organizationId,
      owner_id: ownerId,
      started_at: startedAt,
      status: "open",
      title: `Incident Response: ${alert.title}`,
    })
    .select(INCIDENT_SELECT)
    .single();

  if (incidentInsertError || !insertedIncident) {
    throw new IncidentServiceError(
      "INCIDENT_CREATE_FAILED",
      incidentInsertError?.message || "Failed to create incident.",
      500,
    );
  }

  const incidentId = (insertedIncident as IncidentRow).id;
  const actionTemplates = buildPlaybookActions(alert.severity, startedAt);

  if (actionTemplates.length > 0) {
    const actionRows = actionTemplates.map((template) => ({
      action_title: template.actionTitle,
      due_at: template.dueAt,
      incident_id: incidentId,
      organization_id: input.organizationId,
      owner_id: ownerId,
      status: "todo" as const,
    }));

    const { error: actionInsertError } = await supabase.from("incident_actions").insert(actionRows);

    if (actionInsertError) {
      throw new IncidentServiceError(
        "INCIDENT_ACTION_CREATE_FAILED",
        actionInsertError.message || "Failed to generate playbook actions.",
        500,
      );
    }
  }

  const detail = await getIncidentById(supabase, input.organizationId, incidentId);

  // Non-blocking notification
  createNotification(supabase, input.organizationId, {
    title: `Incident Created: ${detail.title}`,
    message: `New incident created from alert "${alert.title}" with ${actionTemplates.length} playbook actions.`,
    type: "incident",
    referenceType: "incident",
    referenceId: detail.id,
  }).catch((err) => {
    console.warn("[notification] Failed to create incident notification:", err);
  });

  return {
    created: true,
    incident: detail,
  };
}

export async function ensureIncidentForAlert(
  supabase: SupabaseClient,
  organizationId: string,
  alertId: string,
): Promise<IncidentCreateResult> {
  return createIncidentFromAlert(supabase, {
    alertId,
    allowLowSeverity: false,
    organizationId,
  });
}

export async function updateIncidentActionStatus(
  supabase: SupabaseClient,
  input: {
    actionId: string;
    incidentId: string;
    nextStatus: IncidentActionStatus;
    organizationId: string;
  },
): Promise<IncidentActionDTO> {
  const incident = await getIncidentById(supabase, input.organizationId, input.incidentId);

  if (incident.status === "closed") {
    throw new IncidentServiceError(
      "INCIDENT_ACTION_UPDATE_CLOSED_INCIDENT",
      "Cannot update actions for a closed incident.",
      409,
    );
  }

  const { data: actionData, error: actionLookupError } = await supabase
    .from("incident_actions")
    .select("id, incident_id, organization_id, action_title, owner_id, due_at, status, created_at")
    .eq("organization_id", input.organizationId)
    .eq("incident_id", input.incidentId)
    .eq("id", input.actionId)
    .maybeSingle();

  if (actionLookupError) {
    throw new IncidentServiceError(
      "INCIDENT_ACTION_LOOKUP_FAILED",
      actionLookupError.message || "Failed to lookup incident action.",
      500,
    );
  }

  if (!actionData) {
    throw new IncidentServiceError("INCIDENT_ACTION_NOT_FOUND", "Incident action not found.", 404);
  }

  const existing = actionData as IncidentActionRow;
  if (!canTransitionIncidentActionStatus(existing.status, input.nextStatus)) {
    throw new IncidentServiceError(
      "INCIDENT_ACTION_INVALID_TRANSITION",
      `Cannot move action from ${existing.status} to ${input.nextStatus}.`,
      409,
    );
  }

  const { data: updatedAction, error: actionUpdateError } = await supabase
    .from("incident_actions")
    .update({ status: input.nextStatus })
    .eq("organization_id", input.organizationId)
    .eq("incident_id", input.incidentId)
    .eq("id", input.actionId)
    .select("id, incident_id, organization_id, action_title, owner_id, due_at, status, created_at")
    .single();

  if (actionUpdateError || !updatedAction) {
    throw new IncidentServiceError(
      "INCIDENT_ACTION_UPDATE_FAILED",
      actionUpdateError?.message || "Failed to update incident action status.",
      500,
    );
  }

  if (input.nextStatus === "doing" && incident.status === "open") {
    const { error: incidentStatusError } = await supabase
      .from("incidents")
      .update({ status: "in_progress" })
      .eq("organization_id", input.organizationId)
      .eq("id", input.incidentId)
      .eq("status", "open");

    if (incidentStatusError) {
      throw new IncidentServiceError(
        "INCIDENT_STATUS_UPDATE_FAILED",
        incidentStatusError.message || "Failed to update incident status.",
        500,
      );
    }
  }

  return toIncidentActionDto(updatedAction as IncidentActionRow);
}

export async function closeIncident(
  supabase: SupabaseClient,
  organizationId: string,
  incidentId: string,
): Promise<IncidentDetailDTO> {
  const incident = await getIncidentById(supabase, organizationId, incidentId);

  if (incident.status === "closed") {
    throw new IncidentServiceError("INCIDENT_ALREADY_CLOSED", "Incident is already closed.", 409);
  }

  const { count: openActionCount, error: openActionCountError } = await supabase
    .from("incident_actions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("incident_id", incidentId)
    .neq("status", "done");

  if (openActionCountError) {
    throw new IncidentServiceError(
      "INCIDENT_CLOSE_ACTION_CHECK_FAILED",
      openActionCountError.message || "Failed to validate incident actions before close.",
      500,
    );
  }

  if ((openActionCount ?? 0) > 0) {
    throw new IncidentServiceError(
      "INCIDENT_CLOSE_ACTIONS_INCOMPLETE",
      "All incident actions must be done before closing the incident.",
      409,
    );
  }

  if (incident.alertId) {
    const alert = await getAlertSnapshot(supabase, organizationId, incident.alertId);
    if (alert.status !== "resolved") {
      throw new IncidentServiceError(
        "INCIDENT_CLOSE_ALERT_UNRESOLVED",
        "Source alert must be resolved before closing the incident.",
        409,
      );
    }
  }

  const { error: closeError } = await supabase
    .from("incidents")
    .update({
      closed_at: new Date().toISOString(),
      status: "closed",
    })
    .eq("organization_id", organizationId)
    .eq("id", incidentId);

  if (closeError) {
    throw new IncidentServiceError(
      "INCIDENT_CLOSE_FAILED",
      closeError.message || "Failed to close incident.",
      500,
    );
  }

  return getIncidentById(supabase, organizationId, incidentId);
}

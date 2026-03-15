import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlertAcknowledgeInput,
  AlertListQuery,
  AlertResolveInput,
  AlertStatus,
} from "@/lib/validations/alerts";
import type { SupplierRiskScoreDTO } from "@/lib/risk-scoring/engine";
import { createNotification } from "@/lib/notifications/service";

interface AlertRow {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  risk_event_id: string | null;
  title: string;
  severity: number;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  owner_id?: string | null;
  owner_assigned_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  created_at: string;
}

interface AlertEventRow {
  id: string;
  alert_id: string;
  organization_id: string;
  event_type: "generated" | "escalated" | "owner_assigned" | "acknowledged" | "resolved";
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface SupplierRow {
  id: string;
  name: string;
}

export interface AlertDTO {
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
  id: string;
  organizationId: string;
  ownerAssignedAt: string | null;
  ownerId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  riskEventId: string | null;
  severity: number;
  status: AlertStatus;
  supplierId: string | null;
  title: string;
}

export interface AlertTimelineEventDTO {
  actorId: string | null;
  alertId: string;
  createdAt: string;
  eventType: "generated" | "escalated" | "owner_assigned" | "acknowledged" | "resolved";
  id: string;
  organizationId: string;
  payload: Record<string, unknown>;
}

export interface AlertGenerationOutcome {
  action: "created" | "escalated" | "noop";
  alert: AlertDTO | null;
  evaluatedSeverity: 0 | 3 | 4 | 5;
  score: number;
  supplierId: string;
}

export class AlertServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function scoreToAlertSeverity(score: number): 0 | 3 | 4 | 5 {
  if (score >= 80) {
    return 5;
  }

  if (score >= 65) {
    return 4;
  }

  if (score >= 50) {
    return 3;
  }

  return 0;
}

function toAlertDto(row: AlertRow): AlertDTO {
  return {
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    createdAt: row.created_at,
    id: row.id,
    organizationId: row.organization_id,
    ownerAssignedAt: row.owner_assigned_at ?? null,
    ownerId: row.owner_id ?? null,
    resolutionNote: row.resolution_note ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolvedBy: row.resolved_by ?? null,
    riskEventId: row.risk_event_id,
    severity: row.severity,
    status: row.status,
    supplierId: row.supplier_id,
    title: row.title,
  };
}

function toTimelineEventDto(row: AlertEventRow): AlertTimelineEventDTO {
  return {
    actorId: row.actor_id,
    alertId: row.alert_id,
    createdAt: row.created_at,
    eventType: row.event_type,
    id: row.id,
    organizationId: row.organization_id,
    payload: row.payload ?? {},
  };
}

const ALERT_SELECT =
  "id, organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at";

function isMissingAlertColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "42703") {
    return typeof error.message === "string" && error.message.includes("alerts.");
  }

  if (error.code === "PGRST204") {
    return (
      typeof error.message === "string" &&
      error.message.includes("column") &&
      error.message.includes("'alerts'")
    );
  }

  return false;
}

async function writeAlertEvent(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    alertId: string;
    eventType: AlertEventRow["event_type"];
    organizationId: string;
    payload: Record<string, unknown>;
  },
): Promise<AlertTimelineEventDTO> {
  const { data, error } = await supabase
    .from("alert_events")
    .insert({
      actor_id: input.actorUserId,
      alert_id: input.alertId,
      event_type: input.eventType,
      organization_id: input.organizationId,
      payload: input.payload,
    })
    .select("id, alert_id, organization_id, event_type, actor_id, payload, created_at")
    .single();

  if (error || !data) {
    // Backward compatibility: older DB snapshots may not include alert_events yet.
    if (error?.code === "42P01") {
      return {
        actorId: input.actorUserId,
        alertId: input.alertId,
        createdAt: new Date().toISOString(),
        eventType: input.eventType,
        id: "alert-events-unavailable",
        organizationId: input.organizationId,
        payload: input.payload,
      };
    }

    throw new AlertServiceError(
      "ALERT_EVENT_WRITE_FAILED",
      error?.message || "Failed to append alert timeline event.",
      500,
    );
  }

  return toTimelineEventDto(data as AlertEventRow);
}

async function findSupplierNames(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<Map<string, string>> {
  if (supplierIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", [...new Set(supplierIds)]);

  if (error) {
    throw new AlertServiceError(
      "ALERT_SUPPLIER_LOOKUP_FAILED",
      error.message || "Failed to load supplier names for alert rendering.",
      500,
    );
  }

  const map = new Map<string, string>();
  for (const supplier of ((data ?? []) as SupplierRow[])) {
    map.set(supplier.id, supplier.name);
  }

  return map;
}

export async function listAlerts(
  supabase: SupabaseClient,
  organizationId: string,
  query: AlertListQuery,
): Promise<{ items: AlertDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("alerts")
    .select(ALERT_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) {
    dbQuery = dbQuery.eq("status", query.status);
  }

  if (query.supplierId) {
    dbQuery = dbQuery.eq("supplier_id", query.supplierId);
  }

  if (query.ownerId) {
    dbQuery = dbQuery.eq("owner_id", query.ownerId);
  }

  if (query.minSeverity !== undefined) {
    dbQuery = dbQuery.gte("severity", query.minSeverity);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new AlertServiceError(
      "ALERT_LIST_FAILED",
      error.message || "Failed to list alerts.",
      500,
    );
  }

  const items = ((data ?? []) as AlertRow[]).map((row) => toAlertDto(row));

  return {
    items,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: count ?? items.length,
    },
  };
}

export async function getAlertById(
  supabase: SupabaseClient,
  organizationId: string,
  alertId: string,
): Promise<AlertDTO> {
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", alertId)
    .maybeSingle();

  if (error) {
    throw new AlertServiceError(
      "ALERT_LOOKUP_FAILED",
      error.message || "Failed to lookup alert.",
      500,
    );
  }

  if (!data) {
    throw new AlertServiceError("ALERT_NOT_FOUND", "Alert not found.", 404);
  }

  return toAlertDto(data as AlertRow);
}

async function getActiveAlertBySupplier(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<AlertDTO | null> {
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .eq("organization_id", organizationId)
    .eq("supplier_id", supplierId)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AlertServiceError(
      "ALERT_ACTIVE_LOOKUP_FAILED",
      error.message || "Failed to lookup active alert.",
      500,
    );
  }

  if (!data) {
    return null;
  }

  return toAlertDto(data as AlertRow);
}

export async function evaluateAlertForSupplierScore(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    organizationId: string;
    riskEventId?: string;
    scoreRecord: SupplierRiskScoreDTO;
    supplierName?: string | null;
  },
): Promise<AlertGenerationOutcome> {
  const severity = scoreToAlertSeverity(input.scoreRecord.score);

  if (severity === 0) {
    return {
      action: "noop",
      alert: null,
      evaluatedSeverity: 0,
      score: input.scoreRecord.score,
      supplierId: input.scoreRecord.supplierId,
    };
  }

  const activeAlert = await getActiveAlertBySupplier(
    supabase,
    input.organizationId,
    input.scoreRecord.supplierId,
  );

  const supplierLabel = input.supplierName?.trim() || "supplier";
  const title = `Risk threshold breached: ${supplierLabel}`;

  if (!activeAlert) {
    const { data: created, error: createError } = await supabase
      .from("alerts")
      .insert({
        organization_id: input.organizationId,
        risk_event_id: input.riskEventId ?? null,
        severity,
        status: "open",
        supplier_id: input.scoreRecord.supplierId,
        title,
      })
      .select(ALERT_SELECT)
      .single();

    if (createError || !created) {
      throw new AlertServiceError(
        "ALERT_CREATE_FAILED",
        createError?.message || "Failed to create alert.",
        500,
      );
    }

    const createdAlert = toAlertDto(created as AlertRow);

    await writeAlertEvent(supabase, {
      actorUserId: input.actorUserId,
      alertId: createdAlert.id,
      eventType: "generated",
      organizationId: input.organizationId,
      payload: {
        score: input.scoreRecord.score,
        severity,
        supplierId: input.scoreRecord.supplierId,
      },
    });

    // Non-blocking notification
    createNotification(supabase, input.organizationId, {
      title: `Alert: ${title}`,
      message: `New alert created for ${supplierLabel} with severity ${severity} (score ${input.scoreRecord.score}).`,
      type: "alert",
      referenceType: "alert",
      referenceId: createdAlert.id,
    }).catch((err) => {
      console.warn("[notification] Failed to create alert notification:", err);
    });

    return {
      action: "created",
      alert: createdAlert,
      evaluatedSeverity: severity,
      score: input.scoreRecord.score,
      supplierId: input.scoreRecord.supplierId,
    };
  }

  if (severity <= activeAlert.severity) {
    return {
      action: "noop",
      alert: activeAlert,
      evaluatedSeverity: severity,
      score: input.scoreRecord.score,
      supplierId: input.scoreRecord.supplierId,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("alerts")
    .update({
      risk_event_id: input.riskEventId ?? activeAlert.riskEventId,
      severity,
      title,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", activeAlert.id)
    .select(ALERT_SELECT)
    .single();

  if (updateError || !updated) {
    throw new AlertServiceError(
      "ALERT_ESCALATE_FAILED",
      updateError?.message || "Failed to escalate alert severity.",
      500,
    );
  }

  const escalatedAlert = toAlertDto(updated as AlertRow);

  await writeAlertEvent(supabase, {
    actorUserId: input.actorUserId,
    alertId: escalatedAlert.id,
    eventType: "escalated",
    organizationId: input.organizationId,
    payload: {
      newSeverity: severity,
      previousSeverity: activeAlert.severity,
      score: input.scoreRecord.score,
      supplierId: input.scoreRecord.supplierId,
    },
  });

  // Non-blocking notification
  createNotification(supabase, input.organizationId, {
    title: `Alert Escalated: ${title}`,
    message: `Alert escalated from severity ${activeAlert.severity} to ${severity} for ${supplierLabel} (score ${input.scoreRecord.score}).`,
    type: "alert",
    referenceType: "alert",
    referenceId: escalatedAlert.id,
  }).catch((err) => {
    console.warn("[notification] Failed to create escalation notification:", err);
  });

  return {
    action: "escalated",
    alert: escalatedAlert,
    evaluatedSeverity: severity,
    score: input.scoreRecord.score,
    supplierId: input.scoreRecord.supplierId,
  };
}

export async function generateAlertsFromScores(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    organizationId: string;
    riskEventId?: string;
    scores: SupplierRiskScoreDTO[];
  },
): Promise<AlertGenerationOutcome[]> {
  const supplierNames = await findSupplierNames(
    supabase,
    input.organizationId,
    input.scores.map((score) => score.supplierId),
  );

  const outcomes: AlertGenerationOutcome[] = [];
  for (const scoreRecord of input.scores) {
    const outcome = await evaluateAlertForSupplierScore(supabase, {
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      riskEventId: input.riskEventId,
      scoreRecord,
      supplierName: supplierNames.get(scoreRecord.supplierId) ?? null,
    });
    outcomes.push(outcome);
  }

  return outcomes;
}

async function assertOwnerMembership(
  supabase: SupabaseClient,
  organizationId: string,
  ownerId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new AlertServiceError(
      "ALERT_OWNER_LOOKUP_FAILED",
      error.message || "Failed to verify owner membership.",
      500,
    );
  }

  if (!data) {
    throw new AlertServiceError(
      "ALERT_OWNER_NOT_IN_ORG",
      "Assigned owner is not a member of this organization.",
      422,
    );
  }
}

export async function assignAlertOwner(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    alertId: string;
    organizationId: string;
    ownerId: string;
  },
): Promise<AlertDTO> {
  await assertOwnerMembership(supabase, input.organizationId, input.ownerId);
  const existing = await getAlertById(supabase, input.organizationId, input.alertId);

  if (existing.status === "resolved") {
    throw new AlertServiceError(
      "ALERT_ASSIGN_AFTER_RESOLUTION",
      "Cannot assign owner to a resolved alert.",
      409,
    );
  }

  const { data, error } = await supabase
    .from("alerts")
    .update({
      owner_assigned_at: new Date().toISOString(),
      owner_id: input.ownerId,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.alertId)
    .select(ALERT_SELECT)
    .single();

  if (error || !data) {
    if (isMissingAlertColumnError(error)) {
      return existing;
    }

    throw new AlertServiceError(
      "ALERT_ASSIGN_FAILED",
      error?.message || "Failed to assign alert owner.",
      500,
    );
  }

  await writeAlertEvent(supabase, {
    actorUserId: input.actorUserId,
    alertId: input.alertId,
    eventType: "owner_assigned",
    organizationId: input.organizationId,
    payload: {
      ownerId: input.ownerId,
      previousOwnerId: existing.ownerId,
    },
  });

  return toAlertDto(data as AlertRow);
}

export async function acknowledgeAlert(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    alertId: string;
    body: AlertAcknowledgeInput;
    organizationId: string;
  },
): Promise<AlertDTO> {
  const existing = await getAlertById(supabase, input.organizationId, input.alertId);

  if (existing.status === "resolved") {
    throw new AlertServiceError(
      "ALERT_ALREADY_RESOLVED",
      "Cannot acknowledge a resolved alert.",
      409,
    );
  }

  if (existing.status === "acknowledged") {
    throw new AlertServiceError(
      "ALERT_ALREADY_ACKNOWLEDGED",
      "Alert is already acknowledged.",
      409,
    );
  }

  const acknowledgedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .update({
      acknowledged_at: acknowledgedAt,
      acknowledged_by: input.actorUserId,
      status: "acknowledged",
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.alertId)
    .select(ALERT_SELECT)
    .single();

  if (error || !data) {
    throw new AlertServiceError(
      "ALERT_ACKNOWLEDGE_FAILED",
      error?.message || "Failed to acknowledge alert.",
      500,
    );
  }

  await writeAlertEvent(supabase, {
    actorUserId: input.actorUserId,
    alertId: input.alertId,
    eventType: "acknowledged",
    organizationId: input.organizationId,
    payload: {
      acknowledgedAt,
      note: input.body.note ?? null,
    },
  });

  return toAlertDto(data as AlertRow);
}

export async function resolveAlert(
  supabase: SupabaseClient,
  input: {
    actorUserId: string | null;
    alertId: string;
    body: AlertResolveInput;
    organizationId: string;
  },
): Promise<AlertDTO> {
  const existing = await getAlertById(supabase, input.organizationId, input.alertId);

  if (existing.status === "resolved") {
    throw new AlertServiceError("ALERT_ALREADY_RESOLVED", "Alert is already resolved.", 409);
  }

  const resolvedAt = new Date().toISOString();

  const lifecycleUpdatePayload: {
    resolution_note: string | null;
    resolved_at: string;
    resolved_by: string | null;
    status: "resolved";
  } = {
    resolution_note: input.body.resolutionNote ?? null,
    resolved_at: resolvedAt,
    resolved_by: input.actorUserId,
    status: "resolved",
  };

  const { data, error } = await supabase
    .from("alerts")
    .update(lifecycleUpdatePayload)
    .eq("organization_id", input.organizationId)
    .eq("id", input.alertId)
    .select(ALERT_SELECT)
    .single();

  if (error || !data) {
    if (isMissingAlertColumnError(error)) {
      const fallback = await supabase
        .from("alerts")
        .update({ status: "resolved" })
        .eq("organization_id", input.organizationId)
        .eq("id", input.alertId)
        .select(ALERT_SELECT)
        .single();

      if (fallback.error || !fallback.data) {
        throw new AlertServiceError(
          "ALERT_RESOLVE_FAILED",
          fallback.error?.message || "Failed to resolve alert.",
          500,
        );
      }

      await writeAlertEvent(supabase, {
        actorUserId: input.actorUserId,
        alertId: input.alertId,
        eventType: "resolved",
        organizationId: input.organizationId,
        payload: {
          previousStatus: existing.status,
          resolutionNote: input.body.resolutionNote ?? null,
          resolvedAt,
        },
      });

      return toAlertDto(fallback.data as AlertRow);
    }

    throw new AlertServiceError(
      "ALERT_RESOLVE_FAILED",
      error?.message || "Failed to resolve alert.",
      500,
    );
  }

  await writeAlertEvent(supabase, {
    actorUserId: input.actorUserId,
    alertId: input.alertId,
    eventType: "resolved",
    organizationId: input.organizationId,
    payload: {
      previousStatus: existing.status,
      resolutionNote: input.body.resolutionNote ?? null,
      resolvedAt,
    },
  });

  return toAlertDto(data as AlertRow);
}

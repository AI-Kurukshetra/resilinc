import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationCreateInput, NotificationListQuery } from "@/lib/validations/notifications";

// ─── Error ────────────────────────────────────────────────────────────────────

export class NotificationServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface NotificationDTO {
  id: string;
  organizationId: string;
  userId: string | null;
  title: string;
  message: string;
  type: "alert" | "incident" | "mitigation" | "compliance" | "system";
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as NotificationDTO["type"],
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, user_id, title, message, type, reference_type, reference_id, is_read, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function createNotification(
  supabase: SupabaseClient,
  organizationId: string,
  input: NotificationCreateInput,
): Promise<NotificationDTO> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      organization_id: organizationId,
      user_id: input.userId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new NotificationServiceError(
      "NOTIFICATION_CREATE_FAILED",
      error?.message || "Failed to create notification.",
      500,
    );
  }

  return toDTO(data as NotificationRow);
}

export async function listNotifications(
  supabase: SupabaseClient,
  organizationId: string,
  query: NotificationListQuery,
): Promise<{ items: NotificationDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  let dbQuery = supabase
    .from("notifications")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.isRead !== undefined) {
    dbQuery = dbQuery.eq("is_read", query.isRead === "true");
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new NotificationServiceError(
      "NOTIFICATION_LIST_FAILED",
      error.message || "Failed to list notifications.",
      500,
    );
  }

  return {
    items: ((data ?? []) as NotificationRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function markAsRead(
  supabase: SupabaseClient,
  organizationId: string,
  notificationId: string,
): Promise<NotificationDTO> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", organizationId)
    .eq("id", notificationId)
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new NotificationServiceError(
      "NOTIFICATION_MARK_READ_FAILED",
      error?.message || "Failed to mark notification as read.",
      500,
    );
  }

  return toDTO(data as NotificationRow);
}

export async function markAllAsRead(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<{ updated: number }> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_read", false)
    .select("id");

  if (error) {
    throw new NotificationServiceError(
      "NOTIFICATION_MARK_ALL_READ_FAILED",
      error.message || "Failed to mark all notifications as read.",
      500,
    );
  }

  return { updated: data?.length ?? 0 };
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string | null,
): Promise<{ count: number }> {
  let dbQuery = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_read", false);

  if (userId) {
    dbQuery = dbQuery.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { count, error } = await dbQuery;

  if (error) {
    throw new NotificationServiceError(
      "NOTIFICATION_COUNT_FAILED",
      error.message || "Failed to count unread notifications.",
      500,
    );
  }

  return { count: count ?? 0 };
}

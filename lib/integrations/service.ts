import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationCreateInput, IntegrationUpdateInput, IntegrationListQuery } from "@/lib/validations/integrations";

// ─── Error ────────────────────────────────────────────────────────────────────

export class IntegrationServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface IntegrationDTO {
  id: string;
  organizationId: string;
  name: string;
  type: "api_connector" | "webhook" | "data_feed" | "manual";
  status: "active" | "inactive" | "error";
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface IntegrationRow {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDTO(row: IntegrationRow): IntegrationDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    type: row.type as IntegrationDTO["type"],
    status: row.status as IntegrationDTO["status"],
    config: row.config,
    lastSyncAt: row.last_sync_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, organization_id, name, type, status, config, last_sync_at, error_message, created_at";

// ─── Service functions ────────────────────────────────────────────────────────

export async function listIntegrations(
  supabase: SupabaseClient,
  organizationId: string,
  query: IntegrationListQuery,
): Promise<{ items: IntegrationDTO[]; pagination: { limit: number; offset: number; total: number } }> {
  const { data, count, error } = await supabase
    .from("integrations")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    throw new IntegrationServiceError(
      "INTEGRATION_LIST_FAILED",
      error.message || "Failed to list integrations.",
      500,
    );
  }

  return {
    items: ((data ?? []) as IntegrationRow[]).map(toDTO),
    pagination: { limit: query.limit, offset: query.offset, total: count ?? 0 },
  };
}

export async function createIntegration(
  supabase: SupabaseClient,
  organizationId: string,
  input: IntegrationCreateInput,
): Promise<IntegrationDTO> {
  const { data, error } = await supabase
    .from("integrations")
    .insert({
      organization_id: organizationId,
      name: input.name,
      type: input.type,
      status: input.status,
      config: input.config,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new IntegrationServiceError(
      "INTEGRATION_CREATE_FAILED",
      error?.message || "Failed to create integration.",
      500,
    );
  }

  return toDTO(data as IntegrationRow);
}

export async function updateIntegration(
  supabase: SupabaseClient,
  organizationId: string,
  integrationId: string,
  input: IntegrationUpdateInput,
): Promise<IntegrationDTO> {
  const updatePayload: Record<string, unknown> = {};
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.type !== undefined) updatePayload.type = input.type;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.config !== undefined) updatePayload.config = input.config;
  if (input.errorMessage !== undefined) updatePayload.error_message = input.errorMessage;

  const { data, error } = await supabase
    .from("integrations")
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", integrationId)
    .select(SELECT)
    .single();

  if (error || !data) {
    throw new IntegrationServiceError(
      "INTEGRATION_UPDATE_FAILED",
      error?.message || "Failed to update integration.",
      500,
    );
  }

  return toDTO(data as IntegrationRow);
}

export async function testConnection(
  _supabase: SupabaseClient,
  _organizationId: string,
  _integrationId: string,
): Promise<{ success: boolean; latencyMs: number }> {
  // Stub: returns a successful connection test for demo
  return { success: true, latencyMs: 42 };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskEventCreateInput, RiskEventListQuery } from "@/lib/validations/risk-events";
import {
  LOW_CONFIDENCE_THRESHOLD,
  WebSearchAdapter,
  WeatherRiskAdapter,
  buildEnrichmentPayload,
  buildLowConfidenceFlag,
  buildProvenance,
  computeEnrichedConfidence,
} from "@/lib/risk-events/enrichment";

// ---- Error classes ----

export class RiskEventServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class RiskEventSupplierValidationError extends Error {
  readonly invalidSupplierIds: string[];

  constructor(invalidIds: string[]) {
    super("One or more supplier IDs do not belong to this organization.");
    this.invalidSupplierIds = invalidIds;
  }
}

// ---- DB row shapes (snake_case from Supabase) ----

interface RiskEventRow {
  id: string;
  organization_id: string;
  event_type: string;
  severity: number;
  confidence: number;
  region_code: string | null;
  source_url: string | null;
  source_name: string | null;
  observed_at: string;
  summary: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface RiskEventSupplierRow {
  id: string;
  risk_event_id: string;
  supplier_id: string;
  organization_id: string;
  impact_level: number;
}

// ---- DTOs (camelCase for API consumers) ----

export interface RiskEventDTO {
  id: string;
  organizationId: string;
  eventType: string;
  severity: number;
  confidence: number;
  regionCode: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  observedAt: string;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface RiskEventSupplierLinkDTO {
  id: string;
  supplierId: string;
  impactLevel: number;
}

export interface RiskEventDetailDTO extends RiskEventDTO {
  supplierLinks: RiskEventSupplierLinkDTO[];
  isDuplicate?: boolean;    // M3.S3.a — true when a matching event already existed
  reviewRequired?: boolean; // M3.S3.c — true when confidence < LOW_CONFIDENCE_THRESHOLD
}

export interface RiskEventListDTO {
  items: RiskEventDTO[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// ---- Helpers ----

function toRiskEventDTO(row: RiskEventRow): RiskEventDTO {
  return {
    id: row.id,
    organizationId: row.organization_id,
    eventType: row.event_type,
    severity: row.severity,
    confidence: row.confidence,
    regionCode: row.region_code,
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    observedAt: row.observed_at,
    summary: row.summary,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

function dbErrorMessage(error: { message?: string } | null, fallback: string): string {
  return error?.message || fallback;
}

const RISK_EVENT_SELECT = [
  "id",
  "organization_id",
  "event_type",
  "severity",
  "confidence",
  "region_code",
  "source_url",
  "source_name",
  "observed_at",
  "summary",
  "payload",
  "created_at",
].join(", ");

// M3.S3.a — Deduplicate check: match on event_type + region_code + observed_at (±1h) + source
async function findDuplicateEventId(
  supabase: SupabaseClient,
  organizationId: string,
  input: RiskEventCreateInput,
): Promise<string | null> {
  const windowMs = 60 * 60 * 1000; // ±1 hour window
  const observed = new Date(input.observedAt).getTime();
  const windowStart = new Date(observed - windowMs).toISOString();
  const windowEnd = new Date(observed + windowMs).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from("risk_events")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("event_type", input.eventType)
    .gte("observed_at", windowStart)
    .lte("observed_at", windowEnd)
    .limit(1);

  if (input.regionCode) {
    q = q.eq("region_code", input.regionCode);
  } else {
    q = q.is("region_code", null);
  }
  if (input.sourceName) {
    q = q.eq("source_name", input.sourceName);
  } else if (input.sourceUrl) {
    q = q.eq("source_url", input.sourceUrl);
  }

  const { data } = await q;
  return (data as Array<{ id: string }> | null)?.[0]?.id ?? null;
}

// ---- Service functions ----

export async function ingestRiskEvent(
  supabase: SupabaseClient,
  organizationId: string,
  input: RiskEventCreateInput,
): Promise<RiskEventDetailDTO> {
  const dedupedSupplierIds = [...new Set(input.affectedSupplierIds)];

  // M3.S1.c — Pre-validate all supplier IDs belong to this org
  if (dedupedSupplierIds.length > 0) {
    const { data: foundSuppliers, error: supplierLookupError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("organization_id", organizationId)
      .in("id", dedupedSupplierIds);

    if (supplierLookupError) {
      throw new RiskEventServiceError(
        "RISK_EVENT_SUPPLIER_LOOKUP_FAILED",
        dbErrorMessage(supplierLookupError, "Could not validate affected supplier IDs."),
        500,
      );
    }

    const foundIds = new Set((foundSuppliers ?? []).map((row: { id: string }) => row.id));
    const invalidIds = dedupedSupplierIds.filter((id) => !foundIds.has(id));
    if (invalidIds.length > 0) {
      throw new RiskEventSupplierValidationError(invalidIds);
    }
  }

  // M3.S3.a — Dedup check: return existing event if duplicate detected
  const duplicateId = await findDuplicateEventId(supabase, organizationId, input);
  if (duplicateId) {
    const existing = await getRiskEventById(supabase, organizationId, duplicateId);
    return { ...existing, isDuplicate: true };
  }

  // M3.S3.b — Build provenance payload (always persisted)
  const provenancePayload = buildProvenance(
    new Date().toISOString(),
    input.sourceUrl,
    input.sourceName,
  );

  // M3.S3.c — Low-confidence flag
  const reviewRequired = input.confidence < LOW_CONFIDENCE_THRESHOLD;
  const reviewPayload = reviewRequired ? buildLowConfidenceFlag(input.confidence) : {};

  // M3.S2 — Optional auto-enrichment
  let enrichmentPayload: Record<string, unknown> = {};
  let finalConfidence = input.confidence;

  if (input.autoEnrich) {
    const webAdapter = new WebSearchAdapter();
    const weatherAdapter = new WeatherRiskAdapter();
    const [webResult, weatherResult] = await Promise.all([
      webAdapter.enrich(input.eventType, input.regionCode ?? null, input.summary),
      weatherAdapter.getRiskForRegion(input.regionCode ?? null, input.observedAt),
    ]);
    const results = [webResult, weatherResult];
    finalConfidence = computeEnrichedConfidence(input.confidence, results, input.observedAt);
    enrichmentPayload = buildEnrichmentPayload(results, finalConfidence);
  }

  const mergedPayload = {
    ...(input.payload ?? {}),
    ...provenancePayload,
    ...enrichmentPayload,
    ...reviewPayload,
  };

  // M3.S1.b — Insert normalized risk_events row
  const { data: eventData, error: eventInsertError } = await supabase
    .from("risk_events")
    .insert({
      organization_id: organizationId,
      event_type: input.eventType,
      severity: input.severity,
      confidence: finalConfidence,
      region_code: input.regionCode ?? null,
      source_url: input.sourceUrl ?? null,
      source_name: input.sourceName ?? null,
      observed_at: input.observedAt,
      summary: input.summary,
      payload: mergedPayload,
    })
    .select(RISK_EVENT_SELECT)
    .single();

  if (eventInsertError || !eventData) {
    throw new RiskEventServiceError(
      "RISK_EVENT_INSERT_FAILED",
      dbErrorMessage(eventInsertError, "Failed to insert risk event."),
      500,
    );
  }

  const event = eventData as unknown as RiskEventRow;

  // M3.S1.c — Insert risk_event_suppliers junction rows
  let supplierLinks: RiskEventSupplierLinkDTO[] = [];

  if (dedupedSupplierIds.length > 0) {
    const junctionRows = dedupedSupplierIds.map((supplierId) => ({
      risk_event_id: event.id,
      supplier_id: supplierId,
      organization_id: organizationId,
      impact_level: input.impactLevel,
    }));

    const { data: linkData, error: linkInsertError } = await supabase
      .from("risk_event_suppliers")
      .insert(junctionRows)
      .select("id, supplier_id, impact_level");

    if (linkInsertError) {
      throw new RiskEventServiceError(
        "RISK_EVENT_SUPPLIER_LINK_FAILED",
        dbErrorMessage(linkInsertError, "Risk event created but supplier links failed."),
        500,
      );
    }

    supplierLinks = (
      linkData ?? []
    ).map((row: Pick<RiskEventSupplierRow, "id" | "supplier_id" | "impact_level">) => ({
      id: row.id,
      supplierId: row.supplier_id,
      impactLevel: row.impact_level,
    }));
  }

  return {
    ...toRiskEventDTO(event),
    supplierLinks,
    isDuplicate: false,
    reviewRequired,
  };
}

// M3.S2 — Enrich an existing risk event with web search + weather adapters
export async function enrichRiskEvent(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
): Promise<RiskEventDetailDTO> {
  // Fetch the current event
  const existing = await getRiskEventById(supabase, organizationId, eventId);

  const webAdapter = new WebSearchAdapter();
  const weatherAdapter = new WeatherRiskAdapter();
  const [webResult, weatherResult] = await Promise.all([
    webAdapter.enrich(existing.eventType, existing.regionCode, existing.summary),
    weatherAdapter.getRiskForRegion(existing.regionCode, existing.observedAt),
  ]);

  const results = [webResult, weatherResult];
  const enrichedConfidence = computeEnrichedConfidence(
    existing.confidence,
    results,
    existing.observedAt,
  );
  const enrichPayload = buildEnrichmentPayload(results, enrichedConfidence);

  const updatedPayload = {
    ...existing.payload,
    ...enrichPayload,
  };

  // Update event with enriched payload and confidence
  const { data: updated, error: updateError } = await supabase
    .from("risk_events")
    .update({ payload: updatedPayload, confidence: enrichedConfidence })
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .select(RISK_EVENT_SELECT)
    .single();

  if (updateError || !updated) {
    throw new RiskEventServiceError(
      "RISK_EVENT_ENRICH_FAILED",
      dbErrorMessage(updateError, "Failed to persist enrichment results."),
      500,
    );
  }

  const row = updated as unknown as RiskEventRow;
  return {
    ...toRiskEventDTO(row),
    supplierLinks: existing.supplierLinks,
    reviewRequired: enrichedConfidence < LOW_CONFIDENCE_THRESHOLD,
  };
}

export async function listRiskEvents(
  supabase: SupabaseClient,
  organizationId: string,
  query: RiskEventListQuery,
): Promise<RiskEventListDTO> {
  let eventIdFilter: string[] | null = null;

  if (query.supplierId) {
    const { data: linkRows, error: linkError } = await supabase
      .from("risk_event_suppliers")
      .select("risk_event_id")
      .eq("organization_id", organizationId)
      .eq("supplier_id", query.supplierId);

    if (linkError) {
      throw new RiskEventServiceError(
        "RISK_EVENT_SUPPLIER_FILTER_FAILED",
        dbErrorMessage(linkError, "Could not filter risk events by supplier."),
        500,
      );
    }

    eventIdFilter = [
      ...new Set(
        (linkRows ?? []).map((row: { risk_event_id: string }) => row.risk_event_id),
      ),
    ];

    if (eventIdFilter.length === 0) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total: 0 },
      };
    }
  }

  let dbQuery = supabase
    .from("risk_events")
    .select(RISK_EVENT_SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("observed_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (eventIdFilter !== null) dbQuery = dbQuery.in("id", eventIdFilter);
  if (query.regionCode) dbQuery = dbQuery.eq("region_code", query.regionCode);
  if (query.eventType) dbQuery = dbQuery.eq("event_type", query.eventType);
  if (query.minSeverity !== undefined) dbQuery = dbQuery.gte("severity", query.minSeverity);

  const { data, count, error } = await dbQuery;

  if (error) {
    throw new RiskEventServiceError(
      "RISK_EVENT_LIST_FAILED",
      dbErrorMessage(error, "Failed to list risk events."),
      500,
    );
  }

  const items = ((data as unknown as RiskEventRow[] | null) ?? []).map(toRiskEventDTO);

  return {
    items,
    pagination: { limit: query.limit, offset: query.offset, total: count ?? items.length },
  };
}

export async function getRiskEventById(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
): Promise<RiskEventDetailDTO> {
  const { data: eventData, error: eventError } = await supabase
    .from("risk_events")
    .select(RISK_EVENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new RiskEventServiceError(
      "RISK_EVENT_LOOKUP_FAILED",
      dbErrorMessage(eventError, "Failed to look up risk event."),
      500,
    );
  }

  if (!eventData) {
    throw new RiskEventServiceError("RISK_EVENT_NOT_FOUND", "Risk event not found.", 404);
  }

  const { data: linkData, error: linkError } = await supabase
    .from("risk_event_suppliers")
    .select("id, supplier_id, impact_level")
    .eq("organization_id", organizationId)
    .eq("risk_event_id", eventId);

  if (linkError) {
    throw new RiskEventServiceError(
      "RISK_EVENT_SUPPLIER_LINK_LOOKUP_FAILED",
      dbErrorMessage(linkError, "Failed to load supplier links for risk event."),
      500,
    );
  }

  const supplierLinks: RiskEventSupplierLinkDTO[] = (
    (linkData as Pick<RiskEventSupplierRow, "id" | "supplier_id" | "impact_level">[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    impactLevel: row.impact_level,
  }));

  return {
    ...toRiskEventDTO(eventData as unknown as RiskEventRow),
    supplierLinks,
  };
}

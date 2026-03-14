import type { SupabaseClient } from "@supabase/supabase-js";

const SCORING_WINDOW_DAYS = 30;
const RECENCY_HALF_LIFE_DAYS = 14;
const MAX_SCALE_VALUE = 5;

const SCORE_WEIGHTS = {
  confidence: 0.25,
  criticality: 0.25,
  impact: 0.1,
  severity: 0.4,
} as const;

const TREND_FLAT_BAND = 3;

interface SupplierRow {
  id: string;
  criticality: number;
}

interface SupplierRiskScoreRow {
  id: string;
  supplier_id: string;
  score: number | string;
  trend: "up" | "down" | "flat";
  explanation: Record<string, unknown>;
  scored_at: string;
}

interface RiskEventSupplierRow {
  supplier_id: string;
  risk_event_id: string;
  impact_level: number;
}

interface RiskEventRow {
  id: string;
  severity: number;
  confidence: number;
  observed_at: string;
}

export interface RiskSignal {
  confidence: number;
  impactLevel: number;
  observedAt: string;
  severity: number;
}

export interface RiskScoreComputationInput {
  criticality: number;
  previousScore: number | null;
  signals: RiskSignal[];
}

export interface RiskScoreComputationResult {
  aggregates: {
    confidence: number;
    impact: number;
    severity: number;
  };
  delta: number;
  eventCount: number;
  score: number;
  trend: "up" | "down" | "flat";
  trendReason: string;
}

export interface SupplierRiskScoreDTO {
  explanation: Record<string, unknown>;
  organizationId: string;
  score: number;
  scoredAt: string;
  supplierId: string;
  trend: "up" | "down" | "flat";
}

export class RiskScoringServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function normalizeFivePointScale(value: number): number {
  return clamp01(value / MAX_SCALE_VALUE);
}

export function computeRecencyWeight(ageDays: number): number {
  if (!Number.isFinite(ageDays) || ageDays < 0) {
    return 0;
  }

  return Math.exp((-Math.log(2) * ageDays) / RECENCY_HALF_LIFE_DAYS);
}

function computeWeightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0 || weights.length === 0 || values.length !== weights.length) {
    return 0;
  }

  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  return weightedSum / totalWeight;
}

export function deriveTrend(previousScore: number | null, score: number): {
  delta: number;
  trend: "up" | "down" | "flat";
  trendReason: string;
} {
  if (previousScore === null) {
    return {
      delta: 0,
      trend: "flat",
      trendReason: "No previous score found; initialized trend as flat.",
    };
  }

  const delta = round2(score - previousScore);

  if (delta >= TREND_FLAT_BAND) {
    return {
      delta,
      trend: "up",
      trendReason: `Score increased by ${delta} (>= +${TREND_FLAT_BAND}).`,
    };
  }

  if (delta <= -TREND_FLAT_BAND) {
    return {
      delta,
      trend: "down",
      trendReason: `Score decreased by ${Math.abs(delta)} (<= -${TREND_FLAT_BAND}).`,
    };
  }

  return {
    delta,
    trend: "flat",
    trendReason: `Score delta ${delta} is within +/-${TREND_FLAT_BAND} flat band.`,
  };
}

export function computeSupplierRiskScore(
  input: RiskScoreComputationInput,
): RiskScoreComputationResult {
  const nowMs = Date.now();

  const severityValues: number[] = [];
  const confidenceValues: number[] = [];
  const impactValues: number[] = [];
  const recencyWeights: number[] = [];

  for (const signal of input.signals) {
    const ageMs = nowMs - new Date(signal.observedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyWeight = computeRecencyWeight(ageDays);

    if (recencyWeight <= 0) {
      continue;
    }

    severityValues.push(normalizeFivePointScale(signal.severity));
    confidenceValues.push(clamp01(signal.confidence));
    impactValues.push(normalizeFivePointScale(signal.impactLevel));
    recencyWeights.push(recencyWeight);
  }

  const severityAgg = computeWeightedAverage(severityValues, recencyWeights);
  const confidenceAgg = computeWeightedAverage(confidenceValues, recencyWeights);
  const impactAgg = computeWeightedAverage(impactValues, recencyWeights);
  const criticalityNorm = normalizeFivePointScale(input.criticality);

  const score = round2(
    100 *
      (SCORE_WEIGHTS.severity * severityAgg +
        SCORE_WEIGHTS.confidence * confidenceAgg +
        SCORE_WEIGHTS.criticality * criticalityNorm +
        SCORE_WEIGHTS.impact * impactAgg),
  );

  const trend = deriveTrend(input.previousScore, score);

  return {
    aggregates: {
      confidence: round2(confidenceAgg),
      impact: round2(impactAgg),
      severity: round2(severityAgg),
    },
    delta: trend.delta,
    eventCount: recencyWeights.length,
    score,
    trend: trend.trend,
    trendReason: trend.trendReason,
  };
}

function createExplanationPayload(input: {
  aggregates: RiskScoreComputationResult["aggregates"];
  computationTime: string;
  delta: number;
  eventCount: number;
  previousScore: number | null;
  score: number;
  signalRiskEventIds: string[];
  supplierCriticality: number;
  trendReason: string;
}) {
  return {
    aggregates: input.aggregates,
    computedAt: input.computationTime,
    delta: input.delta,
    eventCount: input.eventCount,
    formulaVersion: "m4.v1",
    previousScore: input.previousScore,
    score: input.score,
    signalRiskEventIds: input.signalRiskEventIds,
    supplierCriticality: input.supplierCriticality,
    trendReason: input.trendReason,
    weights: SCORE_WEIGHTS,
    windowDays: SCORING_WINDOW_DAYS,
  };
}

function toRiskScoreDto(row: SupplierRiskScoreRow, organizationId: string): SupplierRiskScoreDTO {
  return {
    explanation: row.explanation ?? {},
    organizationId,
    score: round2(toNumber(row.score, 0)),
    scoredAt: row.scored_at,
    supplierId: row.supplier_id,
    trend: row.trend,
  };
}

async function loadSuppliersForScoring(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<SupplierRow[]> {
  let supplierQuery = supabase
    .from("suppliers")
    .select("id, criticality")
    .eq("organization_id", organizationId);

  if (supplierIds.length > 0) {
    supplierQuery = supplierQuery.in("id", supplierIds);
  }

  const { data, error } = await supplierQuery;

  if (error) {
    throw new RiskScoringServiceError(
      "RISK_SCORE_SUPPLIER_LOAD_FAILED",
      error.message || "Could not load suppliers for risk scoring.",
      500,
    );
  }

  return (data as SupplierRow[] | null) ?? [];
}

async function loadPreviousScores(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<Map<string, number>> {
  if (supplierIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("supplier_risk_scores")
    .select("supplier_id, score")
    .eq("organization_id", organizationId)
    .in("supplier_id", supplierIds);

  if (error) {
    throw new RiskScoringServiceError(
      "RISK_SCORE_PREVIOUS_LOAD_FAILED",
      error.message || "Could not load previous supplier risk scores.",
      500,
    );
  }

  const map = new Map<string, number>();
  for (const row of ((data ?? []) as Array<{ supplier_id: string; score: number | string }>)) {
    map.set(row.supplier_id, round2(toNumber(row.score, 0)));
  }

  return map;
}

async function loadSupplierSignals(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<Map<string, Array<{ impactLevel: number; riskEventId: string; signal: RiskSignal }>>> {
  const linksBySupplier = new Map<
    string,
    Array<{ impactLevel: number; riskEventId: string; signal: RiskSignal }>
  >();

  if (supplierIds.length === 0) {
    return linksBySupplier;
  }

  const { data: linkRows, error: linkError } = await supabase
    .from("risk_event_suppliers")
    .select("supplier_id, risk_event_id, impact_level")
    .eq("organization_id", organizationId)
    .in("supplier_id", supplierIds);

  if (linkError) {
    throw new RiskScoringServiceError(
      "RISK_SCORE_LINK_LOAD_FAILED",
      linkError.message || "Could not load supplier event links for risk scoring.",
      500,
    );
  }

  const links = (linkRows as RiskEventSupplierRow[] | null) ?? [];
  const riskEventIds = [...new Set(links.map((row) => row.risk_event_id))];

  if (riskEventIds.length === 0) {
    return linksBySupplier;
  }

  const since = new Date(Date.now() - SCORING_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: eventRows, error: eventError } = await supabase
    .from("risk_events")
    .select("id, severity, confidence, observed_at")
    .eq("organization_id", organizationId)
    .in("id", riskEventIds)
    .gte("observed_at", since);

  if (eventError) {
    throw new RiskScoringServiceError(
      "RISK_SCORE_EVENT_LOAD_FAILED",
      eventError.message || "Could not load risk events for scoring window.",
      500,
    );
  }

  const eventById = new Map<string, RiskEventRow>();
  for (const row of ((eventRows ?? []) as RiskEventRow[])) {
    eventById.set(row.id, row);
  }

  for (const link of links) {
    const event = eventById.get(link.risk_event_id);
    if (!event) {
      continue;
    }

    const supplierSignals = linksBySupplier.get(link.supplier_id) ?? [];
    supplierSignals.push({
      impactLevel: link.impact_level,
      riskEventId: link.risk_event_id,
      signal: {
        confidence: toNumber(event.confidence, 0),
        impactLevel: toNumber(link.impact_level, 0),
        observedAt: event.observed_at,
        severity: toNumber(event.severity, 0),
      },
    });
    linksBySupplier.set(link.supplier_id, supplierSignals);
  }

  return linksBySupplier;
}

export async function recomputeSupplierRiskScores(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<SupplierRiskScoreDTO[]> {
  const dedupedSupplierIds = [...new Set(supplierIds)];
  const suppliers = await loadSuppliersForScoring(supabase, organizationId, dedupedSupplierIds);

  if (suppliers.length === 0) {
    return [];
  }

  const scopedSupplierIds = suppliers.map((supplier) => supplier.id);
  const [previousScores, supplierSignals] = await Promise.all([
    loadPreviousScores(supabase, organizationId, scopedSupplierIds),
    loadSupplierSignals(supabase, organizationId, scopedSupplierIds),
  ]);

  const results: SupplierRiskScoreDTO[] = [];

  for (const supplier of suppliers) {
    const supplierSignalRows = supplierSignals.get(supplier.id) ?? [];
    const riskSignals = supplierSignalRows.map((item) => item.signal);
    const previousScore = previousScores.get(supplier.id) ?? null;

    const computed = computeSupplierRiskScore({
      criticality: toNumber(supplier.criticality, 0),
      previousScore,
      signals: riskSignals,
    });

    const nowIso = new Date().toISOString();

    const explanation = createExplanationPayload({
      aggregates: computed.aggregates,
      computationTime: nowIso,
      delta: computed.delta,
      eventCount: computed.eventCount,
      previousScore,
      score: computed.score,
      signalRiskEventIds: [...new Set(supplierSignalRows.map((row) => row.riskEventId))],
      supplierCriticality: toNumber(supplier.criticality, 0),
      trendReason: computed.trendReason,
    });

    const { data: upserted, error: upsertError } = await supabase
      .from("supplier_risk_scores")
      .upsert(
        {
          explanation,
          organization_id: organizationId,
          score: computed.score,
          scored_at: nowIso,
          supplier_id: supplier.id,
          trend: computed.trend,
        },
        { onConflict: "supplier_id" },
      )
      .select("id, supplier_id, score, trend, explanation, scored_at")
      .single();

    if (upsertError || !upserted) {
      throw new RiskScoringServiceError(
        "RISK_SCORE_UPSERT_FAILED",
        upsertError?.message || "Failed to persist supplier risk score.",
        500,
      );
    }

    results.push(toRiskScoreDto(upserted as SupplierRiskScoreRow, organizationId));
  }

  return results;
}

export async function listSupplierRiskScores(
  supabase: SupabaseClient,
  organizationId: string,
  supplierIds: string[],
): Promise<SupplierRiskScoreDTO[]> {
  let query = supabase
    .from("supplier_risk_scores")
    .select("id, supplier_id, score, trend, explanation, scored_at")
    .eq("organization_id", organizationId)
    .order("scored_at", { ascending: false });

  if (supplierIds.length > 0) {
    query = query.in("supplier_id", [...new Set(supplierIds)]);
  }

  const { data, error } = await query;

  if (error) {
    throw new RiskScoringServiceError(
      "RISK_SCORE_LIST_FAILED",
      error.message || "Could not list supplier risk scores.",
      500,
    );
  }

  return ((data ?? []) as SupplierRiskScoreRow[]).map((row) => toRiskScoreDto(row, organizationId));
}

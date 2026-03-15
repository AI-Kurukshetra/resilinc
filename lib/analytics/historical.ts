import type { SupabaseClient } from "@supabase/supabase-js";

type Granularity = "day" | "week" | "month";

interface RiskEventTimeSeriesQuery {
  organizationId: string;
  startDate: string;
  endDate: string;
  granularity: Granularity;
  supplierId?: string;
}

interface TimeSeriesBucket {
  period: string;
  total: number;
  bySeverity: Record<number, number>;
}

interface ScoreTrendPoint {
  supplierId: string;
  supplierName: string;
  score: number;
  trend: string;
  scoredAt: string;
}

interface RiskEventTimeSeriesResult {
  buckets: TimeSeriesBucket[];
  totalEvents: number;
}

interface ScoreTrendHistoryResult {
  points: ScoreTrendPoint[];
}

function toDateTrunc(granularity: Granularity): string {
  switch (granularity) {
    case "day":
      return "day";
    case "week":
      return "week";
    case "month":
      return "month";
  }
}

function formatPeriod(date: Date, granularity: Granularity): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  switch (granularity) {
    case "day":
      return `${year}-${month}-${day}`;
    case "week":
      return `${year}-W${getISOWeek(date)}`;
    case "month":
      return `${year}-${month}`;
  }
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return String(weekNo).padStart(2, "0");
}

export async function getRiskEventTimeSeries(
  supabase: SupabaseClient,
  query: RiskEventTimeSeriesQuery,
): Promise<RiskEventTimeSeriesResult> {
  let dbQuery = supabase
    .from("risk_events")
    .select("id, severity, observed_at")
    .eq("organization_id", query.organizationId)
    .gte("observed_at", query.startDate)
    .lte("observed_at", query.endDate)
    .order("observed_at", { ascending: true });

  if (query.supplierId) {
    const { data: linkRows } = await supabase
      .from("risk_event_suppliers")
      .select("risk_event_id")
      .eq("organization_id", query.organizationId)
      .eq("supplier_id", query.supplierId);

    const eventIds = (linkRows ?? []).map((row: { risk_event_id: string }) => row.risk_event_id);
    if (eventIds.length === 0) {
      return { buckets: [], totalEvents: 0 };
    }
    dbQuery = dbQuery.in("id", eventIds);
  }

  const { data: events, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to query risk events: ${error.message}`);
  }

  const rows = (events ?? []) as Array<{ id: string; severity: number; observed_at: string }>;
  const _granularity = toDateTrunc(query.granularity);

  const bucketMap = new Map<string, TimeSeriesBucket>();

  for (const row of rows) {
    const date = new Date(row.observed_at);
    const period = formatPeriod(date, query.granularity);

    let bucket = bucketMap.get(period);
    if (!bucket) {
      bucket = { period, total: 0, bySeverity: {} };
      bucketMap.set(period, bucket);
    }

    bucket.total += 1;
    bucket.bySeverity[row.severity] = (bucket.bySeverity[row.severity] ?? 0) + 1;
  }

  void _granularity;

  const buckets = Array.from(bucketMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return { buckets, totalEvents: rows.length };
}

export async function getScoreTrendHistory(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ScoreTrendHistoryResult> {
  const { data: scores, error: scoresError } = await supabase
    .from("supplier_risk_scores")
    .select("supplier_id, score, trend, scored_at")
    .eq("organization_id", organizationId)
    .order("score", { ascending: false });

  if (scoresError) {
    throw new Error(`Failed to query risk scores: ${scoresError.message}`);
  }

  const scoreRows = (scores ?? []) as Array<{
    supplier_id: string;
    score: number | string;
    trend: string;
    scored_at: string;
  }>;

  const supplierIds = [...new Set(scoreRows.map((row) => row.supplier_id))];
  let supplierNameById = new Map<string, string>();

  if (supplierIds.length > 0) {
    const { data: supplierRows } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", supplierIds);

    supplierNameById = new Map(
      ((supplierRows ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]),
    );
  }

  const points: ScoreTrendPoint[] = scoreRows.map((row) => ({
    supplierId: row.supplier_id,
    supplierName: supplierNameById.get(row.supplier_id) ?? "Unknown",
    score: typeof row.score === "number" ? row.score : Number(row.score),
    trend: row.trend,
    scoredAt: row.scored_at,
  }));

  return { points };
}

export type { RiskEventTimeSeriesQuery, RiskEventTimeSeriesResult, ScoreTrendHistoryResult, TimeSeriesBucket, ScoreTrendPoint };

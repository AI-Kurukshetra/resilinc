// M3.S2 — MCP Enrichment Adapters: web search and weather
// Adapters use real APIs when keys are present; fall back to deterministic stubs for demo.

export const LOW_CONFIDENCE_THRESHOLD = 0.5;

// ---- Types ----

export interface EnrichmentSource {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  relevanceScore: number; // 0–1
}

export interface WeatherRiskFactor {
  condition: string;
  severity: number; // 1–5
  regionCode: string;
  reportedAt: string;
}

export interface EnrichmentResult {
  adapter: "web_search" | "weather";
  sources: EnrichmentSource[];
  weatherRisk?: WeatherRiskFactor;
  enrichedAt: string;
}

// ---- M3.S2.a — Web Search Adapter ----

export class WebSearchAdapter {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY;
  }

  async enrich(
    eventType: string,
    regionCode: string | null,
    summary: string,
  ): Promise<EnrichmentResult> {
    const query = [eventType, "disruption", regionCode, summary.slice(0, 80)]
      .filter(Boolean)
      .join(" ")
      .trim();

    const sources = this.apiKey
      ? await this.fetchBraveSearch(query)
      : this.stubSearch(eventType, regionCode);

    return { adapter: "web_search", sources, enrichedAt: new Date().toISOString() };
  }

  private async fetchBraveSearch(query: string): Promise<EnrichmentSource[]> {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&safesearch=moderate`;
      const resp = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey!,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return this.stubSearch(query, null);
      const data = (await resp.json()) as {
        web?: {
          results?: Array<{
            title: string;
            url: string;
            description: string;
            page_age?: string;
          }>;
        };
      };
      return (data.web?.results ?? []).slice(0, 5).map((r, i) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        publishedAt: r.page_age,
        relevanceScore: Math.max(0.3, 1 - i * 0.15),
      }));
    } catch {
      return this.stubSearch(query, null);
    }
  }

  private stubSearch(eventType: string, regionCode: string | null): EnrichmentSource[] {
    const type = eventType.toLowerCase();
    const sources: EnrichmentSource[] = [];

    if (["earthquake", "seismic"].some((t) => type.includes(t))) {
      sources.push({
        title: "USGS Earthquake Hazards Program",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage",
        snippet: `Seismic activity recorded${regionCode ? ` near ${regionCode}` : ""}; monitoring stations confirm disruption potential.`,
        relevanceScore: 0.9,
      });
    }
    if (["flood", "typhoon", "hurricane", "storm"].some((t) => type.includes(t))) {
      sources.push({
        title: "NOAA National Weather Service Alert",
        url: "https://www.weather.gov/alerts",
        snippet: `Severe weather advisory issued for affected${regionCode ? ` ${regionCode}` : ""} manufacturing region.`,
        relevanceScore: 0.85,
      });
    }
    if (["port", "logistics", "shipping", "logistics_delay"].some((t) => type.includes(t))) {
      sources.push({
        title: "Lloyd's List Port Disruption Report",
        url: "https://lloydslist.maritimeintelligence.informa.com",
        snippet: "Port operations suspended due to reported disruption event.",
        relevanceScore: 0.8,
      });
    }
    if (["factory", "fire", "explosion", "factory_fire"].some((t) => type.includes(t))) {
      sources.push({
        title: "Industrial Risk Monitor",
        url: "https://www.riskmanagementmonitor.com",
        snippet: `Manufacturing facility incident reported${regionCode ? ` in ${regionCode}` : ""}; production halted pending assessment.`,
        relevanceScore: 0.82,
      });
    }
    if (["geopolit", "sanction", "trade", "tariff"].some((t) => type.includes(t))) {
      sources.push({
        title: "Reuters Trade & Geopolitics",
        url: "https://www.reuters.com/business/",
        snippet: "Geopolitical developments affecting cross-border supply chain operations.",
        relevanceScore: 0.75,
      });
    }
    if (sources.length === 0) {
      sources.push({
        title: "Supply Chain 247 Disruption Monitor",
        url: "https://www.supplychain247.com",
        snippet: `Industry monitoring services tracking reported ${eventType} disruption${regionCode ? ` in ${regionCode}` : ""}.`,
        relevanceScore: 0.6,
      });
    }
    return sources;
  }
}

// ---- M3.S2.b — Weather Risk Adapter ----

// Regions with elevated natural disaster risk
const HIGH_RISK_REGIONS = new Set(["TW", "JP", "PH", "BD", "PK", "MX", "TR", "IR", "CN", "ID"]);
const MED_RISK_REGIONS = new Set(["DE", "US", "MY", "KR", "IN", "BR", "AU", "TH", "VN"]);

export class WeatherRiskAdapter {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
  }

  async getRiskForRegion(
    regionCode: string | null,
    observedAt: string,
  ): Promise<EnrichmentResult> {
    if (!regionCode) {
      return { adapter: "weather", sources: [], enrichedAt: new Date().toISOString() };
    }
    return this.apiKey
      ? this.fetchWeatherRisk(regionCode, observedAt)
      : this.stubWeatherRisk(regionCode, observedAt);
  }

  private async fetchWeatherRisk(regionCode: string, observedAt: string): Promise<EnrichmentResult> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(regionCode)}&appid=${this.apiKey}&units=metric`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return this.stubWeatherRisk(regionCode, observedAt);

      const data = (await resp.json()) as {
        weather?: Array<{ main: string; description: string }>;
        name?: string;
        wind?: { speed: number };
      };
      const weather = data.weather?.[0];
      const windSpeed = data.wind?.speed ?? 0;
      const condition = weather?.main ?? "Clear";
      const isDisruptive = ["Thunderstorm", "Tornado", "Snow", "Extreme"].includes(condition);
      const severity = isDisruptive ? Math.min(5, Math.ceil(windSpeed / 10)) : 1;

      return {
        adapter: "weather",
        sources: [
          {
            title: `OpenWeatherMap: ${data.name ?? regionCode} Conditions`,
            url: "https://openweathermap.org/city",
            snippet: weather?.description ?? "Current weather conditions.",
            relevanceScore: 0.75,
          },
        ],
        weatherRisk: {
          condition,
          severity,
          regionCode,
          reportedAt: new Date().toISOString(),
        },
        enrichedAt: new Date().toISOString(),
      };
    } catch {
      return this.stubWeatherRisk(regionCode, observedAt);
    }
  }

  private stubWeatherRisk(regionCode: string, observedAt: string): EnrichmentResult {
    const region = regionCode.toUpperCase();
    let severity = 1;
    let condition = "Clear";

    if (HIGH_RISK_REGIONS.has(region)) {
      severity = 3;
      condition = "Elevated seismic/weather risk zone";
    } else if (MED_RISK_REGIONS.has(region)) {
      severity = 2;
      condition = "Moderate weather risk";
    }

    // Boost if the event is recent (within 72 hours)
    const ageHours = (Date.now() - new Date(observedAt).getTime()) / 3_600_000;
    if (ageHours < 72) severity = Math.min(5, severity + 1);

    const sources: EnrichmentSource[] =
      severity >= 2
        ? [
            {
              title: `Regional Disaster Risk Assessment: ${regionCode}`,
              url: "https://www.undrr.org/disaster-risk",
              snippet: `${condition} assessed for ${regionCode} manufacturing region.`,
              relevanceScore: 0.7,
            },
          ]
        : [];

    return {
      adapter: "weather",
      sources,
      weatherRisk: { condition, severity, regionCode, reportedAt: new Date().toISOString() },
      enrichedAt: new Date().toISOString(),
    };
  }
}

// ---- M3.S2.c — Confidence Rubric ----

/**
 * Computes enriched confidence from base confidence + enrichment signal quality.
 *
 * Weights:
 *   40% — base (manual) confidence from ingestion input
 *   30% — source count factor: saturates at 3+ independent sources
 *   30% — freshness factor: linear decay over 72 hours
 */
export function computeEnrichedConfidence(
  baseConfidence: number,
  results: EnrichmentResult[],
  observedAt: string,
): number {
  const sourceCount = results.reduce((n, r) => n + r.sources.length, 0);
  const sourceCountFactor = Math.min(sourceCount / 3, 1.0);
  const hoursOld = (Date.now() - new Date(observedAt).getTime()) / 3_600_000;
  const freshnessFactor = Math.max(0, 1 - hoursOld / 72);

  const raw = 0.4 * baseConfidence + 0.3 * sourceCountFactor + 0.3 * freshnessFactor;
  return Math.round(Math.min(1, Math.max(0, raw)) * 100) / 100;
}

// ---- Payload builders (M3.S2.c + M3.S3.b) ----

export function buildProvenance(
  ingestedAt: string,
  sourceUrl?: string | null,
  sourceName?: string | null,
): Record<string, unknown> {
  return {
    _provenance: {
      ingestedAt,
      adapter: "manual" as const,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(sourceName ? { sourceName } : {}),
    },
  };
}

export function buildEnrichmentPayload(
  results: EnrichmentResult[],
  enrichedConfidence: number,
): Record<string, unknown> {
  return {
    _enrichment: {
      enrichedAt: new Date().toISOString(),
      enrichedConfidence,
      adapters: results.map((r) => r.adapter),
      sourceCount: results.reduce((n, r) => n + r.sources.length, 0),
      results: results.map((r) => ({
        adapter: r.adapter,
        sources: r.sources,
        ...(r.weatherRisk ? { weatherRisk: r.weatherRisk } : {}),
        enrichedAt: r.enrichedAt,
      })),
    },
  };
}

export function buildLowConfidenceFlag(confidence: number): Record<string, unknown> {
  return {
    _review: {
      required: true as const,
      reason: "low_confidence" as const,
      threshold: LOW_CONFIDENCE_THRESHOLD,
      confidence,
    },
  };
}

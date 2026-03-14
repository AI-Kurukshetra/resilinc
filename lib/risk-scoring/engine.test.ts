import { describe, expect, it } from "vitest";
import {
  computeRecencyWeight,
  computeSupplierRiskScore,
  deriveTrend,
} from "@/lib/risk-scoring/engine";

describe("risk scoring engine", () => {
  it("computes score with configured weighted formula", () => {
    const now = new Date().toISOString();

    const result = computeSupplierRiskScore({
      criticality: 5,
      previousScore: null,
      signals: [
        {
          confidence: 1,
          impactLevel: 5,
          observedAt: now,
          severity: 5,
        },
      ],
    });

    expect(result.score).toBe(100);
    expect(result.trend).toBe("flat");
    expect(result.delta).toBe(0);
    expect(result.eventCount).toBe(1);
    expect(result.aggregates.severity).toBe(1);
    expect(result.aggregates.confidence).toBe(1);
    expect(result.aggregates.impact).toBe(1);
  });

  it("applies trend boundaries for up/down/flat", () => {
    expect(deriveTrend(60, 63).trend).toBe("up");
    expect(deriveTrend(60, 57).trend).toBe("down");
    expect(deriveTrend(60, 62.99).trend).toBe("flat");
  });

  it("weights newer events more than stale events", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const stale = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

    const scoreMostlyRecentHigh = computeSupplierRiskScore({
      criticality: 3,
      previousScore: 50,
      signals: [
        { confidence: 1, impactLevel: 5, observedAt: recent, severity: 5 },
        { confidence: 0.2, impactLevel: 1, observedAt: stale, severity: 1 },
      ],
    }).score;

    const scoreMostlyStaleHigh = computeSupplierRiskScore({
      criticality: 3,
      previousScore: 50,
      signals: [
        { confidence: 0.2, impactLevel: 1, observedAt: recent, severity: 1 },
        { confidence: 1, impactLevel: 5, observedAt: stale, severity: 5 },
      ],
    }).score;

    expect(scoreMostlyRecentHigh).toBeGreaterThan(scoreMostlyStaleHigh);
    expect(computeRecencyWeight(1)).toBeGreaterThan(computeRecencyWeight(20));
  });
});

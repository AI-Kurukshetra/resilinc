import { describe, expect, it } from "vitest";
import { RiskEventCreateSchema, RiskEventListQuerySchema } from "@/lib/validations/risk-events";

describe("risk event validation", () => {
  it("accepts a valid ingestion payload and applies defaults", () => {
    const parsed = RiskEventCreateSchema.parse({
      eventType: "natural_disaster",
      observedAt: new Date().toISOString(),
      severity: 5,
      summary: "Flooding near a critical logistics hub",
    });

    expect(parsed.confidence).toBe(1);
    expect(parsed.impactLevel).toBe(3);
    expect(parsed.autoEnrich).toBe(false);
    expect(parsed.affectedSupplierIds).toEqual([]);
  });

  it("rejects future observedAt timestamps", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = RiskEventCreateSchema.safeParse({
      eventType: "geopolitical",
      observedAt: future,
      severity: 4,
      summary: "Future event should not validate",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes confidence precision to 2 decimals", () => {
    const parsed = RiskEventCreateSchema.parse({
      confidence: 0.876,
      eventType: "regulatory",
      observedAt: new Date().toISOString(),
      severity: 3,
      summary: "Precision rounding check",
    });

    expect(parsed.confidence).toBe(0.88);
  });

  it("parses list query filters with pagination defaults", () => {
    const parsed = RiskEventListQuerySchema.parse({
      eventType: "natural_disaster",
      minSeverity: "4",
      regionCode: "us-ca",
    });

    expect(parsed.limit).toBe(25);
    expect(parsed.offset).toBe(0);
    expect(parsed.minSeverity).toBe(4);
    expect(parsed.regionCode).toBe("US-CA");
  });
});

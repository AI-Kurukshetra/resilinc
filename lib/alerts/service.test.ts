import { describe, expect, it } from "vitest";
import { scoreToAlertSeverity } from "@/lib/alerts/service";

describe("alert severity thresholding", () => {
  it("maps score bands to alert severities", () => {
    expect(scoreToAlertSeverity(49.99)).toBe(0);
    expect(scoreToAlertSeverity(50)).toBe(3);
    expect(scoreToAlertSeverity(64.99)).toBe(3);
    expect(scoreToAlertSeverity(65)).toBe(4);
    expect(scoreToAlertSeverity(79.99)).toBe(4);
    expect(scoreToAlertSeverity(80)).toBe(5);
  });
});

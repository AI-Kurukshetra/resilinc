import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export const RiskScoreRecomputeSchema = z.object({
  riskEventId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  supplierIds: z.array(UUIDSchema).max(500, "Cannot recompute more than 500 suppliers per request").default([]),
});

export type RiskScoreRecomputeInput = z.infer<typeof RiskScoreRecomputeSchema>;

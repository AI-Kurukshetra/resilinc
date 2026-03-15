import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export const CreditRatingSchema = z.enum([
  "AAA", "AA", "A", "BBB", "BB", "B", "CCC", "CC", "C", "D", "NR",
]);

export const RevenueTrendSchema = z.enum(["growing", "stable", "declining", "unknown"]);

export const FinancialRiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const FinancialHealthUpsertSchema = z.object({
  creditRating: z.preprocess(emptyStringToUndefined, CreditRatingSchema.optional()),
  altmanZScore: z.preprocess(emptyStringToUndefined, z.coerce.number().min(0).max(999).optional()),
  revenueTrend: z.preprocess(emptyStringToUndefined, RevenueTrendSchema.optional()),
  debtToEquity: z.preprocess(emptyStringToUndefined, z.coerce.number().min(0).max(999).optional()),
  daysPayableOutstanding: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(0).max(9999).optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(4000).optional()),
});

export const FinancialHealthListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SupplierIdParamSchema = z.object({ supplierId: UUIDSchema });

export type FinancialHealthUpsertInput = z.infer<typeof FinancialHealthUpsertSchema>;
export type FinancialHealthListQuery = z.infer<typeof FinancialHealthListQuerySchema>;
export type CreditRating = z.infer<typeof CreditRatingSchema>;
export type RevenueTrend = z.infer<typeof RevenueTrendSchema>;
export type FinancialRiskLevel = z.infer<typeof FinancialRiskLevelSchema>;

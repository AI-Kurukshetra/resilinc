import { z } from "zod";

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export const GeoRiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const GeoRiskProfileUpsertSchema = z.object({
  regionCode: z.string().trim().min(1, "Region code is required").max(10),
  riskLevel: GeoRiskLevelSchema.default("medium"),
  stabilityIndex: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(100, "Must be at most 100")
    .transform((v) => Math.round(v * 100) / 100)
    .optional(),
  sanctionsActive: z.coerce.boolean().default(false),
  tradeRestrictionNotes: z.preprocess(emptyStringToUndefined, z.string().trim().max(4000).optional()),
});

export const GeoRiskProfileListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const RegionCodeParamSchema = z.object({
  regionCode: z.string().trim().min(1).max(10),
});

export type GeoRiskProfileUpsertInput = z.infer<typeof GeoRiskProfileUpsertSchema>;
export type GeoRiskProfileListQuery = z.infer<typeof GeoRiskProfileListQuerySchema>;
export type GeoRiskLevel = z.infer<typeof GeoRiskLevelSchema>;

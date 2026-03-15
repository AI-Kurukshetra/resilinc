import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

const ScoreField = z.coerce
  .number()
  .min(0, "Score must be at least 0")
  .max(100, "Score must be at most 100")
  .transform((v) => Math.round(v * 100) / 100);

export const EsgScoreUpsertSchema = z.object({
  environmentalScore: ScoreField,
  socialScore: ScoreField,
  governanceScore: ScoreField,
  notes: z.string().trim().max(4000).optional(),
});

export const EsgScoreListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SupplierIdParamSchema = z.object({ supplierId: UUIDSchema });

export type EsgScoreUpsertInput = z.infer<typeof EsgScoreUpsertSchema>;
export type EsgScoreListQuery = z.infer<typeof EsgScoreListQuerySchema>;

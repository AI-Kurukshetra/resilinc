import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

export const InventoryLevelUpsertSchema = z.object({
  partId: UUIDSchema,
  currentStock: z.coerce.number().int().min(0).default(0),
  safetyStock: z.coerce.number().int().min(0).default(0),
  reorderPoint: z.coerce.number().int().min(0).default(0),
  maxStock: z.coerce.number().int().min(0).optional(),
  avgDailyConsumption: z.coerce.number().min(0).default(0).transform((v) => Math.round(v * 100) / 100),
});

export const InventoryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  riskFlag: z.enum(["adequate", "low", "critical", "stockout"]).optional(),
});

export const PartIdParamSchema = z.object({ partId: UUIDSchema });

export type InventoryLevelUpsertInput = z.infer<typeof InventoryLevelUpsertSchema>;
export type InventoryListQuery = z.infer<typeof InventoryListQuerySchema>;

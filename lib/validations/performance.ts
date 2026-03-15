import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

const RateField = z.coerce
  .number()
  .min(0, "Rate must be at least 0")
  .max(100, "Rate must be at most 100")
  .transform((v) => Math.round(v * 100) / 100);

export const PerformanceRecordCreateSchema = z.object({
  supplierId: UUIDSchema,
  periodStart: z.string().date("Must be a valid date (YYYY-MM-DD)"),
  periodEnd: z.string().date("Must be a valid date (YYYY-MM-DD)"),
  onTimeDeliveryRate: RateField,
  qualityRejectionRate: RateField,
  leadTimeVarianceDays: z.coerce.number().int(),
  responsivenessScore: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().max(4000).optional(),
});

export const PerformanceListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  supplierId: UUIDSchema.optional(),
});

export const SupplierIdParamSchema = z.object({ supplierId: UUIDSchema });

export type PerformanceRecordCreateInput = z.infer<typeof PerformanceRecordCreateSchema>;
export type PerformanceListQuery = z.infer<typeof PerformanceListQuerySchema>;

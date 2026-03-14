import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

const AlertStatusSchema = z.enum(["open", "acknowledged", "resolved"]);

export const AlertIdParamSchema = z.object({
  alertId: UUIDSchema,
});

export const AlertListQuerySchema = PaginationSchema.extend({
  minSeverity: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(5).optional()),
  ownerId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  status: z.preprocess(emptyStringToUndefined, AlertStatusSchema.optional()),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const AlertGenerateSchema = z.object({
  riskEventId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  supplierIds: z.array(UUIDSchema).max(200, "Cannot evaluate more than 200 suppliers at once").default([]),
});

export const AlertAssignSchema = z.object({
  ownerId: UUIDSchema,
});

export const AlertAcknowledgeSchema = z.object({
  note: z
    .preprocess(emptyStringToUndefined, z.string().trim().max(1000, "Note too long").optional())
    .optional(),
});

export const AlertResolveSchema = z.object({
  resolutionNote: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(2000, "Resolution note too long").optional(),
  ),
});

export type AlertIdParam = z.infer<typeof AlertIdParamSchema>;
export type AlertListQuery = z.infer<typeof AlertListQuerySchema>;
export type AlertGenerateInput = z.infer<typeof AlertGenerateSchema>;
export type AlertAssignInput = z.infer<typeof AlertAssignSchema>;
export type AlertAcknowledgeInput = z.infer<typeof AlertAcknowledgeSchema>;
export type AlertResolveInput = z.infer<typeof AlertResolveSchema>;
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

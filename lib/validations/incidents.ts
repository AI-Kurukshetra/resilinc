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

const IncidentStatusSchema = z.enum(["open", "in_progress", "closed"]);
const IncidentActionStatusSchema = z.enum(["todo", "doing", "done", "blocked"]);

export const IncidentIdParamSchema = z.object({
  incidentId: UUIDSchema,
});

export const IncidentActionPathSchema = z.object({
  incidentId: UUIDSchema,
  actionId: UUIDSchema,
});

export const IncidentListQuerySchema = PaginationSchema.extend({
  alertId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  ownerId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  status: z.preprocess(emptyStringToUndefined, IncidentStatusSchema.optional()),
});

export const IncidentFromAlertSchema = z.object({
  alertId: UUIDSchema,
  allowLowSeverity: z.boolean().default(false),
});

export const IncidentActionStatusUpdateSchema = z.object({
  status: IncidentActionStatusSchema,
});

export const IncidentCloseSchema = z.object({}).passthrough();

export type IncidentIdParam = z.infer<typeof IncidentIdParamSchema>;
export type IncidentActionPathParam = z.infer<typeof IncidentActionPathSchema>;
export type IncidentListQuery = z.infer<typeof IncidentListQuerySchema>;
export type IncidentFromAlertInput = z.infer<typeof IncidentFromAlertSchema>;
export type IncidentActionStatusUpdateInput = z.infer<typeof IncidentActionStatusUpdateSchema>;
export type IncidentCloseInput = z.infer<typeof IncidentCloseSchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type IncidentActionStatus = z.infer<typeof IncidentActionStatusSchema>;

import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const MitigationStrategySchema = z.enum(["avoid", "mitigate", "transfer", "accept"]);
export const MitigationPlanStatusSchema = z.enum(["draft", "active", "completed", "archived"]);
export const MitigationActionStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);

export const MitigationPlanCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(4000).default(""),
  strategy: MitigationStrategySchema,
  priority: z.coerce.number().int().min(1).max(5).default(3),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  alertId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  targetDate: z.preprocess(emptyStringToUndefined, z.string().datetime({ offset: true }).optional()),
  ownerId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const MitigationPlanUpdateSchema = MitigationPlanCreateSchema.partial()
  .extend({
    status: MitigationPlanStatusSchema.optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "At least one field must be provided." },
  );

export const MitigationPlanListQuerySchema = PaginationSchema.extend({
  status: z.preprocess(emptyStringToUndefined, MitigationPlanStatusSchema.optional()),
  priority: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(5).optional()),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const MitigationActionCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  dueDate: z.preprocess(emptyStringToUndefined, z.string().datetime({ offset: true }).optional()),
  ownerId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(2000).optional()),
});

export const MitigationActionStatusUpdateSchema = z.object({
  status: MitigationActionStatusSchema,
});

export const PlanIdParamSchema = z.object({ planId: UUIDSchema });
export const ActionIdParamSchema = z.object({ planId: UUIDSchema, actionId: UUIDSchema });

export type MitigationPlanCreateInput = z.infer<typeof MitigationPlanCreateSchema>;
export type MitigationPlanUpdateInput = z.infer<typeof MitigationPlanUpdateSchema>;
export type MitigationPlanListQuery = z.infer<typeof MitigationPlanListQuerySchema>;
export type MitigationActionCreateInput = z.infer<typeof MitigationActionCreateSchema>;
export type MitigationActionStatusUpdateInput = z.infer<typeof MitigationActionStatusUpdateSchema>;
export type MitigationStrategy = z.infer<typeof MitigationStrategySchema>;
export type MitigationPlanStatus = z.infer<typeof MitigationPlanStatusSchema>;
export type MitigationActionStatus = z.infer<typeof MitigationActionStatusSchema>;

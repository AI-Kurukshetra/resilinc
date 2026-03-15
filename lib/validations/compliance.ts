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

export const ComplianceCategorySchema = z.enum(["regulatory", "industry", "internal", "esg"]);
export const ComplianceItemStatusSchema = z.enum([
  "not_assessed",
  "compliant",
  "non_compliant",
  "partially_compliant",
  "exempted",
]);

export const FrameworkCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().max(4000).default(""),
  category: ComplianceCategorySchema,
});

export const FrameworkListQuerySchema = PaginationSchema.extend({
  category: z.preprocess(emptyStringToUndefined, ComplianceCategorySchema.optional()),
});

export const ComplianceItemCreateSchema = z.object({
  requirement: z.string().trim().min(1, "Requirement is required").max(2000),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const ComplianceItemStatusUpdateSchema = z.object({
  status: ComplianceItemStatusSchema,
  evidenceNotes: z.preprocess(emptyStringToUndefined, z.string().trim().max(4000).optional()),
  nextReviewDate: z.preprocess(
    emptyStringToUndefined,
    z.string().datetime({ offset: true }).optional(),
  ),
});

export const ComplianceItemListQuerySchema = PaginationSchema.extend({
  status: z.preprocess(emptyStringToUndefined, ComplianceItemStatusSchema.optional()),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const FrameworkIdParamSchema = z.object({ frameworkId: UUIDSchema });
export const ItemIdParamSchema = z.object({ frameworkId: UUIDSchema, itemId: UUIDSchema });

export type FrameworkCreateInput = z.infer<typeof FrameworkCreateSchema>;
export type FrameworkListQuery = z.infer<typeof FrameworkListQuerySchema>;
export type ComplianceItemCreateInput = z.infer<typeof ComplianceItemCreateSchema>;
export type ComplianceItemStatusUpdateInput = z.infer<typeof ComplianceItemStatusUpdateSchema>;
export type ComplianceItemListQuery = z.infer<typeof ComplianceItemListQuerySchema>;
export type ComplianceCategory = z.infer<typeof ComplianceCategorySchema>;
export type ComplianceItemStatus = z.infer<typeof ComplianceItemStatusSchema>;

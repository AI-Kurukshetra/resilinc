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

const SeveritySchema = z
  .number()
  .int("Severity must be an integer")
  .min(1, "Severity must be at least 1")
  .max(5, "Severity must be at most 5");

const ConfidenceSchema = z
  .number()
  .min(0, "Confidence must be >= 0")
  .max(1, "Confidence must be <= 1")
  .transform((val) => Math.round(val * 100) / 100);

const EventTypeSchema = z
  .string()
  .trim()
  .min(1, "Event type is required")
  .max(80, "Event type must be 80 characters or less");

const ObservedAtSchema = z
  .string()
  .trim()
  .min(1, "observedAt is required")
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "observedAt must be a valid ISO datetime",
  })
  .refine((val) => new Date(val).getTime() <= Date.now(), {
    message: "observedAt cannot be in the future",
  });

const OptionalRegionCodeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,12}$/, "Region code must be 2-12 chars (A-Z, 0-9, -)")
    .optional(),
);

const OptionalSourceUrlSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().url("sourceUrl must be a valid URL").max(2048, "sourceUrl is too long").optional(),
);

const OptionalSourceNameSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().max(120, "sourceName is too long").optional(),
);

export const RiskEventCreateSchema = z.object({
  eventType: EventTypeSchema,
  severity: SeveritySchema,
  confidence: ConfidenceSchema.default(1.0),
  regionCode: OptionalRegionCodeSchema,
  sourceUrl: OptionalSourceUrlSchema,
  sourceName: OptionalSourceNameSchema,
  observedAt: ObservedAtSchema,
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(2000, "Summary must be 2000 characters or less"),
  payload: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.record(z.string(), z.unknown()).optional(),
  ),
  affectedSupplierIds: z.array(UUIDSchema).max(50, "Cannot affect more than 50 suppliers per event").default([]),
  impactLevel: z
    .number()
    .int("Impact level must be an integer")
    .min(1, "Impact level must be at least 1")
    .max(5, "Impact level must be at most 5")
    .default(3),
  // M3.S2 — trigger web search + weather enrichment adapters at ingest time
  autoEnrich: z.boolean().default(false),
});

export const RiskEventListQuerySchema = PaginationSchema.extend({
  regionCode: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().toUpperCase().optional(),
  ),
  eventType: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().optional(),
  ),
  minSeverity: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const RiskEventIdParamSchema = z.object({
  eventId: z.string().uuid("Invalid risk event id"),
});

export type RiskEventCreateInput = z.infer<typeof RiskEventCreateSchema>;
export type RiskEventListQuery = z.infer<typeof RiskEventListQuerySchema>;
export type RiskEventIdParam = z.infer<typeof RiskEventIdParamSchema>;

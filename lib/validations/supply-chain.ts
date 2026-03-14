import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const NameSchema = z.string().trim().min(1, "Name is required").max(120, "Name is too long");

const OptionalRegionCodeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,12}$/, "Region code must be 2-12 chars (A-Z, 0-9, -)")
    .optional(),
);

const OptionalCountryCodeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Country code must be ISO-2 format")
    .optional(),
);

const OptionalDescriptionSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().max(500, "Description is too long").optional(),
);

const CriticalitySchema = z.number().int().min(1).max(5);

const OptionalLatitudeSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().min(-90).max(90).optional(),
);

const OptionalLongitudeSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().min(-180).max(180).optional(),
);

const TierLevelSchema = z.number().int().min(1).max(5);

const SearchSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().max(120, "Search query is too long").optional(),
);

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

const SupplierBaseFields = {
  criticality: CriticalitySchema,
  isActive: z.boolean(),
  name: NameSchema,
  regionCode: OptionalRegionCodeSchema,
};

export const SupplierCreateSchema = z.object({
  ...SupplierBaseFields,
  criticality: CriticalitySchema.default(3),
  isActive: z.boolean().default(true),
});

export const SupplierUpdateSchema = z
  .object({
    ...SupplierBaseFields,
  })
  .partial()
  .refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one supplier field is required",
  });

export const SupplierListQuerySchema = PaginationSchema.extend({
  search: SearchSchema,
});

const FacilityBaseFields = {
  countryCode: OptionalCountryCodeSchema,
  latitude: OptionalLatitudeSchema,
  longitude: OptionalLongitudeSchema,
  name: NameSchema,
  supplierId: UUIDSchema,
};

export const FacilityCreateSchema = z.object(FacilityBaseFields);

export const FacilityUpdateSchema = z
  .object(FacilityBaseFields)
  .partial()
  .refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one facility field is required",
  });

export const FacilityListQuerySchema = PaginationSchema.extend({
  search: SearchSchema,
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

const PartBaseFields = {
  criticality: CriticalitySchema,
  description: OptionalDescriptionSchema,
  partNumber: z
    .string()
    .trim()
    .min(1, "Part number is required")
    .max(64, "Part number is too long")
    .toUpperCase(),
};

export const PartCreateSchema = z.object({
  ...PartBaseFields,
  criticality: CriticalitySchema.default(3),
});

export const PartUpdateSchema = z
  .object(PartBaseFields)
  .partial()
  .refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one part field is required",
  });

export const PartListQuerySchema = PaginationSchema.extend({
  search: SearchSchema,
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const UuidPathParamSchema = z.object({
  id: UUIDSchema,
});

export const SupplierPartLinkUpsertSchema = z.object({
  partId: UUIDSchema,
  supplierId: UUIDSchema,
  tierLevel: TierLevelSchema.default(1),
});

export const SupplierPartLinkDeleteSchema = z.object({
  partId: UUIDSchema,
  supplierId: UUIDSchema,
});

export const SupplierPartLinkListQuerySchema = PaginationSchema.extend({
  partId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
  supplierId: z.preprocess(emptyStringToUndefined, UUIDSchema.optional()),
});

export const SupplierExposureQuerySchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
});

export type SupplierCreateInput = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof SupplierUpdateSchema>;
export type SupplierListQuery = z.infer<typeof SupplierListQuerySchema>;
export type FacilityCreateInput = z.infer<typeof FacilityCreateSchema>;
export type FacilityUpdateInput = z.infer<typeof FacilityUpdateSchema>;
export type FacilityListQuery = z.infer<typeof FacilityListQuerySchema>;
export type PartCreateInput = z.infer<typeof PartCreateSchema>;
export type PartUpdateInput = z.infer<typeof PartUpdateSchema>;
export type PartListQuery = z.infer<typeof PartListQuerySchema>;
export type SupplierPartLinkUpsertInput = z.infer<typeof SupplierPartLinkUpsertSchema>;
export type SupplierPartLinkDeleteInput = z.infer<typeof SupplierPartLinkDeleteSchema>;
export type SupplierPartLinkListQuery = z.infer<typeof SupplierPartLinkListQuerySchema>;
export type SupplierExposureQuery = z.infer<typeof SupplierExposureQuerySchema>;

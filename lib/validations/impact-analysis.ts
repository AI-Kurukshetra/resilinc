import { z } from "zod";

export const PartFinancialProfileCreateSchema = z.object({
  partId: z.string().uuid("partId must be a valid UUID."),
  annualSpend: z.number().min(0, "annualSpend must be >= 0.").default(0),
  unitCost: z.number().min(0, "unitCost must be >= 0.").optional(),
  annualVolume: z.number().int().min(0, "annualVolume must be >= 0.").optional(),
  leadTimeDays: z.number().int().min(0, "leadTimeDays must be >= 0.").optional(),
  currency: z.string().min(1).max(10).default("USD"),
});

export const PartFinancialProfileUpdateSchema = z.object({
  annualSpend: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  annualVolume: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  currency: z.string().min(1).max(10).optional(),
});

export const ImpactQueryParamsSchema = z.object({
  supplierId: z.string().uuid("supplierId must be a valid UUID."),
});

export type PartFinancialProfileCreate = z.infer<typeof PartFinancialProfileCreateSchema>;
export type PartFinancialProfileUpdate = z.infer<typeof PartFinancialProfileUpdateSchema>;

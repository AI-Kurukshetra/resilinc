import { z } from "zod";

export const HistoricalQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "startDate must be ISO date format (YYYY-MM-DD).")
    .transform((val) => new Date(val).toISOString()),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "endDate must be ISO date format (YYYY-MM-DD).")
    .transform((val) => new Date(val).toISOString()),
  granularity: z.enum(["day", "week", "month"]).default("week"),
  supplierId: z.string().uuid("supplierId must be a valid UUID.").optional(),
});

export type HistoricalQuery = z.infer<typeof HistoricalQuerySchema>;

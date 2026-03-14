import { z } from "zod";

export const RiskEventSchema = z.object({
  eventType: z.string().min(1),
  severity: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
});

export type RiskEventInput = z.infer<typeof RiskEventSchema>;

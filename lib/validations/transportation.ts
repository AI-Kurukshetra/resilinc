import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

export const RouteCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  originFacilityId: UUIDSchema.nullable().optional(),
  destinationName: z.string().trim().min(1, "Destination is required").max(200),
  transportMode: z.enum(["ocean", "air", "rail", "road", "multimodal"]),
  estimatedTransitDays: z.coerce.number().int().min(0).default(0),
  activeDisruptions: z.string().max(2000).nullable().optional(),
});

export const RouteUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  originFacilityId: UUIDSchema.nullable().optional(),
  destinationName: z.string().trim().min(1).max(200).optional(),
  transportMode: z.enum(["ocean", "air", "rail", "road", "multimodal"]).optional(),
  estimatedTransitDays: z.coerce.number().int().min(0).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  activeDisruptions: z.string().max(2000).nullable().optional(),
});

export const RouteListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  transportMode: z.enum(["ocean", "air", "rail", "road", "multimodal"]).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const RouteIdParamSchema = z.object({ routeId: UUIDSchema });

export type RouteCreateInput = z.infer<typeof RouteCreateSchema>;
export type RouteUpdateInput = z.infer<typeof RouteUpdateSchema>;
export type RouteListQuery = z.infer<typeof RouteListQuerySchema>;

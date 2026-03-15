import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

export const IntegrationCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(["api_connector", "webhook", "data_feed", "manual"]),
  status: z.enum(["active", "inactive", "error"]).default("inactive"),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const IntegrationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.enum(["api_connector", "webhook", "data_feed", "manual"]).optional(),
  status: z.enum(["active", "inactive", "error"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().max(2000).nullable().optional(),
});

export const IntegrationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const IntegrationIdParamSchema = z.object({ integrationId: UUIDSchema });

export type IntegrationCreateInput = z.infer<typeof IntegrationCreateSchema>;
export type IntegrationUpdateInput = z.infer<typeof IntegrationUpdateSchema>;
export type IntegrationListQuery = z.infer<typeof IntegrationListQuerySchema>;

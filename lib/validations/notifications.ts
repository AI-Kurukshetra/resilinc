import { z } from "zod";

const UUIDSchema = z.string().uuid("Must be a valid UUID");

export const NotificationCreateSchema = z.object({
  userId: UUIDSchema.nullable().optional(),
  title: z.string().trim().min(1, "Title is required").max(500),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["alert", "incident", "mitigation", "compliance", "system"]),
  referenceType: z.string().max(100).nullable().optional(),
  referenceId: UUIDSchema.nullable().optional(),
});

export const NotificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  isRead: z.enum(["true", "false"]).optional(),
});

export const NotificationMarkReadSchema = z.object({
  notificationId: UUIDSchema.optional(),
  all: z.boolean().optional(),
}).refine((data) => data.notificationId || data.all, {
  message: "Either notificationId or all:true must be provided",
});

export type NotificationCreateInput = z.infer<typeof NotificationCreateSchema>;
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
export type NotificationMarkReadInput = z.infer<typeof NotificationMarkReadSchema>;

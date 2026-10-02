import { z } from "zod";

export const getNotificationsQuerySchema = z
  .object({
    page: z.coerce
      .number({ message: "Page must be a valid number" })
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .default(1),
    limit: z.coerce
      .number({ message: "Limit must be a valid number" })
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(10),
    unreadOnly: z
      .preprocess((val) => {
        if (typeof val === "string") {
          const lower = val.trim().toLowerCase();
          if (lower === "true") return true;
          if (lower === "false") return false;
        }
        return val;
      }, z.boolean({ message: "unreadOnly must be a boolean" }).default(false)),
  })
  .strict();

export const getNotificationsSchema = z.object({
  query: getNotificationsQuerySchema,
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

export const notificationIdParamsSchema = z.object({
  id: objectIdSchema("notification"),
});

export const markNotificationAsReadSchema = z.object({
  params: notificationIdParamsSchema,
});

export const deleteNotificationSchema = z.object({
  params: notificationIdParamsSchema,
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;




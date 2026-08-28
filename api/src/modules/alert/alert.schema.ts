import { z } from "zod";
import { alertTypes } from "./alert.modal.js";

const objectIdSchema = (entity: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, `Invalid ${entity} ID`);

export const alertIdParamsSchema = z.object({
  id: objectIdSchema("alert"),
});

export const getAlertsQuerySchema = z
  .object({
    type: z.enum(alertTypes).optional(),
    unreadOnly: z.coerce.boolean().default(false),
    page: z.coerce.number().int("Page must be a whole number").min(1).default(1),
    limit: z.coerce.number().int("Limit must be a whole number").min(1).max(100).default(20),
  })
  .strict();

export const getAlertsSchema = z.object({
  query: getAlertsQuerySchema,
});

export const markAlertReadSchema = z.object({
  params: alertIdParamsSchema,
});

export type AlertIdParams = z.infer<typeof alertIdParamsSchema>;
export type GetAlertsQuery = z.infer<typeof getAlertsQuerySchema>;

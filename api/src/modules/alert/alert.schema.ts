import { z } from "zod"

import {
  EmergencyAlertStatus,
  EmergencyAlertType,
} from "./alert.model.js"
import { emergencyAlertUpdateStatuses } from "../security/security-status-transitions.js"

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")

const optionalString = (
  schema: z.ZodString
) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value

    const trimmedValue = value.trim()
    return trimmedValue === "" ? undefined : trimmedValue
  }, schema.optional())

export const createEmergencyAlertSchema = z.object({
  body: z.object({
    alertType: z
      .enum(Object.values(EmergencyAlertType))
      .optional(),
    message: optionalString(z.string().max(500)),
    residentId: objectIdSchema.optional(),
    flatId: objectIdSchema.optional(),
  }),
})

export const listEmergencyAlertsSchema = z.object({
  query: z.object({
    status: z
      .enum(["ALL", ...Object.values(EmergencyAlertStatus)])
      .optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .optional(),
  }),
})

export const emergencyAlertIdParamsSchema = z.object({
  params: z.object({
    alertId: objectIdSchema,
  }),
})

export const updateEmergencyAlertStatusSchema =
  emergencyAlertIdParamsSchema.extend({
    body: z.object({
      status: z.enum(emergencyAlertUpdateStatuses),
      resolutionNotes: optionalString(
        z.string().max(500)
      ),
    }),
  })

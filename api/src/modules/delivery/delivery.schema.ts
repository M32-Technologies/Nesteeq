import { z } from "zod"

import {
  DeliveryStatus,
  DeliveryType,
} from "./delivery.interface.js"
import { deliveryUpdateStatuses } from "../security/security-status-transitions.js"

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

export const createDeliverySchema = z.object({
  body: z.object({
    deliveryType: z.enum(Object.values(DeliveryType)),
    flatId: objectIdSchema,
    residentId: objectIdSchema.optional(),
    deliveryCompany: z
      .string()
      .trim()
      .min(1, "Delivery company is required")
      .max(100),
    deliveryPersonName: optionalString(
      z.string().max(100)
    ),
    deliveryPersonPhone: optionalString(
      z.string().max(20)
    ),
    trackingId: optionalString(z.string().max(80)),
    packageDescription: optionalString(
      z.string().max(300)
    ),
    notes: optionalString(z.string().max(500)),
  }),
})

export const listDeliveriesSchema = z.object({
  query: z.object({
    status: z
      .enum(["ALL", ...Object.values(DeliveryStatus)])
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

export const deliveryIdParamsSchema = z.object({
  params: z.object({
    deliveryId: objectIdSchema,
  }),
})

export const updateDeliveryStatusSchema =
  deliveryIdParamsSchema.extend({
    body: z.object({
      status: z.enum(deliveryUpdateStatuses),
      notes: optionalString(z.string().max(500)),
    }),
  })

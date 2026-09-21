import { z } from "zod"

export const residentListQueryObjectSchema = z.object({
    search: z.string().trim().optional(),
    residentType: z
        .enum(["owner","resident"])
        .optional(),

    blockId: z.string().trim().optional(),
    status: z
        .enum(["active", "pending", "inactive"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const residentListQuerySchema = z.object({
    query: residentListQueryObjectSchema,
})


export type ResidentListQuery = z.infer<typeof residentListQueryObjectSchema>

export const registerVehicleSchema = z.object({
  body: z.object({
    slotId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Slot ID").optional(),
    vehicleNumber: z
      .string()
      .trim()
      .min(3, "Vehicle number must have at least 3 characters")
      .max(20, "Vehicle number cannot exceed 20 characters")
      .transform((val) => val.replace(/[\s-]/g, "").toUpperCase()),
    vehicleType: z.enum(["CAR", "BIKE", "EV", "BICYCLE", "OTHER"]).optional(),
    makeModel: z.string().trim().max(100).optional().nullable(),
    color: z.string().trim().max(50).optional().nullable(),
    rfidTag: z.string().trim().max(50).optional().nullable(),
    evChargingRequired: z.boolean().optional().default(false),
    notes: z.string().trim().max(300).optional().nullable(),
  }),
});

export const vehicleIdParamsSchema = z.object({
  params: z.object({
    vehicleId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Vehicle ID"),
  }),
});

export type RegisterVehicleInput = z.infer<typeof registerVehicleSchema>["body"];

const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    schema.optional()
  );

export const createResidentGuestPassSchema = z.object({
  body: z.object({
    flatId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Flat ID")
      .optional(),
    visitorName: z
      .string()
      .trim()
      .min(1, "Visitor name is required")
      .max(100, "Visitor name cannot exceed 100 characters"),
    visitorPhone: optionalString(
      z
        .string()
        .min(5, "Visitor phone must contain at least 5 characters")
        .max(20, "Visitor phone cannot exceed 20 characters")
        .regex(/^(\+?[0-9\s-]{5,20})$/, "Invalid visitor phone number format")
    ),
    purpose: optionalString(
      z.string().max(200, "Purpose cannot exceed 200 characters")
    ),
    vehicleNumber: optionalString(
      z
        .string()
        .max(20, "Vehicle number cannot exceed 20 characters")
        .transform((val) => val.toUpperCase().replace(/\s+/g, " "))
    ),
    vehicleType: z.enum(["CAR", "BIKE", "EV", "OTHER"]).optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    durationHours: z.coerce.number().min(1).max(72).optional().default(8),
  }),
});

export const residentGuestPassParamsSchema = z.object({
  params: z.object({
    passId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Pass ID"),
  }),
});

export const listResidentGuestPassesQuerySchema = z.object({
  query: z.object({
    status: z.enum(["ALL", "ACTIVE", "USED", "EXPIRED", "CANCELLED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
  }),
});

export type CreateResidentGuestPassInput = z.infer<typeof createResidentGuestPassSchema>["body"];



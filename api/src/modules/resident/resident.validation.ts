import { z } from "zod"

export const residentListQueryObjectSchema = z.object({
    search: z.string().trim().optional(),
    residentType: z
        .enum(["owner","resident"])
        .optional(),

    flatId: z.string().trim().optional(),
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

export const vehicleNumberRegex =
  /^(?:[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}|\d{2}[\s-]?BH[\s-]?\d{4}[\s-]?[A-Z]{1,2})$/i;

export const normalizeVehicleNumber = (value: string) =>
  value.replace(/[\s-]/g, "").toUpperCase();

export const isValidVehicleNumber = (value: string) =>
  vehicleNumberRegex.test(normalizeVehicleNumber(value));

export const registerVehicleSchema = z.object({
  body: z.object({
    slotId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Slot ID").optional(),
    vehicleNumber: z
      .string()
      .trim()
      .min(1, "Vehicle number is required")
      .max(20, "Vehicle number cannot exceed 20 characters")
      .regex(vehicleNumberRegex, "Please enter a valid vehicle number")
      .transform((val) => normalizeVehicleNumber(val)),
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

// Re-export resident visitor pass schemas and types from the visitors module
export {
  createResidentGuestPassSchema,
  residentGuestPassParamsSchema,
  listResidentGuestPassesQuerySchema,
  type CreateResidentGuestPassInput,
} from "../visitors/visit.validation.js";



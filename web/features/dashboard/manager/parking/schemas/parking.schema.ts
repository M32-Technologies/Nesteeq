import { z } from "zod"


export const editSlotSchema = z.object({
  usageType: z.enum(["RESIDENT", "VISITOR"], {
    message: "Please select a usage type",
  }),
})

export type EditSlotFormValues = z.infer<typeof editSlotSchema>

export const assignResidentSchema = z.object({
  flatId: z.string().min(1, "Please select a flat"),
  residentId: z.string().optional(),
  vehicleNumber: z
    .string()
    .trim()
    .max(20, "Vehicle number cannot exceed 20 characters")
    .optional(),
})

export type AssignResidentFormValues = z.infer<typeof assignResidentSchema>

export const generateParkingSlotsSchema = z.object({
  level: z
    .string()
    .trim()
    .min(1, "Level is required (e.g., Basement 1, Ground Floor)")
    .max(50, "Level cannot exceed 50 characters"),
  zoneName: z
    .string()
    .trim()
    .max(50, "Zone name cannot exceed 50 characters")
    .optional(),
  usageType: z.enum(["RESIDENT", "VISITOR"], {
    message: "Please select a usage type",
  }),
  vehicleType: z.enum(["CAR", "BIKE", "EV", "OTHER"], {
    message: "Please select a vehicle type",
  }),
  numberOfSlots: z
    .number({ message: "Number of slots is required" })
    .int("Number of slots must be a whole number")
    .positive("Number of slots must be greater than 0")
    .max(1000, "Cannot generate more than 1000 slots at once"),
})

export type GenerateParkingSlotsFormValues = z.infer<
  typeof generateParkingSlotsSchema
>

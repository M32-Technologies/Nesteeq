import { z } from "zod"

export const generateSlotsSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, "Prefix is required")
    .max(10, "Prefix must be 10 characters or less"),
  totalSlots: z
    .number()
    .int("Number of slots must be a whole number")
    .min(1, "Must generate at least 1 slot")
    .max(500, "Cannot generate more than 500 slots at once"),
  startNumber: z
    .number()
    .int("Starting number must be a whole number")
    .min(1, "Starting number must be at least 1"),
})

export const editSlotSchema = z.object({
  slotNumber: z.string().min(1, "Slot number is required"),
  notes: z.string().optional(),
})

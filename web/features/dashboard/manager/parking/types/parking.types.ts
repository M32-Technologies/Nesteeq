import { z } from "zod"
import type { VisitorParkingSlotStatus } from "../../../security/services/parking.service"
import { editSlotSchema, generateSlotsSchema } from "../schemas/parking.schema"

export type GenerateSlotsFormValues = z.infer<typeof generateSlotsSchema>

export type EditSlotFormValues = z.infer<typeof editSlotSchema>

export type ParkingStatusFilter = "ALL" | VisitorParkingSlotStatus

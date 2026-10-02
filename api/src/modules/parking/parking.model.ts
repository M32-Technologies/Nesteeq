import mongoose, {
  Schema,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose"

import {
  ParkingSlotStatus,
  ParkingUsageType,
  ParkingVehicleType,
  type IParkingSlot,
} from "./parking.interface.js"

const parkingSlotSchema = new Schema<IParkingSlot>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    level: { type: String, required: true, trim: true },
    zoneName: { type: String, trim: true, default: null },
    zoneCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    prefix: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    slotNumber: { type: String, required: true, trim: true },
    vehicleType: {
      type: String,
      enum: Object.values(ParkingVehicleType),
      required: true,
    },
    usageType: {
      type: String,
      enum: Object.values(ParkingUsageType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ParkingSlotStatus),
      default: ParkingSlotStatus.AVAILABLE,
      required: true,
    },
    flatId: { type: Schema.Types.ObjectId, ref: "Flat", default: null },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    visitorId: { type: Schema.Types.ObjectId, ref: "Visitor", default: null },
    visitorVisitId: {
      type: Schema.Types.ObjectId,
      ref: "VisitorVisit",
      default: null,
      index: true,
    },
    visitorName: { type: String, default: null, trim: true },
    vehicleNumber: { type: String, default: null, trim: true },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 300, default: null },
  },
  { timestamps: true }
)

parkingSlotSchema.index(
  { apartmentId: 1, slotNumber: 1 },
  { unique: true }
)
parkingSlotSchema.index({ apartmentId: 1, status: 1 })
parkingSlotSchema.index({
  apartmentId: 1,
  vehicleType: 1,
  usageType: 1,
  status: 1,
})
parkingSlotSchema.index({ apartmentId: 1, usageType: 1, status: 1 })
parkingSlotSchema.index({ apartmentId: 1, level: 1, zoneCode: 1 })
parkingSlotSchema.index({ apartmentId: 1, prefix: 1 })
parkingSlotSchema.index({ apartmentId: 1, visitorVisitId: 1 })

export type ParkingSlot = InferSchemaType<typeof parkingSlotSchema>

export const ParkingSlotModel: Model<IParkingSlot> =
  mongoose.models.ParkingSlot || model<IParkingSlot>(
    "ParkingSlot",
    parkingSlotSchema
  )

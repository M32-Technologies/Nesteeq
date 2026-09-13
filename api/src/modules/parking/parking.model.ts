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
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IParkingSlot,
  type IVisitorParkingAssignment,
  type IVisitorParkingSlot,
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
    vehicleNumber: { type: String, default: null, trim: true },
    assignedAt: { type: Date, default: null },
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
parkingSlotSchema.index({ apartmentId: 1, level: 1, zoneCode: 1 })
parkingSlotSchema.index({ apartmentId: 1, prefix: 1 })

const visitorParkingSlotSchema = new Schema<IVisitorParkingSlot>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    slotNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: Object.values(VisitorParkingSlotStatus),
      default: VisitorParkingSlotStatus.AVAILABLE,
      required: true,
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 300, default: null },
  },
  { timestamps: true }
)

visitorParkingSlotSchema.index(
  { apartmentId: 1, slotNumber: 1 },
  { unique: true }
)

const visitorParkingAssignmentSchema =
  new Schema<IVisitorParkingAssignment>(
    {
      apartmentId: {
        type: Schema.Types.ObjectId,
        ref: "Apartment",
        required: true,
        index: true,
      },
      slotId: {
        type: Schema.Types.ObjectId,
        ref: "VisitorParkingSlot",
        required: true,
        index: true,
      },
      flatId: {
        type: Schema.Types.ObjectId,
        ref: "Flat",
        required: true,
        index: true,
      },
      visitorVisitId: {
        type: Schema.Types.ObjectId,
        ref: "VisitorVisit",
        default: null,
        index: true,
      },
      guestPassId: {
        type: Schema.Types.ObjectId,
        ref: "GuestPass",
        default: null,
        index: true,
      },
      visitorName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      vehicleNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 20,
      },
      vehicleType: {
        type: String,
        enum: Object.values(ParkingVehicleType),
        default: null,
      },
      notes: { type: String, trim: true, maxlength: 300, default: null },
      status: {
        type: String,
        enum: Object.values(VisitorParkingAssignmentStatus),
        default: VisitorParkingAssignmentStatus.ACTIVE,
        required: true,
        index: true,
      },
      assignedBy: { type: String, required: true },
      assignedAt: { type: Date, default: Date.now, required: true },
      releasedBy: { type: String, default: null },
      releasedAt: { type: Date, default: null },
    },
    { timestamps: true }
  )

visitorParkingAssignmentSchema.index({
  apartmentId: 1,
  status: 1,
  assignedAt: -1,
})
visitorParkingAssignmentSchema.index({
  apartmentId: 1,
  visitorVisitId: 1,
  status: 1,
})
visitorParkingAssignmentSchema.index(
  { visitorVisitId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: VisitorParkingAssignmentStatus.ACTIVE,
      visitorVisitId: { $type: "objectId" },
    },
  }
)
visitorParkingAssignmentSchema.index(
  { slotId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: VisitorParkingAssignmentStatus.ACTIVE,
    },
  }
)

export type ParkingSlot = InferSchemaType<typeof parkingSlotSchema>

export const ParkingSlotModel: Model<IParkingSlot> =
  mongoose.models.ParkingSlot || model<IParkingSlot>(
    "ParkingSlot",
    parkingSlotSchema
  )

export const VisitorParkingSlotModel: Model<IVisitorParkingSlot> =
  mongoose.models.VisitorParkingSlot ||
  model<IVisitorParkingSlot>(
    "VisitorParkingSlot",
    visitorParkingSlotSchema
  )

export const VisitorParkingAssignmentModel: Model<IVisitorParkingAssignment> =
  mongoose.models.VisitorParkingAssignment ||
  model<IVisitorParkingAssignment>(
    "VisitorParkingAssignment",
    visitorParkingAssignmentSchema
  )

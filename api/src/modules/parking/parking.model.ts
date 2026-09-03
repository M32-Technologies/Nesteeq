import mongoose, {
  Schema,
  type Model,
} from "mongoose"

import {
  VisitorParkingAssignmentStatus,
  VisitorParkingSlotStatus,
  type IVisitorParkingAssignment,
  type IVisitorParkingSlot,
} from "./parking.interface.js"

const visitorParkingSlotSchema =
  new Schema<IVisitorParkingSlot>(
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

      notes: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  )

visitorParkingSlotSchema.index(
  {
    apartmentId: 1,
    slotNumber: 1,
  },
  {
    unique: true,
  }
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
        trim: true,
        maxlength: 50,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
      },

      status: {
        type: String,
        enum: Object.values(
          VisitorParkingAssignmentStatus
        ),
        default: VisitorParkingAssignmentStatus.ACTIVE,
        required: true,
        index: true,
      },

      assignedBy: {
        type: String,
        required: true,
      },

      assignedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },

      releasedBy: {
        type: String,
        default: null,
      },

      releasedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
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
  {
    slotId: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: VisitorParkingAssignmentStatus.ACTIVE,
    },
  }
)

export const VisitorParkingSlotModel: Model<IVisitorParkingSlot> =
  mongoose.models.VisitorParkingSlot ||
  mongoose.model<IVisitorParkingSlot>(
    "VisitorParkingSlot",
    visitorParkingSlotSchema
  )

export const VisitorParkingAssignmentModel: Model<IVisitorParkingAssignment> =
  mongoose.models.VisitorParkingAssignment ||
  mongoose.model<IVisitorParkingAssignment>(
    "VisitorParkingAssignment",
    visitorParkingAssignmentSchema
  )

import mongoose, {
  Schema,
  type Model,
} from "mongoose"

import {
  type IVisitorVisit,
  VisitorEntryType,
  VisitorVisitStatus,
} from "./visit.interface.js"

const visitorVisitSchema = new Schema<IVisitorVisit>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },

    visitorPassId: {
      type: Schema.Types.ObjectId,
      ref: "GuestPass",
      default: null,
    },

    visitorName: {
      type: String,
      required: true,
      trim: true,
    },

    visitorPhone: {
      type: String,
      trim: true,
      default: null,
    },

    purpose: {
      type: String,
      trim: true,
      default: null,
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    entryType: {
      type: String,
      enum: Object.values(VisitorEntryType),
      required: true,
    },

    checkedInBy: {
      type: String,
      required: true,
    },

    checkedInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    checkedOutBy: {
      type: String,
      default: null,
    },

    checkedOutAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(VisitorVisitStatus),
      default: VisitorVisitStatus.ACTIVE,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

visitorVisitSchema.index({
  apartmentId: 1,
  status: 1,
  checkedInAt: -1,
})

visitorVisitSchema.index({
  apartmentId: 1,
  flatId: 1,
  checkedInAt: -1,
})

visitorVisitSchema.index(
  {
    visitorPassId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      visitorPassId: {
        $type: "objectId",
      },
    },
  }
)

export const VisitorVisitModel: Model<IVisitorVisit> =
  mongoose.models.VisitorVisit ||
  mongoose.model<IVisitorVisit>(
    "VisitorVisit",
    visitorVisitSchema
  )

import mongoose, {
  Schema,
  type Model,
  type Types,
} from "mongoose"

export const VisitorVisitStatus = {
  ACTIVE: "ACTIVE",
  CHECKED_OUT: "CHECKED_OUT",
} as const

export type VisitorVisitStatus =
  (typeof VisitorVisitStatus)[keyof typeof VisitorVisitStatus]

export const VisitorEntryType = {
  PASS: "PASS",
  MANUAL: "MANUAL",
} as const

export type VisitorEntryType =
  (typeof VisitorEntryType)[keyof typeof VisitorEntryType]

export interface IVisitorVisit {
  apartmentId: Types.ObjectId
  flatId: Types.ObjectId

  visitorPassId?: Types.ObjectId | null

  visitorName: string
  visitorPhone?: string | null
  purpose?: string | null
  vehicleNumber?: string | null
  vehicleType?: string | null

  entryType: VisitorEntryType

  checkedInBy: string
  checkedInAt: Date

  checkedOutBy?: string | null
  checkedOutAt?: Date | null

  status: VisitorVisitStatus

  createdAt?: Date
  updatedAt?: Date
}

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

    vehicleType: {
      type: String,
      trim: true,
      default: null,
      maxlength: 50,
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

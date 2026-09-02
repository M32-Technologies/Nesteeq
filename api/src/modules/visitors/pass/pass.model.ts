import mongoose, {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose"

export const GuestPassStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  USED: "USED",
} as const

export type GuestPassStatus =
  (typeof GuestPassStatus)[keyof typeof GuestPassStatus]

const guestPassSchema = new Schema(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    createdByResidentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },

    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },

    visitorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    visitorPhone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 20,
    },

    purpose: {
      type: String,
      trim: true,
      default: null,
      maxlength: 200,
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      maxlength: 20,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
      immutable: true,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(GuestPassStatus),
      default: GuestPassStatus.ACTIVE,
      required: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    usedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

guestPassSchema.index({
  apartmentId: 1,
  status: 1,
  validUntil: 1,
})

guestPassSchema.index({
  apartmentId: 1,
  flatId: 1,
  createdAt: -1,
})

guestPassSchema.index({
  createdByResidentId: 1,
  createdAt: -1,
})

guestPassSchema.index({
  apartmentId: 1,
  status: 1,
  usedAt: -1,
})

export type GuestPass = InferSchemaType<typeof guestPassSchema>

export const GuestPassModel =
  mongoose.models.GuestPass ||
  model("GuestPass", guestPassSchema)

import mongoose, {
  Schema,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose"

const residentSchema = new Schema(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },

    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },
    residentType: {
      type: String,
      enum: ["owner", "resident"],
      required: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "pending", "inactive"],
      default: "pending",
      required: true,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

/**
 * One authenticated user should only have one resident
 * membership inside the same apartment.
 *
 * Important:
 * only enforce this when userId actually exists.
 */
residentSchema.index(
  {
    apartmentId: 1,
    userId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      userId: {
        $type: "string",
      },
    },
  }
)

/**
 * Useful when finding everyone attached to a flat.
 */
residentSchema.index({
  apartmentId: 1,
  flatId: 1,
  status: 1,
})

export type ResidentDocument = InferSchemaType<typeof residentSchema>

export const ResidentModel = model("Resident", residentSchema)
export const Resident = ResidentModel

const vehicleSchema = new Schema(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ["CAR", "BIKE", "EV", "BICYCLE", "OTHER"],
      default: "CAR",
      required: true,
    },
    makeModel: {
      type: String,
      trim: true,
      default: null,
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    rfidTag: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    parkingSlotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingSlot",
      default: null,
    },
    evChargingRequired: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
)

vehicleSchema.index({ apartmentId: 1, vehicleNumber: 1 }, { unique: true })
vehicleSchema.index({ apartmentId: 1, flatId: 1 })
vehicleSchema.index({ apartmentId: 1, residentId: 1 })

export type VehicleDocument = InferSchemaType<typeof vehicleSchema>
export const Vehicle: Model<VehicleDocument> =
  (mongoose.models.Vehicle as Model<VehicleDocument>) || model<VehicleDocument>("Vehicle", vehicleSchema)


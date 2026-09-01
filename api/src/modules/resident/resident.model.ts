import mongoose, {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose"
import mongoose from "mongoose"

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

<<<<<<< HEAD
export const ResidentModel =
  mongoose.models.Resident || model("Resident", residentSchema)
=======
export type ResidentDocument = InferSchemaType<typeof residentSchema>

export const ResidentModel = mongoose.models.Resident || model("Resident", residentSchema)
export const Resident = ResidentModel
>>>>>>> origin/dev

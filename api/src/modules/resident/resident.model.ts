import {
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
      required: true,
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
      enum: ["owner", "tenant", "resident"],
      required: true,
    },

    phone: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

residentSchema.index(
  {
    apartmentId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
)

export type Resident =
  InferSchemaType<typeof residentSchema>

export const ResidentModel = mongoose.models.Resident || model("Resident", residentSchema)

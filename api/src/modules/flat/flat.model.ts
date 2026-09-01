import { Schema, model } from "mongoose";
import { IFlat } from "./flat.schema.js";

const flatSchema = new Schema<IFlat>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    blockId: {
      type: Schema.Types.ObjectId,
      ref: "Block",
      required: true,
      index: true,
    },
    floorNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
      index: true,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    occupancyStatus: {
      type: String,
      enum: ["VACANT", "OWNER", "TENANT"],
      default: "VACANT",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

flatSchema.index(
  {
    apartmentId: 1,
    blockId: 1,
    flatNumber: 1,
  },
  {
    unique: true,
  }
);

export const Flat = model<IFlat>("Flat", flatSchema);

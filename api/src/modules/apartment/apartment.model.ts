import mongoose, { Schema } from "mongoose";

import type { IApartment } from "./apartment.interface.js";
import { blockSchema } from "./block.model.js";

const apartmentSchema = new Schema<IApartment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    totalUnits: {
      type: Number,
      required: true,
      min: 1,
    },

    totalFloors: {
      type: Number,
      required: true,
      min: 1,
    },

    totalBlocks: {
      type: Number,
      required: true,
      min: 1,
    },

    parkingSlots: {
      type: Number,
      required: true,
      min: 0,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    emergencyNumber: {
      type: String,
      required: true,
      trim: true,
    },

    setupRequestId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending_payment", "active", "inactive"],
      default: "pending_payment",
    },

    blocks: {
      type: [blockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

apartmentSchema.index(
  { setupRequestId: 1 },
  { unique: true, sparse: true }
);

export const Apartment = mongoose.model(
  "Apartment",
  apartmentSchema
);

import { randomUUID } from "crypto";
import { Schema, model } from "mongoose";
import { IApartment } from "./apartment.schema.js";

const apartmentSchema = new Schema<IApartment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      trim: true,
    },

    managerId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
      type: String,
      required: true,
      trim: true,
    },

    totalFloors: {
      type: String,
      required: true,
      trim: true,
    },

    totalBlocks: {
      type: String,
      required: true,
      trim: true,
    },

    parkingSlots: {
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    emergencyContact: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending_payment", "active", "inactive"],
      default: "pending_payment",
      trim: true,
    },
  },
  {
    timestamps: true,
    id: false,
  }
);

apartmentSchema.index({ managerId: 1 });
apartmentSchema.index(
  { managerId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending_payment" },
  },
);
apartmentSchema.index(
  { address: 1, city: 1, state: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    collation: {
      locale: "en",
      strength: 2,
    },
  },
);

export const Apartment = model(
  "Apartment",
  apartmentSchema
);

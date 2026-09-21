import { Schema, model, type InferSchemaType, type Model } from "mongoose";

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
);

vehicleSchema.index({ apartmentId: 1, vehicleNumber: 1 }, { unique: true });
vehicleSchema.index({ apartmentId: 1, flatId: 1 });
vehicleSchema.index({ apartmentId: 1, residentId: 1 });

export type VehicleDocument = InferSchemaType<typeof vehicleSchema>;

export const Vehicle: Model<VehicleDocument> =
  (model<VehicleDocument>("Vehicle", vehicleSchema) as any);

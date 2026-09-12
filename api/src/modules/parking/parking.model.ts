import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const parkingSlotSchema = new Schema(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },
    level: {
      type: String,
      required: true,
      trim: true,
    },

    zoneName: {
      type: String,
      trim: true,
      default: null,
    },

    zoneCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },


    prefix: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },

    slotNumber: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      enum: ["CAR", "BIKE", "EV", "OTHER"],
      required: true,
    },

    usageType: {
      type: String,
      enum: ["RESIDENT", "VISITOR"],
      required: true,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "ASSIGNED", "OCCUPIED", "INACTIVE"],
      default: "AVAILABLE",
      required: true,
    },

    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },

    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },

    visitorId: {
      type: Schema.Types.ObjectId,
      ref: "Visitor",
      default: null,
    },

    vehicleNumber: {
      type: String,
      default: null,
      trim: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

parkingSlotSchema.index(
  {
    apartmentId: 1,
    slotNumber: 1,
  },
  {
    unique: true,
  }
);

parkingSlotSchema.index({
  apartmentId: 1,
  status: 1,
});

parkingSlotSchema.index({
  apartmentId: 1,
  vehicleType: 1,
  usageType: 1,
  status: 1,
});

parkingSlotSchema.index({
  apartmentId: 1,
  level: 1,
  zoneCode: 1,
});

parkingSlotSchema.index({
  apartmentId: 1,
  prefix: 1,
});

export type ParkingSlot = InferSchemaType<typeof parkingSlotSchema>;

export const ParkingSlotModel = model("ParkingSlot", parkingSlotSchema);
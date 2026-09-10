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

    setupType: {
      type: String,
      enum: ["SIMPLE", "ADVANCED"],
      required: true,
      default: "SIMPLE",
    },

    level: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },

    zone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },

    slotNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
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
      enum: [
        "AVAILABLE",
        "ASSIGNED",
        "OCCUPIED",
        "INACTIVE",
      ],
      required: true,
      default: "AVAILABLE",
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
      trim: true,
      uppercase: true,
      default: null,
      maxlength: 20,
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
  zone: 1,
});

export type ParkingSlot = InferSchemaType<typeof parkingSlotSchema>;

export const ParkingSlotModel = model("ParkingSlot", parkingSlotSchema);
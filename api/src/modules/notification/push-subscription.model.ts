import { Schema, model, type InferSchemaType } from "mongoose";

const pushSubscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    apartmentId: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true,
      },
      auth: {
        type: String,
        required: true,
        trim: true,
      },
    },
    deviceType: {
      type: String,
      default: "web",
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.index({ userId: 1, apartmentId: 1 });

export type PushSubscriptionDocument = InferSchemaType<typeof pushSubscriptionSchema>;

export const PushSubscription = model("PushSubscription", pushSubscriptionSchema);

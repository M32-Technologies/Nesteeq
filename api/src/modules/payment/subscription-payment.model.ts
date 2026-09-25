import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const subscriptionPaymentSchema = new Schema(
  {
    apartment: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    razorpaySubscriptionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["captured", "failed", "refunded"],
      default: "captured",
      required: true,
      index: true,
    },

    billingCycle: {
      type: Number,
      default: 1,
    },

    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPaymentSchema.index({ apartment: 1, paidAt: -1 });
subscriptionPaymentSchema.index({ status: 1, paidAt: -1 });

export type SubscriptionPaymentDocument = InferSchemaType<typeof subscriptionPaymentSchema>;

export const SubscriptionPayment = model(
  "SubscriptionPayment",
  subscriptionPaymentSchema
);

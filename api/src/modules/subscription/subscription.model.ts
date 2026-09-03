import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const subscriptionSchema = new Schema(
  {
    apartment: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    subscribedBy: {
      type: String,
      required: true,
      trim: true,
    },

    // Razorpay
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    razorpayPlanId: {
      type: String,
      required: true,
    },

    razorpayCustomerId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "authenticated",
        "active",
        "pending",
        "halted",
        "cancelled",
        "completed",
        "expired",
      ],
      default: "created",
      required: true,
      index: true,
    },

    // billing
    currentStart: Date,
    currentEnd: Date,
    chargeAt: Date,
    startAt: Date,
    endAt: Date,
    endedAt: Date,

    totalCount: Number,

    paidCount: {
      type: Number,
      default: 0,
    },

    remainingCount: Number,

    authAttempts: {
      type: Number,
      default: 0,
    },

    hasScheduledChanges: {
      type: Boolean,
      default: false,
    },

    scheduleChangeAt: {
      type: String,
      enum: ["now", "cycle_end"],
    },

    // trial
    isTrial: {
      type: Boolean,
      default: false,
    },

    trialEndsAt: Date,

    // cancellation
    cancelledAt: Date,
    cancelReason: String,

    cancelAtCycleEnd: {
      type: Boolean,
      default: false,
    },

    // plan snapshot
    planSnapshot: {
      planName: String,
      price: Number,

      currency: {
        type: String,
        default: "INR",
      },

      planType: String,
      durationMonths: Number,
    },

    notes: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({
  apartment: 1,
  status: 1,
});

export type SubscriptionDocument =
  InferSchemaType<typeof subscriptionSchema>;

export const Subscription = model(
  "Subscription",
  subscriptionSchema
);
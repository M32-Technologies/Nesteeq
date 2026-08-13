import mongoose, { Document, Schema } from "mongoose";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "expired"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "not_required";

export type DurationUnit = "days" | "months" | "years";

export interface ISubscription extends Document {
  apartment: mongoose.Types.ObjectId;

  planId: string;
  planName: string;
  amount: number;

  durationValue: number;
  durationUnit: DurationUnit;

  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;

  startDate?: Date;
  endDate?: Date;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    apartment: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    planId: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "TRIAL",
        "MONTHLY",
        "HALF_YEARLY",
        "YEARLY",
      ],
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

    durationValue: {
      type: Number,
      required: true,
      min: 1,
    },

    durationUnit: {
      type: String,
      required: true,
      enum: ["days", "months", "years"],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "expired",
        "cancelled",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "not_required",
      ],
      default: "pending",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
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

subscriptionSchema.index({
  razorpayOrderId: 1,
});

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>(
    "Subscription",
    subscriptionSchema
  );

export default Subscription;
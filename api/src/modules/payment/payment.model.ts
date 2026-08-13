import { Schema, model } from "mongoose";

import type { IPayment } from "./payment.interface.js";

const paymentSchema = new Schema<IPayment>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    paymentType: {
      type: String,
      enum: ["SUBSCRIPTION", "MAINTENANCE", "RENT"],
      required: true,
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CAPTURED", "FAILED"],
      default: "PENDING",
    },

    razorpayOrderId: {
      type: String,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
    },

    razorpaySignature: {
      type: String,
      trim: true,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, sparse: true }
);
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ apartmentId: 1, createdAt: -1 });
paymentSchema.index({ referenceId: 1, paymentType: 1 });

export const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;

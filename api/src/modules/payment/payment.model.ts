import mongoose, { Schema } from "mongoose";

import {
  IPayment,
  PaymentSource,
} from "./payment.interface.js";

const paymentSchema = new Schema<IPayment>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    billId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: Object.values(PaymentSource),
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: String,
      trim: true,
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

paymentSchema.index({
  apartmentId: 1,
  paidAt: -1,
});

export const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

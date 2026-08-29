import mongoose, { Schema } from "mongoose";

import {
  BillStatus,
  IBilling,
} from "./billing.interface.js";

const additionalChargeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const billingSchema = new Schema<IBilling>(
  {
    apartmentId: {
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

    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    additionalCharges: {
      type: [additionalChargeSchema],
      default: [],
    },

    lateFeePerDay: {
      type: Number,
      default: 0,
      min: 0,
    },

    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lateFeeWaivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(BillStatus),
      default: BillStatus.PENDING,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

billingSchema.index({
  apartmentId: 1,
  residentId: 1,
  dueDate: 1,
});

export const Billing = mongoose.model<IBilling>(
  "Billing",
  billingSchema
);
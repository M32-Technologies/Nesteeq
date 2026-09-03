import mongoose, { Schema } from "mongoose";

import {
  IWallet,
  WalletTransactionType,
} from "./wallet.interface.js";

const walletTransactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    billId: {
      type: Schema.Types.ObjectId,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const walletSchema = new Schema<IWallet>(
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

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAdded: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactions: {
      type: [walletTransactionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.index(
  {
    apartmentId: 1,
    residentId: 1,
  },
  {
    unique: true,
  }
);

export const Wallet = mongoose.model<IWallet>(
  "Wallet",
  walletSchema
);
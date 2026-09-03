import mongoose, { Schema } from "mongoose";

import {
  ExpenseCategory,
  ExpenseStatus,
  IExpense,
} from "./expense.interface.js";

const expenseSchema = new Schema<IExpense>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    vendorName: {
      type: String,
      trim: true,
    },

    expenseDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.PENDING,
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

expenseSchema.index({
  apartmentId: 1,
  expenseDate: -1,
});

export const Expense = mongoose.model<IExpense>(
  "Expense",
  expenseSchema
);
import mongoose, { Schema, model } from "mongoose";
import { ITreasurerSetting } from "./treasurer.types.js";

const treasurerSettingSchema = new Schema<ITreasurerSetting>(
  {
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      unique: true,
      index: true,
    },
    defaultLateFeePerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    gracePeriodDays: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 4, // April (standard FY in India)
      min: 1,
      max: 12,
    },
    autoReminderEnabled: {
      type: Boolean,
      default: true,
    },
    emergencyReserveTarget: {
      type: Number,
      default: 100000,
      min: 0,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TreasurerSetting = model<ITreasurerSetting>(
  "TreasurerSetting",
  treasurerSettingSchema
);

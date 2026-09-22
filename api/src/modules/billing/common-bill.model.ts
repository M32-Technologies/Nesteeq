import mongoose, { Schema, type Document, type Types } from "mongoose";

export enum BillType {
  MONTHLY_MAINTENANCE = "MONTHLY_MAINTENANCE",
  WATER = "WATER",
  COMMON_ELECTRICITY = "COMMON_ELECTRICITY",
  LIFT_MAINTENANCE = "LIFT_MAINTENANCE",
  SPECIAL_REPAIR = "SPECIAL_REPAIR",
  PARKING_MAINTENANCE = "PARKING_MAINTENANCE",
  OTHER = "OTHER",
}

export enum CommonBillTargetType {
  ALL_FLATS = "ALL_FLATS",
  BY_BLOCK = "BY_BLOCK",
  CUSTOM_FLATS = "CUSTOM_FLATS",
}

export enum CommonBillStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
}

export interface ICommonBillAdditionalCharge {
  title: string;
  amount: number;
  reason?: string;
}

export interface ICommonBill extends Document {
  apartmentId: Types.ObjectId;
  title: string;
  billType: BillType;
  billingPeriod?: string | null;
  description?: string | null;
  baseAmount: number;
  additionalCharges: ICommonBillAdditionalCharge[];
  lateFeePerDay: number;
  dueDate: Date;
  targetType: CommonBillTargetType;
  targetBlockIds: Types.ObjectId[];
  targetFlatIds: Types.ObjectId[];
  totalFlatsCount: number;
  totalAmount: number;
  status: CommonBillStatus;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const additionalChargeSchema = new Schema<ICommonBillAdditionalCharge>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const commonBillSchema = new Schema<ICommonBill>(
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
    billType: {
      type: String,
      enum: Object.values(BillType),
      required: true,
      index: true,
    },
    billingPeriod: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
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
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: Object.values(CommonBillTargetType),
      required: true,
      default: CommonBillTargetType.ALL_FLATS,
    },
    targetBlockIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    targetFlatIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    totalFlatsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(CommonBillStatus),
      default: CommonBillStatus.ACTIVE,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying bills by apartment and period
commonBillSchema.index({ apartmentId: 1, billType: 1, billingPeriod: 1 });

export const CommonBill = mongoose.model<ICommonBill>(
  "CommonBill",
  commonBillSchema
);

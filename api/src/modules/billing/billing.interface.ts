import { Types } from "mongoose";

export enum BillStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export interface IAdditionalCharge {
  title: string;
  amount: number;
  reason?: string;
}

export interface IBilling {
  apartmentId: Types.ObjectId;
  residentId: Types.ObjectId;
  unitId: Types.ObjectId;

  baseAmount: number;

  additionalCharges: IAdditionalCharge[];

  lateFeePerDay: number;
  lateFeeAmount: number;
  lateFeeWaivedAmount: number;

  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;

  dueDate: Date;
  settledAt?: Date | null;

  status: BillStatus;

  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

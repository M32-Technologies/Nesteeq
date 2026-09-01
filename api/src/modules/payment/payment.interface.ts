import { Types } from "mongoose";

export enum PaymentSource {
  MANUAL = "MANUAL",
  WALLET = "WALLET",
}

export interface IPayment {
  apartmentId: Types.ObjectId;
  billId: Types.ObjectId;
  residentId: Types.ObjectId;
  unitId: Types.ObjectId;
  amount: number;
  source: PaymentSource;
  description?: string;
  recordedBy?: string;
  paidAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
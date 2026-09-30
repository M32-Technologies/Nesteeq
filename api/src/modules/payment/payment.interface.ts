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
  paymentMethod?: string;
  referenceNo?: string;
  receiptNumber?: string;
  description?: string;
  recordedBy?: string;
  paidAt: Date;
  reversed?: boolean;
  reversedAt?: Date;
  reversedBy?: string;
  reversalReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
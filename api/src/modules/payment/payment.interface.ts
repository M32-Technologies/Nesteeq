import { Types } from "mongoose";

export type PaymentType =
  | "SUBSCRIPTION"
  | "MAINTENANCE"
  | "RENT";

export type PaymentStatus =
  | "PENDING"
  | "CAPTURED"
  | "FAILED";

export interface IPayment {
  apartmentId: Types.ObjectId;
  userId?: Types.ObjectId;

  paymentType: PaymentType;

  referenceId: Types.ObjectId;

  subtotalAmount: number;

  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;

  taxAmount: number;

  amount: number;

  currency: string;

  status: PaymentStatus;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  paidAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

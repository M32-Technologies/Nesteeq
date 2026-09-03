import { Types } from "mongoose";

export enum WalletTransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export interface IWalletTransaction {
  type: WalletTransactionType;
  amount: number;
  description: string;
  billId?: Types.ObjectId;
  createdAt?: Date;
}

export interface IWallet {
  apartmentId: Types.ObjectId;
  residentId: Types.ObjectId;

  balance: number;
  totalAdded: number;
  totalUsed: number;

  transactions: IWalletTransaction[];

  createdAt?: Date;
  updatedAt?: Date;
}
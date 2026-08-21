import { Types } from "mongoose";

import { Wallet } from "./wallet.model.js";
import { WalletTransactionType } from "./wallet.interface.js";

import { AppError } from "../../utils/AppError.js";

const validateObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ObjectId", 400);
  }
};

export const createWalletService = async (
  apartmentId: string,
  residentId: string
) => {
  validateObjectId(apartmentId);
  validateObjectId(residentId);

  const existingWallet = await Wallet.findOne({
    apartmentId,
    residentId,
  });

  if (existingWallet) {
    throw new AppError("Wallet already exists", 400);
  }

  return Wallet.create({
    apartmentId,
    residentId,
    balance: 0,
    totalAdded: 0,
    totalUsed: 0,
    transactions: [],
  });
};

export const getWalletService = async (
  apartmentId: string,
  residentId: string
) => {
  validateObjectId(apartmentId);
  validateObjectId(residentId);

  const wallet = await Wallet.findOne({
    apartmentId,
    residentId,
  });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  return wallet;
};

export const addWalletFundsService = async (
  apartmentId: string,
  residentId: string,
  amount: number,
  description: string
) => {
  const wallet = await getWalletService(
    apartmentId,
    residentId
  );

  wallet.balance += amount;
  wallet.totalAdded += amount;

  wallet.transactions.push({
    type: WalletTransactionType.CREDIT,
    amount,
    description,
    createdAt: new Date(),
  });

  await wallet.save();

  return wallet;
};

export const deductWalletFundsService = async (
  apartmentId: string,
  residentId: string,
  billId: string,
  amount: number,
  description: string
) => {
  validateObjectId(billId);

  const wallet = await getWalletService(
    apartmentId,
    residentId
  );

  if (wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  wallet.balance -= amount;
  wallet.totalUsed += amount;

  wallet.transactions.push({
    type: WalletTransactionType.DEBIT,
    amount,
    description,
    billId: new Types.ObjectId(billId),
    createdAt: new Date(),
  });

  await wallet.save();

  return wallet;
};
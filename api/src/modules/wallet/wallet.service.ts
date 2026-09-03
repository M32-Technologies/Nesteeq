import mongoose, { ClientSession, Types } from "mongoose";

import { Wallet } from "./wallet.model.js";
import { WalletTransactionType } from "./wallet.interface.js";
import { AuditAction } from "../audit/audit.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";
import { Billing } from "../billing/billing.model.js";
import {
  applyBillValues,
  calculateBillValues,
  roundMoney,
} from "../billing/billing.calculation.js";
import { ResidentModel } from "../resident/resident.model.js";
import { PaymentSource } from "../payment/payment.interface.js";
import { createPaymentRecordService } from "../payment/payment.service.js";

import { AppError } from "../../utils/AppError.js";

interface AuditActor {
  userId: string;
}

const validateObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ObjectId", 400);
  }
};

const toObjectId = (id: string, field: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  return new Types.ObjectId(id);
};

const validateResidentOwnership = async (
  apartmentId: Types.ObjectId,
  residentId: Types.ObjectId,
  session?: ClientSession
) => {
  const resident = await ResidentModel.findOne({
    _id: residentId,
    apartmentId,
  })
    .select("_id")
    .session(session ?? null)
    .lean();

  if (!resident) {
    throw new AppError(
      "Resident does not belong to this apartment",
      403
    );
  }
};

export const createWalletService = async (
  apartmentId: string,
  residentId: string
) => {
  const apartmentObjectId = toObjectId(
    apartmentId,
    "apartmentId"
  );
  const residentObjectId = toObjectId(
    residentId,
    "residentId"
  );

  await validateResidentOwnership(
    apartmentObjectId,
    residentObjectId
  );

  const existingWallet = await Wallet.findOne({
    apartmentId: apartmentObjectId,
    residentId: residentObjectId,
  });

  if (existingWallet) {
    throw new AppError("Wallet already exists", 400);
  }

  return Wallet.create({
    apartmentId: apartmentObjectId,
    residentId: residentObjectId,
    balance: 0,
    totalAdded: 0,
    totalUsed: 0,
    transactions: [],
  });
};

export const getWalletsService = async (apartmentId: string) => {
  validateObjectId(apartmentId);

  return Wallet.find({ apartmentId }).sort({ updatedAt: -1 });
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
  description: string,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const apartmentObjectId = toObjectId(
    apartmentId,
    "apartmentId"
  );
  const residentObjectId = toObjectId(
    residentId,
    "residentId"
  );
  let creditedWallet:
    | Awaited<ReturnType<typeof Wallet.findOne>>
    | null = null;

  try {
    await session.withTransaction(async () => {
      await validateResidentOwnership(
        apartmentObjectId,
        residentObjectId,
        session
      );

      let wallet = await Wallet.findOne({
        apartmentId: apartmentObjectId,
        residentId: residentObjectId,
      }).session(session);

      if (!wallet) {
        [wallet] = await Wallet.create(
          [
            {
              apartmentId: apartmentObjectId,
              residentId: residentObjectId,
              balance: 0,
              totalAdded: 0,
              totalUsed: 0,
              transactions: [],
            },
          ],
          { session }
        );
      }

      const oldValue = {
        residentId: wallet.residentId.toString(),
        balance: wallet.balance,
        totalAdded: wallet.totalAdded,
        totalUsed: wallet.totalUsed,
      };

      const creditAmount = roundMoney(amount);
      wallet.balance = roundMoney(wallet.balance + creditAmount);
      wallet.totalAdded = roundMoney(
        wallet.totalAdded + creditAmount
      );

      wallet.transactions.push({
        type: WalletTransactionType.CREDIT,
        amount: creditAmount,
        description,
        createdAt: new Date(),
      });

      await wallet.save({ session });

      await createAuditLogService(
        {
          apartmentId: wallet.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.WALLET_CREDITED,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          oldValue,
          newValue: {
            residentId: wallet.residentId.toString(),
            amount: creditAmount,
            description,
            balance: wallet.balance,
            totalAdded: wallet.totalAdded,
            totalUsed: wallet.totalUsed,
          },
          description: `Wallet ${wallet._id.toString()} credited with ${creditAmount}`,
        },
        session
      );

      creditedWallet = wallet;
    });
  } finally {
    await session.endSession();
  }

  if (!creditedWallet) {
    throw new AppError("Unable to credit wallet", 500);
  }

  return creditedWallet;
};

export const deductWalletFundsService = async (
  apartmentId: string,
  residentId: string,
  billId: string,
  amount: number,
  description: string,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const apartmentObjectId = toObjectId(
    apartmentId,
    "apartmentId"
  );
  const residentObjectId = toObjectId(
    residentId,
    "residentId"
  );
  const billObjectId = toObjectId(billId, "billId");
  let debitedWallet:
    | Awaited<ReturnType<typeof Wallet.findOne>>
    | null = null;

  try {
    await session.withTransaction(async () => {
      await validateResidentOwnership(
        apartmentObjectId,
        residentObjectId,
        session
      );

      const [wallet, bill] = await Promise.all([
        Wallet.findOne({
          apartmentId: apartmentObjectId,
          residentId: residentObjectId,
        }).session(session),
        Billing.findOne({
          _id: billObjectId,
          apartmentId: apartmentObjectId,
          residentId: residentObjectId,
        }).session(session),
      ]);

      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      if (!bill) {
        throw new AppError(
          "Bill not found for this resident wallet",
          404
        );
      }

      const debitAmount = roundMoney(amount);
      const billValues = calculateBillValues(bill);

      if (debitAmount <= 0) {
        throw new AppError(
          "Deduction amount must be greater than 0",
          400
        );
      }

      if (wallet.balance < debitAmount) {
        throw new AppError("Insufficient wallet balance", 400);
      }

      if (debitAmount > billValues.balanceAmount) {
        throw new AppError(
          "Deduction exceeds outstanding bill amount",
          400
        );
      }

      const oldWalletValue = {
        residentId: wallet.residentId.toString(),
        billId,
        balance: wallet.balance,
        totalAdded: wallet.totalAdded,
        totalUsed: wallet.totalUsed,
      };

      const oldBillValue = {
        paidAmount: bill.paidAmount,
        balanceAmount: billValues.balanceAmount,
        status: billValues.status,
      };

      wallet.balance = roundMoney(wallet.balance - debitAmount);
      wallet.totalUsed = roundMoney(
        wallet.totalUsed + debitAmount
      );

      wallet.transactions.push({
        type: WalletTransactionType.DEBIT,
        amount: debitAmount,
        description,
        billId: billObjectId,
        createdAt: new Date(),
      });

      bill.paidAmount = roundMoney(bill.paidAmount + debitAmount);
      applyBillValues(bill);

      const payment = await createPaymentRecordService(
        {
          apartmentId: bill.apartmentId,
          billId: bill._id,
          residentId: bill.residentId,
          unitId: bill.unitId,
          amount: debitAmount,
          source: PaymentSource.WALLET,
          description,
          recordedBy: actor.userId,
        },
        session
      );

      await Promise.all([
        wallet.save({ session }),
        bill.save({ session }),
      ]);

      await createAuditLogService(
        {
          apartmentId: wallet.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.WALLET_DEBITED,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          oldValue: oldWalletValue,
          newValue: {
            residentId: wallet.residentId.toString(),
            billId,
            amount: debitAmount,
            description,
            balance: wallet.balance,
            totalAdded: wallet.totalAdded,
            totalUsed: wallet.totalUsed,
          },
          description: `Wallet ${wallet._id.toString()} debited by ${debitAmount}`,
        },
        session
      );

      await createAuditLogService(
        {
          apartmentId: bill.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.PAYMENT_RECORDED,
          entityType: "Payment",
          entityId: payment._id.toString(),
          oldValue: oldBillValue,
          newValue: {
            billId: bill._id.toString(),
            paymentAmount: debitAmount,
            source: PaymentSource.WALLET,
            paidAmount: bill.paidAmount,
            balanceAmount: bill.balanceAmount,
            status: bill.status,
          },
          description: `Wallet payment of ${debitAmount} recorded for bill ${bill._id.toString()}`,
        },
        session
      );

      debitedWallet = wallet;
    });
  } finally {
    await session.endSession();
  }

  if (!debitedWallet) {
    throw new AppError("Unable to deduct wallet funds", 500);
  }

  return debitedWallet;
};

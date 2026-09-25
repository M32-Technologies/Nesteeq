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

import { Flat } from "../flat/flat.model.js";
import { getAuthDB } from "../../config/auth-db.js";

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

const getAuthUsersFilter = (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const objectIds = uniqueIds
    .filter((userId) => Types.ObjectId.isValid(userId))
    .map((userId) => new Types.ObjectId(userId));

  return {
    $or: [
      { id: { $in: uniqueIds } },
      ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
    ],
  };
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

export const getWalletSummaryService = async (apartmentId: string) => {
  validateObjectId(apartmentId);
  const aptId = new Types.ObjectId(apartmentId);

  const [agg] = await Wallet.aggregate([
    {
      $match: { apartmentId: aptId },
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$balance" },
        totalAdded: { $sum: "$totalAdded" },
        totalUsed: { $sum: "$totalUsed" },
        activeWallets: {
          $sum: {
            $cond: [{ $gt: ["$balance", 0] }, 1, 0],
          },
        },
        zeroBalanceWallets: {
          $sum: {
            $cond: [{ $lte: ["$balance", 0] }, 1, 0],
          },
        },
        totalWallets: { $sum: 1 },
      },
    },
  ]);

  return {
    totalBalance: agg?.totalBalance || 0,
    totalAdded: agg?.totalAdded || 0,
    totalUsed: agg?.totalUsed || 0,
    activeWallets: agg?.activeWallets || 0,
    zeroBalanceWallets: agg?.zeroBalanceWallets || 0,
    totalWallets: agg?.totalWallets || 0,
  };
};

export const getWalletsService = async (
  apartmentId: string,
  query?: { search?: string; status?: string; page?: number; limit?: number }
) => {
  validateObjectId(apartmentId);
  const aptId = new Types.ObjectId(apartmentId);

  const filter: Record<string, any> = { apartmentId: aptId };
  if (query?.status === "ACTIVE") {
    filter.balance = { $gt: 0 };
  } else if (query?.status === "ZERO") {
    filter.balance = { $lte: 0 };
  }

  const wallets = await Wallet.find(filter)
    .sort({ updatedAt: -1 })
    .lean();

  if (wallets.length === 0) {
    return [];
  }

  const residentIds = wallets.map((w) => w.residentId);

  const residents = await ResidentModel.find(
    { _id: { $in: residentIds } },
    "_id userId flatId residentType"
  ).lean();

  const flatIds = residents
    .map((r) => r.flatId)
    .filter((id): id is Types.ObjectId => Boolean(id));

  const flats = await Flat.find(
    { _id: { $in: flatIds } },
    "_id flatNumber"
  ).lean();

  const flatMap = new Map(
    flats.map((f) => [f._id.toString(), f.flatNumber])
  );

  const userIds = residents
    .map((r) => r.userId)
    .filter((id): id is string => Boolean(id));

  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const authUsers = await getAuthDB()
      .collection("user")
      .find(getAuthUsersFilter(userIds))
      .toArray();
    userMap = new Map(
      authUsers.map((u) => [u.id || u._id.toString(), u.name || "Resident"])
    );
  }

  const residentInfoMap = new Map(
    residents.map((r) => {
      const flatNum = r.flatId ? flatMap.get(r.flatId.toString()) : "";
      const name = r.userId ? userMap.get(r.userId) || "Resident" : "Resident";
      return [
        r._id.toString(),
        {
          residentName: name,
          flatNumber: flatNum || "",
          unitName: flatNum ? `Flat ${flatNum}` : "",
          residentType: r.residentType,
        },
      ];
    })
  );

  let mappedWallets = wallets.map((w) => {
    const info = residentInfoMap.get(w.residentId.toString());
    return {
      ...w,
      residentName: info?.residentName || "Resident",
      flatNumber: info?.flatNumber || "",
      unitName: info?.unitName || "",
      residentType: info?.residentType || "",
    };
  });

  if (query?.search?.trim()) {
    const term = query.search.trim().toLowerCase();
    mappedWallets = mappedWallets.filter(
      (w) =>
        (w.residentName || "").toLowerCase().includes(term) ||
        (w.flatNumber || "").toLowerCase().includes(term) ||
        (w.unitName || "").toLowerCase().includes(term)
    );
  }

  return mappedWallets;
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
  }).lean();

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  const resident = await ResidentModel.findById(
    residentId,
    "_id userId flatId residentType"
  ).lean();

  let residentName = "Resident";
  let flatNumber = "";
  let unitName = "";
  let residentType = "";

  if (resident) {
    residentType = resident.residentType;
    if (resident.flatId) {
      const flat = await Flat.findById(resident.flatId, "flatNumber").lean();
      if (flat) {
        flatNumber = flat.flatNumber;
        unitName = `Flat ${flat.flatNumber}`;
      }
    }
    if (resident.userId) {
      const authUser = await getAuthDB()
        .collection("user")
        .findOne({
          $or: [
            { id: resident.userId },
            ...(Types.ObjectId.isValid(resident.userId)
              ? [{ _id: new Types.ObjectId(resident.userId) }]
              : []),
          ],
        });
      if (authUser?.name) {
        residentName = authUser.name;
      }
    }
  }

  return {
    ...wallet,
    residentName,
    flatNumber,
    unitName,
    residentType,
  };
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

      const wallet = await Wallet.findOne({
        apartmentId: apartmentObjectId,
        residentId: residentObjectId,
      }).session(session);

      const bill = await Billing.findOne({
        _id: billObjectId,
        apartmentId: apartmentObjectId,
        residentId: residentObjectId,
      }).session(session);

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

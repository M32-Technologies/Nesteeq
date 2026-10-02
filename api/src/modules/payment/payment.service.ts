import mongoose, { ClientSession, Types } from "mongoose";

import { Payment } from "./payment.model.js";
import { PaymentSource } from "./payment.interface.js";
import { AppError } from "../../utils/AppError.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Billing } from "../billing/billing.model.js";
import { applyBillValues } from "../billing/billing.calculation.js";
import { Wallet } from "../wallet/wallet.model.js";
import { WalletTransactionType } from "../wallet/wallet.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.interface.js";
import { getAuthDB } from "../../config/auth-db.js";

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

export interface CreatePaymentInput {
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
  paidAt?: Date;
}

export interface PaymentFilters {
  apartmentId: string;
  billId?: string;
  residentId?: string;
  source?: PaymentSource;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  includeReversed?: boolean;
  limit?: number;
}

const toObjectId = (value: string, field: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  return new Types.ObjectId(value);
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const generateReceiptNumber = () => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${dateStr}-${randomSuffix}`;
};

const parseLegacyMeta = (description?: string) => {
  let method: string | undefined;
  let ref: string | undefined;
  if (!description) return { method, ref };
  const methodMatch = description.match(/Method:\s*([^|]+)/i);
  if (methodMatch) method = methodMatch[1].trim();
  const refMatch = description.match(/Ref:\s*([^|)]+)/i);
  if (refMatch) ref = refMatch[1].trim();
  return { method, ref };
};

export const createPaymentRecordService = async (
  input: CreatePaymentInput,
  session?: ClientSession
) => {
  const effectiveMethod =
    input.paymentMethod ||
    (input.source === PaymentSource.WALLET ? "WALLET" : "OTHER");

  const [payment] = await Payment.create(
    [
      {
        ...input,
        paymentMethod: effectiveMethod,
        referenceNo: input.referenceNo?.trim() || undefined,
        receiptNumber: input.receiptNumber || generateReceiptNumber(),
        amount: roundMoney(input.amount),
        paidAt: input.paidAt ?? new Date(),
      },
    ],
    {
      session,
    }
  );

  return payment;
};

export const getPaymentsService = async (filters: PaymentFilters) => {
  const aptObjectId = toObjectId(filters.apartmentId, "apartmentId");
  const query: Record<string, unknown> = {
    apartmentId: aptObjectId,
  };

  if (filters.billId) {
    query.billId = toObjectId(filters.billId, "billId");
  }

  if (filters.residentId) {
    query.residentId = toObjectId(filters.residentId, "residentId");
  }

  if (filters.source) {
    query.source = filters.source;
  }

  if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.startDate || filters.endDate) {
    const dateQuery: Record<string, Date> = {};
    if (filters.startDate) {
      dateQuery.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.paidAt = dateQuery;
  }

  if (!filters.includeReversed) {
    query.reversed = { $ne: true };
  }

  // If a text search query is provided
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), "i");
    query.$or = [
      { receiptNumber: searchRegex },
      { referenceNo: searchRegex },
      { description: searchRegex },
    ];
  }

  const payments = await Payment.find(query)
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(Math.min(filters.limit ?? 100, 1000))
    .lean();

  if (payments.length === 0) {
    return [];
  }

  const unitIds = payments.map((p) => p.unitId);
  const residentIds = payments.map((p) => p.residentId);
  const billIds = payments.map((p) => p.billId).filter(Boolean);

  const [flats, residents, bills] = await Promise.all([
    Flat.find({ _id: { $in: unitIds } }, "flatNumber").lean(),
    ResidentModel.find({ _id: { $in: residentIds } }, "_id userId").lean(),
    Billing.find(
      { _id: { $in: billIds } },
      "title billType billingPeriod totalAmount balanceAmount dueDate"
    ).lean(),
  ]);

  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));
  const billMap = new Map(bills.map((b) => [b._id.toString(), b]));
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

  const residentNameMap = new Map(
    residents.map((r) => [
      r._id.toString(),
      r.userId ? userMap.get(r.userId) || "Resident" : "Resident",
    ])
  );

  return payments.map((payment) => {
    const flatNum = flatMap.get(payment.unitId.toString());
    const unitName = flatNum
      ? `Flat ${flatNum}`
      : `Unit ${payment.unitId.toString().slice(-4).toUpperCase()}`;
    const residentName =
      residentNameMap.get(payment.residentId.toString()) ||
      `Resident #${payment.residentId.toString().slice(-4).toUpperCase()}`;

    const bill = payment.billId ? billMap.get(payment.billId.toString()) : null;
    const legacyMeta = parseLegacyMeta(payment.description);

    const paymentMethod =
      payment.paymentMethod ||
      legacyMeta.method ||
      (payment.source === PaymentSource.WALLET ? "WALLET" : "CASH");

    const referenceNo = payment.referenceNo || legacyMeta.ref || "";
    const receiptNumber =
      payment.receiptNumber ||
      `REC-${payment._id.toString().slice(-6).toUpperCase()}`;

    return {
      ...payment,
      receiptNumber,
      paymentMethod,
      referenceNo,
      unitName,
      flatNumber: flatNum || "",
      residentName,
      billTitle:
        bill?.title ||
        (bill?.billType ? bill.billType.replace(/_/g, " ") : "Maintenance Bill"),
      billType: bill?.billType,
      billTotalAmount: bill?.totalAmount,
      billBalanceAmount: bill?.balanceAmount,
      billingPeriod: bill?.billingPeriod,
    };
  });
};

export const reversePaymentService = async (
  paymentId: string,
  apartmentId: string,
  actor: { userId?: string; role?: string },
  reason: string
) => {
  const session = await mongoose.startSession();
  try {
    let result: any = null;
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        _id: toObjectId(paymentId, "paymentId"),
        apartmentId: toObjectId(apartmentId, "apartmentId"),
      }).session(session);

      if (!payment) {
        throw new AppError("Payment record not found", 404);
      }

      if (payment.reversed) {
        throw new AppError("Payment has already been reversed", 400);
      }

      if (!reason || !reason.trim()) {
        throw new AppError("A reason is required to reverse a payment", 400);
      }

      // If associated with a bill, adjust bill's paidAmount and status
      if (payment.billId) {
        const bill = await Billing.findById(payment.billId).session(session);
        if (bill) {
          const oldBillValue = {
            paidAmount: bill.paidAmount,
            balanceAmount: bill.balanceAmount,
            status: bill.status,
          };

          bill.paidAmount = roundMoney(
            Math.max(0, bill.paidAmount - payment.amount)
          );
          applyBillValues(bill);

          if (bill.balanceAmount > 0) {
            bill.settledAt = null as any;
          }

          await bill.save({ session });

          await createAuditLogService(
            {
              apartmentId,
              performedBy: actor.userId,
              action: AuditAction.PAYMENT_REVERSED,
              entityType: "Payment",
              entityId: payment._id.toString(),
              oldValue: {
                ...oldBillValue,
                paymentAmount: payment.amount,
                receiptNumber: payment.receiptNumber,
              },
              newValue: {
                paidAmount: bill.paidAmount,
                balanceAmount: bill.balanceAmount,
                status: bill.status,
                reason,
              },
              description: `Payment ${payment.receiptNumber || payment._id} of ₹${payment.amount} reversed. Reason: ${reason}`,
            },
            session
          );
        }
      }

      // If payment was made from resident wallet, refund the wallet
      if (payment.source === PaymentSource.WALLET && payment.residentId) {
        const wallet = await Wallet.findOne({
          apartmentId: payment.apartmentId,
          residentId: payment.residentId,
        }).session(session);

        if (wallet) {
          wallet.balance = roundMoney(wallet.balance + payment.amount);
          wallet.totalUsed = roundMoney(
            Math.max(0, wallet.totalUsed - payment.amount)
          );
          wallet.transactions.push({
            type: WalletTransactionType.CREDIT,
            amount: payment.amount,
            description: `Refund for reversed payment (${payment.receiptNumber || payment._id.toString().slice(-6)})`,
            billId: payment.billId,
            createdAt: new Date(),
          });
          await wallet.save({ session });
        }
      }

      payment.reversed = true;
      payment.reversedAt = new Date();
      payment.reversedBy = actor.userId;
      payment.reversalReason = reason.trim();
      await payment.save({ session });

      result = payment;
    });

    return result;
  } finally {
    await session.endSession();
  }
};
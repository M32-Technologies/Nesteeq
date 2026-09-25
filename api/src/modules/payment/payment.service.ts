import { ClientSession, Types } from "mongoose";

import { Payment } from "./payment.model.js";
import { PaymentSource } from "./payment.interface.js";
import { AppError } from "../../utils/AppError.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
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

interface CreatePaymentInput {
  apartmentId: Types.ObjectId;
  billId: Types.ObjectId;
  residentId: Types.ObjectId;
  unitId: Types.ObjectId;
  amount: number;
  source: PaymentSource;
  receiptNumber?: string;
  description?: string;
  recordedBy?: string;
  paidAt?: Date;
}

interface PaymentFilters {
  apartmentId: string;
  billId?: string;
  residentId?: string;
  source?: PaymentSource;
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

const generateReceiptNumber = () => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${dateStr}-${randomSuffix}`;
};

export const createPaymentRecordService = async (
  input: CreatePaymentInput,
  session?: ClientSession
) => {
  const [payment] = await Payment.create(
    [
      {
        ...input,
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

export const getPaymentsService = async (
  filters: PaymentFilters
) => {
  const query: Record<string, unknown> = {
    apartmentId: toObjectId(filters.apartmentId, "apartmentId"),
  };

  if (filters.billId) {
    query.billId = toObjectId(filters.billId, "billId");
  }

  if (filters.residentId) {
    query.residentId = toObjectId(
      filters.residentId,
      "residentId"
    );
  }

  if (filters.source) {
    query.source = filters.source;
  }

  const payments = await Payment.find(query)
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(Math.min(filters.limit ?? 50, 100))
    .lean();

  if (payments.length === 0) {
    return [];
  }

  const unitIds = payments.map((p) => p.unitId);
  const residentIds = payments.map((p) => p.residentId);

  const [flats, residents] = await Promise.all([
    Flat.find({ _id: { $in: unitIds } }, "flatNumber").lean(),
    ResidentModel.find({ _id: { $in: residentIds } }, "_id userId").lean(),
  ]);

  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));
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

    return {
      ...payment,
      unitName,
      flatNumber: flatNum || "",
      residentName,
    };
  });
};
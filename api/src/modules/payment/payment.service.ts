import { ClientSession, Types } from "mongoose";

import { Payment } from "./payment.model.js";
import { PaymentSource } from "./payment.interface.js";
import { AppError } from "../../utils/AppError.js";

interface CreatePaymentInput {
  apartmentId: Types.ObjectId;
  billId: Types.ObjectId;
  residentId: Types.ObjectId;
  unitId: Types.ObjectId;
  amount: number;
  source: PaymentSource;
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

export const createPaymentRecordService = async (
  input: CreatePaymentInput,
  session?: ClientSession
) => {
  const [payment] = await Payment.create(
    [
      {
        ...input,
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

  return Payment.find(query)
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(Math.min(filters.limit ?? 50, 100))
    .lean();
};
import { HydratedDocument, Types } from "mongoose";

import {
  BillStatus,
  IAdditionalCharge,
  IBilling,
} from "./billing.interface.js";
import { Billing } from "./billing.model.js";

import { AppError } from "../../utils/AppError.js";

interface CreateBillInput {
  apartmentId: string;
  residentId: string;
  unitId: string;
  baseAmount: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: Date;
  createdBy?: string;
}

interface UpdateBillInput {
  baseAmount?: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate?: Date;
}

interface BillFilters {
  apartmentId?: string;
  residentId?: string;
  unitId?: string;
  status?: BillStatus;
}

type BillingDocument = HydratedDocument<IBilling>;

type BillCalculationInput = Pick<
  IBilling,
  | "baseAmount"
  | "additionalCharges"
  | "lateFeePerDay"
  | "lateFeeWaivedAmount"
  | "paidAmount"
  | "dueDate"
>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toObjectId = (value: string, field: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  return new Types.ObjectId(value);
};

const getAdditionalTotal = (
  charges: IAdditionalCharge[] = []
) => {
  return charges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );
};

const getDaysOverdue = (
  dueDate: Date,
  currentDate: Date = new Date()
) => {
  const due = new Date(dueDate);
  const current = new Date(currentDate);

  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  if (current <= due) {
    return 0;
  }

  return Math.floor(
    (current.getTime() - due.getTime()) / DAY_IN_MS
  );
};

const calculateBillValues = (
  bill: BillCalculationInput
) => {
  const lateFeeAmount =
    getDaysOverdue(bill.dueDate) * bill.lateFeePerDay;

  const effectiveLateFee = Math.max(
    0,
    lateFeeAmount - bill.lateFeeWaivedAmount
  );

  const totalAmount =
    bill.baseAmount +
    getAdditionalTotal(bill.additionalCharges) +
    effectiveLateFee;

  const balanceAmount = Math.max(
    0,
    totalAmount - bill.paidAmount
  );

  let status = BillStatus.PENDING;

  if (balanceAmount === 0) {
    status = BillStatus.PAID;
  } else if (getDaysOverdue(bill.dueDate) > 0) {
    status = BillStatus.OVERDUE;
  } else if (bill.paidAmount > 0) {
    status = BillStatus.PARTIALLY_PAID;
  }

  return {
    lateFeeAmount,
    totalAmount,
    balanceAmount,
    status,
  };
};

const applyBillValues = (bill: BillingDocument) => {
  const values = calculateBillValues(bill);

  bill.lateFeeAmount = values.lateFeeAmount;
  bill.totalAmount = values.totalAmount;
  bill.balanceAmount = values.balanceAmount;
  bill.status = values.status;

  return bill;
};

export const createBillService = async (
  input: CreateBillInput
) => {
  const additionalCharges = input.additionalCharges ?? [];
  const lateFeePerDay = input.lateFeePerDay ?? 0;

  const values = calculateBillValues({
    baseAmount: input.baseAmount,
    additionalCharges,
    lateFeePerDay,
    lateFeeWaivedAmount: 0,
    paidAmount: 0,
    dueDate: input.dueDate,
  });

  return Billing.create({
    apartmentId: toObjectId(input.apartmentId, "apartmentId"),
    residentId: toObjectId(input.residentId, "residentId"),
    unitId: toObjectId(input.unitId, "unitId"),
    baseAmount: input.baseAmount,
    additionalCharges,
    lateFeePerDay,
    lateFeeAmount: values.lateFeeAmount,
    lateFeeWaivedAmount: 0,
    totalAmount: values.totalAmount,
    paidAmount: 0,
    balanceAmount: values.balanceAmount,
    dueDate: input.dueDate,
    status: values.status,
    createdBy: input.createdBy
      ? toObjectId(input.createdBy, "createdBy")
      : undefined,
  });
};

export const getBillsService = async (
  filters: BillFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters.apartmentId) {
    query.apartmentId = toObjectId(
      filters.apartmentId,
      "apartmentId"
    );
  }

  if (filters.residentId) {
    query.residentId = toObjectId(
      filters.residentId,
      "residentId"
    );
  }

  if (filters.unitId) {
    query.unitId = toObjectId(filters.unitId, "unitId");
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const bills = await Billing.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return bills.map((bill) => ({
    ...bill,
    ...calculateBillValues(bill),
  }));
};

export const getBillByIdService = async (
  billId: string
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id).lean();

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  return {
    ...bill,
    ...calculateBillValues(bill),
  };
};

export const updateBillService = async (
  billId: string,
  input: UpdateBillInput
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id);

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  const currentValues = calculateBillValues(bill);

  if (currentValues.status === BillStatus.PAID) {
    throw new AppError("Paid bill cannot be edited", 400);
  }

  if (input.baseAmount !== undefined) {
    bill.baseAmount = input.baseAmount;
  }

  if (input.additionalCharges !== undefined) {
    bill.additionalCharges = input.additionalCharges;
  }

  if (input.lateFeePerDay !== undefined) {
    bill.lateFeePerDay = input.lateFeePerDay;
  }

  if (input.dueDate !== undefined) {
    bill.dueDate = input.dueDate;
  }

  applyBillValues(bill);
  await bill.save();

  return bill;
};

export const recordBillPaymentService = async (
  billId: string,
  amount: number
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id);

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  const currentValues = calculateBillValues(bill);

  if (amount <= 0) {
    throw new AppError(
      "Payment amount must be greater than 0",
      400
    );
  }

  if (amount > currentValues.balanceAmount) {
    throw new AppError(
      "Payment exceeds outstanding amount",
      400
    );
  }

  bill.paidAmount += amount;

  applyBillValues(bill);
  await bill.save();

  return bill;
};

export const waiveLateFeeService = async (
  billId: string,
  amount: number
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id);

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  const currentValues = calculateBillValues(bill);
  const availableLateFee = Math.max(
    0,
    currentValues.lateFeeAmount - bill.lateFeeWaivedAmount
  );

  if (amount <= 0) {
    throw new AppError(
      "Waiver amount must be greater than 0",
      400
    );
  }

  if (amount > availableLateFee) {
    throw new AppError(
      "Waiver amount exceeds available late fee",
      400
    );
  }

  bill.lateFeeWaivedAmount += amount;

  applyBillValues(bill);
  await bill.save();

  return bill;
};

export const getBillingSummaryService = async (
  apartmentId: string
) => {
  const apartmentObjectId = toObjectId(
    apartmentId,
    "apartmentId"
  );

  const bills = await Billing.find({
    apartmentId: apartmentObjectId,
  }).lean();

  return bills.reduce(
    (summary, bill) => {
      const values = calculateBillValues(bill);

      summary.totalBilled += values.totalAmount;
      summary.totalCollected += bill.paidAmount;
      summary.totalOutstanding += values.balanceAmount;
      summary.totalLateFees += values.lateFeeAmount;
      summary.totalBills += 1;

      return summary;
    },
    {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalLateFees: 0,
      totalBills: 0,
    }
  );
};

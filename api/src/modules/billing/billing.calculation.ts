import { HydratedDocument } from "mongoose";

import {
  BillStatus,
  IAdditionalCharge,
  IBilling,
} from "./billing.interface.js";

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

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const getAdditionalTotal = (
  charges: IAdditionalCharge[] = []
) => {
  return roundMoney(
    charges.reduce((sum, charge) => sum + charge.amount, 0)
  );
};

export const getDaysOverdue = (
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

export const calculateBillValues = (
  bill: BillCalculationInput
) => {
  const lateFeeAmount = roundMoney(
    getDaysOverdue(bill.dueDate) * bill.lateFeePerDay
  );

  const effectiveLateFee = roundMoney(
    Math.max(0, lateFeeAmount - bill.lateFeeWaivedAmount)
  );

  const totalAmount = roundMoney(
    bill.baseAmount +
      getAdditionalTotal(bill.additionalCharges) +
      effectiveLateFee
  );

  const balanceAmount = roundMoney(
    Math.max(0, totalAmount - bill.paidAmount)
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

export const applyBillValues = (
  bill: HydratedDocument<IBilling>
) => {
  const values = calculateBillValues(bill);

  bill.lateFeeAmount = values.lateFeeAmount;
  bill.totalAmount = values.totalAmount;
  bill.balanceAmount = values.balanceAmount;
  bill.status = values.status;

  return bill;
};

import { Types } from "mongoose";

import { Billing } from "../billing/billing.model.js";
import { Expense } from "../expense/expense.model.js";

import { BillStatus } from "../billing/billing.interface.js";
import { ExpenseStatus } from "../expense/expense.interface.js";

import { AppError } from "../../utils/AppError.js";

const getApartmentId = (apartmentId: string) => {
  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartmentId", 400);
  }

  return new Types.ObjectId(apartmentId);
};

export const getFinanceSummaryService = async (
  apartmentId: string
) => {
  const id = getApartmentId(apartmentId);

  const [billing, expenses] = await Promise.all([
    Billing.aggregate([
      { $match: { apartmentId: id } },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: "$paidAmount" },
          totalOutstanding: { $sum: "$balanceAmount" },
          totalOverdue: {
            $sum: {
              $cond: [
                { $eq: ["$status", BillStatus.OVERDUE] },
                "$balanceAmount",
                0,
              ],
            },
          },
        },
      },
    ]),

    Expense.aggregate([
      {
        $match: {
          apartmentId: id,
          status: {
            $in: [
              ExpenseStatus.APPROVED,
              ExpenseStatus.PAID,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const totalCollection =
    billing[0]?.totalCollection ?? 0;

  const totalExpenses =
    expenses[0]?.totalExpenses ?? 0;

  return {
    totalCollection,
    totalOutstanding:
      billing[0]?.totalOutstanding ?? 0,
    totalOverdue:
      billing[0]?.totalOverdue ?? 0,
    totalExpenses,
    currentBalance:
      totalCollection - totalExpenses,
  };
};

export const getMonthlyFinanceService = async (
  apartmentId: string,
  month?: number,
  year?: number
) => {
  const id = getApartmentId(apartmentId);

  const selectedYear =
    year ?? new Date().getFullYear();

  const match: Record<string, unknown> = {
    apartmentId: id,
  };

  if (month) {
    match.$expr = {
      $and: [
        { $eq: [{ $month: "$createdAt" }, month] },
        { $eq: [{ $year: "$createdAt" }, selectedYear] },
      ],
    };
  }

  const [collections, expenses] = await Promise.all([
    Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          collection: { $sum: "$paidAmount" },
        },
      },
    ]),

    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          expenses: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  return {
    month: month ?? 0,
    year: selectedYear,
    collection: collections[0]?.collection ?? 0,
    expenses: expenses[0]?.expenses ?? 0,
  };
};
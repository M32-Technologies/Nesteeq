import { Types } from "mongoose";

import { Billing } from "../billing/billing.model.js";
import { Expense } from "../expense/expense.model.js";
import {
  calculateBillValues,
  roundMoney,
} from "../billing/billing.calculation.js";
import { ExpenseStatus } from "../expense/expense.interface.js";
import { Payment } from "../payment/payment.model.js";

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

  const [bills, expenses] = await Promise.all([
    Billing.find({ apartmentId: id }).lean(),
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

  const billingSummary = bills.reduce(
    (summary, bill) => {
      const values = calculateBillValues(bill);

      summary.totalCollection = roundMoney(
        summary.totalCollection + bill.paidAmount
      );
      summary.totalOutstanding = roundMoney(
        summary.totalOutstanding + values.balanceAmount
      );
      summary.totalLateFees = roundMoney(
        summary.totalLateFees + values.lateFeeAmount
      );

      if (values.status === "OVERDUE") {
        summary.totalOverdue = roundMoney(
          summary.totalOverdue + values.balanceAmount
        );
      }

      return summary;
    },
    {
      totalCollection: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      totalLateFees: 0,
    }
  );
  const totalExpenses =
    expenses[0]?.totalExpenses ?? 0;

  return {
    ...billingSummary,
    totalExpenses,
    currentBalance: roundMoney(
      billingSummary.totalCollection - totalExpenses
    ),
  };
};

const getMonthRange = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { start, end };
};

const buildMonthlyRow = async (
  apartmentId: Types.ObjectId,
  year: number,
  month: number
) => {
  const { start, end } = getMonthRange(year, month);

  const [payments, expenses, bills] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          apartmentId,
          paidAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          collection: { $sum: "$amount" },
        },
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          apartmentId,
          expenseDate: { $gte: start, $lt: end },
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
          expenses: { $sum: "$amount" },
        },
      },
    ]),
    Billing.find({
      apartmentId,
      dueDate: { $gte: start, $lt: end },
    }).lean(),
  ]);

  const billTotals = bills.reduce(
    (totals, bill) => {
      const values = calculateBillValues(bill);

      totals.outstanding = roundMoney(
        totals.outstanding + values.balanceAmount
      );
      totals.lateFees = roundMoney(
        totals.lateFees + values.lateFeeAmount
      );

      return totals;
    },
    {
      outstanding: 0,
      lateFees: 0,
    }
  );

  const collection = roundMoney(payments[0]?.collection ?? 0);
  const monthlyExpenses = roundMoney(
    expenses[0]?.expenses ?? 0
  );

  return {
    month,
    year,
    collection,
    expenses: monthlyExpenses,
    outstanding: billTotals.outstanding,
    lateFees: billTotals.lateFees,
    balance: roundMoney(collection - monthlyExpenses),
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

  if (month) {
    const data = await buildMonthlyRow(
      id,
      selectedYear,
      month
    );

    return {
      ...data,
      months: [data],
    };
  }

  const months = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      buildMonthlyRow(id, selectedYear, index + 1)
    )
  );

  const yearlyTotals = months.reduce(
    (totals, row) => {
      totals.collection = roundMoney(
        totals.collection + row.collection
      );
      totals.expenses = roundMoney(
        totals.expenses + row.expenses
      );
      totals.outstanding = roundMoney(
        totals.outstanding + row.outstanding
      );
      totals.lateFees = roundMoney(
        totals.lateFees + row.lateFees
      );
      return totals;
    },
    {
      collection: 0,
      expenses: 0,
      outstanding: 0,
      lateFees: 0,
    }
  );

  return {
    month: 0,
    year: selectedYear,
    ...yearlyTotals,
    balance: roundMoney(
      yearlyTotals.collection - yearlyTotals.expenses
    ),
    months,
  };
};

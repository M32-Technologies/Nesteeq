import { Types } from "mongoose";

import { Billing } from "../billing/billing.model.js";
import { Payment } from "../payment/payment.model.js";
import { Expense } from "../expense/expense.model.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { ExpenseCategory, ExpenseStatus } from "../expense/expense.interface.js";
import { createExpenseService } from "../expense/expense.service.js";
import { getAuthDB } from "../../config/auth-db.js";
import { TreasurerSetting } from "./treasurer.model.js";
import {
  TreasurerChartData,
  TreasurerDashboardData,
  ITreasurerSetting,
} from "./treasurer.types.js";
import {
  calculateBillValues,
  roundMoney,
} from "../billing/billing.calculation.js";
import { AppError } from "../../utils/AppError.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const getApartmentObjectId = (apartmentId: string) => {
  if (!Types.ObjectId.isValid(apartmentId)) {
    throw new AppError("Invalid apartmentId", 400);
  }
  return new Types.ObjectId(apartmentId);
};

export const getTreasurerChartService = async (
  apartmentId: string,
  year?: number
): Promise<TreasurerChartData> => {
  const id = getApartmentObjectId(apartmentId);
  const selectedYear = year ?? new Date().getFullYear();

  const startOfYear = new Date(Date.UTC(selectedYear, 0, 1));
  const endOfYear = new Date(Date.UTC(selectedYear + 1, 0, 1));

  // Perform 3 fast aggregations for the entire 12-month period
  const [paymentsByMonth, expensesByMonth, billsInYear] = await Promise.all([
    Payment.aggregate<{ _id: number; total: number }>([
      {
        $match: {
          apartmentId: id,
          paidAt: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$paidAt" },
          total: { $sum: "$amount" },
        },
      },
    ]),

    Expense.aggregate<{ _id: number; total: number }>([
      {
        $match: {
          apartmentId: id,
          expenseDate: { $gte: startOfYear, $lt: endOfYear },
          status: {
            $in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID],
          },
        },
      },
      {
        $group: {
          _id: { $month: "$expenseDate" },
          total: { $sum: "$amount" },
        },
      },
    ]),

    Billing.find({
      apartmentId: id,
      dueDate: { $gte: startOfYear, $lt: endOfYear },
    }).lean(),
  ]);

  const paymentMap = new Map(paymentsByMonth.map((p) => [p._id, p.total]));
  const expenseMap = new Map(expensesByMonth.map((e) => [e._id, e.total]));

  // Group bill balances by month of dueDate
  const outstandingMap = new Map<number, number>();
  for (const bill of billsInYear) {
    const month = new Date(bill.dueDate).getUTCMonth() + 1;
    const values = calculateBillValues(bill);
    outstandingMap.set(
      month,
      roundMoney((outstandingMap.get(month) ?? 0) + values.balanceAmount)
    );
  }

  // Generate 12 months data
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const collection = roundMoney(paymentMap.get(month) ?? 0);
    const expenses = roundMoney(expenseMap.get(month) ?? 0);
    const outstanding = roundMoney(outstandingMap.get(month) ?? 0);
    const balance = roundMoney(collection - expenses);

    return {
      month,
      monthName: MONTH_NAMES[index],
      collection,
      expenses,
      outstanding,
      balance,
    };
  });

  const totalCollection = roundMoney(
    months.reduce((sum, m) => sum + m.collection, 0)
  );
  const totalExpenses = roundMoney(
    months.reduce((sum, m) => sum + m.expenses, 0)
  );
  const netCashflow = roundMoney(totalCollection - totalExpenses);
  const marginRate =
    totalCollection > 0
      ? Math.round((netCashflow / totalCollection) * 100)
      : 0;
  const hasData = totalCollection > 0 || totalExpenses > 0;

  return {
    year: selectedYear,
    months,
    totalCollection,
    totalExpenses,
    netCashflow,
    marginRate,
    hasData,
  };
};

export const getTreasurerDashboardService = async (
  apartmentId: string
): Promise<TreasurerDashboardData> => {
  const id = getApartmentObjectId(apartmentId);
  const currentYear = new Date().getFullYear();

  // Run summary, chart, pending dues, and recent payments concurrently
  const [bills, expensesAgg, chart, pendingRaw, recentRaw] =
    await Promise.all([
      Billing.find({ apartmentId: id }).lean(),

      Expense.aggregate<{ totalExpenses: number }>([
        {
          $match: {
            apartmentId: id,
            status: {
              $in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID],
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

      getTreasurerChartService(apartmentId, currentYear),

      Billing.find({
        apartmentId: id,
        balanceAmount: { $gt: 0 },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),

      Payment.find({ apartmentId: id })
        .sort({ paidAt: -1 })
        .limit(8)
        .lean(),
    ]);

  // Compute overall financial KPI summary
  const summary = bills.reduce(
    (acc, bill) => {
      const values = calculateBillValues(bill);
      acc.totalCollection = roundMoney(acc.totalCollection + bill.paidAmount);
      acc.totalOutstanding = roundMoney(
        acc.totalOutstanding + values.balanceAmount
      );
      acc.totalLateFees = roundMoney(
        acc.totalLateFees + values.lateFeeAmount
      );
      if (values.status === "OVERDUE") {
        acc.totalOverdue = roundMoney(
          acc.totalOverdue + values.balanceAmount
        );
      }
      return acc;
    },
    {
      totalCollection: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      totalLateFees: 0,
    }
  );

  const totalExpenses = roundMoney(expensesAgg[0]?.totalExpenses ?? 0);
  const currentBalance = roundMoney(summary.totalCollection - totalExpenses);

  // Collect flat IDs to populate human-readable flat numbers for pending and recent lists
  const unitIds = [
    ...pendingRaw.map((b) => b.unitId),
    ...recentRaw.map((p) => p.unitId),
  ];
  const flats = await Flat.find(
    { _id: { $in: unitIds } },
    "flatNumber"
  ).lean();
  const flatMap = new Map(
    flats.map((f) => [f._id.toString(), f.flatNumber])
  );

  // Format pending dues
  const pendingDues = pendingRaw.map((bill) => {
    const values = calculateBillValues(bill);
    return {
      _id: bill._id.toString(),
      unitId: bill.unitId.toString(),
      flatNumber:
        flatMap.get(bill.unitId.toString()) ||
        `Unit ${bill.unitId.toString().slice(-4).toUpperCase()}`,
      residentId: bill.residentId.toString(),
      balanceAmount: values.balanceAmount,
      dueDate: bill.dueDate,
      status: values.status,
    };
  });

  // Format recent payments
  const recentPayments = recentRaw.map((p) => ({
    _id: p._id.toString(),
    residentId: p.residentId.toString(),
    billId: p.billId ? p.billId.toString() : undefined,
    unitId: p.unitId.toString(),
    flatNumber:
      flatMap.get(p.unitId.toString()) ||
      `Unit ${p.unitId.toString().slice(-4).toUpperCase()}`,
    amount: p.amount,
    source: p.source,
    description: p.description,
    paidAt: p.paidAt,
  }));

  return {
    summary: {
      ...summary,
      totalExpenses,
      currentBalance,
    },
    chart,
    pendingDues,
    recentPayments,
  };
};

export const getTreasurerSettingsService = async (apartmentId: string) => {
  const id = getApartmentObjectId(apartmentId);
  let settings = await TreasurerSetting.findOne({ apartmentId: id });
  if (!settings) {
    settings = await TreasurerSetting.create({ apartmentId: id });
  }
  return settings;
};

export const updateTreasurerSettingsService = async (
  apartmentId: string,
  updateData: Partial<ITreasurerSetting>
) => {
  const id = getApartmentObjectId(apartmentId);
  const settings = await TreasurerSetting.findOneAndUpdate(
    { apartmentId: id },
    { $set: updateData },
    { new: true, upsert: true }
  );
  return settings;
};

export const getMaintenancePayoutsService = async (apartmentId: string) => {
  const id = getApartmentObjectId(apartmentId);

  const query: Record<string, unknown> = {
    apartment: id,
    "costReview.status": "APPROVED",
    "costReview.forwardedToRole": "TREASURER",
  };

  const jobs = await (Maintenance as any).find(query)
    .sort({ "costReview.forwardedAt": -1 })
    .lean();

  if (!jobs || jobs.length === 0) {
    return [];
  }

  const userIds = new Set<string>();
  const flatIds = new Set<string>();

  for (const job of jobs) {
    if (job.assignedStaff) userIds.add(job.assignedStaff.toString());
    if (job.costReview?.submittedBy) userIds.add(job.costReview.submittedBy.toString());
    if (job.costReview?.reviewedBy) userIds.add(job.costReview.reviewedBy.toString());
    if (job.flat) flatIds.add(job.flat.toString());
  }

  const flats = flatIds.size > 0
    ? await Flat.find(
        { _id: { $in: Array.from(flatIds).map((fid) => new Types.ObjectId(fid)) } },
        "flatNumber"
      ).lean()
    : [];
  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));

  const uniqueUserIds = Array.from(userIds);
  let userMap = new Map<string, string>();
  if (uniqueUserIds.length > 0) {
    const objectIds = uniqueUserIds
      .filter((uid) => Types.ObjectId.isValid(uid))
      .map((uid) => new Types.ObjectId(uid));
    const authUsers = await getAuthDB()
      .collection("user")
      .find({
        $or: [
          { id: { $in: uniqueUserIds } },
          ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
        ],
      })
      .toArray();
    userMap = new Map(
      authUsers.map((u) => [u.id || u._id.toString(), u.name || "User"])
    );
  }

  return jobs.map((job: any) => {
    const flatNum = job.flat ? flatMap.get(job.flat.toString()) : undefined;
    const techName =
      (job.costReview?.submittedBy ? userMap.get(job.costReview.submittedBy.toString()) : undefined) ||
      (job.assignedStaff ? userMap.get(job.assignedStaff.toString()) : undefined) ||
      "Technician";
    const reviewerName = job.costReview?.reviewedBy
      ? userMap.get(job.costReview.reviewedBy.toString()) || "Facility Manager"
      : "Facility Manager";

    return {
      _id: job._id.toString(),
      title: job.title,
      description: job.description,
      category: job.category,
      flatNumber: flatNum ? `Flat ${flatNum}` : "Common Area",
      amount: job.costReview?.submittedAmount ?? job.finalCost ?? 0,
      technicianName: techName,
      reviewedByName: reviewerName,
      remarks: job.costReview?.remarks || "Cost verified & approved",
      forwardedAt: job.costReview?.forwardedAt || job.costReview?.reviewedAt || job.updatedAt,
      priority: job.priority,
    };
  });
};

export const processMaintenancePayoutService = async (
  jobId: string,
  apartmentId: string,
  input: { paymentMethod?: string; notes?: string },
  actor: { userId: string; name?: string }
) => {
  const aptId = getApartmentObjectId(apartmentId);
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError("Invalid maintenance job ID", 400);
  }

  const job = await (Maintenance as any).findOne({
    _id: new Types.ObjectId(jobId),
    apartment: aptId,
  });

  if (!job) {
    throw new AppError("Maintenance job not found", 404);
  }

  if (
    job.costReview?.status !== "APPROVED" ||
    job.costReview?.forwardedToRole !== "TREASURER"
  ) {
    throw new AppError(
      "Only approved maintenance costs forwarded to Treasurer can be processed",
      400
    );
  }

  const amount = job.costReview?.submittedAmount ?? job.finalCost ?? 0;
  if (amount <= 0) {
    throw new AppError("Maintenance payout amount must be greater than 0", 400);
  }

  // Create an official Expense record
  const createdExpense = await createExpenseService(
    {
      apartmentId: aptId.toString(),
      title: `Maintenance: ${job.title}`,
      description:
        input.notes ||
        `Maintenance payout approved by Facility Manager for ${job.title} (${
          job.costReview?.remarks || ""
        })`.trim(),
      invoiceRef: `MAINT-${job._id.toString().slice(-6).toUpperCase()}`,
      category: ExpenseCategory.MAINTENANCE,
      amount,
      vendorName: job.costReview?.submittedBy || "Maintenance Staff",
      expenseDate: new Date(),
      createdBy: actor.userId,
    },
    { userId: actor.userId }
  );

  const expense = createdExpense as any;

  // Mark the expense as PAID with the selected payment method
  expense.status = ExpenseStatus.PAID;
  expense.paymentMethod = input.paymentMethod || "UPI";
  expense.paidAt = new Date();
  await expense.save();

  // Update the Maintenance document to mark payout settled
  await (Maintenance as any).findByIdAndUpdate(job._id, {
    $set: {
      "costReview.forwardedToRole": "SETTLED",
    },
    $push: {
      workNotes: {
        message: `Treasurer settled payout of ₹${amount} via ${
          input.paymentMethod || "UPI"
        } (Recorded as Society Expense #${expense._id.toString().slice(-6).toUpperCase()})`,
        by: actor.name || "Treasurer",
        role: "treasurer",
        createdAt: new Date(),
      },
    },
  });

  return {
    success: true,
    expense,
    message: `Maintenance payout of ₹${amount} recorded and marked as Paid.`,
  };
};

export const getDefaultersReportService = async (
  apartmentId: string,
  options: {
    overdueDays?: number;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  const aptId = getApartmentObjectId(apartmentId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bills = await Billing.find({
    apartmentId: aptId,
    balanceAmount: { $gt: 0 },
    $or: [{ status: "OVERDUE" }, { dueDate: { $lt: today } }],
  } as any)
    .sort({ dueDate: 1 })
    .lean();

  if (bills.length === 0) {
    return {
      defaulters: [],
      pagination: { total: 0, page: 1, limit: options.limit || 10, totalPages: 1 },
    };
  }

  // Populate resident and flat details
  const residentIds = bills.map((b) => b.residentId);
  const residents = await ResidentModel.find(
    { _id: { $in: residentIds } },
    "_id userId flatId"
  ).lean();

  const flatIds = bills.map((b) => b.unitId).concat(residents.map((r) => r.flatId).filter(Boolean) as any);
  const flats = await Flat.find({ _id: { $in: flatIds } }, "_id flatNumber").lean();
  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));

  const userIds = residents.map((r) => r.userId).filter(Boolean);
  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const authUsers = await getAuthDB()
      .collection("user")
      .find({ id: { $in: userIds } })
      .toArray();
    userMap = new Map(authUsers.map((u) => [u.id || u._id.toString(), u.name || "Resident"]));
  }

  const residentInfoMap = new Map(
    residents.map((r) => {
      const flatNum = r.flatId ? flatMap.get(r.flatId.toString()) : "";
      const name = r.userId ? userMap.get(r.userId) || "Resident" : "Resident";
      return [r._id.toString(), { name, flatNumber: flatNum }];
    })
  );

  let processed = bills.map((bill) => {
    const due = new Date(bill.dueDate);
    const diffTime = Math.max(0, today.getTime() - due.getTime());
    const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const rInfo = residentInfoMap.get(bill.residentId.toString());
    const flatNumber = flatMap.get(bill.unitId.toString()) || rInfo?.flatNumber || "";
    const residentName = rInfo?.name || "Resident";

    return {
      ...bill,
      overdueDays,
      residentName,
      flatNumber,
      unitName: flatNumber ? `Flat ${flatNumber}` : "Unit",
    };
  });

  // Filter by minimum overdue days
  if (options.overdueDays && options.overdueDays > 0) {
    processed = processed.filter((b) => b.overdueDays >= options.overdueDays!);
  }

  // Filter by search term
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    processed = processed.filter(
      (b) =>
        (b.residentName || "").toLowerCase().includes(q) ||
        (b.flatNumber || "").toLowerCase().includes(q) ||
        (b.unitName || "").toLowerCase().includes(q)
    );
  }

  processed.sort((a, b) => b.overdueDays - a.overdueDays);

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginated = processed.slice(start, start + limit);

  return {
    defaulters: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

export const getExpenseBreakdownReportService = async (
  apartmentId: string,
  year: number,
  month?: number
) => {
  const aptId = getApartmentObjectId(apartmentId);

  const startDate = month && month > 0
    ? new Date(Date.UTC(year, month - 1, 1))
    : new Date(Date.UTC(year, 0, 1));
  const endDate = month && month > 0
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year + 1, 0, 1));

  const aggregation = await Expense.aggregate([
    {
      $match: {
        apartmentId: aptId,
        status: { $in: ["APPROVED", "PAID"] },
        expenseDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  const categories: Record<string, { total: number; count: number }> = {};
  let totalAmount = 0;
  let totalCount = 0;

  for (const item of aggregation) {
    const cat = item._id || "OTHER";
    categories[cat] = { total: item.total, count: item.count };
    totalAmount += item.total;
    totalCount += item.count;
  }

  return {
    categories,
    totalAmount,
    totalCount,
    year,
    month: month || null,
  };
};

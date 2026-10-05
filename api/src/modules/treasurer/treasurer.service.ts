import { Types } from "mongoose";

import { Billing } from "../billing/billing.model.js";
import { BillStatus } from "../billing/billing.interface.js";
import { Payment } from "../payment/payment.model.js";
import { Expense } from "../expense/expense.model.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Maintenance } from "../maintenance/maintenance.model.js";
import { ExpenseCategory, ExpenseStatus } from "../expense/expense.interface.js";
import { createExpenseService } from "../expense/expense.service.js";
import { AuditAction } from "../audit/audit.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";
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
import { getMonthlyFinanceService } from "../finance/finance.service.js";
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
          reversed: { $ne: true },
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
      status: { $ne: BillStatus.CANCELLED },
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
      Billing.find({
        apartmentId: id,
        status: { $ne: BillStatus.CANCELLED },
      }).lean(),

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
        status: { $ne: BillStatus.CANCELLED },
        balanceAmount: { $gt: 0 },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),

      Payment.find({ apartmentId: id, reversed: { $ne: true } })
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
    { returnDocument: "after", upsert: true }
  );
  return settings;
};

export const getMaintenancePayoutsService = async (
  apartmentId: string,
  search?: string
) => {
  const id = getApartmentObjectId(apartmentId);
  const aptValues: unknown[] = [apartmentId, String(apartmentId)];
  if (Types.ObjectId.isValid(apartmentId)) {
    aptValues.push(id);
  }

  const query: Record<string, unknown> = {
    apartment: { $in: aptValues },
    "costReview.status": "APPROVED",
  };

  if (search && search.trim()) {
    const rawSearch = search.trim();
    const safeSearch = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(safeSearch, "i");

    const matchedFlats = await Flat.find(
      { apartmentId: id, flatNumber: searchRegex },
      "_id"
    ).lean();
    const flatIds = matchedFlats.map((f) => f._id);

    let matchedUserIds: string[] = [];
    try {
      const authUsers = await getAuthDB()
        .collection("user")
        .find({ name: searchRegex })
        .project({ _id: 1, id: 1 })
        .toArray();
      matchedUserIds = authUsers
        .map((u) => u.id || u._id.toString())
        .filter(Boolean);
    } catch {
      // Ignore auth db lookup errors
    }

    const orConditions: Array<Record<string, unknown>> = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ];

    if (flatIds.length > 0) {
      orConditions.push({ flat: { $in: flatIds } });
    }

    if (matchedUserIds.length > 0) {
      orConditions.push(
        { assignedStaff: { $in: matchedUserIds } },
        { "costReview.submittedBy": { $in: matchedUserIds } },
        { "costReview.reviewedBy": { $in: matchedUserIds } }
      );
    }

    const cleanId = rawSearch.toUpperCase().startsWith("JOB-")
      ? rawSearch.slice(4).trim()
      : rawSearch;
    if (Types.ObjectId.isValid(cleanId)) {
      orConditions.push({ _id: new Types.ObjectId(cleanId) });
    }

    query.$or = orConditions;
  }

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

  const validFlatObjectIds = Array.from(flatIds)
    .filter((fid) => Types.ObjectId.isValid(fid))
    .map((fid) => new Types.ObjectId(fid));

  const flats =
    validFlatObjectIds.length > 0
      ? await Flat.find(
          { _id: { $in: validFlatObjectIds } },
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

  const results = jobs.map((job: any) => {
    const flatNum = job.flat ? (flatMap.get(job.flat.toString()) || job.flat) : undefined;
    const techName =
      (job.costReview?.submittedBy ? userMap.get(job.costReview.submittedBy.toString()) : undefined) ||
      (job.assignedStaff ? userMap.get(job.assignedStaff.toString()) : undefined) ||
      "Technician";
    const reviewerName = job.costReview?.reviewedBy
      ? userMap.get(job.costReview.reviewedBy.toString()) || "Facility Manager"
      : "Facility Manager";

    const isPaid = job.costReview?.forwardedToRole === "SETTLED";

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
      isPaid,
      paymentStatus: isPaid ? "PAID" : "PENDING",
      paidAt: isPaid ? (job.costReview?.settledAt || job.updatedAt) : null,
    };
  });

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    return results.filter(
      (item: any) =>
        item.title?.toLowerCase().includes(q) ||
        item.technicianName?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.flatNumber?.toLowerCase().includes(q) ||
        item.reviewedByName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item._id?.toLowerCase().includes(q)
    );
  }

  return results;
};

export const processMaintenancePayoutService = async (
  jobId: string,
  apartmentId: string,
  input: { paymentMethod?: string; paymentReference?: string; notes?: string },
  actor: { userId: string; name?: string }
) => {
  const aptId = getApartmentObjectId(apartmentId);
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError("Invalid maintenance job ID", 400);
  }

  // Atomically claim the payout to prevent race conditions and duplicate payouts
  const job = await (Maintenance as any).findOneAndUpdate(
    {
      _id: new Types.ObjectId(jobId),
      $or: [{ apartment: aptId }, { apartment: apartmentId }],
      "costReview.status": "APPROVED",
      "costReview.forwardedToRole": { $in: ["TREASURER", null] },
    },
    {
      $set: {
        "costReview.forwardedToRole": "SETTLED",
        "costReview.settledAt": new Date(),
      },
    },
    { returnDocument: "before" }
  );

  if (!job) {
    throw new AppError(
      "Maintenance job not found, not approved, or payout has already been processed",
      400
    );
  }

  const amount = job.costReview?.submittedAmount ?? job.finalCost ?? 0;
  if (amount <= 0) {
    // Revert state if amount is invalid
    await (Maintenance as any).findByIdAndUpdate(job._id, {
      $set: { "costReview.forwardedToRole": "TREASURER" },
    });
    throw new AppError("Maintenance payout amount must be greater than 0", 400);
  }

  // Resolve technician name from Auth DB
  let vendorName = "Maintenance Staff";
  const staffUserId =
    job.costReview?.submittedBy?.toString() || job.assignedStaff?.toString();
  if (staffUserId) {
    const objectIds = Types.ObjectId.isValid(staffUserId)
      ? [new Types.ObjectId(staffUserId)]
      : [];
    const authUser = await getAuthDB()
      .collection("user")
      .findOne({
        $or: [
          { id: staffUserId },
          ...(objectIds.length ? [{ _id: objectIds[0] }] : []),
        ],
      });
    if (authUser?.name) {
      vendorName = authUser.name;
    }
  }

  const baseDesc = `Maintenance payout approved by Facility Manager for ${job.title}${
    job.costReview?.remarks ? ` (${job.costReview.remarks})` : ""
  }`.trim();
  const description = input.notes ? `${baseDesc}. Note: ${input.notes}` : baseDesc;

  // Create an official Expense record
  const createdExpense = await createExpenseService(
    {
      apartmentId: aptId.toString(),
      title: `Maintenance: ${job.title}`,
      description,
      invoiceRef: `MAINT-${job._id.toString().slice(-6).toUpperCase()}`,
      category: ExpenseCategory.MAINTENANCE,
      amount,
      vendorName,
      expenseDate: new Date(),
      createdBy: Types.ObjectId.isValid(actor.userId) ? actor.userId : undefined,
    },
    { userId: actor.userId }
  );

  const expense = createdExpense as any;

  // Mark the expense as PAID with the selected payment details
  expense.status = ExpenseStatus.PAID;
  expense.paymentMethod = input.paymentMethod || "UPI";
  if (input.paymentReference) {
    expense.paymentReference = input.paymentReference;
  }
  expense.paidAt = new Date();
  await expense.save();

  // Create audit log for payment settlement
  await createAuditLogService({
    apartmentId: aptId.toString(),
    performedBy: actor.userId,
    action: AuditAction.EXPENSE_UPDATED,
    entityType: "Expense",
    entityId: expense._id.toString(),
    oldValue: { status: ExpenseStatus.PENDING },
    newValue: {
      status: ExpenseStatus.PAID,
      paymentMethod: expense.paymentMethod,
      paymentReference: expense.paymentReference,
      paidAt: expense.paidAt,
    },
    description: `Maintenance payout expense ${expense._id.toString()} marked as paid via ${
      expense.paymentMethod
    }${expense.paymentReference ? ` (Ref: ${expense.paymentReference})` : ""}`,
  });

  // Update the Maintenance document work notes
  await (Maintenance as any).findByIdAndUpdate(job._id, {
    $push: {
      workNotes: {
        message: `Treasurer settled payout of ₹${amount} via ${
          expense.paymentMethod
        }${
          expense.paymentReference ? ` (Ref: ${expense.paymentReference})` : ""
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
    status: { $ne: BillStatus.CANCELLED },
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

  const totalOverdueAmount = roundMoney(
    processed.reduce((sum, b) => sum + (b.balanceAmount || 0), 0)
  );

  return {
    defaulters: paginated,
    totalOverdueAmount,
    defaulterCount: total,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      pages: totalPages,
    },
  };
};

export const getExpenseBreakdownReportService = async (
  apartmentId: string,
  year?: number,
  month?: number,
  startDateInput?: string,
  endDateInput?: string
) => {
  const aptId = getApartmentObjectId(apartmentId);

  let startDate: Date;
  let endDate: Date;

  if (startDateInput && endDateInput) {
    startDate = new Date(startDateInput);
    endDate = new Date(endDateInput);
  } else {
    const yr = year || new Date().getFullYear();
    startDate = month && month > 0
      ? new Date(Date.UTC(yr, month - 1, 1))
      : new Date(Date.UTC(yr, 0, 1));
    endDate = month && month > 0
      ? new Date(Date.UTC(yr, month, 1))
      : new Date(Date.UTC(yr + 1, 0, 1));
  }

  const aggregation = await Expense.aggregate([
    {
      $match: {
        apartmentId: aptId,
        status: { $in: ["APPROVED", "PAID"] },
        expenseDate: { $gte: startDate, $lte: endDate },
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

  let totalAmount = 0;
  let totalCount = 0;

  for (const item of aggregation) {
    totalAmount += item.total || 0;
    totalCount += item.count || 0;
  }

  const categories = aggregation.map((item) => {
    const cat = item._id || "OTHER";
    const total = item.total || 0;
    const percentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
    return {
      category: cat,
      totalAmount: total,
      total,
      count: item.count || 0,
      percentage: Number(percentage.toFixed(2)),
    };
  });

  return {
    totalApprovedAmount: totalAmount,
    totalAmount,
    totalCount,
    categories,
    year: year || startDate.getFullYear(),
    month: month || null,
  };
};

export const exportTreasurerReportCsvService = async (
  apartmentId: string,
  options: {
    type: "summary" | "defaulters" | "expenses";
    year?: number;
    month?: number;
    days?: number;
    overdueDays?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  if (options.type === "summary") {
    const selectedYear = options.year || new Date().getFullYear();
    const data = await getMonthlyFinanceService(apartmentId, options.month, selectedYear);
    const rows = data.months || [];

    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const header = [
      "Month",
      "Year",
      "Collection",
      "Expenses",
      "Outstanding",
      "Late Fees",
      "Balance",
    ];

    const csvRows = rows.map((row) => [
      escapeCsv(monthLabels[row.month - 1] || `Month ${row.month}`),
      row.year,
      row.collection,
      row.expenses,
      row.outstanding,
      row.lateFees,
      row.balance,
    ]);

    const csvContent = [header.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const filename = `financial-summary-${selectedYear}${
      options.month ? `-${options.month}` : ""
    }.csv`;
    return { csvContent, filename };
  }

  if (options.type === "defaulters") {
    const data = await getDefaultersReportService(apartmentId, {
      overdueDays: options.overdueDays || options.days,
      search: options.search,
      limit: 10000,
    });

    const header = [
      "Flat",
      "Resident",
      "Due Amount (INR)",
      "Due Date",
      "Overdue Days",
      "Status",
    ];

    const csvRows = data.defaulters.map((d) => [
      escapeCsv(d.flatNumber ? `Flat ${d.flatNumber}` : d.unitName || "N/A"),
      escapeCsv(d.residentName || "Resident"),
      d.balanceAmount,
      escapeCsv(d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : "N/A"),
      d.overdueDays,
      d.status,
    ]);

    const csvContent = [header.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const filename = `defaulters-report-${new Date().toISOString().slice(0, 10)}.csv`;
    return { csvContent, filename };
  }

  if (options.type === "expenses") {
    const data = await getExpenseBreakdownReportService(
      apartmentId,
      options.year,
      options.month,
      options.startDate,
      options.endDate
    );

    const header = ["Category", "Amount (INR)", "Expense Count", "Share (%)"];

    const csvRows = data.categories.map((c) => [
      escapeCsv(c.category),
      c.totalAmount,
      c.count,
      escapeCsv(`${c.percentage.toFixed(1)}%`),
    ]);

    const csvContent = [header.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const filename = `expense-breakdown-${options.year || new Date().getFullYear()}${
      options.month ? `-${options.month}` : ""
    }.csv`;
    return { csvContent, filename };
  }

  throw new AppError("Invalid report type for CSV export", 400);
};


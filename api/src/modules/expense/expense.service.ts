import mongoose, { Types } from "mongoose";

import { Expense } from "./expense.model.js";
import {
  ExpenseCategory,
  ExpenseStatus,
} from "./expense.interface.js";
import { AuditAction } from "../audit/audit.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";

import { AppError } from "../../utils/AppError.js";

interface AuditActor {
  userId: string;
}

interface CreateExpenseInput {
  apartmentId: string;
  title: string;
  description?: string;
  invoiceRef?: string;
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: Date;
  createdBy?: string;
}

interface UpdateExpenseInput {
  title?: string;
  description?: string;
  invoiceRef?: string;
  category?: ExpenseCategory;
  amount?: number;
  vendorName?: string;
  expenseDate?: Date;
  status?: ExpenseStatus;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
}

interface ExpenseFilters {
  apartmentId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

const validateObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ObjectId", 400);
  }
};

const allowedStatusTransitions: Record<
  ExpenseStatus,
  ExpenseStatus[]
> = {
  [ExpenseStatus.PENDING]: [
    ExpenseStatus.PENDING,
    ExpenseStatus.APPROVED,
    ExpenseStatus.REJECTED,
  ],
  [ExpenseStatus.APPROVED]: [
    ExpenseStatus.APPROVED,
    ExpenseStatus.PAID,
  ],
  [ExpenseStatus.PAID]: [ExpenseStatus.PAID],
  [ExpenseStatus.REJECTED]: [ExpenseStatus.REJECTED],
};

const assertExpenseStatusTransition = (
  currentStatus: ExpenseStatus,
  nextStatus?: ExpenseStatus
) => {
  if (!nextStatus || nextStatus === currentStatus) {
    return;
  }

  if (
    !allowedStatusTransitions[currentStatus].includes(nextStatus)
  ) {
    throw new AppError(
      `Expense status cannot change from ${currentStatus} to ${nextStatus}`,
      400
    );
  }
};

const getExpenseAuditValue = (expense: {
  title: string;
  description?: string;
  invoiceRef?: string;
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: Date;
  status: ExpenseStatus;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
  createdBy?: Types.ObjectId;
}) => ({
  title: expense.title,
  description: expense.description,
  invoiceRef: expense.invoiceRef,
  category: expense.category,
  amount: expense.amount,
  vendorName: expense.vendorName,
  expenseDate: expense.expenseDate,
  status: expense.status,
  rejectionReason: expense.rejectionReason,
  paymentMethod: expense.paymentMethod,
  paymentReference: expense.paymentReference,
  paidAt: expense.paidAt,
  createdBy: expense.createdBy?.toString(),
});

export const createExpenseService = async (
  input: CreateExpenseInput,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  validateObjectId(input.apartmentId);

  if (input.createdBy) {
    validateObjectId(input.createdBy);
  }

  let createdExpense:
    | Awaited<ReturnType<typeof Expense.findById>>
    | null = null;

  try {
    await session.withTransaction(async () => {
      const [expense] = await Expense.create(
        [
          {
            ...input,
            status: ExpenseStatus.PENDING,
          },
        ],
        { session }
      );

      await createAuditLogService(
        {
          apartmentId: expense.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.EXPENSE_CREATED,
          entityType: "Expense",
          entityId: expense._id.toString(),
          newValue: getExpenseAuditValue(expense),
          description: `Expense ${expense._id.toString()} created`,
        },
        session
      );

      createdExpense = expense;
    });
  } finally {
    await session.endSession();
  }

  if (!createdExpense) {
    throw new AppError("Unable to create expense", 500);
  }

  return createdExpense;
};

const escapeRegex = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getExpensesService = async (
  filters: ExpenseFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters.apartmentId) {
    validateObjectId(filters.apartmentId);
    query.apartmentId = filters.apartmentId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const safeSearch = escapeRegex(filters.search.trim());
    const searchRegex = new RegExp(safeSearch, "i");
    query.$or = [
      { title: searchRegex },
      { vendorName: searchRegex },
      { invoiceRef: searchRegex },
      { description: searchRegex },
    ];
  }

  if (filters.startDate || filters.endDate) {
    const dateQuery: Record<string, unknown> = {};
    if (filters.startDate) {
      dateQuery.$gte = filters.startDate;
    }
    if (filters.endDate) {
      dateQuery.$lte = filters.endDate;
    }
    query.expenseDate = dateQuery;
  }

  return Expense.find(query).sort({
    expenseDate: -1,
  });
};

export const getExpenseByIdService = async (
  expenseId: string
) => {
  validateObjectId(expenseId);

  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};

export const updateExpenseService = async (
  expenseId: string,
  input: UpdateExpenseInput,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  validateObjectId(expenseId);
  let updatedExpense:
    | Awaited<ReturnType<typeof Expense.findById>>
    | null = null;

  try {
    await session.withTransaction(async () => {
      const existingExpense = await Expense.findById(expenseId)
        .session(session)
        .lean();

      if (!existingExpense) {
        throw new AppError("Expense not found", 404);
      }

      assertExpenseStatusTransition(
        existingExpense.status,
        input.status
      );

      const updateData: UpdateExpenseInput = { ...input };
      if (
        updateData.status === ExpenseStatus.PAID &&
        !updateData.paidAt
      ) {
        updateData.paidAt = new Date();
      }

      const expense = await Expense.findByIdAndUpdate(
        expenseId,
        updateData,
        {
          returnDocument: "after",
          runValidators: true,
          session,
        }
      );

      if (!expense) {
        throw new AppError("Expense not found", 404);
      }

      const wasApproved =
        existingExpense.status !== ExpenseStatus.APPROVED &&
        expense.status === ExpenseStatus.APPROVED;

      const wasRejected =
        existingExpense.status !== ExpenseStatus.REJECTED &&
        expense.status === ExpenseStatus.REJECTED;

      const wasPaid =
        existingExpense.status !== ExpenseStatus.PAID &&
        expense.status === ExpenseStatus.PAID;

      let description = `Expense ${expense._id.toString()} updated`;
      if (wasApproved) {
        description = `Expense ${expense._id.toString()} approved`;
      } else if (wasRejected) {
        description = `Expense ${expense._id.toString()} rejected${
          expense.rejectionReason ? `: ${expense.rejectionReason}` : ""
        }`;
      } else if (wasPaid) {
        description = `Expense ${expense._id.toString()} marked as paid${
          expense.paymentMethod ? ` via ${expense.paymentMethod}` : ""
        }${
          expense.paymentReference ? ` (Ref: ${expense.paymentReference})` : ""
        }`;
      }

      await createAuditLogService(
        {
          apartmentId: expense.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.EXPENSE_UPDATED,
          entityType: "Expense",
          entityId: expense._id.toString(),
          oldValue: getExpenseAuditValue(existingExpense),
          newValue: getExpenseAuditValue(expense),
          description,
        },
        session
      );

      updatedExpense = expense;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedExpense) {
    throw new AppError("Expense not found", 404);
  }

  return updatedExpense;
};

export const getExpenseSummaryService = async (
  apartmentId: string
) => {
  validateObjectId(apartmentId);
  const id = new Types.ObjectId(apartmentId);

  const [result] = await Expense.aggregate([
    { $match: { apartmentId: id } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" },
        approvedExpenses: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  [ExpenseStatus.APPROVED, ExpenseStatus.PAID],
                ],
              },
              "$amount",
              0,
            ],
          },
        },
        pendingExpenses: {
          $sum: {
            $cond: [
              { $eq: ["$status", ExpenseStatus.PENDING] },
              "$amount",
              0,
            ],
          },
        },
        pendingCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", ExpenseStatus.PENDING] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    totalExpenses: result?.totalExpenses ?? 0,
    approvedExpenses: result?.approvedExpenses ?? 0,
    pendingExpenses: result?.pendingExpenses ?? 0,
    pendingCount: result?.pendingCount ?? 0,
  };
};

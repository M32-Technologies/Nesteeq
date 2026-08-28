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
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: Date;
  createdBy?: string;
}

interface UpdateExpenseInput {
  title?: string;
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  vendorName?: string;
  expenseDate?: Date;
  status?: ExpenseStatus;
}

interface ExpenseFilters {
  apartmentId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
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
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: Date;
  status: ExpenseStatus;
  createdBy?: Types.ObjectId;
}) => ({
  title: expense.title,
  description: expense.description,
  category: expense.category,
  amount: expense.amount,
  vendorName: expense.vendorName,
  expenseDate: expense.expenseDate,
  status: expense.status,
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

      const expense = await Expense.findByIdAndUpdate(
        expenseId,
        input,
        {
          new: true,
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

      await createAuditLogService(
        {
          apartmentId: expense.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.EXPENSE_UPDATED,
          entityType: "Expense",
          entityId: expense._id.toString(),
          oldValue: getExpenseAuditValue(existingExpense),
          newValue: getExpenseAuditValue(expense),
          description: wasApproved
            ? `Expense ${expense._id.toString()} approved`
            : `Expense ${expense._id.toString()} updated`,
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

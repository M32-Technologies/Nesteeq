import { Types } from "mongoose";

export enum ExpenseCategory {
  MAINTENANCE = "MAINTENANCE",
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  SECURITY = "SECURITY",
  CLEANING = "CLEANING",
  REPAIR = "REPAIR",
  SALARY = "SALARY",
  OTHER = "OTHER",
}

export enum ExpenseStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export interface IExpense {
  apartmentId: Types.ObjectId;

  title: string;
  description?: string;

  category: ExpenseCategory;

  amount: number;

  vendorName?: string;

  expenseDate: Date;

  status: ExpenseStatus;

  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
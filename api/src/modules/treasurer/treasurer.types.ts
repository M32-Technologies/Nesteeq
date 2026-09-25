import { Types } from "mongoose";

export interface TreasurerChartMonth {
  month: number;
  monthName: string;
  collection: number;
  expenses: number;
  outstanding: number;
  balance: number;
}

export interface TreasurerChartData {
  year: number;
  months: TreasurerChartMonth[];
  totalCollection: number;
  totalExpenses: number;
  netCashflow: number;
  marginRate: number;
  hasData: boolean;
}

export interface TreasurerFinanceSummary {
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalLateFees: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface TreasurerPendingDue {
  _id: string;
  unitId: string;
  flatNumber: string;
  residentId: string;
  balanceAmount: number;
  dueDate: Date | string;
  status: string;
}

export interface TreasurerRecentPayment {
  _id: string;
  residentId: string;
  billId?: string;
  unitId: string;
  flatNumber: string;
  amount: number;
  source: string;
  description?: string;
  paidAt: Date | string;
}

export interface TreasurerDashboardData {
  summary: TreasurerFinanceSummary;
  chart: TreasurerChartData;
  pendingDues: TreasurerPendingDue[];
  recentPayments: TreasurerRecentPayment[];
}

export interface ITreasurerSetting {
  apartmentId: Types.ObjectId;
  defaultLateFeePerDay: number;
  gracePeriodDays: number;
  currency: string;
  fiscalYearStartMonth: number;
  autoReminderEnabled: boolean;
  emergencyReserveTarget: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

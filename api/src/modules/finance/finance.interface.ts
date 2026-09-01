export interface IFinanceSummary {
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalLateFees: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface IMonthlyFinanceData {
  month: number;
  year: number;
  collection: number;
  expenses: number;
  outstanding?: number;
  lateFees?: number;
  balance?: number;
}

export interface IFinanceFilters {
  apartmentId: string;
  month?: number;
  year?: number;
}

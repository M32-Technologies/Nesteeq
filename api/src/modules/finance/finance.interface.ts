export interface IFinanceSummary {
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface IMonthlyFinanceData {
  month: number;
  year: number;
  collection: number;
  expenses: number;
}

export interface IFinanceFilters {
  apartmentId: string;
  month?: number;
  year?: number;
}
export type BillStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type BillStatusFilter = "ALL" | BillStatus;

export type PaymentSource = "MANUAL" | "WALLET";
export type PaymentSourceFilter = "ALL" | PaymentSource;

export interface AdditionalCharge {
  title: string;
  amount: number;
  reason?: string;
}

export interface Bill {
  _id: string;
  apartmentId: string;
  residentId: string;
  unitId: string;
  baseAmount: number;
  additionalCharges: AdditionalCharge[];
  lateFeePerDay: number;
  lateFeeAmount: number;
  lateFeeWaivedAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: BillStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  apartmentId: string;
  billId: string;
  residentId: string;
  unitId: string;
  amount: number;
  source: PaymentSource;
  description?: string;
  recordedBy?: string;
  paidAt: string;
  createdAt?: string;
}

export interface FinanceSummary {
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalLateFees: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface GetManagerBillsParams {
  residentId?: string;
  unitId?: string;
  status?: BillStatusFilter;
}

export interface GetManagerPaymentsParams {
  billId?: string;
  residentId?: string;
  source?: PaymentSourceFilter;
  limit?: number;
}

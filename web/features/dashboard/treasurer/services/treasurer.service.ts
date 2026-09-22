export type BillStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE";

export type ExpenseCategory =
  | "MAINTENANCE"
  | "ELECTRICITY"
  | "WATER"
  | "SECURITY"
  | "CLEANING"
  | "REPAIR"
  | "SALARY"
  | "OTHER";

export type ExpenseStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

export type PaymentSource = "MANUAL" | "WALLET";

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
  commonBillId?: string | null;
  title?: string | null;
  billType?: string;
  billingPeriod?: string | null;
  description?: string | null;
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
  unitName?: string;
  flatNumber?: string;
  residentName?: string;
}

export interface CommonBillStats {
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectedAmount: number;
  outstandingAmount: number;
}

export interface CommonBill {
  _id: string;
  apartmentId: string;
  title: string;
  billType: string;
  billingPeriod?: string | null;
  description?: string | null;
  baseAmount: number;
  additionalCharges: AdditionalCharge[];
  lateFeePerDay: number;
  dueDate: string;
  targetType: "ALL_FLATS" | "BY_BLOCK" | "CUSTOM_FLATS";
  targetBlockIds?: string[];
  targetFlatIds?: string[];
  totalFlatsCount: number;
  totalAmount: number;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
  updatedAt?: string;
  stats?: CommonBillStats;
}

export interface CreateCommonBillPayload {
  title: string;
  billType: string;
  billingPeriod?: string | null;
  description?: string | null;
  baseAmount: number;
  additionalCharges?: AdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: string;
  targetType: "ALL_FLATS" | "BY_BLOCK" | "CUSTOM_FLATS";
  targetBlockIds?: string[];
  targetFlatIds?: string[];
}

export interface BillRecipient {
  unitId: string;
  flatNumber: string;
  unitName: string;
  residentId: string | null;
  residentName: string;
  hasResident: boolean;
  residentType: string | null;
}

export interface CreateBillPayload {
  apartmentId?: string;
  residentId?: string;
  unitId: string;
  baseAmount: number;
  additionalCharges?: AdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: string;
}

export interface UpdateBillPayload {
  baseAmount?: number;
  additionalCharges?: AdditionalCharge[];
  lateFeePerDay?: number;
  dueDate?: string;
}

export interface GetBillsParams {
  apartmentId?: string;
  residentId?: string;
  unitId?: string;
  commonBillId?: string;
  billType?: string;
  status?: BillStatus;
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
  unitName?: string;
  flatNumber?: string;
  residentName?: string;
}

export interface FinanceSummary {
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalLateFees: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface MonthlyFinanceRow {
  month: number;
  year: number;
  collection: number;
  expenses: number;
  outstanding: number;
  lateFees: number;
  balance: number;
}

export interface MonthlyFinanceResponse extends MonthlyFinanceRow {
  months: MonthlyFinanceRow[];
}

export interface Expense {
  _id: string;
  apartmentId: string;
  title: string;
  description?: string;
  invoiceRef?: string;
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: string;
  status: ExpenseStatus;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  pendingCount: number;
}

export interface CreateExpensePayload {
  apartmentId?: string;
  title: string;
  description?: string;
  invoiceRef?: string;
  category: ExpenseCategory;
  amount: number;
  vendorName?: string;
  expenseDate: string;
}

export interface UpdateExpensePayload {
  title?: string;
  description?: string;
  invoiceRef?: string;
  category?: ExpenseCategory;
  amount?: number;
  vendorName?: string;
  expenseDate?: string;
  status?: ExpenseStatus;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
}

export type WalletTransactionType = "CREDIT" | "DEBIT";

export interface WalletTransaction {
  _id?: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  billId?: string;
  createdAt?: string;
}

export interface Wallet {
  _id: string;
  apartmentId: string;
  residentId: string;
  balance: number;
  totalAdded: number;
  totalUsed: number;
  transactions: WalletTransaction[];
  residentName?: string;
  flatNumber?: string;
  unitName?: string;
  residentType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  apartmentId: string;
  performedBy?: string;
  performedByName?: string;
  action: string;
  entityType: string;
  entityId: string;
  residentName?: string;
  flatNumber?: string;
  unitName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  oldValueFormatted?: Record<string, unknown>;
  newValueFormatted?: Record<string, unknown>;
  description?: string;
  createdAt?: string;
}

const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl.replace(/\/$/, "");
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    const details = Array.isArray(data?.details)
      ? data.details
          .map((detail: unknown) => {
            if (
              detail &&
              typeof detail === "object" &&
              "message" in detail
            ) {
              const path =
                "path" in detail &&
                typeof detail.path === "string"
                  ? `${detail.path}: `
                  : "";

              return `${path}${String(detail.message)}`;
            }

            return String(detail);
          })
          .filter(Boolean)
      : [];

    return details.length
      ? `${message}: ${details.join("; ")}`
      : message;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = await response.json();

  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    return result.data as T;
  }

  return result as T;
};

const toQuery = (params: object) => {
  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      (typeof value === "string" ||
        typeof value === "number") &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getBills = (params: GetBillsParams = {}) =>
  request<Bill[]>(`/api/bills${toQuery(params)}`);

export const getBillRecipients = (params: { apartmentId?: string } = {}) =>
  request<BillRecipient[]>(`/api/bills/recipients${toQuery(params)}`);

export const createBill = (payload: CreateBillPayload) =>
  request<Bill>("/api/bills", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createCommonBill = (payload: CreateCommonBillPayload) =>
  request<{
    commonBill: CommonBill;
    generatedCount: number;
    totalAmount: number;
    message: string;
  }>("/api/bills/common", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCommonBills = (params: { billType?: string; status?: string } = {}) =>
  request<CommonBill[]>(`/api/bills/common${toQuery(params)}`);

export const updateBill = (
  billId: string,
  payload: UpdateBillPayload,
) =>
  request<Bill>(`/api/bills/${encodeURIComponent(billId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const recordBillPayment = (
  billId: string,
  amount: number,
  options?: {
    paymentMethod?: string;
    referenceNo?: string;
    description?: string;
  },
) =>
  request<Bill>(
    `/api/bills/${encodeURIComponent(billId)}/payment`,
    {
      method: "PATCH",
      body: JSON.stringify({ amount, ...options }),
    },
  );

export const waiveLateFee = (billId: string, amount: number) =>
  request<Bill>(
    `/api/bills/${encodeURIComponent(billId)}/waive-late-fee`,
    {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    },
  );

export const getPayments = (
  params: {
    apartmentId?: string;
    billId?: string;
    residentId?: string;
    source?: PaymentSource;
    limit?: number;
  } = {},
) => request<Payment[]>(`/api/payments${toQuery(params)}`);

export const getFinanceSummary = () =>
  request<FinanceSummary>("/api/finance/summary");

export const getMonthlyFinance = (
  params: { month?: number; year?: number } = {},
) =>
  request<MonthlyFinanceResponse>(
    `/api/finance/monthly${toQuery(params)}`,
  );

export const getExpenses = (
  params: {
    apartmentId?: string;
    category?: ExpenseCategory;
    status?: ExpenseStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) => request<Expense[]>(`/api/expenses${toQuery(params)}`);

export const getExpenseSummary = (
  params: { apartmentId?: string } = {},
) => request<ExpenseSummary>(`/api/expenses/summary${toQuery(params)}`);

export const createExpense = (payload: CreateExpensePayload) =>
  request<Expense>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateExpense = (
  expenseId: string,
  payload: UpdateExpensePayload,
) =>
  request<Expense>(
    `/api/expenses/${encodeURIComponent(expenseId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

export const getWallets = () => request<Wallet[]>("/api/wallets");

export const creditWallet = (payload: {
  residentId: string;
  amount: number;
  description: string;
}) =>
  request<Wallet>(
    `/api/wallets/${encodeURIComponent(payload.residentId)}/add-funds`,
    {
      method: "PATCH",
      body: JSON.stringify({
        amount: payload.amount,
        description: payload.description,
      }),
    },
  );

export const deductWallet = (payload: {
  residentId: string;
  billId: string;
  amount: number;
  description: string;
}) =>
  request<Wallet>(
    `/api/wallets/${encodeURIComponent(payload.residentId)}/deduct`,
    {
      method: "PATCH",
      body: JSON.stringify({
        billId: payload.billId,
        amount: payload.amount,
        description: payload.description,
      }),
    },
  );

export const getAuditLogs = (
  params: {
    apartmentId?: string;
    performedBy?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
  } = {},
) => request<AuditLog[]>(`/api/audit${toQuery(params)}`);

export interface MaintenancePayout {
  _id: string;
  title: string;
  description?: string;
  category: string;
  flatNumber: string;
  amount: number;
  technicianName: string;
  reviewedByName: string;
  remarks: string;
  forwardedAt: string;
  priority?: string;
}

export const getMaintenancePayouts = () =>
  request<MaintenancePayout[]>("/api/treasurer/maintenance-payouts");

export const processMaintenancePayout = (
  jobId: string,
  payload: { paymentMethod?: string; notes?: string } = {}
) =>
  request<Expense>(
    `/api/treasurer/maintenance-payouts/${encodeURIComponent(jobId)}/process`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );


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

export interface TreasurerPendingDue {
  _id: string;
  unitId: string;
  flatNumber: string;
  residentId: string;
  balanceAmount: number;
  dueDate: string;
  status: string;
}

export interface TreasurerRecentPayment {
  _id: string;
  residentId: string;
  billId?: string;
  unitId: string;
  flatNumber: string;
  amount: number;
  source: PaymentSource;
  description?: string;
  paidAt: string;
}

export interface TreasurerDashboardResponse {
  summary: FinanceSummary;
  chart: TreasurerChartData;
  pendingDues: TreasurerPendingDue[];
  recentPayments: TreasurerRecentPayment[];
}

export const getTreasurerDashboard = () =>
  request<TreasurerDashboardResponse>("/api/treasurer/dashboard");

export const getTreasurerChart = (year?: number) =>
  request<TreasurerChartData>(`/api/treasurer/chart${toQuery({ year })}`);

export interface BillingSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalLateFees: number;
  totalOverdue: number;
  totalBills: number;
}

export const getBillingSummary = () =>
  request<BillingSummary>("/api/bills/summary");

export interface WalletSummary {
  totalBalance: number;
  totalAdded: number;
  totalUsed: number;
  activeWallets: number;
  zeroBalanceWallets: number;
}

export const getWalletSummary = () =>
  request<WalletSummary>("/api/wallets/summary");

export interface DefaulterReportRow {
  billId: string;
  residentId: string;
  residentName: string;
  residentEmail?: string;
  residentPhone?: string;
  flatNumber: string;
  unitName?: string;
  balanceAmount: number;
  totalAmount: number;
  dueDate: string;
  overdueDays: number;
  status: string;
}

export interface DefaultersReportResponse {
  defaulters: DefaulterReportRow[];
  totalOverdueAmount: number;
  defaulterCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getDefaultersReport = (
  params: {
    days?: number;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) =>
  request<DefaultersReportResponse>(
    `/api/treasurer/reports/defaulters${toQuery(params)}`
  );

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategory;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface ExpenseBreakdownResponse {
  totalApprovedAmount: number;
  categories: ExpenseCategoryBreakdown[];
}

export const getExpenseBreakdownReport = (
  params: {
    startDate?: string;
    endDate?: string;
  } = {}
) =>
  request<ExpenseBreakdownResponse>(
    `/api/treasurer/reports/expense-breakdown${toQuery(params)}`
  );


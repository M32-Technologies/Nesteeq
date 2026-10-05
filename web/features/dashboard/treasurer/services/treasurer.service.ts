export type BillStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

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
  settledAt?: string | null;
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
  blockId?: string | null;
  blockName?: string | null;
}

export interface CreateBillPayload {
  apartmentId?: string;
  residentId?: string;
  unitId: string;
  title?: string;
  billType?: string;
  billingPeriod?: string | null;
  description?: string | null;
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
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBillsResponse {
  bills: Bill[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Payment {
  _id: string;
  apartmentId: string;
  billId: string;
  residentId: string;
  unitId: string;
  amount: number;
  source: PaymentSource;
  paymentMethod?: string;
  referenceNo?: string;
  receiptNumber?: string;
  description?: string;
  recordedBy?: string;
  paidAt: string;
  createdAt?: string;
  unitName?: string;
  flatNumber?: string;
  residentName?: string;
  billTitle?: string;
  billType?: string;
  billTotalAmount?: number;
  billBalanceAmount?: number;
  billingPeriod?: string;
  reversed?: boolean;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
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
  totalCount?: number;
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return apiUrl ? apiUrl.replace(/\/$/, "") : "";
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
  const normalizedPath = path.startsWith("/api/v1/")
    ? path
    : path.replace(/^\/api\//, "/api/v1/");
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
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
        typeof value === "number" ||
        typeof value === "boolean") &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export function getBills(
  params: GetBillsParams & { page: number },
): Promise<PaginatedBillsResponse>;
export function getBills(
  params?: GetBillsParams,
): Promise<Bill[]>;
export function getBills(
  params: GetBillsParams = {},
): Promise<Bill[] | PaginatedBillsResponse> {
  return request<Bill[] | PaginatedBillsResponse>(`/api/bills${toQuery(params)}`);
}

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

export const waiveLateFee = (billId: string, amount: number, reason?: string) =>
  request<Bill>(
    `/api/bills/${encodeURIComponent(billId)}/waive-late-fee`,
    {
      method: "PATCH",
      body: JSON.stringify({ amount, reason }),
    },
  );

export const deleteBill = (billId: string, reason?: string) =>
  request<{ success: boolean; message: string }>(
    `/api/bills/${encodeURIComponent(billId)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    },
  );

export interface PaymentMetrics {
  totalCollected: number;
  digitalCollected: number;
  cashCollected: number;
  totalCount: number;
  validCount: number;
  reversedCount: number;
}

export interface PaginatedPaymentsResponse {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics?: PaymentMetrics;
}

export interface GetPaymentsParams {
  apartmentId?: string;
  billId?: string;
  residentId?: string;
  source?: PaymentSource;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  includeReversed?: boolean;
  page?: number;
  limit?: number;
}

export function getPayments(
  params: GetPaymentsParams & { page: number },
): Promise<PaginatedPaymentsResponse>;
export function getPayments(
  params?: GetPaymentsParams,
): Promise<Payment[]>;
export function getPayments(
  params: GetPaymentsParams = {},
): Promise<Payment[] | PaginatedPaymentsResponse> {
  return request<Payment[] | PaginatedPaymentsResponse>(
    `/api/payments${toQuery(params)}`,
  );
}

export const reversePayment = (paymentId: string, reason: string) =>
  request<{ success: boolean; message: string; data: Payment }>(
    `/api/payments/${encodeURIComponent(paymentId)}/reverse`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );

export const getFinanceSummary = () =>
  request<FinanceSummary>("/api/finance/summary");

export const getMonthlyFinance = (
  params: { month?: number; year?: number } = {},
) =>
  request<MonthlyFinanceResponse>(
    `/api/finance/monthly${toQuery(params)}`,
  );

export interface PaginatedExpensesResponse {
  expenses: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetExpensesParams {
  apartmentId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function getExpenses(
  params: GetExpensesParams & { page: number },
): Promise<PaginatedExpensesResponse>;
export function getExpenses(
  params?: GetExpensesParams,
): Promise<Expense[]>;
export function getExpenses(
  params: GetExpensesParams = {},
): Promise<Expense[] | PaginatedExpensesResponse> {
  return request<Expense[] | PaginatedExpensesResponse>(
    `/api/expenses${toQuery(params)}`,
  );
}

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

export interface PaginatedWalletsResponse {
  wallets: Wallet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetWalletsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function getWallets(
  params: GetWalletsParams & { page: number },
): Promise<PaginatedWalletsResponse>;
export function getWallets(
  params?: GetWalletsParams,
): Promise<Wallet[]>;
export function getWallets(
  params: GetWalletsParams = {},
): Promise<Wallet[] | PaginatedWalletsResponse> {
  return request<Wallet[] | PaginatedWalletsResponse>(
    `/api/wallets${toQuery(params)}`,
  );
}

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

export interface PaginatedAuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetAuditLogsParams {
  apartmentId?: string;
  performedBy?: string;
  action?: string;
  actionCategory?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function getAuditLogs(
  params: GetAuditLogsParams & { page: number },
): Promise<PaginatedAuditLogsResponse>;
export function getAuditLogs(
  params?: GetAuditLogsParams,
): Promise<AuditLog[]>;
export function getAuditLogs(
  params: GetAuditLogsParams = {},
): Promise<AuditLog[] | PaginatedAuditLogsResponse> {
  return request<AuditLog[] | PaginatedAuditLogsResponse>(
    `/api/audit${toQuery(params)}`,
  );
}

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
  isPaid?: boolean;
  paymentStatus?: "PAID" | "PENDING";
  paidAt?: string | null;
}

export function getMaintenancePayouts(params?: { search?: string }): Promise<MaintenancePayout[]>;
export function getMaintenancePayouts(...args: any[]): Promise<MaintenancePayout[]> {
  const params = args[0];
  const searchParam =
    params && typeof params === "object" && typeof params.search === "string"
      ? params.search
      : undefined;
  const query = searchParam ? `?search=${encodeURIComponent(searchParam)}` : "";
  return request<MaintenancePayout[]>(`/api/treasurer/maintenance-payouts${query}`);
}

export const processMaintenancePayout = (
  jobId: string,
  payload: { paymentMethod?: string; paymentReference?: string; notes?: string } = {}
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

const downloadFile = async (path: string, fallbackFilename: string) => {
  const normalizedPath = path.startsWith("/api/v1/")
    ? path
    : path.replace(/^\/api\//, "/api/v1/");
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    if (filenameMatch?.[1]) {
      filename = filenameMatch[1];
    }
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportPaymentsCsv = (
  params: {
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    includeReversed?: boolean;
  } = {}
) =>
  downloadFile(
    `/api/payments/export/csv${toQuery(params)}`,
    `Nesteeq_Collection_Register_${new Date().toISOString().split("T")[0]}.csv`
  );

export const exportExpensesCsv = (
  params: {
    category?: ExpenseCategory;
    status?: ExpenseStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) =>
  downloadFile(
    `/api/expenses/export/csv${toQuery(params)}`,
    `nesteeq-expenses-${new Date().toISOString().split("T")[0]}.csv`
  );

export const exportTreasurerReportCsv = (
  params: {
    type: "summary" | "defaulters" | "expenses";
    year?: number;
    month?: number;
    days?: number;
    overdueDays?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
) =>
  downloadFile(
    `/api/treasurer/reports/export-csv${toQuery(params)}`,
    `report-${params.type}.csv`
  );



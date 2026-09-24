export type {
  AdditionalCharge,
  Bill,
  BillRecipient,
  BillStatus,
  CommonBill,
  CommonBillStats,
  CreateBillPayload,
  CreateCommonBillPayload,
  GetBillsParams,
  UpdateBillPayload,
} from "../../services/treasurer.service";

export interface RecordBillPaymentPayload {
  amount: number;
}

export interface WaiveLateFeePayload {
  amount: number;
}

export interface AdditionalChargeItem {
  title: string;
  amount: number;
  reason?: string;
}

export interface ResidentBillItem {
  _id: string;
  apartmentId: string;
  unitId: string;
  residentId: string;
  commonBillId?: string;
  title?: string;
  billType?:
    | "MONTHLY_MAINTENANCE"
    | "WATER"
    | "COMMON_ELECTRICITY"
    | "LIFT_AMC"
    | "SPECIAL_REPAIR"
    | "PARKING_MAINTENANCE"
    | "OTHER"
    | string;
  billingPeriod?: string;
  description?: string;
  baseAmount: number;
  additionalCharges: AdditionalChargeItem[];
  lateFeePerDay: number;
  lateFeeAmount: number;
  lateFeeWaivedAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  createdAt: string;
}

export interface ResidentBillsSummary {
  totalOutstanding: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
  lateFees: number;
}

export interface ResidentPaymentItem {
  _id: string;
  billId?: string;
  amount: number;
  source: string;
  description?: string;
  paidAt: string;
}

export interface ResidentBillsResponse {
  summary: ResidentBillsSummary;
  bills: ResidentBillItem[];
  recentPayments: ResidentPaymentItem[];
}

export interface PayResidentBillPayload {
  amount?: number;
  paymentMethod?: string;
  referenceNo?: string;
  description?: string;
}


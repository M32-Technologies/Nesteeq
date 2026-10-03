import api from "@/lib/axios";
import type {
  ResidentBillsResponse,
  PayResidentBillPayload,
  FetchResidentBillsParams,
} from "../types/billing.types";

export {
  createBill,
  createCommonBill,
  deleteBill,
  getBillRecipients,
  getBills,
  getCommonBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
} from "../../services/treasurer.service";

export async function fetchResidentBills(
  params?: FetchResidentBillsParams | any
): Promise<ResidentBillsResponse> {
  const queryParams = params && !("queryKey" in params) ? params : undefined;
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentBillsResponse;
    }>("/api/v1/bills/my-bills", { params: queryParams });
    return (
      res.data?.data || {
        summary: {
          totalOutstanding: 0,
          totalPaid: 0,
          pendingCount: 0,
          overdueCount: 0,
          lateFees: 0,
        },
        bills: [],
        recentPayments: [],
      }
    );
  } catch {
    return {
      summary: {
        totalOutstanding: 0,
        totalPaid: 0,
        pendingCount: 0,
        overdueCount: 0,
        lateFees: 0,
      },
      bills: [],
      recentPayments: [],
    };
  }
}

export async function payResidentBill(
  billId: string,
  payload: PayResidentBillPayload
) {
  const res = await api.post(
    `/api/v1/bills/${encodeURIComponent(billId)}/pay`,
    payload
  );
  return res.data;
}

export interface PayAllResidentBillsPayload {
  paymentMethod?: string;
  referenceNo?: string;
  description?: string;
  billIds?: string[];
}

export async function payAllResidentBills(
  payload: PayAllResidentBillsPayload
) {
  const res = await api.post("/api/v1/bills/pay-all", payload);
  return res.data;
}



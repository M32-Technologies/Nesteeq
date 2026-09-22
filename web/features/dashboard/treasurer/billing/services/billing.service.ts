import api from "@/lib/axios";
import type {
  ResidentBillsResponse,
  PayResidentBillPayload,
} from "../types/billing.types";

export {
  createBill,
  createCommonBill,
  getBillRecipients,
  getBills,
  getCommonBills,
  recordBillPayment,
  updateBill,
  waiveLateFee,
} from "../../services/treasurer.service";

export async function fetchResidentBills(): Promise<ResidentBillsResponse> {
  try {
    const res = await api.get<{
      success: boolean;
      data: ResidentBillsResponse;
    }>("/api/v1/bills/my-bills");
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


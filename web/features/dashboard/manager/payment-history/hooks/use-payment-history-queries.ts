import { useQuery } from "@tanstack/react-query";
import {
  getFinanceSummary,
  getManagerBills,
  getManagerPayments,
} from "../api/payment-history.api";
import {
  GetManagerBillsParams,
  GetManagerPaymentsParams,
} from "../types/payment-history";

export const paymentHistoryKeys = {
  all: ["property-manager", "payment-history"] as const,
  summary: () => [...paymentHistoryKeys.all, "summary"] as const,
  billsRoot: () => [...paymentHistoryKeys.all, "bills"] as const,
  bills: (filters: GetManagerBillsParams) =>
    [...paymentHistoryKeys.billsRoot(), filters] as const,
  paymentsRoot: () => [...paymentHistoryKeys.all, "payments"] as const,
  payments: (filters: GetManagerPaymentsParams) =>
    [...paymentHistoryKeys.paymentsRoot(), filters] as const,
};

export const useFinanceSummaryQuery = () => {
  return useQuery({
    queryKey: paymentHistoryKeys.summary(),
    queryFn: getFinanceSummary,
    staleTime: 60 * 1000,
  });
};

export const useManagerBillsQuery = (filters: GetManagerBillsParams = {}) => {
  return useQuery({
    queryKey: paymentHistoryKeys.bills(filters),
    queryFn: () => getManagerBills(filters),
    staleTime: 60 * 1000,
  });
};

export const useManagerPaymentsQuery = (
  filters: GetManagerPaymentsParams = {},
) => {
  return useQuery({
    queryKey: paymentHistoryKeys.payments(filters),
    queryFn: () => getManagerPayments(filters),
    staleTime: 60 * 1000,
  });
};

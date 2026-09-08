"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useFinanceSummaryQuery,
  useManagerBillsQuery,
  useManagerPaymentsQuery,
} from "../hooks/use-payment-history-queries";
import {
  useFlatsQuery,
  useResidentsQuery,
} from "@/features/dashboard/manager/users/hooks/use-residents-query";
import {
  Bill,
  BillStatusFilter,
  Payment,
  PaymentSourceFilter,
} from "../types/payment-history";

import PaymentHistorySummary from "./payment-history-summary";
import BillsDuesTable from "./bills-dues-table";
import TransactionsTable from "./transactions-table";
import PaymentDetailsSheet from "./payment-details-sheet";

type Tab = "bills" | "transactions";

export default function PaymentHistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bills");
  
  // Bills Filters
  const [billsSearch, setBillsSearch] = useState("");
  const [billsStatus, setBillsStatus] = useState<BillStatusFilter>("ALL");
  
  // Transactions Filters
  const [txSearch, setTxSearch] = useState("");
  const [txSource, setTxSource] = useState<PaymentSourceFilter>("ALL");

  // Selection
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
  } = useFinanceSummaryQuery();

  const {
    data: billsData = [],
    isLoading: isBillsLoading,
    isError: isBillsError,
    error: billsError,
  } = useManagerBillsQuery({
    status: billsStatus === "ALL" ? undefined : billsStatus,
  });

  const {
    data: paymentsData = [],
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    error: paymentsError,
  } = useManagerPaymentsQuery({
    source: txSource === "ALL" ? undefined : txSource,
    limit: 100, // Matching the existing treasurer logic to fetch latest 100
  });

  // Fetch Lookups
  // Limit to 1000 for the first version to get a reasonably comprehensive map
  const { data: residentsData } = useResidentsQuery({ limit: 1000 });
  const { data: flatsData } = useFlatsQuery("all"); // Requesting all blocks

  // Lookups Maps
  const residentMap = useMemo(() => {
    const map = new Map<string, string>();
    if (residentsData?.residents) {
      residentsData.residents.forEach((r) => {
        map.set(r.id, r.name);
      });
    }
    return map;
  }, [residentsData]);

  const flatMap = useMemo(() => {
    const map = new Map<string, string>();
    if (flatsData) {
      flatsData.forEach((f: { id: string; flatNumber?: string; name?: string }) => {
        // Handle varying flat option shapes gracefully
        const name = f.flatNumber || f.name || f.id;
        map.set(f.id, name);
      });
    }
    return map;
  }, [flatsData]);

  const resolveResidentName = useCallback((id: string) => {
    return residentMap.get(id) ?? `User #${id.slice(-6).toUpperCase()}`;
  }, [residentMap]);

  const resolveFlatNumber = useCallback((id: string) => {
    return flatMap.get(id) ?? `Unit #${id.slice(-6).toUpperCase()}`;
  }, [flatMap]);

  // Local Search Filters
  const filteredBills = useMemo(() => {
    if (!billsSearch.trim()) return billsData;
    const query = billsSearch.toLowerCase();
    
    return billsData.filter((bill) => {
      const resName = resolveResidentName(bill.residentId).toLowerCase();
      const flatName = resolveFlatNumber(bill.unitId).toLowerCase();
      return resName.includes(query) || flatName.includes(query);
    });
  }, [billsData, billsSearch, resolveResidentName, resolveFlatNumber]);

  const filteredPayments = useMemo(() => {
    if (!txSearch.trim()) return paymentsData;
    const query = txSearch.toLowerCase();

    return paymentsData.filter((payment) => {
      const resName = resolveResidentName(payment.residentId).toLowerCase();
      const flatName = resolveFlatNumber(payment.unitId).toLowerCase();
      const billRef = payment.billId.slice(-6).toLowerCase();
      return (
        resName.includes(query) ||
        flatName.includes(query) ||
        billRef.includes(query)
      );
    });
  }, [paymentsData, txSearch, resolveResidentName, resolveFlatNumber]);

  const handleCloseDetails = () => {
    setSelectedBill(null);
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Payment History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View apartment bills, outstanding dues, and resident payment activity.
        </p>
      </div>

      <PaymentHistorySummary
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        error={summaryError}
      />

      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("bills")}
          className={`relative -mb-px pb-3 text-sm font-medium transition ${
            activeTab === "bills"
              ? "text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Bills & Dues
          {activeTab === "bills" && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0F5F45]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`relative -mb-px pb-3 text-sm font-medium transition ${
            activeTab === "transactions"
              ? "text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Transactions
          {activeTab === "transactions" && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0F5F45]" />
          )}
        </button>
      </div>

      {activeTab === "bills" ? (
        <BillsDuesTable
          bills={filteredBills}
          isLoading={isBillsLoading}
          isError={isBillsError}
          error={billsError}
          searchQuery={billsSearch}
          onSearchChange={setBillsSearch}
          statusFilter={billsStatus}
          onStatusFilterChange={setBillsStatus}
          onViewDetails={setSelectedBill}
          resolveResidentName={resolveResidentName}
          resolveFlatNumber={resolveFlatNumber}
        />
      ) : (
        <TransactionsTable
          payments={filteredPayments}
          isLoading={isPaymentsLoading}
          isError={isPaymentsError}
          error={paymentsError}
          searchQuery={txSearch}
          onSearchChange={setTxSearch}
          sourceFilter={txSource}
          onSourceFilterChange={setTxSource}
          onViewDetails={setSelectedPayment}
          resolveResidentName={resolveResidentName}
          resolveFlatNumber={resolveFlatNumber}
        />
      )}

      <PaymentDetailsSheet
        open={Boolean(selectedBill || selectedPayment)}
        onClose={handleCloseDetails}
        bill={selectedBill}
        payment={selectedPayment}
        residentName={
          selectedBill
            ? resolveResidentName(selectedBill.residentId)
            : selectedPayment
              ? resolveResidentName(selectedPayment.residentId)
              : undefined
        }
        flatNumber={
          selectedBill
            ? resolveFlatNumber(selectedBill.unitId)
            : selectedPayment
              ? resolveFlatNumber(selectedPayment.unitId)
              : undefined
        }
      />
    </div>
  );
}

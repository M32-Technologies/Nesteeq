"use client";

import React, { useMemo, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Info,
  ChevronDown,
  Sparkles,
  Eye,
  FileText,
  Home,
  Building2,
  Users,
  Download,
  Printer,
  Share2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useResidentDashboard } from "@/features/dashboard/resident/hooks/use-resident-dashboard";
import {
  fetchResidentBills,
  payResidentBill,
  payAllResidentBills,
} from "../services/billing.service";
import type { ResidentBillItem, ResidentPaymentItem } from "../types/billing.types";

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const PAYMENT_MODES = [
  { id: "UPI", label: "Instant UPI (GPay / PhonePe / Paytm)", icon: "⚡" },
  { id: "NETBANKING", label: "Net Banking (NEFT / IMPS)", icon: "🏦" },
  { id: "CARD", label: "Credit / Debit Card", icon: "💳" },
  { id: "WALLET", label: "Resident Society Advance Wallet", icon: "👛" },
];

const BILL_TYPE_CONFIG: Record<
  string,
  { label: string; badgeColor: string; icon: string }
> = {
  MONTHLY_MAINTENANCE: {
    label: "Monthly Maintenance",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🏢",
  },
  WATER: {
    label: "Water Bill",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "💧",
  },
  COMMON_ELECTRICITY: {
    label: "Common Electricity",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⚡",
  },
  LIFT_MAINTENANCE: {
    label: "Lift Maintenance",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "🛗",
  },
  LIFT_AMC: {
    label: "Lift AMC",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "🛗",
  },
  SPECIAL_REPAIR: {
    label: "Special Repair",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "🛠️",
  },
  PARKING_MAINTENANCE: {
    label: "Parking Maintenance",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "🚗",
  },
  OTHER: {
    label: "Custom Bill",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "📋",
  },
};

const ITEMS_PER_PAGE = 8;

export function ResidentBillsPage() {
  const queryClient = useQueryClient();
  const { apartmentName, flatUnitName, userName } = useResidentDashboard();

  const [selectedScope, setSelectedScope] = useState<"ALL" | "COMMON" | "SEPARATE">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [receiptsPage, setReceiptsPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<ResidentBillItem | null>(null);
  const [payingBill, setPayingBill] = useState<ResidentBillItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<
    (ResidentPaymentItem & { billTitle?: string; billingPeriod?: string; billScope?: string }) | null
  >(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isPayingTotal, setIsPayingTotal] = useState(false);
  const [totalPaymentMode, setTotalPaymentMode] = useState("UPI");
  const [totalPaymentRef, setTotalPaymentRef] = useState("");
  const [totalPaymentNotes, setTotalPaymentNotes] = useState("");

  const handlePrintReceipt = () => {
    if (typeof window === "undefined" || !selectedReceipt) return;

    const receipt = selectedReceipt;
    const receiptNo = `REC-${receipt._id.slice(-6).toUpperCase()}`;
    const dateStr = formatDate(receipt.paidAt);
    const formattedAmt = formatCurrency(receipt.amount);
    const society = apartmentName || "Nesteeq Residential Society";
    const resident = userName || "Resident Member";
    const unit = flatUnitName || "N/A";
    const source = receipt.source || "ONLINE / UPI";
    const desc = receipt.description || receipt.billTitle || "Monthly Society Maintenance Settlement";
    const refNo = receipt.billId ? `BILL-${receipt.billId.slice(-6).toUpperCase()}` : receipt._id;

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_${receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .header {
      background: #07584F !important;
      color: #ffffff !important;
      padding: 20px 22px;
      text-align: center;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 9px;
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .society-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .voucher-sub {
      font-size: 11px;
      opacity: 0.9;
      margin-top: 3px;
    }
    .badge-pill {
      display: inline-block;
      background: #ecfdf5 !important;
      color: #065f46 !important;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 999px;
      margin-top: 8px;
      border: 1px solid #a7f3d0;
    }
    .body {
      padding: 18px 22px;
    }
    .amount-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
      margin-bottom: 14px;
    }
    .amount-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .amount-val {
      font-size: 26px;
      font-weight: 800;
      color: #07584F;
      margin-top: 2px;
    }
    .amount-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .details-table tr:not(:last-child) {
      border-bottom: 1px solid #f1f5f9;
    }
    .details-table td {
      padding: 8px 12px;
      font-size: 11px;
    }
    .label-col {
      color: #64748b;
      width: 38%;
      font-weight: 500;
    }
    .val-col {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .tag {
      background: #f1f5f9;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }
    .stamp-box {
      border: 1px dashed #cbd5e1;
      background: #fafafa;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 12px;
    }
    .stamp-text {
      color: #475569;
    }
    .stamp-strong {
      font-weight: 700;
      color: #1e293b;
    }
    .verified-mark {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }
    .footer-note {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">N</div>
      <div class="society-title">${society}</div>
      <div class="voucher-sub">Official Society Maintenance & Billing Payment Receipt</div>
      <div>
        <span class="badge-pill">✓ PAYMENT RECONCILED</span>
      </div>
    </div>
    <div class="body">
      <div class="amount-box">
        <div class="amount-label">Total Amount Settled</div>
        <div class="amount-val">${formattedAmt}</div>
        <div class="amount-sub">Received with thanks on ${dateStr}</div>
      </div>
      <table class="details-table">
        <tr>
          <td class="label-col">Receipt Number</td>
          <td class="val-col" style="font-family: monospace; font-size: 12px;">${receiptNo}</td>
        </tr>
        <tr>
          <td class="label-col">Resident Name</td>
          <td class="val-col">${resident}</td>
        </tr>
        <tr>
          <td class="label-col">Flat / Unit</td>
          <td class="val-col">${unit}</td>
        </tr>
        <tr>
          <td class="label-col">Society Community</td>
          <td class="val-col">${society}</td>
        </tr>
        <tr>
          <td class="label-col">Payment Channel</td>
          <td class="val-col"><span class="tag">${source}</span></td>
        </tr>
        <tr>
          <td class="label-col">Description</td>
          <td class="val-col">${desc}</td>
        </tr>
        <tr>
          <td class="label-col">Reference / Bill ID</td>
          <td class="val-col" style="font-family: monospace;">${refNo}</td>
        </tr>
      </table>
      <div class="stamp-box">
        <div class="stamp-text">
          <div class="stamp-strong">Authorized Society Ledger Record</div>
          <div>Digitally validated by Society Treasurer Office. No physical signature required.</div>
        </div>
        <div class="verified-mark">✓</div>
      </div>
      <div class="footer-note">
        Generated digitally via Nesteeq Resident Portal • Official Ledger Acknowledgment
      </div>
    </div>
  </div>
</body>
</html>`;

    // Create an invisible iframe to isolate print strictly to the single receipt card
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute(
      "style",
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;"
    );
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    printFrame.contentWindow?.focus();
    setTimeout(() => {
      try {
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 1500);
    }, 200);
  };

  const handleDownloadReceiptHtml = async (
    receipt: ResidentPaymentItem & { billTitle?: string; billingPeriod?: string; billScope?: string }
  ) => {
    try {
      const res = await api.get(`/api/v1/bills/receipt/${receipt._id}/download?format=html`, {
        responseType: "blob",
      });
      let filename = `Receipt_${receipt._id}_${flatUnitName || "Unit"}.html`;
      const disposition = res.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match?.[1]) filename = match[1];
      }
      const blob = new Blob([res.data], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Official receipt downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download receipt.");
    }
  };

  const handleDownloadReceiptTxt = async (
    receipt: ResidentPaymentItem & { billTitle?: string; billingPeriod?: string; billScope?: string }
  ) => {
    try {
      const res = await api.get(`/api/v1/bills/receipt/${receipt._id}/download?format=txt`, {
        responseType: "blob",
      });
      let filename = `Receipt_${receipt._id}_${flatUnitName || "Unit"}.txt`;
      const disposition = res.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match?.[1]) filename = match[1];
      }
      const blob = new Blob([res.data], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Receipt voucher downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download voucher.");
    }
  };

  const {
    data: billsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["resident", "bills"],
    queryFn: fetchResidentBills,
  });

  const summary = billsData?.summary || {
    totalOutstanding: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0,
    lateFees: 0,
  };

  const bills = billsData?.bills || [];
  const recentPayments = billsData?.recentPayments || [];

  const handleOpenReceiptForBill = (bill: ResidentBillItem) => {
    const existingPayment = recentPayments.find((p) => p.billId === bill._id);
    const receiptItem: ResidentPaymentItem & {
      billTitle?: string;
      billingPeriod?: string;
      billScope?: string;
    } = existingPayment || {
      _id: bill._id,
      billId: bill._id,
      amount: bill.paidAmount > 0 ? bill.paidAmount : bill.totalAmount,
      source:
        bill.isCommonBill || bill.billScope === "COMMON"
          ? "SOCIETY COMMON"
          : "DIRECT / TREASURER",
      description:
        bill.description ||
        `${bill.title || "Society Bill"} (${bill.billingPeriod || "Settled"})`,
      paidAt: bill.dueDate || bill.createdAt,
      billTitle: bill.title,
      billingPeriod: bill.billingPeriod,
      billScope: bill.billScope,
    };
    setSelectedReceipt(receiptItem);
  };

  const allReceipts = useMemo(() => {
    const receiptsList: Array<
      ResidentPaymentItem & {
        billTitle?: string;
        billingPeriod?: string;
        billScope?: string;
      }
    > = [];
    const handledBillIds = new Set<string>();

    // 1. Add all recent payments recorded in the ledger
    for (const payment of recentPayments) {
      const matchedBill = bills.find((b) => b._id === payment.billId);
      if (payment.billId) {
        handledBillIds.add(payment.billId);
      }
      receiptsList.push({
        ...payment,
        billTitle: matchedBill?.title,
        billingPeriod: matchedBill?.billingPeriod,
        billScope: matchedBill?.billScope,
      });
    }

    // 2. Add all completed / settled bills that don't have a distinct recentPayment record
    for (const bill of bills) {
      const isCompleted =
        bill.status === "PAID" ||
        (bill.balanceAmount === 0 && bill.totalAmount > 0) ||
        (bill.paidAmount > 0 && bill.balanceAmount === 0);

      if (isCompleted && !handledBillIds.has(bill._id)) {
        receiptsList.push({
          _id: bill._id,
          billId: bill._id,
          amount: bill.paidAmount > 0 ? bill.paidAmount : bill.totalAmount,
          source:
            bill.isCommonBill || bill.billScope === "COMMON"
              ? "SOCIETY COMMON"
              : "TREASURER SETTLED",
          description:
            bill.description ||
            `${bill.title || "Maintenance"} - Settled in full`,
          paidAt: bill.dueDate || bill.createdAt,
          billTitle: bill.title,
          billingPeriod: bill.billingPeriod,
          billScope: bill.billScope,
        });
        handledBillIds.add(bill._id);
      }
    }

    // Sort receipts by date descending (most recent first)
    return receiptsList.sort((a, b) => {
      const timeA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const timeB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [recentPayments, bills]);

  const commonBillsCount = useMemo(
    () => bills.filter((b) => b.isCommonBill || b.billScope === "COMMON").length,
    [bills]
  );
  const separateBillsCount = useMemo(
    () => bills.filter((b) => !b.isCommonBill && b.billScope !== "COMMON").length,
    [bills]
  );

  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        // 1. Scope filter (Common vs Separate)
        if (selectedScope === "COMMON" && !b.isCommonBill && b.billScope !== "COMMON") {
          return false;
        }
        if (selectedScope === "SEPARATE" && (b.isCommonBill || b.billScope === "COMMON")) {
          return false;
        }
        // 2. Category filter
        if (selectedCategory !== "ALL") {
          const type = b.billType || "MONTHLY_MAINTENANCE";
          if (type !== selectedCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const isUnpaidA =
          a.status !== "PAID" &&
          (a.balanceAmount > 0 ||
            a.status === "PENDING" ||
            a.status === "OVERDUE" ||
            a.status === "PARTIALLY_PAID");
        const isUnpaidB =
          b.status !== "PAID" &&
          (b.balanceAmount > 0 ||
            b.status === "PENDING" ||
            b.status === "OVERDUE" ||
            b.status === "PARTIALLY_PAID");

        // 1. Unpaid / payable bills come first
        if (isUnpaidA && !isUnpaidB) return -1;
        if (!isUnpaidA && isUnpaidB) return 1;

        // 2. Within the same group, newest created bills come first
        const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return timeB - timeA;
      });
  }, [bills, selectedScope, selectedCategory]);

  const totalInvoicePages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE) || 1;
  const paginatedBills = useMemo(() => {
    const start = (invoicesPage - 1) * ITEMS_PER_PAGE;
    return filteredBills.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBills, invoicesPage]);

  const totalReceiptPages = Math.ceil(allReceipts.length / ITEMS_PER_PAGE) || 1;
  const paginatedReceipts = useMemo(() => {
    const start = (receiptsPage - 1) * ITEMS_PER_PAGE;
    return allReceipts.slice(start, start + ITEMS_PER_PAGE);
  }, [allReceipts, receiptsPage]);

  const payMutation = useMutation({
    mutationFn: async ({
      billId,
      amount,
      paymentMethod,
      referenceNo,
      description,
    }: {
      billId: string;
      amount: number;
      paymentMethod: string;
      referenceNo?: string;
      description?: string;
    }) => {
      return payResidentBill(billId, {
        amount,
        paymentMethod,
        referenceNo,
        description,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Payment processed and confirmed!");
      setPayingBill(null);
      setPaymentRef("");
      setPaymentNotes("");
      queryClient.invalidateQueries({ queryKey: ["resident", "bills"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "profile"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to process payment."
      );
    },
  });

  const handleOpenPay = (bill: ResidentBillItem) => {
    setPayingBill(bill);
    setPaymentMode("UPI");
    setPaymentRef(`UPI-${Date.now().toString().slice(-6)}`);
    setPaymentNotes("");
  };

  const handleConfirmPay = () => {
    if (!payingBill) return;
    payMutation.mutate({
      billId: payingBill._id,
      amount: payingBill.balanceAmount,
      paymentMethod: paymentMode,
      referenceNo: paymentRef.trim() || undefined,
      description: paymentNotes.trim() || undefined,
    });
  };

  const unpaidBills = useMemo(() => {
    return bills.filter(
      (b) =>
        (b.status === "PENDING" || b.status === "OVERDUE" || b.status === "PARTIALLY_PAID") &&
        b.balanceAmount > 0
    );
  }, [bills]);

  const totalOutstandingSum = useMemo(() => {
    return unpaidBills.reduce((acc, b) => acc + (b.balanceAmount || 0), 0);
  }, [unpaidBills]);

  const payAllMutation = useMutation({
    mutationFn: async ({
      paymentMethod,
      referenceNo,
      description,
      billIds,
    }: {
      paymentMethod: string;
      referenceNo?: string;
      description?: string;
      billIds?: string[];
    }) => {
      return payAllResidentBills({
        paymentMethod,
        referenceNo,
        description,
        billIds,
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Total bills settled successfully!");
      setIsPayingTotal(false);
      setTotalPaymentRef("");
      setTotalPaymentNotes("");
      queryClient.invalidateQueries({ queryKey: ["resident", "bills"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "wallet"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to settle total bills."
      );
    },
  });

  const handleOpenPayTotal = () => {
    setIsPayingTotal(true);
    setTotalPaymentMode("UPI");
    setTotalPaymentRef(`BULK-${Date.now().toString().slice(-6)}`);
    setTotalPaymentNotes("");
  };

  const handleConfirmPayTotal = () => {
    if (unpaidBills.length === 0) return;
    payAllMutation.mutate({
      paymentMethod: totalPaymentMode,
      referenceNo: totalPaymentRef.trim() || undefined,
      description: totalPaymentNotes.trim() || undefined,
      billIds: unpaidBills.map((b) => b._id),
    });
  };

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Bills & Society Finance
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Review monthly maintenance invoices and payment receipts for{" "}
            <span className="font-semibold text-[#111111]">{flatUnitName}</span> at{" "}
            <span className="font-semibold text-[#111111]">{apartmentName}</span>.
          </p>
        </div>

        {unpaidBills.length > 0 && totalOutstandingSum > 0 ? (
          <button
            type="button"
            onClick={handleOpenPayTotal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#07584F] px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#064C44] active:scale-95 cursor-pointer w-full sm:w-auto group"
            title="View all unpaid bills and pay total dues in one click"
          >
            <CreditCard className="size-4 group-hover:scale-110 transition-transform" />
            <span>Pay Total Bill ({formatCurrency(totalOutstandingSum)})</span>
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-emerald-800/80 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
              {unpaidBills.length} bill{unpaidBills.length > 1 ? "s" : ""}
            </span>
          </button>
        ) : (
          <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 w-full sm:w-auto">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>All Dues Cleared</span>
          </div>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              summary.totalOutstanding > 0
                ? summary.overdueCount > 0
                  ? "bg-red-500"
                  : "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Total Outstanding
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.totalOutstanding)}
          </h3>
          <p
            className={`text-xs font-medium mt-1 flex items-center gap-1 ${
              summary.totalOutstanding > 0 ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {summary.totalOutstanding > 0 ? (
              <>
                <AlertTriangle className="size-3.5" />
                <span>
                  {summary.pendingCount} pending bill
                  {summary.pendingCount > 1 ? "s" : ""}{" "}
                  {summary.overdueCount > 0 ? `(${summary.overdueCount} overdue)` : ""}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>All dues cleared for {flatUnitName}</span>
              </>
            )}
          </p>
        </div>

        {/* Total Settled */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Total Paid & Settled
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.totalPaid)}
          </h3>
          <p className="text-xs text-blue-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            <span>Lifetime receipts recorded</span>
          </p>
        </div>

        {/* Accrued Late Fees */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Accrued Late Fee
          </span>
          <h3 className="text-2xl font-bold text-[#111111] mt-2">
            {formatCurrency(summary.lateFees)}
          </h3>
          <p className="text-xs text-[#637083] font-medium mt-1">
            {summary.lateFees > 0 ? "Penalty for overdue dates" : "Zero penalty accrued"}
          </p>
        </div>

        {/* Billing Policy */}
        <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#07584F]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
            Billing Cycle
          </span>
          <h3 className="text-base font-bold text-[#111111] mt-2">
            1st - 5th of Month
          </h3>
          <p className="text-xs text-[#637083] font-medium mt-1">
            Managed by Society Treasurer
          </p>
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#DDE3DF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#111111]">
              Maintenance Invoices & Bills
            </h2>
            <p className="text-xs text-[#637083] mt-0.5">
              Directly synced with the Society Treasurer ledger.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {unpaidBills.length > 1 && (
              <button
                type="button"
                onClick={handleOpenPayTotal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
              >
                <CreditCard className="size-3.5" />
                <span>Pay Total ({formatCurrency(totalOutstandingSum)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs text-[#07584F] font-semibold hover:underline"
            >
              Refresh Statements
            </button>
          </div>
        </div>

        {/* Scope Filter Tabs (All / Society Common / Flat Separate) */}
        <div className="border-b border-slate-200/80 bg-slate-50/70 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Bill Scope:
            </span>
            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedScope("ALL");
                  setInvoicesPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedScope === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Bills ({bills.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedScope("COMMON");
                  setInvoicesPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedScope === "COMMON"
                    ? "bg-[#07584F] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="size-3.5" />
                <span>Society Common ({commonBillsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedScope("SEPARATE");
                  setInvoicesPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedScope === "SEPARATE"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Home className="size-3.5" />
                <span>Flat Separate ({separateBillsCount})</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            {selectedScope === "COMMON"
              ? "Showing shared society expenses distributed by Treasurer"
              : selectedScope === "SEPARATE"
              ? `Showing separate individual bills assigned to ${flatUnitName}`
              : "Showing all common society and flat separate bills"}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="border-b border-slate-100 bg-slate-50/40 px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setInvoicesPage(1);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-[#07584F] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Categories
          </button>
          {Object.entries(BILL_TYPE_CONFIG).map(([typeKey, cfg]) => {
            const count = bills.filter((b) => {
              if (selectedScope === "COMMON" && !b.isCommonBill && b.billScope !== "COMMON") return false;
              if (selectedScope === "SEPARATE" && (b.isCommonBill || b.billScope === "COMMON")) return false;
              return (b.billType || "MONTHLY_MAINTENANCE") === typeKey;
            }).length;
            if (count === 0 && selectedCategory !== typeKey) return null;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => {
                  setSelectedCategory(typeKey);
                  setInvoicesPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedCategory === typeKey
                    ? "bg-[#07584F] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#637083]">
            Loading billing statements...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            Unable to fetch billing statements. Please check your network or try again later.
          </div>
        ) : bills.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
            <p className="text-base font-semibold text-[#111111]">
              Zero Pending Invoices
            </p>
            <p className="text-xs text-[#637083] max-w-sm mx-auto">
              Your society treasurer has not generated any unpaid bills for {flatUnitName}. When a new maintenance cycle starts, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Bill / Title</th>
                  <th className="px-5 py-3">Base Amount</th>
                  <th className="px-5 py-3">Additional Charges</th>
                  <th className="px-5 py-3">Late Fee</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Balance Due</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBills.map((bill) => {
                    const isPaid = bill.status === "PAID";
                    const isOverdue = bill.status === "OVERDUE";
                    const typeCfg =
                      BILL_TYPE_CONFIG[bill.billType || "MONTHLY_MAINTENANCE"] ||
                      BILL_TYPE_CONFIG.OTHER;

                    return (
                      <tr key={bill._id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{typeCfg.icon}</span>
                            <span>{bill.title || typeCfg.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {bill.isCommonBill || bill.billScope === "COMMON" ? (
                              <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                                <Building2 className="size-3 text-teal-600" />
                                <span>Society Common</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                                <Home className="size-3 text-blue-600" />
                                <span>Flat Separate</span>
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-slate-400">
                              #{bill._id.slice(-6).toUpperCase()}
                            </span>
                            {bill.billingPeriod && (
                              <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {bill.billingPeriod}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.badgeColor}`}
                            >
                              {typeCfg.label}
                            </span>
                          </div>
                          {bill.description && (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-1 italic max-w-sm">
                              "{bill.description}"
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800">
                          {formatCurrency(bill.baseAmount)}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {bill.additionalCharges && bill.additionalCharges.length > 0 ? (
                            <div className="space-y-0.5">
                              {bill.additionalCharges.map((c, i) => (
                                <div key={i} className="text-[11px] text-slate-500">
                                  {c.title}: <span className="font-medium text-slate-700">{formatCurrency(c.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-amber-700">
                          {bill.lateFeeAmount > 0 ? formatCurrency(bill.lateFeeAmount) : "₹0"}
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-900">
                          {formatCurrency(bill.totalAmount)}
                        </td>

                        <td className="px-5 py-4 font-bold text-lg">
                          <span
                            className={
                              bill.balanceAmount > 0
                                ? isOverdue
                                  ? "text-red-600"
                                  : "text-amber-700"
                                : "text-emerald-700"
                            }
                          >
                            {formatCurrency(bill.balanceAmount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-slate-400" />
                            <span>{formatDate(bill.dueDate)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isOverdue
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBill(bill)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                              title="View full bill breakdown and treasurer notes"
                            >
                              <Eye className="size-3.5 text-slate-500" />
                              <span>Details</span>
                            </button>
                            {bill.balanceAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenPay(bill)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#064C44] cursor-pointer"
                              >
                                <CreditCard className="size-3.5" />
                                <span>Pay Dues</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenReceiptForBill(bill)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-semibold text-[#07584F] hover:bg-[#07584F] hover:text-white transition cursor-pointer shadow-2xs group"
                                title="View & Download Payment Receipt"
                              >
                                <Receipt className="size-3.5 text-[#07584F] group-hover:text-white transition-colors" />
                                <span>Receipt</span>
                                <Download className="size-3 text-[#07584F] group-hover:text-white transition-colors" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Standard Pagination for Invoices */}
            {filteredBills.length > ITEMS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(invoicesPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(invoicesPage * ITEMS_PER_PAGE, filteredBills.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredBills.length}
                  </span>{" "}
                  invoices
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={invoicesPage === 1}
                    onClick={() => setInvoicesPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {invoicesPage} of {totalInvoicePages}
                  </span>
                  <button
                    type="button"
                    disabled={invoicesPage === totalInvoicePages}
                    onClick={() => setInvoicesPage((p) => Math.min(totalInvoicePages, p + 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Recent Receipts & Payment History */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#DDE3DF] p-5 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111111]">
              Recent Receipts & Payment History
            </h2>
            <p className="text-xs text-[#637083] mt-0.5">
              Reconciled real-time with the Society Treasurer desk.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {allReceipts.length} record{allReceipts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allReceipts.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <Receipt className="size-6 text-[#7C8782] mx-auto" />
            <p className="text-sm font-semibold text-[#111111]">
              No Past Payments Recorded
            </p>
            <p className="text-xs text-[#637083] max-w-sm mx-auto">
              When you pay monthly society maintenance dues, your digital receipts will be available here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Receipt / Ref</th>
                  <th className="px-5 py-3">Amount Paid</th>
                  <th className="px-5 py-3">Payment Source</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Receipt Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReceipts.map((p) => (
                  <tr key={p._id} className="transition hover:bg-slate-50/60 text-xs">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                      REC-{p._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                        {p.source || "MANUAL"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 truncate">
                          {p.billTitle || p.description || "Maintenance settlement"}
                        </span>
                        {p.billTitle && p.description && p.billTitle !== p.description && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {p.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="size-3.5" />
                        <span>Reconciled</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          title="View receipt voucher"
                        >
                          <Eye className="size-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadReceiptHtml(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-2.5 py-1 text-xs font-semibold text-[#07584F] hover:bg-[#07584F] hover:text-white transition cursor-pointer shadow-2xs group"
                          title="Download official receipt voucher"
                        >
                          <Download className="size-3 text-[#07584F] group-hover:text-white transition-colors" />
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Standard Pagination for Receipts */}
            {allReceipts.length > ITEMS_PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(receiptsPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(receiptsPage * ITEMS_PER_PAGE, allReceipts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {allReceipts.length}
                  </span>{" "}
                  receipts
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={receiptsPage === 1}
                    onClick={() => setReceiptsPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {receiptsPage} of {totalReceiptPages}
                  </span>
                  <button
                    type="button"
                    disabled={receiptsPage === totalReceiptPages}
                    onClick={() => setReceiptsPage((p) => Math.min(totalReceiptPages, p + 1))}
                    className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Pay Dues Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#07584F] border border-emerald-200">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pay {payingBill.title || "Society Bill"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {payingBill.billingPeriod ? `${payingBill.billingPeriod} • ` : ""}Instant settlement recorded in Treasurer ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              {/* Bill Details Box */}
              <div className="rounded-xl bg-slate-50 p-3.5 text-slate-800 space-y-2 border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Unit:</span>
                  <span className="font-semibold text-slate-900">{flatUnitName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bill Category:</span>
                  <span className="font-medium text-slate-800">
                    {BILL_TYPE_CONFIG[payingBill.billType || "MONTHLY_MAINTENANCE"]?.label || "Maintenance"}
                  </span>
                </div>
                {payingBill.billingPeriod && (
                  <div className="flex justify-between text-slate-600">
                    <span>Billing Period:</span>
                    <span className="font-medium text-slate-800">{payingBill.billingPeriod}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Reference:</span>
                  <span className="font-mono text-slate-700">
                    #{payingBill._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Date:</span>
                  <span className="font-medium text-slate-800">{formatDate(payingBill.dueDate)}</span>
                </div>
                {payingBill.lateFeeAmount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Accrued Late Fee:</span>
                    <span className="font-semibold">+{formatCurrency(payingBill.lateFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 items-baseline">
                  <span className="font-semibold text-slate-800 text-sm">Payable Amount:</span>
                  <span className="font-bold text-xl text-[#07584F]">
                    {formatCurrency(payingBill.balanceAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="space-y-1.5">
                  {PAYMENT_MODES.map((mode) => (
                    <label
                      key={mode.id}
                      className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition ${
                        paymentMode === mode.id
                          ? "border-[#07584F] bg-emerald-50/50 text-[#07584F] font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mode.icon}</span>
                        <span className="text-xs">{mode.label}</span>
                      </div>
                      <input
                        type="radio"
                        name="paymentMode"
                        value={mode.id}
                        checked={paymentMode === mode.id}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="text-[#07584F] focus:ring-[#07584F]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference / UTR Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-902188219"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via GooglePay"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="w-full sm:w-auto rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={handleConfirmPay}
                className="w-full sm:w-auto rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#064C44] transition cursor-pointer text-center disabled:opacity-50"
              >
                {payMutation.isPending ? "Processing..." : `Confirm & Pay ${formatCurrency(payingBill.balanceAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Total Outstanding Bills Modal (1-Click Settle) */}
      {isPayingTotal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07584F] text-white shadow-xs">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pay Total Outstanding Bill
                  </h3>
                  <p className="text-xs text-slate-500">
                    {unpaidBills.length} unpaid bill{unpaidBills.length > 1 ? "s" : ""} to be settled in 1-Click
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayingTotal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs">
              {/* Bills List / Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Unpaid Bill Breakdown ({unpaidBills.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Unit: <strong className="text-slate-700">{flatUnitName}</strong>
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                  {unpaidBills.map((bill, index) => {
                    const isOverdue =
                      bill.status === "OVERDUE" ||
                      (bill.dueDate && new Date(bill.dueDate) < new Date());
                    const isCommon = bill.isCommonBill || bill.billScope === "COMMON";

                    return (
                      <div
                        key={bill._id || index}
                        className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-xs truncate max-w-[200px]">
                              {bill.title || "Maintenance Bill"}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isOverdue
                                  ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              }`}
                            >
                              {isOverdue ? "Overdue" : "Pending"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isCommon ? "Society Common" : "Flat Separate"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {bill.billingPeriod && (
                              <span>Period: {bill.billingPeriod}</span>
                            )}
                            {bill.dueDate && (
                              <span>Due: {formatDate(bill.dueDate)}</span>
                            )}
                          </div>

                          {bill.lateFeeAmount > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium">
                              Includes accrued late fee: +{formatCurrency(bill.lateFeeAmount)}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900 text-xs">
                            {formatCurrency(bill.balanceAmount)}
                          </div>
                          {bill.totalAmount !== bill.balanceAmount && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(bill.totalAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Summary Card */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Number of Unpaid Invoices:</span>
                  <span className="font-semibold text-slate-800">{unpaidBills.length}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Base Maintenance & Charges:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(
                      unpaidBills.reduce(
                        (acc, b) => acc + Math.max(0, (b.balanceAmount || 0) - (b.lateFeeAmount || 0)),
                        0
                      )
                    )}
                  </span>
                </div>
                {unpaidBills.some((b) => (b.lateFeeAmount || 0) > 0) && (
                  <div className="flex justify-between text-amber-700 text-xs">
                    <span>Accrued Late Fees:</span>
                    <span className="font-semibold">
                      +{formatCurrency(
                        unpaidBills.reduce((acc, b) => acc + (b.lateFeeAmount || 0), 0)
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-emerald-200/80 pt-2.5 items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      Total Amount to Pay:
                    </span>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Calculated sum of all unpaid bills
                    </span>
                  </div>
                  <span className="font-extrabold text-2xl text-[#07584F]">
                    {formatCurrency(totalOutstandingSum)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="space-y-1.5">
                  {PAYMENT_MODES.map((mode) => (
                    <label
                      key={mode.id}
                      className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition ${
                        totalPaymentMode === mode.id
                          ? "border-[#07584F] bg-emerald-50/50 text-[#07584F] font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mode.icon}</span>
                        <span className="text-xs">{mode.label}</span>
                      </div>
                      <input
                        type="radio"
                        name="totalPaymentMode"
                        value={mode.id}
                        checked={totalPaymentMode === mode.id}
                        onChange={(e) => setTotalPaymentMode(e.target.value)}
                        className="text-[#07584F] focus:ring-[#07584F]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference / UTR Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={totalPaymentRef}
                  onChange={(e) => setTotalPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-BULK-902188219"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={totalPaymentNotes}
                  onChange={(e) => setTotalPaymentNotes(e.target.value)}
                  placeholder="e.g. Settle all outstanding maintenance dues"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50/30">
              <button
                type="button"
                onClick={() => setIsPayingTotal(false)}
                className="w-full sm:w-auto rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payAllMutation.isPending || unpaidBills.length === 0}
                onClick={handleConfirmPayTotal}
                className="w-full sm:w-auto rounded-lg bg-[#07584F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#064C44] transition cursor-pointer text-center disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
              >
                {payAllMutation.isPending ? (
                  <>
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing 1-Click Settlement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Confirm & Pay Total ({formatCurrency(totalOutstandingSum)}) in 1-Click</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <FileText className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedBill.title || "Maintenance Bill"}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selectedBill.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedBill.status === "OVERDUE"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {selectedBill.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Invoice #{selectedBill._id.slice(-6).toUpperCase()} •{" "}
                    {selectedBill.billingPeriod || "Standard Cycle"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs">
              {/* Scope Banner */}
              <div
                className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                  selectedBill.isCommonBill || selectedBill.billScope === "COMMON"
                    ? "bg-teal-50/60 border-teal-200/80 text-teal-900"
                    : "bg-blue-50/60 border-blue-200/80 text-blue-900"
                }`}
              >
                {selectedBill.isCommonBill || selectedBill.billScope === "COMMON" ? (
                  <>
                    <Building2 className="size-5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Society Common Bill</h4>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        Generated by Society Treasurer for shared society expenses (e.g. lift, common electricity, security, shared amenities).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Home className="size-5 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Flat Separate Bill</h4>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Issued specifically to {flatUnitName} for individual unit maintenance, flat-specific repairs, or dedicated utility charges.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Bill Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Target Flat</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{flatUnitName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Bill Type</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {BILL_TYPE_CONFIG[selectedBill.billType || "MONTHLY_MAINTENANCE"]?.label || selectedBill.billType || "Maintenance"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Billing Period</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedBill.billingPeriod || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Due Date</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Issued On</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedBill.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Society Community</span>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate">{apartmentName}</p>
                </div>
              </div>

              {/* Treasurer Description / Remarks */}
              {selectedBill.description && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                    <Info className="size-3.5" />
                    <span>Treasurer Notes & Description</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedBill.description}
                  </p>
                </div>
              )}

              {/* Itemized Cost Breakdown */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700 flex justify-between">
                  <span>Charge Description</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-slate-100 p-2 space-y-1">
                  <div className="flex justify-between px-2 py-1 text-slate-700">
                    <div>
                      <span className="font-medium">Base Maintenance / Utility</span>
                      <p className="text-[11px] text-slate-400">Standard rate for flat</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(selectedBill.baseAmount)}</span>
                  </div>

                  {selectedBill.additionalCharges && selectedBill.additionalCharges.length > 0 && (
                    <>
                      {selectedBill.additionalCharges.map((charge, idx) => (
                        <div key={idx} className="flex justify-between px-2 py-1 text-slate-700">
                          <div>
                            <span className="font-medium">{charge.title}</span>
                            {charge.reason && (
                              <p className="text-[11px] text-slate-400">{charge.reason}</p>
                            )}
                          </div>
                          <span className="font-semibold text-slate-800">
                            +{formatCurrency(charge.amount)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {selectedBill.lateFeeAmount > 0 && (
                    <div className="flex justify-between px-2 py-1 text-amber-700">
                      <div>
                        <span className="font-medium">Accrued Late Fee</span>
                        {selectedBill.lateFeePerDay > 0 && (
                          <p className="text-[11px] text-amber-600">₹{selectedBill.lateFeePerDay}/day overdue penalty</p>
                        )}
                      </div>
                      <span className="font-semibold">+{formatCurrency(selectedBill.lateFeeAmount)}</span>
                    </div>
                  )}

                  {selectedBill.lateFeeWaivedAmount > 0 && (
                    <div className="flex justify-between px-2 py-1 text-emerald-700">
                      <span className="font-medium">Late Fee Waived by Treasurer</span>
                      <span className="font-semibold">-{formatCurrency(selectedBill.lateFeeWaivedAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between px-2 pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                    <span>Total Invoiced</span>
                    <span>{formatCurrency(selectedBill.totalAmount)}</span>
                  </div>

                  {selectedBill.paidAmount > 0 && (
                    <div className="flex justify-between px-2 py-1 text-emerald-700 font-medium">
                      <span>Total Paid / Settled</span>
                      <span>-{formatCurrency(selectedBill.paidAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between px-2 pt-2 border-t border-slate-200 font-bold text-base items-baseline">
                    <span className="text-slate-900">Remaining Balance Due:</span>
                    <span className={selectedBill.balanceAmount > 0 ? "text-amber-700" : "text-emerald-700"}>
                      {formatCurrency(selectedBill.balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-slate-200 px-6 py-4 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center"
              >
                Close
              </button>

              {selectedBill.balanceAmount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const billToPay = selectedBill;
                    setSelectedBill(null);
                    handleOpenPay(billToPay);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
                >
                  <CreditCard className="size-3.5" />
                  <span>Pay Now ({formatCurrency(selectedBill.balanceAmount)})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const bill = selectedBill;
                    setSelectedBill(null);
                    handleOpenReceiptForBill(bill);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download Payment Receipt</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div
            id="printable-receipt-modal"
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-4 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header (No Print) */}
            <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-[#07584F]">
                  <Receipt className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Payment Receipt & Voucher
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    REC-{selectedReceipt._id.slice(-6).toUpperCase()} • Verified Reconciled
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Receipt Header Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center space-y-1">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[#07584F] text-white font-bold text-lg shadow-2xs mb-1">
                  N
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {apartmentName || "Nesteeq Residential Society"}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  Official Society Maintenance & Utility Payment Voucher
                </p>
                <div className="pt-1.5 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>PAYMENT RECONCILED</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">
                    REC-{selectedReceipt._id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Total Amount Settled
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#07584F] mt-0.5">
                  {formatCurrency(selectedReceipt.amount)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Received with thanks on {formatDate(selectedReceipt.paidAt)}
                </p>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Issued To Resident:</span>
                  <span className="font-semibold text-slate-900">{userName || "Resident"}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Apartment / Unit:</span>
                  <span className="font-semibold text-slate-900">{flatUnitName}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Society Community:</span>
                  <span className="font-semibold text-slate-900">{apartmentName}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                    {selectedReceipt.source || "ONLINE / UPI"}
                  </span>
                </div>
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Description / Narration:</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs">
                    {selectedReceipt.description || "Monthly Maintenance Settlement"}
                  </span>
                </div>
                <div className="flex justify-between px-3.5 py-2.5">
                  <span className="text-slate-500">Transaction ID / Ref:</span>
                  <span className="font-mono text-slate-700">
                    {selectedReceipt.billId ? `BILL-${selectedReceipt.billId.slice(-6).toUpperCase()}` : selectedReceipt._id}
                  </span>
                </div>
              </div>

              {/* Official Stamp & Signoff */}
              <div className="rounded-xl border border-dashed border-slate-300 p-3.5 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-600">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">Authorized Society Ledger Entry</p>
                  <p className="text-[10px] text-slate-500">
                    Digitally validated by Society Treasurer Office. No physical stamp required.
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
            </div>

            {/* Modal Footer (No Print) */}
            <div className="no-print flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-slate-200 px-5 sm:px-6 py-3.5 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer w-full sm:w-auto"
              >
                Close
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadReceiptTxt(selectedReceipt)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer w-full sm:w-auto"
                  title="Download plain text voucher"
                >
                  <FileText className="size-3.5 text-slate-600" />
                  <span>.TXT Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadReceiptHtml(selectedReceipt)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#07584F] hover:bg-[#07584F] hover:text-white transition cursor-pointer w-full sm:w-auto shadow-2xs"
                  title="Download official offline-viewable formatted receipt"
                >
                  <Download className="size-3.5" />
                  <span>Download Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer w-full sm:w-auto"
                >
                  <Printer className="size-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print-Only CSS Rules */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-modal,
          #printable-receipt-modal * {
            visibility: visible !important;
          }
          #printable-receipt-modal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 620px !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            max-height: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ResidentBillsPage;

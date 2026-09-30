"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  FileClock,
  Filter,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";

import {
  getAuditLogs,
  type AuditLog,
} from "../../services/treasurer.service";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/format";

const ITEMS_PER_PAGE = 8;

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to load audit records.";

const formatActionName = (action: string): string => {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActionBadgeStyle = (action: string) => {
  const upper = action.toUpperCase();
  if (
    upper.includes("CREATE") ||
    upper.includes("CREDIT") ||
    upper.includes("APPROVE")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (upper.includes("UPDATE") || upper.includes("EDIT")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (upper.includes("PAYMENT") || upper.includes("RECORD")) {
    return "bg-teal-50 text-teal-700 border-teal-200";
  }
  if (upper.includes("DEBIT") || upper.includes("WAIVE")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (
    upper.includes("REJECT") ||
    upper.includes("DELETE") ||
    upper.includes("CANCEL")
  ) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getEntityIcon = (entityType: string) => {
  const upper = entityType.toUpperCase();
  if (upper.includes("BILL")) return ReceiptText;
  if (upper.includes("PAYMENT")) return CreditCard;
  if (upper.includes("WALLET")) return Wallet;
  if (upper.includes("EXPENSE")) return CircleDollarSign;
  return Activity;
};

const getInitials = (name?: string): string => {
  if (!name || name.trim() === "") return "SY";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatKeyLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const formatDisplayValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  const currencyKeys = [
    "amount",
    "baseamount",
    "totalamount",
    "paidamount",
    "balanceamount",
    "latefeeamount",
    "latefeewaivedamount",
    "latefeeperday",
    "balance",
    "creditamount",
    "deductionamount",
    "totaladded",
    "totalused",
    "paymentamount",
  ];

  if (typeof value === "number") {
    if (currencyKeys.includes(key.toLowerCase())) {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatDate(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null && "title" in item && "amount" in item) {
          const typedItem = item as { title: string; amount: number };
          return `${typedItem.title}: ${formatCurrency(Number(typedItem.amount))}`;
        }
        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function TreasurerAudit() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionCategory, setActionCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AuditLog | null>(null);

  const auditQuery = useQuery({
    queryKey: ["treasurer", "audit"],
    queryFn: () => getAuditLogs(),
  });

  const auditLogs = auditQuery.data ?? [];

  // Metrics
  const totalRecords = auditLogs.length;
  const billingCount = auditLogs.filter(
    (record) =>
      record.entityType === "Billing" || record.action.includes("BILL")
  ).length;
  const paymentCount = auditLogs.filter(
    (record) =>
      record.entityType === "Payment" || record.action.includes("PAYMENT")
  ).length;
  const walletCount = auditLogs.filter(
    (record) =>
      record.entityType === "Wallet" || record.action.includes("WALLET")
  ).length;

  const auditSummary = [
    {
      title: "Total Audit Records",
      value: totalRecords.toString(),
      icon: FileClock,
      accent: "from-violet-500 to-indigo-600",
    },
    {
      title: "Billing Actions",
      value: billingCount.toString(),
      icon: ReceiptText,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      title: "Payment Records",
      value: paymentCount.toString(),
      icon: Activity,
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Wallet Operations",
      value: walletCount.toString(),
      icon: Wallet,
      accent: "from-amber-500 to-orange-600",
    },
  ];

  // Filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((record) => {
      // Entity Filter
      if (entityFilter !== "ALL" && record.entityType !== entityFilter) {
        return false;
      }

      // Action Category Filter
      if (actionCategory !== "ALL") {
        if (!record.action.toUpperCase().includes(actionCategory.toUpperCase())) {
          return false;
        }
      }

      // Search Query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const actor = (record.performedByName || "").toLowerCase();
        const action = record.action.toLowerCase();
        const resident = (record.residentName || "").toLowerCase();
        const flat = (record.flatNumber || "").toLowerCase();
        const desc = (record.description || "").toLowerCase();
        const entity = record.entityType.toLowerCase();

        return (
          actor.includes(query) ||
          action.includes(query) ||
          resident.includes(query) ||
          flat.includes(query) ||
          desc.includes(query) ||
          entity.includes(query)
        );
      }

      return true;
    });
  }, [auditLogs, entityFilter, actionCategory, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const resetFilters = () => {
    setSearch("");
    setEntityFilter("ALL");
    setActionCategory("ALL");
    setCurrentPage(1);
  };

  const isFiltered = search.trim() !== "" || entityFilter !== "ALL" || actionCategory !== "ALL";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable, chronological activity log of all financial actions, billing adjustments, and wallet operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Append-Only System
          </div>
          <button
            type="button"
            onClick={() => auditQuery.refetch()}
            disabled={auditQuery.isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${auditQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {auditSummary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by actor, resident, flat, or action..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Module:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["ALL", "Billing", "Payment", "Wallet", "Expense"] as const).map((entity) => (
                  <button
                    key={entity}
                    type="button"
                    onClick={() => {
                      setEntityFilter(entity);
                      setCurrentPage(1);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      entityFilter === entity
                        ? "bg-white font-semibold text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {entity}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Action:</span>
              <select
                value={actionCategory}
                onChange={(e) => {
                  setActionCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">Created</option>
                <option value="UPDATE">Updated</option>
                <option value="PAYMENT">Payments</option>
                <option value="CREDIT">Credits</option>
                <option value="DEBIT">Debits</option>
                <option value="APPROVE">Approved</option>
                <option value="REJECT">Rejected</option>
              </select>
            </div>

            {/* Clear Filter Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-5">
          {auditQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-[#07584F]" />
              <p className="mt-3 text-sm font-medium">Loading audit history...</p>
            </div>
          ) : auditQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-semibold text-red-800">
                Failed to load audit records
              </p>
              <p className="mt-1 text-xs text-red-600">
                {getSafeErrorMessage(auditQuery.error)}
              </p>
              <button
                type="button"
                onClick={() => auditQuery.refetch()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileClock className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {isFiltered ? "No matching audit records" : "No audit records found"}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {isFiltered
                  ? "Try adjusting your search keywords or clearing active filters to see all audit logs."
                  : "Financial and billing operations will be automatically recorded here."}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-3 pr-3 font-semibold">Timestamp</th>
                  <th className="pb-3 pr-3 font-semibold">Actor</th>
                  <th className="pb-3 pr-3 font-semibold">Action & Module</th>
                  <th className="pb-3 pr-3 font-semibold">Resident / Flat</th>
                  <th className="pb-3 pr-3 font-semibold">Description</th>
                  <th className="pb-3 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((record: AuditLog) => {
                  const EntityIcon = getEntityIcon(record.entityType);
                  const actorName = record.performedByName || "System";
                  const hasDetails = Boolean(
                    record.oldValueFormatted ||
                    record.newValueFormatted ||
                    record.oldValue ||
                    record.newValue
                  );

                  return (
                    <tr
                      key={record._id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateTime(record.createdAt)}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200">
                            {getInitials(actorName)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {actorName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {record.performedBy ? "Authorized User" : "System Audit"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action & Module */}
                      <td className="py-3.5 pr-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getActionBadgeStyle(
                              record.action
                            )}`}
                          >
                            {formatActionName(record.action)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <EntityIcon className="h-3 w-3 text-slate-400" />
                            {record.entityType}
                          </span>
                        </div>
                      </td>

                      {/* Resident & Flat Target */}
                      <td className="py-3.5 pr-3">
                        {record.residentName || record.flatNumber || record.unitName ? (
                          <div className="space-y-0.5">
                            {record.residentName && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                                <User className="h-3 w-3 text-slate-400" />
                                <span>{record.residentName}</span>
                              </div>
                            )}
                            {(record.unitName || record.flatNumber) && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Building className="h-3 w-3 text-slate-400" />
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 text-[11px]">
                                  {record.unitName || `Flat ${record.flatNumber}`}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 pr-3 max-w-sm">
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                          {record.description || "No description provided"}
                        </p>
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {hasDetails ? (
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-[#07584F] hover:bg-[#07584F]/5 hover:text-[#07584F]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Changes
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No diff</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Project Standard Pagination */}
          {filteredLogs.length > ITEMS_PER_PAGE ? (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {filteredLogs.length}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 p-1.5 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                  aria-label="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Audit Detail & Changes Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeStyle(
                      selectedRecord.action
                    )}`}
                  >
                    {formatActionName(selectedRecord.action)}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {selectedRecord.entityType}
                  </span>
                </div>
                <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                  Audit Event Details
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded on {formatDateTime(selectedRecord.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Context Summary Cards */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Actor</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#07584F]/10 text-[10px] font-bold text-[#07584F]">
                    {getInitials(selectedRecord.performedByName)}
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedRecord.performedByName || "System"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Resident</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedRecord.residentName || "Apartment Wide / N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Flat / Unit</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedRecord.unitName ||
                      (selectedRecord.flatNumber
                        ? `Flat ${selectedRecord.flatNumber}`
                        : "N/A")}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            {selectedRecord.description && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Description</p>
                <p className="mt-1 text-xs font-medium text-slate-800">
                  {selectedRecord.description}
                </p>
              </div>
            )}

            {/* Changes Inspection Section */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Recorded Changes & Values
              </h4>

              {(() => {
                const oldVals = (selectedRecord.oldValueFormatted || selectedRecord.oldValue) as Record<string, unknown> | undefined;
                const newVals = (selectedRecord.newValueFormatted || selectedRecord.newValue) as Record<string, unknown> | undefined;

                if (!oldVals && !newVals) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                      No explicit field-level changes captured for this event.
                    </div>
                  );
                }

                // If only new values (e.g. create event)
                if (!oldVals && newVals) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                        Initial Values Created
                      </div>
                      <div className="divide-y divide-slate-100 p-2">
                        {Object.entries(newVals).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2 px-3 text-xs"
                          >
                            <span className="font-medium text-slate-500">
                              {formatKeyLabel(key)}
                            </span>
                            <span className="font-semibold text-slate-900 text-right max-w-xs break-words">
                              {formatDisplayValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Side-by-side or stacked diff
                const allKeys = Array.from(
                  new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})])
                );

                return (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-600">
                      <div className="col-span-4">Field</div>
                      <div className="col-span-4 text-rose-700">Before</div>
                      <div className="col-span-4 text-emerald-700">After</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {allKeys.map((key) => {
                        const beforeVal = oldVals ? oldVals[key] : undefined;
                        const afterVal = newVals ? newVals[key] : undefined;
                        const isDifferent =
                          JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                        return (
                          <div
                            key={key}
                            className={`grid grid-cols-12 items-center px-4 py-2.5 text-xs transition-colors ${
                              isDifferent ? "bg-amber-50/30 font-medium" : ""
                            }`}
                          >
                            <div className="col-span-4 font-medium text-slate-700 pr-2">
                              {formatKeyLabel(key)}
                            </div>
                            <div className="col-span-4 text-slate-600 pr-2 break-words">
                              {beforeVal !== undefined ? (
                                <span className={isDifferent ? "text-rose-600 line-through text-[11px]" : ""}>
                                  {formatDisplayValue(key, beforeVal)}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">None</span>
                              )}
                            </div>
                            <div className="col-span-4 text-slate-900 break-words">
                              {afterVal !== undefined ? (
                                <span className={isDifferent ? "text-emerald-700 font-semibold" : ""}>
                                  {formatDisplayValue(key, afterVal)}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">None</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

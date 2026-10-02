"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  KeyRound,
  LifeBuoy,
  Image as ImageIcon,
  ChevronRight,
  RefreshCw,
  CircleDollarSign,
  ShieldCheck,
  FileText,
  Eye,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmResidentComplaint,
  fetchResidentComplaints,
} from "../api/resident-dashboard.api";
import { CreateComplaintModal } from "./create-complaint-modal";
import {
  ResidentComplaintDetailsDrawer,
  type ResidentComplaintItem,
} from "./resident-complaint-details-drawer";

const isResolvedStatus = (status?: string) =>
  Boolean(
    status &&
      ["WORK_COMPLETED", "APPROVED", "CLOSED", "RESOLVED"].includes(
        status.toUpperCase()
      )
  );

const isCancelledOrRejected = (status?: string) =>
  Boolean(
    status && ["REJECTED", "CANCELLED"].includes(status.toUpperCase())
  );

const getStatusBadge = (status: string) => {
  const s = status ? status.toUpperCase() : "PENDING";
  if (["CLOSED", "RESOLVED"].includes(s)) {
    return {
      label: "Closed",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }
  if (s === "APPROVED") {
    return {
      label: "Approved",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }
  if (s === "WORK_COMPLETED") {
    return {
      label: "Work Completed",
      className: "bg-teal-50 text-teal-700 ring-teal-200",
    };
  }
  if (s === "AWAITING_APPROVAL") {
    return {
      label: "Awaiting Approval",
      className: "bg-purple-50 text-purple-700 ring-purple-200",
    };
  }
  if (s === "IN_PROGRESS") {
    return {
      label: "In Progress",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }
  if (s === "ASSIGNED") {
    return {
      label: "Assigned",
      className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    };
  }
  if (s === "UNDER_REVIEW") {
    return {
      label: "Under Review",
      className: "bg-sky-50 text-sky-700 ring-sky-200",
    };
  }
  if (["REJECTED", "CANCELLED"].includes(s)) {
    return {
      label: s.replace(/_/g, " "),
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }
  return {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  };
};

export function ResidentComplaintsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ResidentComplaintItem | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "true" || params.get("action") === "create") {
        setIsCreateModalOpen(true);
      }
    }
  }, []);

  const { data: complaintsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["resident", "complaints"],
    queryFn: () => fetchResidentComplaints({ limit: 50 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const complaintsList: ResidentComplaintItem[] =
    (complaintsData?.complaints as unknown as ResidentComplaintItem[]) || [];

  const filtered = useMemo(() => {
    return complaintsList.filter((c) => {
      if (activeTab === "IN_PROGRESS") {
        if (isResolvedStatus(c.status) || isCancelledOrRejected(c.status)) return false;
      } else if (activeTab === "RESOLVED") {
        if (!isResolvedStatus(c.status)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
          c.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaintsList, activeTab, searchQuery]);

  const handleConfirmResolution = async (ticketId: string) => {
    try {
      setConfirmingId(ticketId);
      await confirmResidentComplaint(ticketId, "Confirmed by Resident");
      toast.success("Complaint resolution confirmed! Ticket closed.");
      await queryClient.invalidateQueries({ queryKey: ["resident", "complaints"] });
      await queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", "complaints"] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to confirm resolution";
      toast.error(msg);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Complaints & Maintenance Requests
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Track ongoing repairs, request facility technician help, and verify completion OTPs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 w-full sm:w-auto"
        >
          <Plus className="size-4" />
          <LifeBuoy className="size-4" />
          <span>Create Complaint</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#DDE3DF] bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7C8782]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title, keyword, or ID..."
            className="h-9 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] pl-9 pr-4 text-xs sm:text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition-colors focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh tickets"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] px-3 text-xs font-medium text-[#637083] hover:text-[#111111] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-[#07584F]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-1 overflow-x-auto w-full sm:w-auto shrink-0 [&::-webkit-scrollbar]:hidden">
            {(["ALL", "IN_PROGRESS", "RESOLVED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-[#07584F] font-semibold shadow-2xs"
                    : "text-[#637083] hover:text-[#111111]"
                }`}
              >
                {tab === "ALL" ? "All Tickets" : tab === "IN_PROGRESS" ? "In Progress" : "Resolved"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-[#DDE3DF] bg-white p-5 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DDE3DF] bg-white py-14 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#07584F]/10 text-[#07584F] mb-3">
            <Wrench className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-[#111111]">
            {searchQuery ? "No matching complaints found" : "No complaints logged"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#637083]">
            {searchQuery
              ? "Try searching with a different term or clear your search."
              : "Raise a ticket anytime you experience plumbing, electrical, or society issues."}
          </p>
          <div className="mt-4 flex gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-lg border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5]"
              >
                Clear Search
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#064C44] cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Raise Maintenance Ticket</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, index) => {
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const isInProgress = ticket.status === "IN_PROGRESS";
            const completionOtp = ticket.completionOtp;
            const hasPhotos = (ticket.images && ticket.images.length > 0) || (ticket.attachments && ticket.attachments.length > 0);
            const statusBadge = getStatusBadge(ticket.status);
            const maintenance = (ticket as any).maintenance;

            return (
              <div
                key={ticket._id || ticket.id || index}
                onClick={() => setSelectedComplaint(ticket)}
                className="group relative rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-3.5 cursor-pointer hover:border-[#07584F]/40 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#7C8782]">
                        #{ticket.ticketNumber || (ticket._id ? ticket._id.slice(-6).toUpperCase() : "TKT")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                      {ticket.priority && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#637083]">
                          {ticket.priority}
                        </span>
                      )}
                      {ticket.category && (
                        <span className="rounded bg-[#F7F8F5] border border-[#E2E8EE] px-1.5 py-0.5 text-[10px] font-medium text-[#4E5B67]">
                          {ticket.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-[#111111] group-hover:text-[#07584F] transition-colors">
                      {ticket.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7C8782] flex items-center gap-1 shrink-0">
                      <Clock className="size-3.5" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="size-4 text-[#7C8782] group-hover:text-[#07584F] group-hover:translate-x-0.5 transition-all hidden sm:block" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#637083] leading-relaxed line-clamp-2">
                  {ticket.description.replace(/^\[Location:\s*[^\static\]]+\]\s*/i, "").replace(/^\[Location:\s*[^\]]+\]\s*/i, "")}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F2F4F7]">
                  <div className="flex items-center gap-3 text-xs">
                    {ticket.assignedStaff ? (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-[#7C8782]">Technician:</span>
                        <span className="font-semibold text-[#111111]">
                          {ticket.assignedStaff.name}
                        </span>
                        <span className="text-[10px] text-[#7C8782]">
                          ({ticket.assignedStaff.role || "Staff"})
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                        Awaiting Technician Allocation
                      </span>
                    )}

                    {hasPhotos && (
                      <div className="flex items-center gap-1 text-[#07584F] font-medium text-[11px]">
                        <ImageIcon className="size-3.5" />
                        <span>Attached Photo</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComplaint(ticket);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                  >
                    <Eye className="h-4 w-4 text-slate-500" />
                    <span>View Details</span>
                  </button>
                </div>

                {completionOtp && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900"
                  >
                    <KeyRound className="size-3.5 text-amber-600 shrink-0" />
                    <span>Completion Verification OTP: </span>
                    <span className="font-mono font-bold text-amber-950">
                      {completionOtp}
                    </span>
                    <span className="text-[10px] text-amber-700 hidden sm:inline">
                      (Share only when work is fully completed)
                    </span>
                  </div>
                )}

                {/* Treasurer & Facility Finance Flow Integration */}
                {maintenance?.costReview && (
                  <div className="space-y-1.5">
                    {maintenance.costReview.forwardedToRole === "TREASURER" && (
                      <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs text-amber-950">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="size-4 text-amber-700 shrink-0" />
                          <span>
                            <strong>Treasurer Society Review: </strong>
                            Cost of ₹{maintenance.costReview.submittedAmount || maintenance.finalCost || 0} approved by Facility Manager, awaiting treasurer payout disbursement.
                          </span>
                        </div>
                        <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 self-start sm:self-auto">
                          Treasurer Review
                        </span>
                      </div>
                    )}

                    {maintenance.costReview.forwardedToRole === "SETTLED" && (
                      <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs text-emerald-950">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>Society Settled: </strong>
                            Cost of ₹{maintenance.costReview.submittedAmount || maintenance.finalCost || 0} disbursed & settled by Society Treasurer as official Society Maintenance Expense.
                          </span>
                        </div>
                        <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900 self-start sm:self-auto">
                          Treasurer Settled
                        </span>
                      </div>
                    )}

                    {maintenance.finalCost && !maintenance.isSocietyCovered && maintenance.costReview.forwardedToRole !== "SETTLED" && (
                      <div className="rounded-lg bg-blue-50/80 border border-blue-200 p-2.5 flex items-center gap-2 text-xs text-blue-950">
                        <FileText className="size-4 text-blue-700 shrink-0" />
                        <span>
                          <strong>Flat Maintenance: </strong>
                          Repair charges of ₹{maintenance.finalCost} included in flat maintenance cycle.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Creation Modal */}
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Complaint Details Drawer */}
      <ResidentComplaintDetailsDrawer
        complaint={selectedComplaint}
        open={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}

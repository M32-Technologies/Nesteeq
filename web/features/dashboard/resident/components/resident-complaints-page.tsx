"use client";

import React, { useMemo, useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  KeyRound,
  LifeBuoy,
  CircleDollarSign,
  ShieldCheck,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmResidentComplaint,
  fetchResidentComplaints,
} from "../api/resident-dashboard.api";
import { CreateComplaintModal } from "./create-complaint-modal";

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: complaintsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["resident", "complaints"],
    queryFn: () => fetchResidentComplaints({ limit: 50 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const complaintsList = complaintsData?.complaints || [];

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
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 self-start sm:self-auto"
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

        <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-1 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-1">
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

      {/* Tickets List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#637083]">
          Loading maintenance tickets...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-12 text-center space-y-3">
          <Wrench className="size-8 text-[#7C8782] mx-auto" />
          <p className="text-base font-semibold text-[#111111]">
            No Maintenance Tickets
          </p>
          <p className="text-xs sm:text-sm text-[#637083] max-w-sm mx-auto">
            Everything is in order! If you have any electrical, plumbing, carpentry, or common area issues, raise a ticket here.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Raise Maintenance Ticket</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, index) => {
            const statusBadge = getStatusBadge(ticket.status);
            const canConfirmResolution =
              ticket.status === "WORK_COMPLETED" || ticket.status === "APPROVED";
            const completionOtp = (ticket as Record<string, any>).completionOtp;
            const maintenance = ticket.maintenance;
            const ticketId = ticket._id || ticket.id || String(index);

            return (
              <div
                key={ticketId}
                className="rounded-lg border border-[#DDE3DF] bg-white p-4.5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                        {ticket.category}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#111111]">
                      {ticket.title}
                    </h3>
                  </div>

                  <span className="text-xs text-[#7C8782] flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#637083] leading-relaxed">
                  {ticket.description}
                </p>

                {ticket.assignedStaff && (
                  <div className="rounded-md bg-[#F7F8F5] border border-[#EEF1F4] p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#7C8782]">Assigned Technician: </span>
                      <span className="font-semibold text-[#111111]">
                        {typeof ticket.assignedStaff === "object" ? ticket.assignedStaff.name : "Facility Staff"}{" "}
                        ({typeof ticket.assignedStaff === "object" ? ticket.assignedStaff.role || "Staff" : "Staff"})
                      </span>
                    </div>
                    {typeof ticket.assignedStaff === "object" && ticket.assignedStaff.phone && (
                      <span className="font-mono text-[#07584F] font-semibold">
                        {ticket.assignedStaff.phone}
                      </span>
                    )}
                  </div>
                )}

                {/* Confirm Resolution Prompt */}
                {canConfirmResolution && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md bg-emerald-50/70 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Work is completed on this ticket. Please confirm if the issue is resolved.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmResolution(ticketId)}
                      disabled={confirmingId === ticketId}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>{confirmingId === ticketId ? "Confirming..." : "Confirm Resolution"}</span>
                    </button>
                  </div>
                )}

                {/* Completion OTP */}
                {completionOtp && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
                    <KeyRound className="size-3.5 text-amber-600" />
                    <span>Completion Verification OTP: </span>
                    <span className="font-mono font-bold text-amber-950">
                      {completionOtp}
                    </span>
                    <span className="text-[10px] text-amber-700">
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

      {/* Modal Dialog */}
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

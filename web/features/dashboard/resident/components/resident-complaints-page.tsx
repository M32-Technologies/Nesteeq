"use client";

import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  KeyRound,
  LifeBuoy,
  X,
  CircleDollarSign,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchResidentComplaints } from "../api/resident-dashboard.api";
import { CreateComplaintModal } from "./create-complaint-modal";

export function ResidentComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["resident", "complaints", activeTab, searchQuery],
    queryFn: () =>
      fetchResidentComplaints({
        status: activeTab === "ALL" ? undefined : activeTab,
        search: searchQuery.trim() || undefined,
        limit: 50,
      }),
  });

  const complaintsList = complaintsData?.complaints || [];

  const filtered = complaintsList.filter((c) => {
    if (activeTab === "IN_PROGRESS" && (c.status === "RESOLVED" || c.status === "CLOSED")) return false;
    if (activeTab === "RESOLVED" && c.status !== "RESOLVED" && c.status !== "CLOSED") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

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
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const isInProgress = ticket.status === "IN_PROGRESS";
            const completionOtp = (ticket as Record<string, any>).completionOtp;
            const maintenance = ticket.maintenance;

            return (
              <div
                key={ticket._id || ticket.id || index}
                className="rounded-lg border border-[#DDE3DF] bg-white p-4.5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#7C8782]">
                        #{ticket.ticketNumber || (ticket._id ? ticket._id.slice(-6).toUpperCase() : "TKT")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                          isResolved
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : isInProgress
                            ? "bg-blue-50 text-blue-700 ring-blue-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {ticket.status}
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
                        {ticket.assignedStaff.name} ({ticket.assignedStaff.role || "Staff"})
                      </span>
                    </div>
                    {ticket.assignedStaff.phone && (
                      <span className="font-mono text-[#07584F] font-semibold">
                        {ticket.assignedStaff.phone}
                      </span>
                    )}
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

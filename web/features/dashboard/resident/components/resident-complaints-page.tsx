"use client";

import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  KeyRound,
  LifeBuoy,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchResidentComplaints } from "../api/resident-dashboard.api";
import { CreateComplaintModal } from "./create-complaint-modal";
import {
  ResidentComplaintDetailsDrawer,
  type ResidentComplaintItem,
} from "./resident-complaint-details-drawer";

export function ResidentComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ResidentComplaintItem | null>(null);

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["resident", "complaints", activeTab],
    queryFn: () =>
      fetchResidentComplaints({
        status: activeTab === "ALL" ? undefined : activeTab,
      }),
  });

  const complaintsList: ResidentComplaintItem[] =
    (complaintsData?.complaints as unknown as ResidentComplaintItem[]) || [];

  const displayList = complaintsList;

  const filtered = displayList.filter((c) => {
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
            Track ongoing repairs, request facility help, and verify completion OTPs.
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

                  <span className="text-xs font-medium text-[#07584F] group-hover:underline flex items-center gap-1">
                    View Details &amp; Track &rarr;
                  </span>
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

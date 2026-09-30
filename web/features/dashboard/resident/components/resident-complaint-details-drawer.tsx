"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  ShieldAlert,
  Maximize2,
  Calendar,
  Layers,
  KeyRound,
  ExternalLink,
} from "lucide-react";

export interface ResidentComplaintItem {
  _id: string;
  id?: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status:
    | "PENDING"
    | "UNDER_REVIEW"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED"
    | "REJECTED"
    | "CANCELLED";
  assignedStaff?: {
    _id?: string;
    name?: string;
    fullName?: string;
    role?: string;
    phone?: string;
    email?: string;
  } | null;
  assignedTechnician?: {
    _id?: string;
    name?: string;
    fullName?: string;
    role?: string;
    phone?: string;
    email?: string;
  } | null;
  assignedTo?: {
    _id?: string;
    name?: string;
    fullName?: string;
    role?: string;
    phone?: string;
    email?: string;
  } | string | null;
  assignedTechnicianName?: string | null;
  flat?: string | null;
  unit?: {
    unitNumber?: string;
    flatNumber?: string;
  } | null;
  completionOtp?: string | null;
  images?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ResidentComplaintDetailsDrawerProps {
  complaint: ResidentComplaintItem | null;
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

function getMediaUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";
  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

export function ResidentComplaintDetailsDrawer({
  complaint,
  open,
  isOpen,
  onClose,
}: ResidentComplaintDetailsDrawerProps) {
  const isDrawerOpen = open ?? isOpen ?? !!complaint;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else if (isDrawerOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, selectedPhoto, onClose]);

  if (!isDrawerOpen || !complaint) return null;

  const locationMatch = complaint.description.match(/^\[Location:\s*([^\]]+)\]/i);
  const parsedLocation = locationMatch ? locationMatch[1].trim() : null;
  const cleanDescription = complaint.description
    .replace(/^\[Location:\s*[^\static\]]+\]\s*/i, "")
    .replace(/^\[Location:\s*[^\static\]]+\]\s*/i, "")
    .replace(/^\[Location:\s*[^\]]+\]\s*/i, "")
    .trim();

  const rawImages: string[] = [
    ...(Array.isArray(complaint.images) ? complaint.images : []),
    ...(Array.isArray(complaint.attachments) ? complaint.attachments : []),
  ].filter(Boolean);

  const status = complaint.status;
  const isTerminalNegative = status === "REJECTED" || status === "CANCELLED";

  let currentStep = 1;
  if (status === "ASSIGNED") currentStep = 2;
  else if (status === "IN_PROGRESS") currentStep = 3;
  else if (status === "RESOLVED" || status === "CLOSED") currentStep = 4;
  else if (status === "UNDER_REVIEW") currentStep = 1;

  const steps = [
    { label: "Submitted", step: 1, desc: "Ticket logged" },
    { label: "Assigned", step: 2, desc: "Technician allocated" },
    { label: "In Progress", step: 3, desc: "Work underway" },
    { label: "Resolved", step: 4, desc: "Issue fixed" },
  ];

  const staff =
    complaint.assignedStaff ||
    complaint.assignedTechnician ||
    (typeof complaint.assignedTo === "object" && complaint.assignedTo !== null
      ? complaint.assignedTo
      : null);
  const technicianName =
    (staff && typeof staff === "object" ? staff.name || staff.fullName : null) ||
    complaint.assignedTechnicianName ||
    (typeof complaint.assignedTo === "string" ? complaint.assignedTo : null);
  const technicianRole =
    staff && typeof staff === "object" && staff.role ? staff.role : "Maintenance Staff";
  const technicianPhone = staff && typeof staff === "object" && staff.phone ? staff.phone : null;
  const technicianEmail = staff && typeof staff === "object" && staff.email ? staff.email : null;

  const ticketNumber =
    complaint.ticketNumber ||
    (complaint._id ? complaint._id.slice(-6).toUpperCase() : "TKT");

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <aside
          className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-250 ease-out"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-[#DDE3DF] bg-[#F7F8F5]/80 px-6 py-5">
            <div className="space-y-1.5 min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#07584F]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#07584F]">
                  #{ticketNumber}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ${
                    status === "RESOLVED" || status === "CLOSED"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : status === "IN_PROGRESS"
                      ? "bg-blue-50 text-blue-700 ring-blue-200"
                      : status === "ASSIGNED"
                      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                      : isTerminalNegative
                      ? "bg-rose-50 text-rose-700 ring-rose-200"
                      : "bg-amber-50 text-amber-700 ring-amber-200"
                  }`}
                >
                  {status}
                </span>

                {complaint.priority && (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      complaint.priority === "URGENT"
                        ? "bg-rose-100 text-rose-800"
                        : complaint.priority === "HIGH"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {complaint.priority} Priority
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#7C8782] pt-0.5">
                <Calendar className="size-3.5" />
                <span>Raised on {formattedDate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#637083] hover:bg-[#EEF1F4] hover:text-[#111111] transition cursor-pointer"
              aria-label="Close complaint details"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Drawer Body Scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Status Stepper */}
            {!isTerminalNegative ? (
              <section className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5]/60 p-4.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#637083] mb-4">
                  Request Progress
                </h4>

                <div className="grid grid-cols-4 relative">
                  <div className="absolute top-3.5 left-[12%] right-[12%] h-0.5 bg-[#DDE3DF] -z-0" />
                  <div
                    className="absolute top-3.5 left-[12%] h-0.5 bg-[#07584F] transition-all duration-300 -z-0"
                    style={{
                      width: `${((Math.min(currentStep, 4) - 1) / 3) * 76}%`,
                    }}
                  />

                  {steps.map((s) => {
                    const isPassed = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;

                    return (
                      <div key={s.step} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            isPassed
                              ? "bg-[#07584F] text-white ring-4 ring-[#07584F]/15"
                              : "bg-white border-2 border-[#DDE3DF] text-[#7C8782]"
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="size-4 text-white" />
                          ) : (
                            <span>{s.step}</span>
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium leading-tight ${
                            isCurrent
                              ? "font-semibold text-[#07584F]"
                              : isPassed
                              ? "text-[#111111]"
                              : "text-[#7C8782]"
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="text-[10px] text-[#7C8782] hidden sm:block mt-0.5">
                          {s.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-900">
                <ShieldAlert className="size-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-rose-950">
                    This complaint was {status.toLowerCase()}
                  </p>
                  <p className="text-rose-800 leading-relaxed">
                    If you believe this was an error or the issue persists, please reach out to the society facility manager or raise a fresh request.
                  </p>
                </div>
              </div>
            )}

            {/* Issue Information */}
            <section className="space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                  Issue Title
                </span>
                <h3 className="text-lg font-semibold text-[#111111] mt-0.5">
                  {complaint.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2.5 rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3 text-xs">
                  <div className="flex size-7 items-center justify-center rounded-md bg-white text-[#07584F] border border-[#DDE3DF]">
                    <Layers className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7C8782]">Category</p>
                    <p className="font-semibold text-[#111111]">{complaint.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3 text-xs">
                  <div className="flex size-7 items-center justify-center rounded-md bg-white text-[#07584F] border border-[#DDE3DF]">
                    <MapPin className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7C8782]">Location inside Unit</p>
                    <p className="font-semibold text-[#111111]">
                      {parsedLocation ||
                        (complaint.flat
                          ? `Flat ${complaint.flat}`
                          : complaint.unit?.unitNumber
                          ? `Flat ${complaint.unit.unitNumber}`
                          : complaint.unit?.flatNumber
                          ? `Flat ${complaint.unit.flatNumber}`
                          : "General Area")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                  Detailed Description
                </span>
                <div className="rounded-xl border border-[#DDE3DF] bg-slate-50/50 p-4 text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {cleanDescription || complaint.description}
                </div>
              </div>
            </section>

            {/* Completion Verification OTP Banner */}
            {complaint.completionOtp && (
              <section className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 flex items-start gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <KeyRound className="size-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-semibold text-amber-950">
                    Completion Verification Code (OTP)
                  </p>
                  <p className="font-mono text-base font-bold tracking-wider text-amber-950">
                    {complaint.completionOtp}
                  </p>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    Please share this 4-digit code with the technician only after you have inspected and confirmed that the repair work is completed.
                  </p>
                </div>
              </section>
            )}

            {/* Attached Photos */}
            {rawImages.length > 0 && (
              <section className="space-y-2.5 border-t border-[#EEF1F4] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                    Attached Photos ({rawImages.length})
                  </h4>
                  <span className="text-[11px] text-[#7C8782]">Click photo to enlarge</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {rawImages.map((img, idx) => {
                    const resolved = getMediaUrl(img);
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPhoto(resolved)}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:border-[#07584F] transition-colors"
                      >
                        <img
                          src={resolved}
                          alt={`Attachment ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="size-3" /> Enlarge
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Assigned Technician Card */}
            <section className="space-y-2.5 border-t border-[#EEF1F4] pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                Assigned Staff & Support
              </h4>

              {technicianName ? (
                <div className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#07584F] text-white font-semibold text-sm">
                      {technicianName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#111111]">
                          {technicianName}
                        </p>
                        <span className="rounded bg-white border border-[#DDE3DF] px-2 py-0.5 text-[10px] font-medium text-[#07584F]">
                          {technicianRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#637083] mt-0.5">
                        Assigned society technician handling this ticket
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0">
                    {technicianPhone && (
                      <a
                        href={`tel:${technicianPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#07584F] bg-white px-3 py-1.5 text-xs font-medium text-[#07584F] hover:bg-[#07584F]/5 transition"
                      >
                        <Phone className="size-3.5" />
                        <span>Call {technicianPhone}</span>
                      </a>
                    )}
                    {technicianEmail && (
                      <a
                        href={`mailto:${technicianEmail}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white px-3 py-1.5 text-xs font-medium text-[#637083] hover:text-[#111111] transition"
                        title={technicianEmail}
                      >
                        <Mail className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#DDE3DF] bg-[#F7F8F5]/60 p-4 text-xs text-[#637083] flex items-center gap-3">
                  <Clock className="size-4.5 text-[#7C8782] shrink-0" />
                  <p>
                    Our facility manager is reviewing your complaint and will assign a dedicated technician shortly. You will be notified as soon as work begins.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Drawer Footer */}
          <div className="shrink-0 border-t border-[#DDE3DF] bg-[#F7F8F5]/80 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-[#7C8782]">
              Need urgent escalation? Contact Society Desk.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DDE3DF] bg-white px-4 py-2 text-xs font-medium text-[#111111] hover:bg-[#EEF1F4] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </aside>
      </div>

      {/* Full-Screen Lightbox Image Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
              <span className="text-xs font-medium text-slate-300">
                Ticket Attachment • #{ticketNumber}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open Full</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center p-2 bg-slate-950">
              <img
                src={selectedPhoto}
                alt="Enlarged complaint attachment"
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Image as ImageIcon,
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
    | "WORK_COMPLETED"
    | "AWAITING_APPROVAL"
    | "APPROVED"
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
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
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

  const locationMatch = complaint.description.match(/\[Location:\s*([^\]]+)\]/i);
  const parsedLocation = locationMatch ? locationMatch[1].trim() : null;

  const photoRefMatch = complaint.description.match(
    /\[Attached Photo Reference:\s*([^\]]+)\]/i
  );
  const parsedPhotoRef = photoRefMatch ? photoRefMatch[1].trim() : null;

  const cleanDescription = complaint.description
    .replace(/\[Location:\s*[^\]]+\]/gi, "")
    .replace(/\[Attached Photo Reference:[^\]]+\]/gi, "")
    .trim();

  const uniquePhotos: string[] = useMemo(() => {
    // Prefer images array if present; otherwise fallback to attachments
    const candidateList =
      Array.isArray(complaint.images) && complaint.images.length > 0
        ? complaint.images
        : Array.isArray(complaint.attachments) && complaint.attachments.length > 0
        ? complaint.attachments
        : [];

    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of candidateList) {
      if (!raw) continue;
      const resolved = getMediaUrl(String(raw).trim());
      if (!resolved) continue;

      const key = resolved.split("/").pop()?.split("?")[0]?.toLowerCase() || resolved;

      if (!seen.has(key)) {
        seen.add(key);
        result.push(resolved);
      }
    }

    return result;
  }, [complaint.images, complaint.attachments]);

  const status = (complaint.status || "PENDING").toUpperCase();
  const isTerminalNegative = status === "REJECTED" || status === "CANCELLED";

  // Progress Tracker Steps: Complaint Raised -> Assigned -> Work in Progress -> Completed
  let currentStep = 1;
  if (status === "ASSIGNED") {
    currentStep = 2;
  } else if (["IN_PROGRESS", "UNDER_REPAIR", "IN-PROGRESS"].includes(status)) {
    currentStep = 3;
  } else if (
    ["RESOLVED", "CLOSED", "WORK_COMPLETED", "APPROVED", "AWAITING_APPROVAL"].includes(
      status
    )
  ) {
    currentStep = 4;
  } else {
    currentStep = 1;
  }

  const steps = [
    { label: "Complaint Raised", step: 1, desc: "Ticket logged" },
    { label: "Assigned", step: 2, desc: "Technician allocated" },
    { label: "Work in Progress", step: 3, desc: "Work underway" },
    { label: "Completed", step: 4, desc: "Issue resolved" },
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

  const technicianPhone =
    (staff && typeof staff === "object"
      ? (staff as any).phone ||
        (staff as any).phoneNumber ||
        (staff as any).mobile ||
        (staff as any).contact
      : null) ||
    (complaint as any).technicianPhone ||
    (complaint as any).technicianContact ||
    null;

  const technicianEmail =
    staff && typeof staff === "object" && staff.email ? staff.email : null;

  const completionOtp =
    complaint.completionOtp ||
    (complaint as any).otp ||
    (complaint as any).verificationOtp ||
    (complaint as any).maintenance?.verificationOtp ||
    (complaint as any).maintenance?.completionOtp ||
    null;

  const rawId =
    complaint.ticketNumber ||
    (complaint._id ? complaint._id.slice(-6).toUpperCase() : "TKT");
  const ticketReferenceId = `#${rawId.replace(/^#+/, "")}`;

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
                  {ticketReferenceId}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ${
                    status === "RESOLVED" ||
                    status === "CLOSED" ||
                    status === "WORK_COMPLETED" ||
                    status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : status === "IN_PROGRESS" || status === "UNDER_REPAIR"
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
                    {complaint.priority}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#7C8782] pt-0.5">
                <Calendar className="size-3.5" />
                <span>Created {formattedDate}</span>
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
            {/* Progress Tracker / Timeline */}
            {!isTerminalNegative ? (
              <section className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5]/60 p-4.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#637083] mb-4">
                  Progress Tracker
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
                      <div
                        key={s.step}
                        className="flex flex-col items-center text-center relative z-10"
                      >
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
                    If you believe this was an error or the issue persists, please reach out to
                    the facility manager or raise a fresh request.
                  </p>
                </div>
              </div>
            )}

            {/* Issue Description & Info */}
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
                    <p className="text-[11px] text-[#7C8782]">Location</p>
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

            {/* OTP / Verification Status */}
            {completionOtp && (
              <section className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4.5 flex items-start gap-3.5 shadow-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <KeyRound className="size-4.5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      Completion Verification Code (OTP)
                    </p>
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Awaiting Verification
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl font-black tracking-widest text-amber-950">
                      {completionOtp}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-normal">
                    Share this verification OTP with the technician only after you have inspected
                    and confirmed that the repair work is completed.
                  </p>
                </div>
              </section>
            )}

            {/* Attached Photos / Proof */}
            {uniquePhotos.length > 0 ? (
              <section className="space-y-2.5 border-t border-[#EEF1F4] pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                    ATTACHED PHOTOS / PROOF ({uniquePhotos.length})
                  </h4>
                  <span className="text-[11px] text-[#7C8782]">Click photo to enlarge</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uniquePhotos.map((img, idx) => {
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
            ) : parsedPhotoRef ? (
              <section className="space-y-2.5 border-t border-[#EEF1F4] pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                  ATTACHED PHOTOS / PROOF (1)
                </h4>
                <div className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5] p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative aspect-video w-full sm:w-44 overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-500 shadow-2xs">
                    <ImageIcon className="size-8 text-[#07584F]/70 mb-1" />
                    <span className="text-[10px] font-medium text-slate-600">
                      Attached Proof Image
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs flex-1">
                    <span className="rounded bg-teal-50 text-[#07584F] border border-teal-200 px-2 py-0.5 text-[10px] font-semibold">
                      Screenshot Reference Attached
                    </span>
                    <p className="font-semibold text-slate-900 mt-1 break-all">
                      {parsedPhotoRef}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Photo captured during ticket creation and accessible to the assigned technician.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Assigned Technician Details */}
            <section className="space-y-2.5 border-t border-[#EEF1F4] pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8782]">
                Assigned Technician Details
              </h4>

              {technicianName ? (
                <div className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#07584F] text-white font-semibold text-sm shadow-2xs">
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
                    {technicianPhone ? (
                      <a
                        href={`tel:${technicianPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#07584F] bg-white px-3 py-1.5 text-xs font-semibold text-[#07584F] shadow-2xs hover:bg-[#07584F]/5 transition"
                      >
                        <Phone className="size-3.5" />
                        <span>Call {technicianPhone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#7C8782] italic">
                        Phone available on dispatch
                      </span>
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
                    Our facility manager is reviewing your complaint and will assign a dedicated
                    technician shortly. You will be notified as soon as work begins.
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
                Ticket Attachment • {ticketReferenceId}
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

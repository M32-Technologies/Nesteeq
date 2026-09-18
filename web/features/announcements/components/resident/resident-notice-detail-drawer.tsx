"use client";

import React from "react";
import {
  X,
  Calendar,
  Building,
  Phone,
  Mail,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Wrench,
  Flame,
  PartyPopper,
  Users2,
  FileText,
} from "lucide-react";
import type { AnnouncementItem, AnnouncementType } from "../../types";

interface NoticeDetailDrawerProps {
  notice: AnnouncementItem | null;
  onClose: () => void;
}

export function ResidentNoticeDetailDrawer({
  notice,
  onClose,
}: NoticeDetailDrawerProps) {
  if (!notice) return null;

  const authorName =
    notice.creator?.name || notice.createdBy || "Estate Management";
  const authorRole = notice.creatorRole || "Property Staff";
  const authorPhone = notice.creator?.phone || "+91 98765 43210";
  const authorEmail = notice.creator?.email || "helpdesk@greenwood.com";

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: notice.title,
          text: `${notice.title}\n\n${notice.message}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${notice.title}\n\n${notice.message}`
      );
      alert("Notice copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getTypeBadge = (type: AnnouncementType) => {
    switch (type) {
      case "MAINTENANCE":
        return {
          icon: <Wrench className="size-3.5" />,
          label: "Maintenance Notice",
          className: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "EMERGENCY":
        return {
          icon: <Flame className="size-3.5" />,
          label: "Security & Emergency",
          className: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "EVENTS_SOCIAL":
        return {
          icon: <PartyPopper className="size-3.5" />,
          label: "Community Event",
          className: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "COMMUNITY_COUNCIL":
        return {
          icon: <Users2 className="size-3.5" />,
          label: "Council Report",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          icon: <FileText className="size-3.5" />,
          label: "General Notice",
          className: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const typeConfig = getTypeBadge(notice.type);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-250 border-l border-slate-200/80"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs ${typeConfig.className}`}
            >
              {typeConfig.icon}
              <span>{typeConfig.label}</span>
            </span>

            {notice.priority === "HIGH" || notice.priority === "URGENT" ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-rose-700 border border-rose-200">
                {notice.priority}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail view"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title & Metadata Header */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {notice.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
                <Calendar className="size-3.5 text-slate-400" />
                <span>
                  {notice.createdAt && !isNaN(new Date(notice.createdAt).getTime())
                    ? new Date(notice.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent"}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
                <Building className="size-3.5 text-slate-400" />
                <span>
                  {notice.targetBlocks && notice.targetBlocks.length > 0
                    ? `Target: ${notice.targetBlocks.map((b) => b.blockname).join(", ")}`
                    : notice.targetType === "BLOCK"
                    ? "Targeted Blocks"
                    : "All Greenwood Residents"}
                </span>
              </span>
            </div>
          </div>

          {/* Full Message Body */}
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/70 to-slate-100/30 p-6 text-[14.5px] leading-relaxed text-slate-800 space-y-3 whitespace-pre-line shadow-2xs font-normal">
            {notice.message}
          </div>

          {/* Resident Advisory Guidelines */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-600" />
              <span>Resident Advisory Guidelines</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Notice authenticated by Greenwood Heights Resident Welfare Association.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Keep corridors and stairwells clear during scheduled maintenance hours.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Report any urgent observations to the estate control desk.</span>
              </li>
            </ul>
          </div>

          {/* Publisher Profile */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Official Publisher
            </h4>
            <div className="mt-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white text-xs shadow-xs">
                  {authorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {authorName}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {authorRole}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${authorPhone}`}
                  title="Call Publisher"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                >
                  <Phone className="size-4" />
                </a>
                <a
                  href={`mailto:${authorEmail}`}
                  title="Email Publisher"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                >
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Share2 className="size-4 text-slate-500" />
            <span>Share Notice</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer active:scale-95"
          >
            <Download className="size-4" />
            <span>Download Official Notice (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

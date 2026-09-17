"use client";

import React from "react";
import {
  X,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { AnnouncementItem } from "../../types";

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
              {notice.type}
            </span>
            {notice.priority === "HIGH" || notice.priority === "URGENT" ? (
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 border border-rose-200">
                {notice.priority}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {notice.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" />
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
              <span className="flex items-center gap-1.5">
                <Building className="size-3.5 text-slate-400" />
                {notice.targetBlocks && notice.targetBlocks.length > 0
                  ? `Targeted: ${notice.targetBlocks.map((b) => b.blockname).join(", ")}`
                  : notice.targetType === "BLOCK"
                  ? "Targeted Blocks"
                  : "All Greenwood Residents"}
              </span>
            </div>
          </div>

          {/* Full Message Body */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-[14px] leading-relaxed text-slate-700 space-y-3 whitespace-pre-line">
            {notice.message}
          </div>

          {/* Key Advisory Points */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-600" />
              Resident Advisory Guidelines
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Notice authenticated by Greenwood Heights Resident Welfare Association.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Keep corridors and stairwells clear during scheduled maintenance hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Report any non-compliance to security control desk.</span>
              </li>
            </ul>
          </div>

          {/* Issuer / Publisher Profile */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Published By
            </h4>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-xs">
                  {authorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{authorName}</p>
                  <p className="text-xs text-slate-500">{authorRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${authorPhone}`}
                  title="Call Officer"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
                >
                  <Phone className="size-4" />
                </a>
                <a
                  href={`mailto:${authorEmail}`}
                  title="Send Email"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
                >
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Share2 className="size-4" />
            <span>Share Notice</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Download className="size-4" />
            <span>Download Official Notice (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

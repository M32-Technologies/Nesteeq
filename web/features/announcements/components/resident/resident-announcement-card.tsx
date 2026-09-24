"use client";

import React from "react";
import {
  Wrench,
  PartyPopper,
  Building,
  FileText,
  AlertOctagon,
  ArrowRight,
  Download,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
} from "lucide-react";
import type { AnnouncementItem, AnnouncementType } from "../../types";

interface ResidentAnnouncementCardProps {
  notice: AnnouncementItem;
  onSelect: (notice: AnnouncementItem) => void;
  viewMode?: "grid" | "stream";
}

export function ResidentAnnouncementCard({
  notice,
  onSelect,
  viewMode = "grid",
}: ResidentAnnouncementCardProps) {
  // Determine rich category styling and accent palette
  const getBadgeConfig = (type: AnnouncementType, title: string) => {
    const t = title.toLowerCase();

    if (type === "MAINTENANCE") {
      return {
        label: "MAINTENANCE",
        icon: <Wrench className="size-3.5" />,
        badgeClasses: "bg-sky-50 text-sky-700 border-sky-200/80",
        accentGradient: "from-sky-500 to-blue-600",
        avatarBg: "bg-gradient-to-br from-sky-500 to-blue-600",
        hoverBorder: "hover:border-sky-300",
        indicatorColor: "bg-sky-500",
      };
    }

    if (type === "EVENTS_SOCIAL") {
      return {
        label: "COMMUNITY EVENT",
        icon: <PartyPopper className="size-3.5" />,
        badgeClasses: "bg-purple-50 text-purple-700 border-purple-200/80",
        accentGradient: "from-purple-500 to-indigo-600",
        avatarBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
        hoverBorder: "hover:border-purple-300",
        indicatorColor: "bg-purple-500",
      };
    }

    if (type === "COMMUNITY_COUNCIL" || t.includes("audit") || t.includes("report")) {
      return {
        label: "COUNCIL REPORT",
        icon: <Building className="size-3.5" />,
        badgeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        accentGradient: "from-emerald-500 to-teal-600",
        avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        hoverBorder: "hover:border-emerald-300",
        indicatorColor: "bg-emerald-500",
      };
    }

    if (t.includes("waste") || t.includes("sanitation") || t.includes("chute")) {
      return {
        label: "SANITATION GUIDELINE",
        icon: <FileText className="size-3.5" />,
        badgeClasses: "bg-teal-50 text-teal-700 border-teal-200/80",
        accentGradient: "from-teal-500 to-cyan-600",
        avatarBg: "bg-gradient-to-br from-teal-500 to-cyan-600",
        hoverBorder: "hover:border-teal-300",
        indicatorColor: "bg-teal-500",
      };
    }

    if (type === "EMERGENCY" || notice.priority === "URGENT") {
      return {
        label: "SECURITY ADVISORY",
        icon: <AlertOctagon className="size-3.5" />,
        badgeClasses: "bg-rose-50 text-rose-700 border-rose-200/80",
        accentGradient: "from-rose-500 to-red-600",
        avatarBg: "bg-gradient-to-br from-rose-500 to-red-600",
        hoverBorder: "hover:border-rose-300",
        indicatorColor: "bg-rose-500",
      };
    }

    return {
      label: "GENERAL NOTICE",
      icon: <FileText className="size-3.5" />,
      badgeClasses: "bg-slate-100 text-slate-700 border-slate-200/80",
      accentGradient: "from-slate-600 to-slate-800",
      avatarBg: "bg-gradient-to-br from-slate-600 to-slate-800",
      hoverBorder: "hover:border-slate-300",
      indicatorColor: "bg-slate-500",
    };
  };

  const badge = getBadgeConfig(notice.type, notice.title);

  // Format friendly relative time
  const formatTime = (iso: string) => {
    if (!iso) return "Recent";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "Recent";

    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "Just now";
    }

    if (diffHours < 12) {
      return `Today • ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    if (diffDays === 1) {
      return `Yesterday • ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const authorName =
    notice.creator?.name || notice.createdBy || "Greenwood Management";
  const initials = authorName
    .split(/[\s()]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const authorRole = notice.creatorRole || "Estate Office";

  const isReport =
    notice.type === "COMMUNITY_COUNCIL" ||
    notice.title.toLowerCase().includes("report");

  const isUrgent = notice.priority === "URGENT" || notice.priority === "HIGH";

  /* ========================================================================= */
  /* STREAM / TIMELINE VIEW MODE                                                */
  /* ========================================================================= */
  if (viewMode === "stream") {
    return (
      <div
        onClick={() => onSelect(notice)}
        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${badge.hoverBorder}`}
      >
        <span
          className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${badge.accentGradient}`}
        />

        <div className="flex items-start gap-4 min-w-0 flex-1 pl-1">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${badge.avatarBg}`}
          >
            {badge.icon}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide ${badge.badgeClasses}`}
              >
                <span>{badge.label}</span>
              </span>

              {isUrgent && (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                  {notice.priority}
                </span>
              )}

              <span className="text-xs text-slate-400">
                {formatTime(notice.createdAt)}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {notice.title}
            </h3>

            <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-1">
              {notice.message}
            </p>
          </div>
        </div>

        {/* Right Author + Action */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 pl-1 sm:pl-0">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${badge.avatarBg}`}
            >
              {initials || "GW"}
            </div>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">
              {authorName}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
            <span>{isReport ? "Download" : "Read"}</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* GRID / CARD VIEW MODE (DEFAULT)                                            */
  /* ========================================================================= */
  return (
    <div
      onClick={() => onSelect(notice)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] cursor-pointer ${badge.hoverBorder}`}
    >
      {/* Subtle top accent gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${badge.accentGradient}`}
      />

      <div>
        {/* Top Header: Badge, Priority, Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-2xs ${badge.badgeClasses}`}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            {isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>{notice.priority}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 shrink-0">
            <Clock className="size-3 text-slate-300" />
            <span>{formatTime(notice.createdAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-[16.5px] sm:text-[17.5px] font-bold tracking-tight text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
          {notice.title}
        </h3>

        {/* Message Excerpt */}
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-600 line-clamp-3">
          {notice.message}
        </p>

        {/* Target block badge (if targeted) */}
        {notice.targetBlocks && notice.targetBlocks.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-100">
            <Layers className="size-3 text-slate-400" />
            <span>Target: {notice.targetBlocks.map((b) => b.code).join(", ")}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Author + Interactive Pill CTA */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100/90 pt-4">
        {/* Author Section */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ring-2 ring-white ${badge.avatarBg}`}
          >
            {initials || "GW"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800">
              {authorName}
            </p>
            <p className="truncate text-[10.5px] text-slate-400 font-medium">
              {authorRole}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pl-3">
          {isReport ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs group-hover:bg-emerald-100 transition-colors">
              <span>Download</span>
              <Download className="size-3.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-100/80 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
              <span>Read Notice</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

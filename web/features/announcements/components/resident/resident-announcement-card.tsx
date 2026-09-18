"use client";

import React from "react";
import {
  Wrench,
  PartyPopper,
  Users2,
  FileText,
  AlertOctagon,
  ArrowRight,
  Download,
  Building,
} from "lucide-react";
import type { AnnouncementItem, AnnouncementType } from "../../types";

interface ResidentAnnouncementCardProps {
  notice: AnnouncementItem;
  onSelect: (notice: AnnouncementItem) => void;
}

export function ResidentAnnouncementCard({
  notice,
  onSelect,
}: ResidentAnnouncementCardProps) {
  // Determine badge styling based on type
  const getBadgeConfig = (type: AnnouncementType, title: string) => {
    const t = title.toLowerCase();

    if (type === "MAINTENANCE") {
      return {
        label: "MAINTENANCE",
        icon: <Wrench className="size-3.5" />,
        className: "bg-[#E0F2FE] text-[#0369A1] border-sky-200/80",
        avatarBg: "bg-[#0284C7]",
      };
    }

    if (type === "EVENTS_SOCIAL") {
      return {
        label: "COMMUNITY EVENT",
        icon: <PartyPopper className="size-3.5" />,
        className: "bg-[#F3E8FF] text-[#7E22CE] border-purple-200/80",
        avatarBg: "bg-[#9333EA]",
      };
    }

    if (type === "COMMUNITY_COUNCIL" || t.includes("audit") || t.includes("report")) {
      return {
        label: "COUNCIL REPORT",
        icon: <Building className="size-3.5" />,
        className: "bg-[#DCFCE7] text-[#15803D] border-emerald-200/80",
        avatarBg: "bg-[#16A34A]",
      };
    }

    if (t.includes("waste") || t.includes("sanitation") || t.includes("chute")) {
      return {
        label: "SANITATION GUIDELINE",
        icon: <FileText className="size-3.5" />,
        className: "bg-[#CCFBF1] text-[#0F766E] border-teal-200/80",
        avatarBg: "bg-[#0D9488]",
      };
    }

    if (type === "EMERGENCY" || notice.priority === "URGENT") {
      return {
        label: "SECURITY ADVISORY",
        icon: <AlertOctagon className="size-3.5" />,
        className: "bg-[#FFE4E6] text-[#BE123C] border-rose-200/80",
        avatarBg: "bg-[#E11D48]",
      };
    }

    return {
      label: "GENERAL NOTICE",
      icon: <FileText className="size-3.5" />,
      className: "bg-[#F1F5F9] text-[#334155] border-slate-200/80",
      avatarBg: "bg-[#475569]",
    };
  };

  const badge = getBadgeConfig(notice.type, notice.title);

  // Format relative or friendly timestamp matching the design
  const formatTime = (iso: string) => {
    if (!iso) return "Recent";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "Recent";

    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    const diffDays = Math.floor(diffHours / 24);

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

  // Extract author initials
  const authorName =
    notice.creator?.name || notice.createdBy || "Greenwood Management";
  const initials = authorName
    .split(/[\s()]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const isReport =
    notice.type === "COMMUNITY_COUNCIL" ||
    notice.title.toLowerCase().includes("report");

  return (
    <div
      onClick={() => onSelect(notice)}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Top Header: Badge + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>

          <span className="text-xs font-medium text-slate-400">
            {formatTime(notice.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
          {notice.title}
        </h3>

        {/* Excerpt Description */}
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 line-clamp-3">
          {notice.message}
        </p>
      </div>

      {/* Footer: Author info + Action Link */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        {/* Author Avatar + Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${badge.avatarBg}`}
          >
            {initials || "GW"}
          </div>
          <span className="truncate text-xs font-semibold text-slate-700">
            {authorName}
          </span>
        </div>

        {/* Action Link */}
        <div className="shrink-0 pl-2">
          {isReport ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:underline">
              <span>Download Summary</span>
              <Download className="size-3.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
              <span>Read Notice</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

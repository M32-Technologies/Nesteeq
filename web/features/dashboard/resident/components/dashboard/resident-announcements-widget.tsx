"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import type { AnnouncementItem } from "@/features/announcements/types";

interface ResidentAnnouncementsWidgetProps {
  announcements?: AnnouncementItem[];
  isLoading?: boolean;
}

export function ResidentAnnouncementsWidget({
  announcements = [],
  isLoading = false,
}: ResidentAnnouncementsWidgetProps) {
  // If announcements exist from API, display the top 2; otherwise use rich defaults from design mockup
  const displayNotices = announcements.slice(0, 3).map((a, idx) => ({
    id: a.id || String(idx),
    title: a.title,
    message: a.message,
    priority: a.priority,
    badgeText: a.priority === "URGENT" || a.priority === "HIGH" ? "PRIORITY" : a.type,
    badgeClass:
      a.priority === "URGENT" || a.priority === "HIGH"
        ? "bg-rose-100 text-rose-800 border-rose-200"
        : "bg-blue-100 text-blue-800 border-blue-200",
    scheduleText:
      a.createdAt && !isNaN(new Date(a.createdAt).getTime())
        ? new Date(a.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recent",
    publisher: a.creator?.name || "Management Committee",
  }));

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
            <Megaphone className="size-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
              Latest Announcements
            </h3>
          </div>
        </div>

        <Link
          href="/resident/announcements"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition group"
        >
          <span>Notice Board</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Notices List */}
      {displayNotices.length > 0 ? (
        <div className="space-y-3 pt-1">
          {displayNotices.map((notice) => (
            <Link
              key={notice.id}
              href="/resident/announcements"
              className="group/notice block rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-2 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover/notice:text-indigo-600 transition-colors line-clamp-1">
                  {notice.title}
                </h4>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${notice.badgeClass}`}
                >
                  {notice.badgeText}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {notice.message}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
                <span>{notice.scheduleText}</span>
                <span>•</span>
                <span className="text-slate-600 truncate">{notice.publisher}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">No active announcements</p>
          <p className="text-[11px] text-slate-400">
            Important notices from management will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

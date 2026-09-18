"use client";

import React from "react";
import {
  FileDown,
  RefreshCw,
  Search,
  Wrench,
  Flame,
  PartyPopper,
  Users2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  useResidentAnnouncements,
  type ResidentAnnouncementTab,
} from "../../hooks/use-resident-announcements";
import { CriticalAlertBanner } from "./critical-alert-banner";
import { ResidentAnnouncementCard } from "./resident-announcement-card";
import { EmergencyHotlineModal } from "./emergency-hotline-modal";
import { ResidentNoticeDetailDrawer } from "./resident-notice-detail-drawer";

export function ResidentAnnouncementsPage() {
  const {
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    totalNotices,
    startRecord,
    endRecord,
    counts,

    criticalAlert,
    paginatedNotices,
    allNoticesCount,
    isLoading,
    isRefetching,
    refetch,

    selectedNotice,
    setSelectedNotice,
    isHotlineOpen,
    setIsHotlineOpen,
  } = useResidentAnnouncements();

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. TOP PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
              Announcements
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5] border border-indigo-100">
              {allNoticesCount} Active
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Updates and community notices for Greenwood Heights • Block A
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw className={`size-4 text-slate-500 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <FileDown className="size-4 text-slate-500" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. PINNED CRITICAL ALERT BANNER */}
      <CriticalAlertBanner
        alert={criticalAlert}
        onOpenHotline={() => setIsHotlineOpen(true)}
      />

      {/* 3. SEARCH & CATEGORY FILTER TABS BAR */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All */}
          <button
            type="button"
            onClick={() => setSelectedTab("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedTab === "all"
              ? "bg-[#4338CA] text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${selectedTab === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
                }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Maintenance */}
          <button
            type="button"
            onClick={() => setSelectedTab("maintenance")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${selectedTab === "maintenance"
              ? "bg-[#4338CA] text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <Wrench className="size-3.5 text-sky-600" />
            <span>Maintenance</span>
          </button>

          {/* Emergency */}
          <button
            type="button"
            onClick={() => setSelectedTab("emergency")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${selectedTab === "emergency"
              ? "bg-[#4338CA] text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <Flame className="size-3.5 text-rose-500" />
            <span>Emergency</span>
          </button>

          {/* Events */}
          <button
            type="button"
            onClick={() => setSelectedTab("events")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${selectedTab === "events"
              ? "bg-[#4338CA] text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <PartyPopper className="size-3.5 text-purple-600" />
            <span>Events</span>
          </button>

          {/* Society */}
          <button
            type="button"
            onClick={() => setSelectedTab("society")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${selectedTab === "society"
              ? "bg-[#4338CA] text-white shadow-xs"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <Users2 className="size-3.5 text-emerald-600" />
            <span>Society</span>
          </button>
        </div>
      </div>

      {/* 4. 2x2 ANNOUNCEMENTS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse"
            >
              <div className="h-6 w-28 rounded-full bg-slate-200" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paginatedNotices.map((notice) => (
            <ResidentAnnouncementCard
              key={notice.id}
              notice={notice}
              onSelect={setSelectedNotice}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <RotateCcw className="size-5" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No announcements found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            No notices match your selected filters. Try searching for other
            keywords or reset your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTab("all");
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 5. PAGINATION FOOTER */}
      {totalNotices > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 pt-5 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{startRecord}</span> to{" "}
            <span className="font-semibold text-slate-800">{endRecord}</span> of{" "}
            <span className="font-semibold text-slate-800">{totalNotices}</span> notices
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Previous */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition ${currentPage === pageNum
                  ? "bg-[#4338CA] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Next */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. MODALS & DRAWERS */}
      <EmergencyHotlineModal
        isOpen={isHotlineOpen}
        onClose={() => setIsHotlineOpen(false)}
        alert={criticalAlert}
      />

      <ResidentNoticeDetailDrawer
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </div>
  );
}

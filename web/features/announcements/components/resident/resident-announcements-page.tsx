"use client";

import React, { useState } from "react";
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
  LayoutGrid,
  Rows3,
  Megaphone,
  Radio,
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

  // Layout view toggle: Grid (default) vs. Stream/Feed
  const [viewMode, setViewMode] = useState<"grid" | "stream">("grid");

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 pb-14">
      {/* ===================================================================== */}
      {/* 1. TOP PAGE HEADER                                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Announcements
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/70 shadow-2xs">
              <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{allNoticesCount} Active</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Updates and community notices for Greenwood Heights • Block A
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh feed"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-95"
          >
            <RefreshCw
              className={`size-3.5 sm:size-4 text-slate-500 ${
                isRefetching ? "animate-spin text-indigo-600" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            title="Export notices to PDF or Print"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 cursor-pointer active:scale-95"
          >
            <FileDown className="size-3.5 sm:size-4 text-slate-500" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. PINNED CRITICAL ALERT BANNER                                       */}
      {/* ===================================================================== */}
      <CriticalAlertBanner
        alert={criticalAlert}
        onOpenHotline={() => setIsHotlineOpen(true)}
      />

      {/* ===================================================================== */}
      {/* 3. COMMAND BAR: SEARCH, CATEGORY PILLS & VIEW TOGGLE                  */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 shadow-xs backdrop-blur-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements by title or content..."
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-300 hover:text-slate-800 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Toolbar: View Mode Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 self-end lg:self-auto rounded-xl border border-slate-200/80 bg-slate-100/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("stream")}
              title="Timeline Stream View"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "stream"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Rows3 className="size-3.5" />
              <span>Stream</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {/* All */}
          <button
            type="button"
            onClick={() => setSelectedTab("all")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedTab === "all"
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/20"
                : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <span>All Notices</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-extrabold ${
                selectedTab === "all"
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedTab === "maintenance"
                ? "bg-sky-600 text-white shadow-xs shadow-sky-600/20"
                : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Wrench
              className={`size-3.5 ${
                selectedTab === "maintenance" ? "text-white" : "text-sky-600"
              }`}
            />
            <span>Maintenance</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-extrabold ${
                selectedTab === "maintenance"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.maintenance}
            </span>
          </button>

          {/* Emergency */}
          <button
            type="button"
            onClick={() => setSelectedTab("emergency")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedTab === "emergency"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-600/20"
                : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Flame
              className={`size-3.5 ${
                selectedTab === "emergency" ? "text-white" : "text-rose-500"
              }`}
            />
            <span>Emergency</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-extrabold ${
                selectedTab === "emergency"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.emergency}
            </span>
          </button>

          {/* Events */}
          <button
            type="button"
            onClick={() => setSelectedTab("events")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedTab === "events"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-600/20"
                : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <PartyPopper
              className={`size-3.5 ${
                selectedTab === "events" ? "text-white" : "text-purple-600"
              }`}
            />
            <span>Events</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-extrabold ${
                selectedTab === "events"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.events}
            </span>
          </button>

          {/* Society */}
          <button
            type="button"
            onClick={() => setSelectedTab("society")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedTab === "society"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/20"
                : "border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Users2
              className={`size-3.5 ${
                selectedTab === "society" ? "text-white" : "text-emerald-600"
              }`}
            />
            <span>Society</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-extrabold ${
                selectedTab === "society"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.society}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. ANNOUNCEMENTS CONTENT: SKELETON, CARDS GRID, OR EMPTY STATE       */}
      {/* ===================================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-60 rounded-2xl border border-slate-200/80 bg-white p-6 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 rounded-full bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-5/6 rounded bg-slate-100" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-24 rounded bg-slate-200" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedNotices.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
              : "flex flex-col gap-3.5"
          }
        >
          {paginatedNotices.map((notice) => (
            <ResidentAnnouncementCard
              key={notice.id}
              notice={notice}
              onSelect={setSelectedNotice}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
            <Megaphone className="size-7 stroke-[1.8]" />
          </div>
          <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
            No announcements found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
            No notices match your selected filters or keywords. Adjust your
            filters to see recent updates.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTab("all");
              setSearchQuery("");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PAGINATION FOOTER                                                  */}
      {/* ===================================================================== */}
      {totalNotices > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 pt-5 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{startRecord}</span>{" "}
            to <span className="font-bold text-slate-800">{endRecord}</span> of{" "}
            <span className="font-bold text-slate-800">{totalNotices}</span> notices
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Previous */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
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
                className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
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
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODALS & DRAWERS                                                   */}
      {/* ===================================================================== */}
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

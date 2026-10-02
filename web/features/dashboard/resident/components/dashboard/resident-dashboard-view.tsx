"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Wrench,
  ReceiptText,
  Car,
  Bell,
  RefreshCw,
  Plus,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Phone,
  Home,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { useResidentDashboard, type UnifiedFeedItem } from "../../hooks/use-resident-dashboard";
import { CreateComplaintModal } from "../create-complaint-modal";
import { CreateVisitorPassModal } from "../create-visitor-pass-modal";
import { ResidentNoticeDetailDrawer } from "@/features/announcements/components/resident/resident-notice-detail-drawer";
import type { AnnouncementItem } from "@/features/announcements/types";

export function ResidentDashboardView() {
  const router = useRouter();
  const {
    userName,
    userEmail,
    flatUnitName,
    apartmentName,
    residentRole,
    apartment,
    greeting,
    currentDateFormatted,
    unifiedFeedItems,
    guestPasses,
    activeVisitorsCount,
    complaintsList,
    activeComplaintsCount,
    announcements,
    criticalAlert,
    isVisitorsLoading,
    isComplaintsLoading,
    isAnnouncementsLoading,
    billsSummary,
    billsList,
    isBillsLoading,
    refetchAll,
  } = useResidentDashboard();

  const [activeTab, setActiveTab] = useState<"ALL" | "ANNOUNCEMENTS" | "COMPLAINTS" | "PASSES">("ALL");
  const [isRefetching, setIsRefetching] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<AnnouncementItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRefresh = async () => {
    setIsRefetching(true);
    await refetchAll();
    setTimeout(() => setIsRefetching(false), 400);
  };

  const handleViewNotice = (item: UnifiedFeedItem) => {
    if (item.noticeData) {
      setSelectedNotice(item.noticeData);
      return;
    }
    const cleanId = item.id.replace(/^ann-/, "");
    const found = announcements.find(
      (a) => a.id === cleanId || (a as { _id?: string })._id === cleanId
    );
    if (found) {
      setSelectedNotice(found);
      return;
    }
    // Fallback announcement item constructed from feed item
    setSelectedNotice({
      id: cleanId,
      title: item.title,
      message: item.description,
      type: (item.tags?.[0] as any) || "GENERAL",
      priority: item.badge?.label?.includes("CRITICAL") ? "URGENT" : "NORMAL",
      status: "PUBLISHED",
      targetType: "ALL_RESIDENTS",
      createdBy: item.author?.name || "Management",
      creator: {
        id: "mgmt",
        name: item.author?.name || "Management",
        email: null,
        phone: null,
      },
      creatorRole: item.author?.role || "Verified Management",
      createdAt: item.rawDate ? new Date(item.rawDate).toISOString() : new Date().toISOString(),
      updatedAt: item.rawDate ? new Date(item.rawDate).toISOString() : new Date().toISOString(),
      expiresAt: null,
    });
  };

  // Filter feed items - strictly limit to 10 most recent activities
  const filteredFeed = useMemo(() => {
    let feed = unifiedFeedItems;
    if (activeTab === "ANNOUNCEMENTS") {
      feed = unifiedFeedItems.filter((i) => i.type === "ANNOUNCEMENT");
    } else if (activeTab === "COMPLAINTS") {
      feed = unifiedFeedItems.filter((i) => i.type === "COMPLAINT");
    } else if (activeTab === "PASSES") {
      feed = unifiedFeedItems.filter((i) => i.type === "PASS");
    }
    return feed.slice(0, 10);
  }, [unifiedFeedItems, activeTab]);

  const quickActions: Array<{
    title: string;
    description: string;
    href?: string;
    onClick?: () => void;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      title: "Pre-Approve Visitor",
      description: "Generate an instant gate pass QR code",
      onClick: () => setIsVisitorModalOpen(true),
      icon: QrCode,
    },
    {
      title: "Raise Complaint",
      description: "Request maintenance or report an issue",
      onClick: () => setIsComplaintModalOpen(true),
      icon: Wrench,
    },
    {
      title: "Bills & Society Finance",
      description: "Review society dues and payment history",
      href: "/resident/bills",
      icon: ReceiptText,
    },
    {
      title: "Parking & Vehicles",
      description: "View assigned bay and gate RFID status",
      href: "/resident/parking",
      icon: Car,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER: Matches other dashboards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Resident Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#637083]" suppressHydrationWarning>
            Welcome back,{" "}
            <span className="font-medium text-[#111111]" suppressHydrationWarning>
              {isMounted ? userName : "Resident"}
            </span>{" "}
            •{" "}
            <span suppressHydrationWarning>
              {isMounted ? flatUnitName : "Unit"}
            </span>{" "}
            at{" "}
            <span suppressHydrationWarning>
              {isMounted ? apartmentName : "Apartment"}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#DDE3DF] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#111111] transition-colors hover:bg-[#F7F8F5] disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin text-[#07584F]" : "text-[#637083]"}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsComplaintModalOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#111111] transition-colors hover:bg-[#F7F8F5] cursor-pointer w-full sm:w-auto"
          >
            <Plus className="size-3.5 text-[#637083]" />
            <span>Raise Complaint</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVisitorModalOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer w-full sm:w-auto"
          >
            <QrCode className="size-3.5" />
            <span>Pre-approve Visitor</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI STAT CARDS (5-column grid matching SecuritySummaryCards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          label="Active Guest Passes"
          value={activeVisitorsCount}
          icon={<QrCode className="size-5" />}
          href="/resident/visitors"
          subtext="Pre-approved entries"
        />

        <SummaryCard
          label="Complaints"
          value={activeComplaintsCount}
          icon={<Wrench className="size-5" />}
          href="/resident/complaints"
          urgent={activeComplaintsCount > 0}
          subtext={activeComplaintsCount > 0 ? "Under maintenance" : "No pending issues"}
        />

        <SummaryCard
          label="Outstanding Dues"
          value={
            isBillsLoading
              ? "..."
              : `₹${(billsSummary?.totalOutstanding ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          icon={<ReceiptText className="size-5" />}
          href="/resident/bills"
          urgent={(billsSummary?.overdueCount ?? 0) > 0}
          statusBadge={
            (billsSummary?.overdueCount ?? 0) > 0
              ? "OVERDUE"
              : (billsSummary?.totalOutstanding ?? 0) > 0
              ? "PENDING"
              : "CLEARED"
          }
          subtext={
            (billsSummary?.overdueCount ?? 0) > 0
              ? `${billsSummary.overdueCount} bill(s) overdue`
              : (billsSummary?.totalOutstanding ?? 0) > 0
              ? `${billsSummary.pendingCount} pending bill(s)`
              : "All dues settled"
          }
        />

        <SummaryCard
          label="Assigned Parking"
          value="Active"
          icon={<Car className="size-5" />}
          href="/resident/parking"
          subtext="Boom barrier RFID linked"
        />

        <SocietyNoticesCard
          count={announcements.length}
          criticalAlert={criticalAlert}
          onViewAlert={() => criticalAlert && setSelectedNotice(criticalAlert as AnnouncementItem)}
        />
      </div>

      {/* 3. QUICK ACTIONS ROW (Matches SecurityQuickActions) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => {
                if (action.onClick) {
                  action.onClick();
                } else if (action.href) {
                  router.push(action.href);
                }
              }}
              className="flex items-center gap-4 rounded-lg border border-[#DDE3DF] bg-white p-4 text-left transition-colors hover:bg-[#F7F8F5] cursor-pointer"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#07584F]/10 text-[#07584F]">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#111111] text-sm truncate">
                  {action.title}
                </p>
                <p className="mt-0.5 text-xs text-[#637083] truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN 2-COLUMN GRID (Matching SecurityDashboard grid) */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        {/* ================= LEFT: RECENT ACTIVITY & UPDATES ================= */}
        <section className="rounded-lg border border-[#DDE3DF] bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EEF1F4] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#111111]">
                Recent Activity & Society Updates
              </h2>
              <p className="mt-0.5 text-sm text-[#637083]">
                Live notices, maintenance tickets, and gate activity for your unit.
              </p>
            </div>

            {/* Tab Filters */}
            <div className="flex items-center gap-1 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-1 self-start sm:self-auto">
              {(
                [
                  { key: "ALL", label: "All" },
                  { key: "ANNOUNCEMENTS", label: "Notices" },
                  { key: "COMPLAINTS", label: "Complaints" },
                  { key: "PASSES", label: "Passes" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-white text-[#07584F] font-semibold shadow-2xs"
                      : "text-[#637083] hover:text-[#111111]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-3">
            {isVisitorsLoading || isComplaintsLoading || isAnnouncementsLoading ? (
              <p className="text-sm text-[#637083] py-6 text-center">
                Loading society activity...
              </p>
            ) : filteredFeed.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-8 text-center space-y-2">
                <CheckCircle2 className="size-6 text-[#7C8782] mx-auto" />
                <p className="text-sm font-semibold text-[#111111]">
                  No Activity Records
                </p>
                <p className="text-xs text-[#637083] max-w-sm mx-auto">
                  There are currently no active announcements, open complaints, or pending visitor passes for this filter.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVisitorModalOpen(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#07584F] px-3 text-xs font-medium text-white hover:bg-[#064C44] transition cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Generate Visitor Pass</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredFeed.map((item) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  onViewNotice={handleViewNotice}
                />
              ))
            )}
          </div>
        </section>

        {/* ================= RIGHT: RESIDENCE & SOCIETY PANELS ================= */}
        <div className="space-y-6">
          {/* A. Residence Details Card */}
          <section className="rounded-lg border border-[#DDE3DF] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF1F4] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#111111]">
                  Residence Overview
                </h2>
                <p className="mt-0.5 text-xs text-[#637083]">
                  Verified apartment occupancy profile
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <UserCheck className="size-3 text-emerald-600" />
                <span>Verified</span>
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Resident Name</span>
                <span className="font-semibold text-[#111111]" suppressHydrationWarning>
                  {isMounted ? userName : "Resident"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Resident Role</span>
                <span className="inline-flex items-center rounded-md bg-[#F7F8F5] px-2 py-0.5 text-xs font-semibold text-[#07584F]" suppressHydrationWarning>
                  {isMounted ? residentRole : "Resident"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Flat / Unit</span>
                <span className="font-semibold text-[#111111]" suppressHydrationWarning>
                  {isMounted ? flatUnitName : "Unit"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Society</span>
                <span className="font-semibold text-[#111111] truncate max-w-[170px]" suppressHydrationWarning>
                  {isMounted ? apartmentName : "Apartment"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-xs text-[#637083]">Gate Barrier Access</span>
                <span className="text-xs font-semibold text-emerald-700">
                  Authorized (RFID Enabled)
                </span>
              </div>
            </div>
          </section>

          {/* B. Society Dues Card */}
          <section className="rounded-lg border border-[#DDE3DF] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111111]">
                  Maintenance Statement
                </h2>
                <p className="mt-0.5 text-xs text-[#637083]">
                  Monthly maintenance & utility billing
                </p>
              </div>
              {(billsSummary?.totalOutstanding ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <AlertTriangle className="size-3 text-amber-600" />
                  <span>{(billsSummary?.overdueCount ?? 0) > 0 ? "Overdue" : "Pending"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="size-3" />
                  <span>Cleared</span>
                </span>
              )}
            </div>

            <div className="rounded-lg bg-[#F7F8F5] p-3.5 border border-[#EEF1F4]">
              <p className="text-xs font-medium text-[#637083]">Current Outstanding Balance</p>
              <p className="text-2xl font-bold text-[#111111] mt-1">
                {isBillsLoading
                  ? "..."
                  : `₹${(billsSummary?.totalOutstanding ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>
              <p className="text-xs text-[#637083] mt-1" suppressHydrationWarning>
                {(billsSummary?.totalOutstanding ?? 0) > 0
                  ? `You have ${billsSummary?.pendingCount ?? 1} unpaid invoice(s) for ${isMounted ? flatUnitName : "your unit"}.`
                  : `All maintenance dues and utility charges are completely settled for ${isMounted ? flatUnitName : "your unit"}.`}
              </p>
            </div>

            <Link
              href="/resident/bills"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white px-3 text-xs font-semibold text-[#111111] hover:bg-[#F7F8F5] transition-colors shadow-2xs"
            >
              <span>View Statements & Receipts</span>
              <ChevronRight className="size-3.5 text-[#637083]" />
            </Link>
          </section>

          {/* C. Gate Helpdesk & Emergency Card */}
          <section className="rounded-lg border border-[#DDE3DF] bg-white p-5 space-y-3">
            <h2 className="text-base font-semibold text-[#111111]">
              Helpdesk & Emergency Contacts
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#07584F]" />
                  <span className="font-medium text-[#111111]">Main Gate Intercom</span>
                </div>
                <span className="font-mono font-semibold text-[#07584F]">Ext. 101</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#07584F]" />
                  <span className="font-medium text-[#111111]">Society Management</span>
                </div>
                <span className="font-mono font-semibold text-[#07584F]">Ext. 100</span>
              </div>
            </div>

            <Link
              href="/resident/alerts"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <ShieldAlert className="size-3.5" />
              <span>Trigger Emergency SOS Alert</span>
            </Link>
          </section>
        </div>
      </div>

      {/* Create Complaint Modal (Image 2) */}
      <CreateComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        onSuccess={() => refetchAll()}
      />

      {/* Generate Visitor Pass Modal (Image 3) */}
      <CreateVisitorPassModal
        isOpen={isVisitorModalOpen}
        onClose={() => setIsVisitorModalOpen(false)}
        flatUnitName={flatUnitName}
        onSuccess={() => refetchAll()}
      />

      {/* Notice Detail Drawer */}
      <ResidentNoticeDetailDrawer
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </div>
  );
}

// Summary Card Component matching SecuritySummaryCards
function SummaryCard({
  label,
  value,
  icon,
  urgent = false,
  subtext,
  statusBadge,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  urgent?: boolean;
  subtext?: string;
  statusBadge?: string;
  href: string;
}) {
  const getBadgeStyle = () => {
    if (statusBadge === "OVERDUE" || urgent) {
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    }
    if (statusBadge === "PENDING") {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    }
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  };

  return (
    <Link
      href={href}
      className={`rounded-lg border bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs block ${
        urgent ? "border-red-200" : "border-[#DDE3DF]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-[#637083] truncate">
          {label}
        </p>
        <span className={urgent ? "text-red-600" : "text-[#07584F]"}>
          {icon}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold text-[#111111]">
          {value}
        </p>
        {statusBadge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getBadgeStyle()}`}>
            {statusBadge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-[#637083] truncate">
          {subtext}
        </p>
      )}
    </Link>
  );
}

// Society Notices Card with Hover Popover for Critical Alerts
function SocietyNoticesCard({
  count,
  criticalAlert,
  onViewAlert,
}: {
  count: number;
  criticalAlert?: {
    id?: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
  } | null;
  onViewAlert?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!criticalAlert) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!criticalAlert) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!criticalAlert) return;
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/resident/announcements"
        onClick={criticalAlert ? handleClick : undefined}
        className={`rounded-lg border bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs block ${
          criticalAlert
            ? "border-red-200/90 bg-gradient-to-br from-red-50/20 via-white to-white ring-1 ring-red-100 hover:border-red-300"
            : "border-[#DDE3DF]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-[#637083] truncate">
            Society Notices
          </p>
          <div className="flex items-center gap-1.5">
            {criticalAlert && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
              </span>
            )}
            <span className={criticalAlert ? "text-red-600" : "text-[#07584F]"}>
              <Bell className="size-5" />
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold text-[#111111]">{count}</p>
          {criticalAlert ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-red-600"></span>
              1 URGENT
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Notices
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-[#637083] truncate flex items-center justify-between">
          <span>{criticalAlert ? "⚠️ Hover to view alert" : "Published updates"}</span>
          {criticalAlert && (
            <ChevronRight className={`size-3 text-red-500 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
          )}
        </p>
      </Link>

      {/* Floating Hover / Click Popover for Critical Alert */}
      {criticalAlert && isOpen && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute right-0 top-full mt-2 z-40 w-[300px] sm:w-[340px] rounded-xl border border-red-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 border-b border-red-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
                  Critical Alert
                </span>
                <p className="text-xs font-semibold text-[#111111] truncate">
                  {criticalAlert.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="rounded-md p-1 text-[#637083] hover:bg-slate-100 hover:text-[#111111] transition cursor-pointer shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Popover Body */}
          <div className="py-2.5">
            <p className="text-xs text-[#475467] line-clamp-3 leading-relaxed">
              {criticalAlert.message}
            </p>
          </div>

          {/* Popover Footer Action */}
          <div className="pt-2 border-t border-[#EEF1F4] flex items-center justify-between">
            <span className="text-[11px] text-[#637083]">High Priority Notice</span>
            {onViewAlert ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onViewAlert();
                }}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
              >
                <span>View Alert</span>
                <ArrowRight className="size-3" />
              </button>
            ) : (
              <Link
                href="/resident/announcements"
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition shadow-xs"
              >
                <span>View Alert</span>
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Row Component matching Security ActivityRow
function ActivityRow({
  item,
  onViewNotice,
}: {
  item: UnifiedFeedItem;
  onViewNotice?: (item: UnifiedFeedItem) => void;
}) {
  const getBadgeClass = (variant: string) => {
    switch (variant) {
      case "rose":
        return "bg-red-50 text-red-700 ring-red-200";
      case "amber":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "blue":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      default:
        return "bg-slate-100 text-slate-700 ring-slate-200";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Bell className="size-4 text-[#07584F]" />;
      case "COMPLAINT":
        return <Wrench className="size-4 text-amber-600" />;
      case "PASS":
        return <QrCode className="size-4 text-[#07584F]" />;
      default:
        return <Building2 className="size-4 text-[#07584F]" />;
    }
  };

  const isAnnouncement = item.type === "ANNOUNCEMENT";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#EEF1F4] bg-white p-3.5 transition-colors hover:bg-[#F7F8F5]">
      <div
        className={`flex items-start gap-3 min-w-0 ${isAnnouncement ? "cursor-pointer group/item" : ""}`}
        onClick={isAnnouncement ? () => onViewNotice?.(item) : undefined}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F8F5] border border-[#EEF1F4] mt-0.5">
          {getIcon(item.type)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${getBadgeClass(item.badge.variant)}`}>
              {item.badge.label}
            </span>
            <span className="text-xs text-[#94A3B8]">•</span>
            <span className="text-xs text-[#637083]">{item.date}</span>
          </div>

          <h3 className={`text-sm font-semibold text-[#111111] mt-1 truncate ${isAnnouncement ? "group-hover/item:text-[#07584F] transition-colors" : ""}`}>
            {item.title}
          </h3>

          <p className="text-xs text-[#637083] mt-0.5 line-clamp-1">
            {item.description}
          </p>

          <p className="text-[11px] text-[#94A3B8] mt-1">
            {item.author.name} {item.author.role ? `• ${item.author.role}` : ""}
          </p>
        </div>
      </div>

      {isAnnouncement ? (
        <button
          type="button"
          onClick={() => onViewNotice?.(item)}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#DDE3DF] bg-white px-3 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] hover:border-[#07584F] hover:text-[#07584F] transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>{item.ctaText}</span>
          <ExternalLink className="size-3 text-[#637083]" />
        </button>
      ) : (
        <Link
          href={item.ctaHref}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#DDE3DF] bg-white px-3 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors self-start sm:self-center"
        >
          <span>{item.ctaText}</span>
          <ExternalLink className="size-3 text-[#637083]" />
        </Link>
      )}
    </div>
  );
}


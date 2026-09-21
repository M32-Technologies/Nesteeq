"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useResidentDashboard, type UnifiedFeedItem } from "../../hooks/use-resident-dashboard";

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
    refetchAll,
  } = useResidentDashboard();

  const [activeTab, setActiveTab] = useState<"ALL" | "ANNOUNCEMENTS" | "COMPLAINTS" | "PASSES">("ALL");
  const [isRefetching, setIsRefetching] = useState(false);

  const handleRefresh = async () => {
    setIsRefetching(true);
    await refetchAll();
    setTimeout(() => setIsRefetching(false), 400);
  };

  // Filter feed items
  const filteredFeed = useMemo(() => {
    if (activeTab === "ANNOUNCEMENTS") {
      return unifiedFeedItems.filter((i) => i.type === "ANNOUNCEMENT");
    }
    if (activeTab === "COMPLAINTS") {
      return unifiedFeedItems.filter((i) => i.type === "COMPLAINT");
    }
    if (activeTab === "PASSES") {
      return unifiedFeedItems.filter((i) => i.type === "PASS");
    }
    return unifiedFeedItems;
  }, [unifiedFeedItems, activeTab]);

  const quickActions = [
    {
      title: "Pre-Approve Visitor",
      description: "Generate an instant gate pass QR code",
      href: "/resident/visitors",
      icon: QrCode,
    },
    {
      title: "Raise Complaint",
      description: "Request maintenance or report an issue",
      href: "/resident/complaints",
      icon: Wrench,
    },
    {
      title: "Maintenance Bills",
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
          <p className="mt-1 text-sm text-[#637083]">
            Welcome back, <span className="font-medium text-[#111111]">{userName}</span> • {flatUnitName} at {apartmentName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#DDE3DF] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#111111] transition-colors hover:bg-[#F7F8F5] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin text-[#07584F]" : "text-[#637083]"}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/resident/complaints"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#111111] transition-colors hover:bg-[#F7F8F5]"
          >
            <Plus className="size-3.5 text-[#637083]" />
            <span>Raise Complaint</span>
          </Link>

          <Link
            href="/resident/visitors"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44]"
          >
            <QrCode className="size-3.5" />
            <span>Pre-approve Visitor</span>
          </Link>
        </div>
      </div>

      {/* Critical Alert Banner (if any) */}
      {criticalAlert && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold">{criticalAlert.title}</p>
              <p className="text-xs text-red-700 mt-0.5">{criticalAlert.message}</p>
            </div>
          </div>
          <Link
            href="/resident/announcements"
            className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            View Alert
          </Link>
        </div>
      )}

      {/* 2. SUMMARY KPI STAT CARDS (5-column grid matching SecuritySummaryCards) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          value="₹0.00"
          icon={<ReceiptText className="size-5" />}
          href="/resident/bills"
          statusBadge="CLEARED"
          subtext="All dues settled"
        />

        <SummaryCard
          label="Assigned Parking"
          value="Active"
          icon={<Car className="size-5" />}
          href="/resident/parking"
          subtext="Boom barrier RFID linked"
        />

        <SummaryCard
          label="Society Notices"
          value={announcements.length}
          icon={<Bell className="size-5" />}
          href="/resident/announcements"
          subtext="Published updates"
        />
      </div>

      {/* 3. QUICK ACTIONS ROW (Matches SecurityQuickActions) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              type="button"
              onClick={() => router.push(action.href)}
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
                  <Link
                    href="/resident/visitors"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#07584F] px-3 text-xs font-medium text-white hover:bg-[#064C44] transition"
                  >
                    <Plus className="size-3.5" />
                    <span>Generate Visitor Pass</span>
                  </Link>
                </div>
              </div>
            ) : (
              filteredFeed.map((item) => (
                <ActivityRow key={item.id} item={item} />
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
                <span className="font-semibold text-[#111111]">{userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Resident Role</span>
                <span className="inline-flex items-center rounded-md bg-[#F7F8F5] px-2 py-0.5 text-xs font-semibold text-[#07584F]">
                  {residentRole}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Flat / Unit</span>
                <span className="font-semibold text-[#111111]">{flatUnitName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EEF1F4]">
                <span className="text-xs text-[#637083]">Society</span>
                <span className="font-semibold text-[#111111] truncate max-w-[170px]">
                  {apartmentName}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 className="size-3" />
                <span>Cleared</span>
              </span>
            </div>

            <div className="rounded-lg bg-[#F7F8F5] p-3.5 border border-[#EEF1F4]">
              <p className="text-xs font-medium text-[#637083]">Current Outstanding Balance</p>
              <p className="text-2xl font-bold text-[#111111] mt-1">₹0.00</p>
              <p className="text-xs text-[#637083] mt-1">
                All maintenance dues and utility charges are completely settled for {flatUnitName}.
              </p>
            </div>

            <Link
              href="/resident/bills"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white px-3 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors"
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
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
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

// Activity Row Component matching Security ActivityRow
function ActivityRow({ item }: { item: UnifiedFeedItem }) {
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#EEF1F4] bg-white p-3.5 transition-colors hover:bg-[#F7F8F5]">
      <div className="flex items-start gap-3 min-w-0">
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

          <h3 className="text-sm font-semibold text-[#111111] mt-1 truncate">
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

      <Link
        href={item.ctaHref}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#DDE3DF] bg-white px-3 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors self-start sm:self-center"
      >
        <span>{item.ctaText}</span>
        <ExternalLink className="size-3 text-[#637083]" />
      </Link>
    </div>
  );
}

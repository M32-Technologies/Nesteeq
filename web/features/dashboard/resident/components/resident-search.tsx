"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  QrCode,
  Wrench,
  Bell,
  ReceiptText,
  Car,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";
import {
  fetchResidentBills,
  fetchResidentParkingInfo,
} from "../api/resident-dashboard.api";

export type SearchCategory =
  | "ALL"
  | "PASSES"
  | "TICKETS"
  | "NOTICES"
  | "BILLS"
  | "PARKING"
  | "PAGES";

export interface SearchResultItem {
  id: string;
  category: "PASSES" | "TICKETS" | "NOTICES" | "BILLS" | "PARKING" | "PAGES";
  categoryLabel: string;
  title: string;
  subtitle: string;
  detail?: string;
  badge?: {
    label: string;
    variant: "emerald" | "amber" | "rose" | "blue" | "purple" | "slate";
  };
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ResidentSearchProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ResidentSearch({
  className = "",
  isMobileOpen = false,
  onMobileClose,
}: ResidentSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Core resident hook data (Passes, Complaints, Announcements, Unit Context)
  const {
    guestPasses = [],
    complaintsList = [],
    announcements = [],
    flatUnitName,
    apartmentName,
  } = useResidentDashboard();

  // 2. Fetch Bills data (shares query cache with resident bills page)
  const { data: billsData } = useQuery({
    queryKey: ["resident", "bills"],
    queryFn: fetchResidentBills,
    staleTime: 60 * 1000,
  });

  // 3. Fetch Parking data (shares query cache with resident parking page)
  const { data: parkingData } = useQuery({
    queryKey: ["resident", "parking-info"],
    queryFn: fetchResidentParkingInfo,
    staleTime: 60 * 1000,
  });

  // Global keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus input when mobile modal opens
  useEffect(() => {
    if (isMobileOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setIsOpen(true);
      }, 100);
    }
  }, [isMobileOpen]);

  // Build Pages & Quick Nav items
  const pageNavItems: SearchResultItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        category: "PAGES",
        categoryLabel: "Navigation",
        title: "Resident Dashboard",
        subtitle: "Overview metrics, quick actions & community activity",
        detail: apartmentName,
        badge: { label: "PORTAL", variant: "emerald" },
        href: "/resident",
        icon: LayoutDashboard,
      },
      {
        id: "nav-visitors",
        category: "PAGES",
        categoryLabel: "Visitors",
        title: "Visitors & Guest Passes",
        subtitle: "Generate visitor QR passes, log deliveries, track gate entry",
        badge: { label: "SECURITY", variant: "blue" },
        href: "/resident/visitors",
        icon: QrCode,
      },
      {
        id: "nav-complaints",
        category: "PAGES",
        categoryLabel: "Helpdesk",
        title: "Complaints & Service Requests",
        subtitle: "Log plumbing, electrical, maintenance issues and track technicians",
        badge: { label: "SUPPORT", variant: "purple" },
        href: "/resident/complaints",
        icon: Wrench,
      },
      {
        id: "nav-bills",
        category: "PAGES",
        categoryLabel: "Billing",
        title: "Bills & Society Finance",
        subtitle: "Review monthly society dues, outstanding invoices & receipts",
        badge: { label: "FINANCE", variant: "amber" },
        href: "/resident/bills",
        icon: ReceiptText,
      },
      {
        id: "nav-parking",
        category: "PAGES",
        categoryLabel: "Parking",
        title: "My Parking & Vehicles",
        subtitle: `Registered vehicle plates, assigned slot: ${flatUnitName}`,
        badge: { label: "VEHICLES", variant: "emerald" },
        href: "/resident/parking",
        icon: Car,
      },
      {
        id: "nav-announcements",
        category: "PAGES",
        categoryLabel: "Notices",
        title: "Society Announcements & Bulletins",
        subtitle: "Official circulars, water/power maintenance schedules & alerts",
        badge: { label: "COMMUNITY", variant: "blue" },
        href: "/resident/announcements",
        icon: Bell,
      },
      {
        id: "nav-alerts",
        category: "PAGES",
        categoryLabel: "Emergency",
        title: "Emergency SOS Rapid Alert",
        subtitle: "Immediate security and medical distress broadcast to guards & admin",
        badge: { label: "SOS", variant: "rose" },
        href: "/resident/alerts",
        icon: ShieldAlert,
      },
      {
        id: "nav-settings",
        category: "PAGES",
        categoryLabel: "Settings",
        title: "Resident Account Settings",
        subtitle: "Update personal contact info, flat details & notification preferences",
        badge: { label: "ACCOUNT", variant: "slate" },
        href: "/resident/settings",
        icon: Settings,
      },
    ],
    [apartmentName, flatUnitName]
  );

  // Filter and collect all items based on search query
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();

    // 1. If query is empty, return Quick Navigation items
    if (!q) {
      return pageNavItems;
    }

    const results: SearchResultItem[] = [];

    // --- Search Pages & Navigation ---
    for (const page of pageNavItems) {
      if (
        page.title.toLowerCase().includes(q) ||
        page.subtitle.toLowerCase().includes(q) ||
        page.categoryLabel.toLowerCase().includes(q)
      ) {
        results.push(page);
      }
    }

    // --- Search Visitor Passes ---
    for (const pass of guestPasses) {
      const code = pass._id ? pass._id.slice(-4).toLowerCase() : "";
      const passMatches =
        pass.visitorName?.toLowerCase().includes(q) ||
        pass.purpose?.toLowerCase().includes(q) ||
        pass.vehicleNumber?.toLowerCase().includes(q) ||
        pass.visitorPhone?.toLowerCase().includes(q) ||
        pass.status?.toLowerCase().includes(q) ||
        code.includes(q);

      if (passMatches) {
        const variant: "emerald" | "blue" | "slate" | "rose" =
          pass.status === "ACTIVE"
            ? "emerald"
            : pass.status === "USED"
            ? "blue"
            : pass.status === "CANCELLED"
            ? "rose"
            : "slate";

        const validDate = pass.validUntil
          ? new Date(pass.validUntil).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "Valid today";

        results.push({
          id: `pass-${pass._id}`,
          category: "PASSES",
          categoryLabel: "Visitor Pass",
          title: pass.visitorName || "Guest Visitor",
          subtitle: `${pass.purpose || "Visit"} • ${
            pass.vehicleNumber ? `Vehicle ${pass.vehicleNumber}` : "Walk-in"
          } • Valid: ${validDate}`,
          detail: `Pass #QR-${pass._id.slice(-4).toUpperCase()}`,
          badge: {
            label: pass.status,
            variant,
          },
          href: "/resident/visitors",
          icon: QrCode,
        });
      }
    }

    // --- Search Complaints & Helpdesk Tickets ---
    for (const ticket of complaintsList) {
      const tNumber = ticket.ticketNumber || `#REQ-${ticket._id.slice(-4).toUpperCase()}`;
      const ticketMatches =
        ticket.title?.toLowerCase().includes(q) ||
        ticket.description?.toLowerCase().includes(q) ||
        ticket.category?.toLowerCase().includes(q) ||
        ticket.priority?.toLowerCase().includes(q) ||
        ticket.status?.toLowerCase().includes(q) ||
        tNumber.toLowerCase().includes(q);

      if (ticketMatches) {
        const isResolved =
          ticket.status === "RESOLVED" || ticket.status === "CLOSED";
        const isCritical = ticket.priority === "URGENT";

        results.push({
          id: `ticket-${ticket._id}`,
          category: "TICKETS",
          categoryLabel: "Helpdesk Ticket",
          title: ticket.title,
          subtitle: `${tNumber} • Category: ${ticket.category} • Priority: ${ticket.priority}`,
          detail: ticket.description?.slice(0, 60),
          badge: {
            label: ticket.status.replace("_", " "),
            variant: isResolved
              ? "emerald"
              : isCritical
              ? "rose"
              : "purple",
          },
          href: "/resident/complaints",
          icon: Wrench,
        });
      }
    }

    // --- Search Announcements & Bulletins ---
    for (const notice of announcements) {
      const noticeMatches =
        notice.title?.toLowerCase().includes(q) ||
        notice.message?.toLowerCase().includes(q) ||
        notice.priority?.toLowerCase().includes(q) ||
        notice.type?.toLowerCase().includes(q);

      if (noticeMatches) {
        const isUrgent =
          notice.type === "EMERGENCY" || notice.priority === "URGENT";

        results.push({
          id: `notice-${notice.id}`,
          category: "NOTICES",
          categoryLabel: "Notice",
          title: notice.title,
          subtitle: `${notice.type || "Circular"} • ${notice.message?.slice(0, 65)}${
            notice.message?.length > 65 ? "..." : ""
          }`,
          badge: {
            label: isUrgent ? "URGENT" : notice.priority || "NOTICE",
            variant: isUrgent ? "rose" : "amber",
          },
          href: "/resident/announcements",
          icon: Bell,
        });
      }
    }

    // --- Search Maintenance Bills ---
    const bills = billsData?.bills || [];
    for (const bill of bills) {
      const amountStr = bill.totalAmount ? bill.totalAmount.toString() : "";
      const balanceStr = bill.balanceAmount ? bill.balanceAmount.toString() : "";
      const titleLower = bill.title?.toLowerCase() || "";
      const typeLower = bill.billType?.toLowerCase().replace(/_/g, " ") || "";
      const periodLower = bill.billingPeriod?.toLowerCase() || "";
      const billMatches =
        q.includes("bill") ||
        q.includes("due") ||
        q.includes("pay") ||
        q.includes("maintenance") ||
        titleLower.includes(q) ||
        typeLower.includes(q) ||
        periodLower.includes(q) ||
        bill.status?.toLowerCase().includes(q) ||
        amountStr.includes(q) ||
        balanceStr.includes(q);

      if (billMatches) {
        const isPaid = bill.status === "PAID";
        const isOverdue = bill.status === "OVERDUE";
        const dueFormatted = bill.dueDate
          ? new Date(bill.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A";

        results.push({
          id: `bill-${bill._id}`,
          category: "BILLS",
          categoryLabel: bill.title || "Maintenance Bill",
          title: bill.title
            ? `${bill.title}: ₹${bill.totalAmount?.toLocaleString("en-IN") || "0"}`
            : `Maintenance: ₹${bill.totalAmount?.toLocaleString("en-IN") || "0"}`,
          subtitle: `${bill.billingPeriod ? `${bill.billingPeriod} • ` : ""}Due: ${dueFormatted} • Balance: ₹${(
            bill.balanceAmount ?? bill.totalAmount ?? 0
          ).toLocaleString("en-IN")}`,
          badge: {
            label: bill.status?.replace("_", " ") || "DUE",
            variant: isPaid ? "emerald" : isOverdue ? "rose" : "amber",
          },
          href: "/resident/bills",
          icon: ReceiptText,
        });
      }
    }

    // --- Search Parking & Vehicles ---
    const vehicles = parkingData?.vehicles || [];
    for (const vehicle of vehicles) {
      const vehicleMatches =
        vehicle.vehicleNumber?.toLowerCase().includes(q) ||
        vehicle.makeModel?.toLowerCase().includes(q) ||
        vehicle.color?.toLowerCase().includes(q) ||
        vehicle.vehicleType?.toLowerCase().includes(q) ||
        vehicle.rfidTag?.toLowerCase().includes(q) ||
        q.includes("vehicle") ||
        q.includes("parking") ||
        q.includes("car");

      if (vehicleMatches) {
        results.push({
          id: `veh-${vehicle._id}`,
          category: "PARKING",
          categoryLabel: "Vehicle",
          title: `${vehicle.makeModel || "Vehicle"} (${vehicle.vehicleNumber})`,
          subtitle: `${vehicle.color ? `${vehicle.color} • ` : ""}${
            vehicle.vehicleType || "Vehicle"
          } • RFID Tag: ${vehicle.rfidTag || "Gate Active"}`,
          badge: {
            label: vehicle.status || "ACTIVE",
            variant: vehicle.status === "ACTIVE" ? "emerald" : "slate",
          },
          href: "/resident/parking",
          icon: Car,
        });
      }
    }

    const assignedSlots = parkingData?.assignedSlots || [];
    for (const slot of assignedSlots) {
      const slotMatches =
        slot.slotNumber?.toLowerCase().includes(q) ||
        slot.level?.toLowerCase().includes(q) ||
        slot.zoneName?.toLowerCase().includes(q) ||
        q.includes("slot") ||
        q.includes("parking");

      if (slotMatches) {
        results.push({
          id: `slot-${slot._id}`,
          category: "PARKING",
          categoryLabel: "Parking Slot",
          title: `Parking Slot ${slot.prefix || ""}${slot.slotNumber}`,
          subtitle: `Level ${slot.level || "Ground"} • Zone: ${
            slot.zoneName || "General"
          } • Vehicle Type: ${slot.vehicleType || "All"}`,
          badge: {
            label: "ASSIGNED",
            variant: "emerald",
          },
          href: "/resident/parking",
          icon: Car,
        });
      }
    }

    return results;
  }, [
    query,
    pageNavItems,
    guestPasses,
    complaintsList,
    announcements,
    billsData,
    parkingData,
  ]);

  // Filter results by active tab
  const filteredResults = useMemo(() => {
    if (activeCategory === "ALL") return searchResults;
    return searchResults.filter((item) => item.category === activeCategory);
  }, [searchResults, activeCategory]);

  // Counts by category for tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<SearchCategory, number> = {
      ALL: searchResults.length,
      PASSES: 0,
      TICKETS: 0,
      NOTICES: 0,
      BILLS: 0,
      PARKING: 0,
      PAGES: 0,
    };

    for (const item of searchResults) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [searchResults]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults, activeCategory]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    if (onMobileClose) onMobileClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      if (onMobileClose) onMobileClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  const badgeColorClass = (variant?: string) => {
    switch (variant) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  const categoryIconColor = (cat: string) => {
    switch (cat) {
      case "PASSES":
        return "bg-emerald-100 text-emerald-700";
      case "TICKETS":
        return "bg-purple-100 text-purple-700";
      case "NOTICES":
        return "bg-amber-100 text-amber-700";
      case "BILLS":
        return "bg-blue-100 text-blue-700";
      case "PARKING":
        return "bg-teal-100 text-teal-700";
      case "PAGES":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-[#07584F]/10 text-[#07584F]";
    }
  };

  const isSearching = query.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7C8782]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search passes, tickets, notices, bills, parking..."
          className="h-10 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] pl-9 pr-14 text-xs sm:text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition-all focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[#DDE3DF] bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#7C8782] shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#DDE3DF] bg-white shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-98 duration-150 max-h-[80vh] sm:max-h-[520px] flex flex-col">
          {/* Header Row with Query Summary & Category Pills */}
          <div className="border-b border-[#EEF1F4] bg-[#FAFBF9] px-3 py-2.5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                {isSearching
                  ? `${searchResults.length} ${
                      searchResults.length === 1 ? "Result" : "Results"
                    } for "${query}"`
                  : "Quick Navigation & Dashboard Shortcuts"}
              </span>

              <span className="text-[11px] text-[#7C8782]">
                <kbd className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">
                  ↑↓
                </kbd>{" "}
                navigate •{" "}
                <kbd className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">
                  ↵
                </kbd>{" "}
                select
              </span>
            </div>

            {/* Category Filter Pills (when searching) */}
            {isSearching && searchResults.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "PASSES", label: "Passes" },
                    { key: "TICKETS", label: "Tickets" },
                    { key: "NOTICES", label: "Notices" },
                    { key: "BILLS", label: "Bills" },
                    { key: "PARKING", label: "Parking" },
                    { key: "PAGES", label: "Pages" },
                  ] as const
                ).map(({ key, label }) => {
                  const count = categoryCounts[key] || 0;
                  if (key !== "ALL" && count === 0) return null;
                  const isActive = activeCategory === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#07584F] text-white shadow-2xs"
                          : "bg-white text-[#637083] border border-[#DDE3DF] hover:bg-slate-100 hover:text-[#111111]"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          isActive ? "text-white/80" : "text-[#7C8782]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-[#F1F4F2] p-1.5">
            {filteredResults.length > 0 ? (
              filteredResults.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#F4F7F5] ring-1 ring-[#07584F]/20"
                        : "hover:bg-[#F9FAF8]"
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${categoryIconColor(
                        item.category
                      )}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#111111] truncate">
                          {item.title}
                        </span>

                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight border ${badgeColorClass(
                              item.badge.variant
                            )}`}
                          >
                            {item.badge.label}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] sm:text-xs text-[#637083] line-clamp-1">
                        {item.subtitle}
                      </p>

                      {item.detail && (
                        <p className="text-[10px] font-mono text-[#07584F] mt-0.5 truncate">
                          {item.detail}
                        </p>
                      )}
                    </div>

                    {/* Arrow / Shortcut */}
                    <div className="shrink-0 self-center pl-1 text-[#CBD5E1]">
                      <ArrowRight
                        className={`size-4 transition-transform ${
                          isSelected ? "translate-x-0.5 text-[#07584F]" : ""
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            ) : (
              /* Empty State */
              <div className="py-8 px-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-[#7C8782] mb-3">
                  <Search className="size-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-[#111111] mb-1">
                  No matches found for &quot;{query}&quot;
                </h3>
                <p className="text-xs text-[#637083] max-w-xs mx-auto mb-4">
                  Try searching for visitor names, ticket numbers, announcements,
                  parking slots, or bills.
                </p>

                {/* Helpful suggestion pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mx-auto">
                  {[
                    "Pass",
                    "Plumbing",
                    "Electricity",
                    "Bill",
                    "Parking",
                    "Notice",
                    "SOS",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setQuery(chip);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-[#07584F] hover:bg-[#07584F]/10 transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-[#EEF1F4] bg-[#FAFBF9] px-3 py-2 text-[11px] text-[#7C8782] flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-[#07584F]" />
              <span>Resident Portal: {flatUnitName}</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onMobileClose) onMobileClose();
              }}
              className="text-xs font-medium text-[#07584F] hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

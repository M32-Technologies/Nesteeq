"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  fetchResidentGuestPasses,
  fetchResidentComplaints,
  fetchResidentDashboardAnnouncements,
  fetchCurrentApartment,
  fetchCurrentResidentProfile,
  type GuestPassItem,
  type CurrentApartment,
  type ResidentProfileItem,
} from "../api/resident-dashboard.api";

export interface UnifiedFeedItem {
  id: string;
  type: "ANNOUNCEMENT" | "COMPLAINT" | "PASS";
  title: string;
  subtitle?: string;
  meta: string;
  description: string;
  badge: {
    label: string;
    variant: "amber" | "emerald" | "blue" | "rose" | "purple";
  };
  tags: string[];
  author: {
    name: string;
    verified: boolean;
    role?: string;
  };
  ctaText: string;
  ctaHref: string;
  date: string;
  rawDate: Date;
}

export function useResidentDashboard() {
  const queryClient = useQueryClient();
  const { data: sessionData, isPending: isSessionLoading } = useSession();

  const user = sessionData?.user;
  const userName = user?.name || "Resident";
  const userEmail = user?.email;
  const userId = user?.id;

  // 1. Current Apartment Query
  const {
    data: apartment,
    isLoading: isApartmentLoading,
    refetch: refetchApartment,
  } = useQuery({
    queryKey: ["apartment", "current"],
    queryFn: fetchCurrentApartment,
    staleTime: 60 * 1000,
  });

  // 2. Current Resident Profile & Flat Details Query
  const {
    data: residentProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["resident", "profile", userEmail, userId],
    queryFn: () => fetchCurrentResidentProfile(userEmail, userId),
    enabled: Boolean(userEmail || userId),
    staleTime: 60 * 1000,
  });

  // 3. Friendly time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // 4. Formatted Dynamic Date (e.g. "Friday, September 18")
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  // 5. Guest Passes & Visitors Query
  const {
    data: guestPasses = [],
    isLoading: isVisitorsLoading,
    refetch: refetchVisitors,
  } = useQuery({
    queryKey: ["resident", "dashboard", "passes"],
    queryFn: () => fetchResidentGuestPasses({ limit: 10 }),
    staleTime: 30 * 1000,
  });

  // 6. Complaints & Helpdesk Query
  const {
    data: complaintsData,
    isLoading: isComplaintsLoading,
    refetch: refetchComplaints,
  } = useQuery({
    queryKey: ["resident", "dashboard", "complaints"],
    queryFn: () => fetchResidentComplaints({ limit: 10 }),
    staleTime: 30 * 1000,
  });

  // 7. Announcements Feed Query
  const {
    data: announcements = [],
    isLoading: isAnnouncementsLoading,
    refetch: refetchAnnouncements,
  } = useQuery({
    queryKey: ["resident", "dashboard", "announcements"],
    queryFn: fetchResidentDashboardAnnouncements,
    staleTime: 30 * 1000,
  });

  // Resolve clean human-readable flat unit without any raw IDs or dummy fallbacks
  const flatUnitName = useMemo(() => {
    if (residentProfile?.flat?.flatNumber) {
      const block = residentProfile.flat.blockId?.blockname;
      const flatNum = residentProfile.flat.flatNumber;
      return block ? `${block} • Flat ${flatNum}` : `Flat ${flatNum}`;
    }
    const rawFlat = (user as { flatId?: string })?.flatId;
    if (rawFlat && !/^[0-9a-fA-F]{24}$/.test(rawFlat)) {
      return rawFlat.toLowerCase().startsWith("flat") || rawFlat.toLowerCase().startsWith("unit")
        ? rawFlat
        : `Flat ${rawFlat}`;
    }
    return "Assigned Flat";
  }, [residentProfile, user]);

  const apartmentName = apartment?.name || "Apartment Community";

  const residentRole = useMemo(() => {
    const type = residentProfile?.residentType || (user as { role?: string })?.role;
    if (type === "owner") return "Flat Owner";
    return "Resident";
  }, [residentProfile, user]);

  const complaintsList = complaintsData?.complaints || [];
  const activeComplaintsCount = complaintsList.filter(
    (c) => c.status !== "RESOLVED" && c.status !== "CLOSED" && c.status !== "REJECTED"
  ).length;

  const criticalAlert = useMemo(() => {
    return announcements.find(
      (a) => a.type === "EMERGENCY" || a.priority === "URGENT"
    );
  }, [announcements]);

  const activeVisitorsCount = guestPasses.filter(
    (p) => p.status === "ACTIVE"
  ).length;

  // Build Unified Feed Items for Center Column
  const unifiedFeedItems = useMemo<UnifiedFeedItem[]>(() => {
    const items: UnifiedFeedItem[] = [];

    // Map Announcements
    for (const a of announcements) {
      const isCritical = a.type === "EMERGENCY" || a.priority === "URGENT";
      const rawDate = a.createdAt ? new Date(a.createdAt) : new Date();
      items.push({
        id: `ann-${a.id}`,
        type: "ANNOUNCEMENT",
        title: a.title,
        meta: `Target: ${a.targetType === "ALL_RESIDENTS" ? "All Residents" : "Targeted Blocks"} • Priority: ${a.priority}`,
        description: a.message,
        badge: isCritical
          ? { label: "CRITICAL NOTICE", variant: "rose" }
          : { label: "ANNOUNCEMENT", variant: "amber" },
        tags: [a.type || "Notice", a.priority, apartmentName].filter(Boolean),
        author: {
          name: a.creator?.name || `${apartmentName} Office`,
          verified: true,
          role: "Verified Management",
        },
        ctaText: "View Notice",
        ctaHref: "/resident/announcements",
        date: !isNaN(rawDate.getTime())
          ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Recent",
        rawDate: !isNaN(rawDate.getTime()) ? rawDate : new Date(),
      });
    }

    // Map Complaints
    for (const c of complaintsList) {
      const rawDate = c.createdAt ? new Date(c.createdAt) : new Date();
      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      items.push({
        id: `comp-${c._id}`,
        type: "COMPLAINT",
        title: c.title,
        meta: `Ticket: ${c.ticketNumber || `#REQ-${c._id.slice(-4).toUpperCase()}`} • Category: ${c.category} • Priority: ${c.priority}`,
        description: c.description,
        badge: isResolved
          ? { label: "RESOLVED", variant: "emerald" }
          : { label: `IN PROGRESS (${c.status.replace("_", " ")})`, variant: "purple" },
        tags: [c.category, c.status, c.priority].filter(Boolean),
        author: {
          name: c.assignedStaff?.name || "Facility Support Desk",
          verified: Boolean(c.assignedStaff),
          role: c.assignedStaff?.role || "Facility Support",
        },
        ctaText: "View Ticket",
        ctaHref: "/resident/complaints",
        date: !isNaN(rawDate.getTime())
          ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Recent",
        rawDate: !isNaN(rawDate.getTime()) ? rawDate : new Date(),
      });
    }

    // Map Guest Passes
    for (const p of guestPasses) {
      const rawDate = p.createdAt ? new Date(p.createdAt) : new Date();
      items.push({
        id: `pass-${p._id}`,
        type: "PASS",
        title: `Guest Pass: ${p.visitorName}`,
        meta: `Pass Code: #QR-${p._id.slice(-4).toUpperCase()} • Valid until: ${new Date(p.validUntil).toLocaleDateString()}`,
        description: p.purpose
          ? `Purpose: ${p.purpose}. Vehicle: ${p.vehicleNumber || "Walk-in"}. Pre-authorized gate access.`
          : `Pre-authorized gate access for ${p.visitorName}.`,
        badge:
          p.status === "ACTIVE"
            ? { label: "ACTIVE PASS", variant: "emerald" }
            : { label: p.status, variant: "blue" },
        tags: ["Visitor Pass", p.status, p.vehicleNumber || "Walk-in"].filter(Boolean),
        author: {
          name: "Gate Security System",
          verified: true,
          role: "Automated Gate Clearance",
        },
        ctaText: "View Pass",
        ctaHref: "/resident/visitors",
        date: !isNaN(rawDate.getTime())
          ? rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Recent",
        rawDate: !isNaN(rawDate.getTime()) ? rawDate : new Date(),
      });
    }

    // Sort newest first
    return items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [announcements, complaintsList, guestPasses, apartmentName]);

  // Refetch all queries
  const refetchAll = () => {
    refetchApartment();
    refetchProfile();
    refetchVisitors();
    refetchComplaints();
    refetchAnnouncements();
  };

  return {
    user,
    userName,
    userEmail,
    flatUnitName,
    apartmentName,
    residentRole,
    apartment,
    residentProfile,
    greeting,
    currentDateFormatted,
    isSessionLoading,
    isApartmentLoading,
    isProfileLoading,

    // Unified Feed
    unifiedFeedItems,

    // Visitors & Deliveries
    guestPasses,
    activeVisitorsCount,
    isVisitorsLoading,

    // Complaints & Helpdesk
    complaintsList,
    activeComplaintsCount,
    isComplaintsLoading,

    // Announcements
    announcements,
    criticalAlert,
    isAnnouncementsLoading,

    refetchAll,
  };
}

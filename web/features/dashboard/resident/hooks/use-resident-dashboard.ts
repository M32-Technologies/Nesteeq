"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  fetchResidentGuestPasses,
  fetchResidentComplaints,
  fetchResidentDashboardAnnouncements,
  type GuestPassItem,
} from "../api/resident-dashboard.api";

export function useResidentDashboard() {
  const queryClient = useQueryClient();
  const { data: sessionData, isPending: isSessionLoading } = useSession();

  const user = sessionData?.user;
  const userName = user?.name || "Resident";
  const flatId = (user as { flatId?: string })?.flatId || "A-204";

  // Compute friendly greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // 1. Guest Passes & Visitors Query
  const {
    data: guestPasses = [],
    isLoading: isVisitorsLoading,
    refetch: refetchVisitors,
  } = useQuery({
    queryKey: ["resident", "dashboard", "passes"],
    queryFn: () => fetchResidentGuestPasses({ limit: 5 }),
    staleTime: 30 * 1000,
  });

  // 2. Complaints & Helpdesk Query
  const {
    data: complaintsData,
    isLoading: isComplaintsLoading,
    refetch: refetchComplaints,
  } = useQuery({
    queryKey: ["resident", "dashboard", "complaints"],
    queryFn: () => fetchResidentComplaints({ limit: 5 }),
    staleTime: 30 * 1000,
  });

  // 3. Announcements Feed Query
  const {
    data: announcements = [],
    isLoading: isAnnouncementsLoading,
    refetch: refetchAnnouncements,
  } = useQuery({
    queryKey: ["resident", "dashboard", "announcements"],
    queryFn: fetchResidentDashboardAnnouncements,
    staleTime: 30 * 1000,
  });

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

  // Refetch all queries
  const refetchAll = () => {
    refetchVisitors();
    refetchComplaints();
    refetchAnnouncements();
  };

  return {
    user,
    userName,
    flatId,
    greeting,
    isSessionLoading,

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

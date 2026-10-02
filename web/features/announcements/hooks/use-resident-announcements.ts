"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResidentFeed } from "../api/announcements.api";
import type {
  AnnouncementItem,
  CriticalAlertData,
} from "../types";

export type ResidentAnnouncementTab =
  | "all"
  | "maintenance"
  | "emergency"
  | "events"
  | "society";

export function useResidentAnnouncements() {
  const [selectedTab, setSelectedTab] =
    useState<ResidentAnnouncementTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const [selectedNotice, setSelectedNotice] =
    useState<AnnouncementItem | null>(null);
  const [isHotlineOpen, setIsHotlineOpen] = useState(false);

  // Fetch live notices from backend resident feed endpoint
  const {
    data: liveNotices = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["resident", "announcements", "feed"],
    queryFn: getResidentFeed,
    staleTime: 30 * 1000,
  });

  // Use strictly live backend announcements (zero dummy data)
  const allNotices = Array.isArray(liveNotices) ? liveNotices : [];

  // Determine active critical alert dynamically from real backend announcements
  const criticalAlert: CriticalAlertData | null = useMemo(() => {
    if (!Array.isArray(allNotices) || allNotices.length === 0) return null;

    const liveEmergency = allNotices.find(
      (n) => n && (n.priority === "URGENT" || n.type === "EMERGENCY")
    );

    if (!liveEmergency) {
      return null;
    }

    const affected =
      liveEmergency.targetBlocks && liveEmergency.targetBlocks.length > 0
        ? liveEmergency.targetBlocks.map((b) => b?.blockname || "Block")
        : liveEmergency.targetType === "ALL_RESIDENTS"
        ? ["All Society Residents"]
        : ["Targeted Units"];

    let scheduleText = "Active Advisory";
    if (liveEmergency.expiresAt) {
      const expDate = new Date(liveEmergency.expiresAt);
      if (!isNaN(expDate.getTime())) {
        scheduleText = `Until ${expDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`;
      }
    }

    return {
      id: liveEmergency.id || "emergency-alert",
      badgeText: "CRITICAL ALERT",
      scheduleText,
      title: liveEmergency.title || "Emergency Advisory",
      description: liveEmergency.message || "",
      affectedBlocks: affected,
      actionGuidelines: [
        "Adhere to emergency instructions issued by management.",
        "Keep common pathways and fire exits clear.",
        "For immediate emergency escalation, contact the numbers below.",
      ],
      hotlineNumbers: [
        {
          label: liveEmergency.creator?.name || "Estate Control Room",
          number: liveEmergency.creator?.phone || "Intercom 101",
          description: liveEmergency.creatorRole || "Authorized Authority",
        },
      ],
    };
  }, [allNotices]);

  // Tab counts based on real backend types
  const counts = useMemo(() => {
    const list = Array.isArray(allNotices) ? allNotices : [];
    return {
      all: list.length,
      maintenance: list.filter((n) => n?.type === "MAINTENANCE").length,
      emergency: list.filter((n) => n?.type === "EMERGENCY").length,
      events: list.filter((n) => n?.type === "EVENTS_SOCIAL").length,
      society: list.filter(
        (n) => n?.type === "COMMUNITY_COUNCIL" || n?.type === "GENERAL"
      ).length,
    };
  }, [allNotices]);

  // Filter and search against real backend notices
  const filteredNotices = useMemo(() => {
    let result = Array.isArray(allNotices) ? allNotices : [];

    if (selectedTab === "maintenance") {
      result = result.filter((n) => n?.type === "MAINTENANCE");
    } else if (selectedTab === "emergency") {
      result = result.filter((n) => n?.type === "EMERGENCY");
    } else if (selectedTab === "events") {
      result = result.filter((n) => n?.type === "EVENTS_SOCIAL");
    } else if (selectedTab === "society") {
      result = result.filter(
        (n) => n?.type === "COMMUNITY_COUNCIL" || n?.type === "GENERAL"
      );
    }

    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter(
        (n) =>
          (n?.title && n.title.toLowerCase().includes(q)) ||
          (n?.message && n.message.toLowerCase().includes(q)) ||
          (n?.creator?.name && n.creator.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allNotices, selectedTab, deferredSearch]);

  // Pagination calculation
  const totalNotices = filteredNotices.length;
  const totalPages = Math.max(1, Math.ceil(totalNotices / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedNotices = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredNotices.slice(startIndex, startIndex + pageSize);
  }, [filteredNotices, safePage, pageSize]);

  const startRecord = totalNotices === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, totalNotices);

  return {
    // State
    selectedTab,
    setSelectedTab: (tab: ResidentAnnouncementTab) => {
      setSelectedTab(tab);
      setCurrentPage(1);
    },
    searchQuery,
    setSearchQuery: (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
    },
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalNotices,
    startRecord,
    endRecord,
    counts,

    // Data
    criticalAlert,
    paginatedNotices,
    allNoticesCount: allNotices.length,
    isLoading,
    isRefetching,
    refetch,

    // Modals & Drawers
    selectedNotice,
    setSelectedNotice,
    isHotlineOpen,
    setIsHotlineOpen,
  };
}

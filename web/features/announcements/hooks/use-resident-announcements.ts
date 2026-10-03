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

  // Fetch live notices with backend tab filtering, search, and pagination
  const {
    data: feedResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      "resident",
      "announcements",
      "feed",
      selectedTab,
      deferredSearch,
      currentPage,
    ],
    queryFn: () =>
      getResidentFeed({
        tab: selectedTab !== "all" ? selectedTab : undefined,
        search: deferredSearch.trim() || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    staleTime: 30 * 1000,
  });

  const isPaginatedResponse =
    feedResponse && typeof feedResponse === "object" && !Array.isArray(feedResponse);

  const paginatedNotices: AnnouncementItem[] = isPaginatedResponse
    ? (feedResponse as any).announcements || []
    : Array.isArray(feedResponse)
    ? feedResponse
    : [];

  const counts = isPaginatedResponse
    ? (feedResponse as any).counts || {
        all: 0,
        maintenance: 0,
        emergency: 0,
        events: 0,
        society: 0,
      }
    : {
        all: paginatedNotices.length,
        maintenance: paginatedNotices.filter((n) => n?.type === "MAINTENANCE").length,
        emergency: paginatedNotices.filter((n) => n?.type === "EMERGENCY").length,
        events: paginatedNotices.filter((n) => n?.type === "EVENTS_SOCIAL").length,
        society: paginatedNotices.filter(
          (n) => n?.type === "COMMUNITY_COUNCIL" || n?.type === "GENERAL"
        ).length,
      };

  const totalNotices = isPaginatedResponse
    ? (feedResponse as any).pagination?.total ?? paginatedNotices.length
    : paginatedNotices.length;

  const totalPages = isPaginatedResponse
    ? (feedResponse as any).pagination?.totalPages ?? 1
    : Math.max(1, Math.ceil(totalNotices / pageSize));

  const allNoticesCount = isPaginatedResponse
    ? (feedResponse as any).allNoticesCount ?? totalNotices
    : totalNotices;

  const rawCritical = isPaginatedResponse
    ? (feedResponse as any).criticalNotice
    : paginatedNotices.find(
        (n) => n && (n.priority === "URGENT" || n.type === "EMERGENCY")
      );

  // Determine active critical alert dynamically from real backend announcements
  const criticalAlert: CriticalAlertData | null = useMemo(() => {
    if (!rawCritical) return null;

    const affected =
      rawCritical.targetBlocks && rawCritical.targetBlocks.length > 0
        ? rawCritical.targetBlocks.map((b: any) => b?.blockname || "Block")
        : rawCritical.targetType === "ALL_RESIDENTS"
        ? ["All Society Residents"]
        : ["Targeted Units"];

    let scheduleText = "Active Advisory";
    if (rawCritical.expiresAt) {
      const expDate = new Date(rawCritical.expiresAt);
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
      id: rawCritical.id || (rawCritical as any)._id || "emergency-alert",
      badgeText: "CRITICAL ALERT",
      scheduleText,
      title: rawCritical.title || "Emergency Advisory",
      description: rawCritical.message || "",
      affectedBlocks: affected,
      actionGuidelines: [
        "Adhere to emergency instructions issued by management.",
        "Keep common pathways and fire exits clear.",
        "For immediate emergency escalation, contact the numbers below.",
      ],
      hotlineNumbers: [
        {
          label: rawCritical.creator?.name || "Estate Control Room",
          number: rawCritical.creator?.phone || "Intercom 101",
          description: rawCritical.creatorRole || "Authorized Authority",
        },
      ],
    };
  }, [rawCritical]);

  const startRecord = totalNotices === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalNotices);

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
    currentPage,
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
    allNoticesCount,
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

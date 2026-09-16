"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Megaphone,
  FileText,
  Send,
  FileEdit,
  Clock,
  Search,
  RotateCcw,
  MoreVertical,
  Wrench,
  Flame,
  PartyPopper,
  Users2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Eye,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  AlertOctagon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AnnouncementFilterState,
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementType,
  CreateAnnouncementFormData,
  EmergencyBroadcastFormData,
} from "../types";
import {
  useAnnouncementsQuery,
  useBroadcastEmergencyMutation,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useUpdateAnnouncementStatusMutation,
} from "../hooks/use-announcements-query";
import { AnnouncementDrawer } from "./announcement-drawer";
import { AnnouncementDetailDrawer } from "./announcement-detail-drawer";
import { AnnouncementDeleteDialog } from "./announcement-delete-dialog";
import { EmergencyBroadcastModal } from "./emergency-broadcast-modal";

interface AnnouncementsPageContentProps {
  initialSearch?: string;
}

export function AnnouncementsPageContent({
  initialSearch = "",
}: AnnouncementsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [filters, setFilters] = useState<AnnouncementFilterState>({
    search: initialSearch,
    status: "all",
    type: "all",
    target: "all",
    priority: "all",
    page: 1,
    limit: 8,
  });

  const queryParams: AnnouncementFilterState = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch.trim(),
    }),
    [filters, debouncedSearch]
  );

  // Backend Query
  const { data, isLoading, isError, error, isFetching } =
    useAnnouncementsQuery(queryParams);

  // Mutations
  const createMutation = useCreateAnnouncementMutation();
  const updateMutation = useUpdateAnnouncementMutation();
  const updateStatusMutation = useUpdateAnnouncementStatusMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const broadcastEmergencyMutation = useBroadcastEmergencyMutation();

  // Drawer / Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [viewingItem, setViewingItem] = useState<AnnouncementItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnnouncementItem | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const handleBroadcastEmergency = async (
    formData: EmergencyBroadcastFormData
  ) => {
    try {
      const res = await broadcastEmergencyMutation.mutateAsync(formData);
      const audienceInfo =
        res.estimatedAudience?.residentsCount > 0
          ? ` (${res.estimatedAudience.residentsCount} residents notified)`
          : "";
      toast.success(`Emergency alert broadcasted live!${audienceInfo}`, {
        icon: "🚨",
      });
      setIsEmergencyOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to broadcast emergency alert";
      toast.error(message);
      throw err;
    }
  };

  const announcements = data?.announcements || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  };
  const stats = data?.stats;
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filters.type !== "all" ||
    filters.target !== "all" ||
    filters.priority !== "all" ||
    filters.status !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilters({
      search: "",
      status: "all",
      type: "all",
      target: "all",
      priority: "all",
      page: 1,
      limit: 8,
    });
  };

  const handleCreateOrUpdate = async (
    formData: CreateAnnouncementFormData,
    editId?: string
  ) => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, formData });
        toast.success("Announcement updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Announcement created successfully");
      }
      setIsCreateOpen(false);
      setEditingItem(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save announcement";
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Announcement deleted successfully");
      if (viewingItem?.id === id) setViewingItem(null);
      setDeletingItem(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete announcement";
      toast.error(message);
    }
  };

  const handleToggleStatus = async (
    id: string,
    newStatus: AnnouncementStatus
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Announcement status updated to ${newStatus.toLowerCase()}`);
      if (viewingItem?.id === id) {
        setViewingItem((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    }
  };

  const getTypeStyle = (type: AnnouncementType) => {
    switch (type) {
      case "MAINTENANCE":
        return {
          icon: <Wrench className="size-4 text-blue-600" />,
          bg: "bg-blue-50/80 border-blue-100",
          name: "Maintenance",
        };
      case "EMERGENCY":
        return {
          icon: <Flame className="size-4 text-rose-600" />,
          bg: "bg-rose-50/80 border-rose-100",
          name: "Emergency",
        };
      case "EVENTS_SOCIAL":
        return {
          icon: <PartyPopper className="size-4 text-purple-600" />,
          bg: "bg-purple-50/80 border-purple-100",
          name: "Events & Social",
        };
      case "COMMUNITY_COUNCIL":
        return {
          icon: <Users2 className="size-4 text-emerald-600" />,
          bg: "bg-emerald-50/80 border-emerald-100",
          name: "Community",
        };
      case "GENERAL":
      default:
        return {
          icon: <FileText className="size-4 text-[#0F5F45]" />,
          bg: "bg-[#E7F4EE] border-[#D0EADF]",
          name: "General",
        };
    }
  };

  const formatRelativeTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. MAIN PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep your residents informed with important community updates.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEmergencyOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 cursor-pointer"
          >
            <AlertOctagon size={16} />
            <span>Broadcast Emergency</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.25} />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Subtle Announcement Insight Banner - Brand Theme Styled */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#E7F4EE]/90 via-[#F3FAF6]/60 to-white p-4 border border-[#D0EADF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-lg bg-white text-[#0F5F45] border border-[#D0EADF] shadow-xs flex items-center justify-center shrink-0">
            <Megaphone className="size-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Stay connected with your community
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0F5F45]/10 text-[#0F5F45] border border-[#0F5F45]/20">
                Direct SMS & App Push
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Share maintenance updates, events, alerts and important information with the right residents. Target specific active blocks or broadcast to the entire society in one click.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsCreateOpen(true);
            }}
            className="text-xs font-semibold text-[#0F5F45] hover:text-[#0B4D38] bg-white px-3.5 py-1.5 rounded-lg border border-[#D0EADF] shadow-xs hover:bg-[#E7F4EE] transition-colors"
          >
            Quick Draft
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total */}
        <div
          onClick={() => {
            setFilters((f) => ({ ...f, status: "all", page: 1 }));
          }}
          className={`relative overflow-hidden rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${filters.status === "all"
              ? "border-[#0F5F45] ring-2 ring-[#0F5F45]/15"
              : "border-slate-200 hover:border-slate-300"
            }`}
        >
          <span className="absolute inset-y-0 left-0 w-[3px] bg-[#0F5F45]" />
          <div className="flex items-start justify-between pl-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">
                Total Announcements
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-slate-900 tracking-tight">
                  {pagination.total}
                </span>
                {isFetching && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
              </div>
            </div>
            <div className="size-9 rounded-lg bg-[#E7F4EE] text-[#0F5F45] flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </div>
        </div>

        {/* Card 2: Published */}
        <div
          onClick={() => {
            setFilters((f) => ({ ...f, status: "PUBLISHED", page: 1 }));
          }}
          className={`relative overflow-hidden rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${
            filters.status === "PUBLISHED"
              ? "border-emerald-600 ring-2 ring-emerald-600/15"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="absolute inset-y-0 left-0 w-[3px] bg-emerald-600" />
          <div className="flex items-start justify-between pl-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">
                Published
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-slate-900 tracking-tight">
                  {stats?.published ?? (filters.status === "PUBLISHED" ? pagination.total : 0)}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                  Live
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Send className="size-4" />
            </div>
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div
          onClick={() => {
            setFilters((f) => ({ ...f, status: "DRAFT", page: 1 }));
          }}
          className={`relative overflow-hidden rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${
            filters.status === "DRAFT"
              ? "border-slate-500 ring-2 ring-slate-500/15"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="absolute inset-y-0 left-0 w-[3px] bg-slate-500" />
          <div className="flex items-start justify-between pl-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">
                Drafts
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-slate-900 tracking-tight">
                  {stats?.draft ?? (filters.status === "DRAFT" ? pagination.total : 0)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Ready</span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileEdit className="size-4" />
            </div>
          </div>
        </div>

        {/* Card 4: Archived */}
        <div
          onClick={() => {
            setFilters((f) => ({ ...f, status: "ARCHIVED", page: 1 }));
          }}
          className={`relative overflow-hidden rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${
            filters.status === "ARCHIVED"
              ? "border-amber-500 ring-2 ring-amber-500/15"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" />
          <div className="flex items-start justify-between pl-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">
                Archived
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[26px] font-bold text-slate-900 tracking-tight">
                  {stats?.archived ?? (filters.status === "ARCHIVED" ? pagination.total : 0)}
                </span>
                <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 font-medium">
                  Past
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER / SEARCH AREA & MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main List Area (8 or 9 columns on XL) */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-4">
          {/* Aligned Toolbar Section */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs p-3.5 sm:p-4 space-y-3">
            {/* Top row: Search input + Select Dropdowns + Reset */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              {/* Search input (debounced backend query) */}
              <div className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFilters((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-9 pr-9 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : isFetching ? (
                  <Loader2 className="size-3.5 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : null}
              </div>

              {/* Filter controls aligned neatly with uniform height, styling, and chevron */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                {/* Type dropdown */}
                <div className="relative min-w-[115px] flex-1 sm:flex-none">
                  <select
                    aria-label="Filter by Type"
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        type: e.target.value as "all" | AnnouncementType,
                        page: 1,
                      });
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50/70 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="GENERAL">General</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="EVENTS_SOCIAL">Events & Social</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="COMMUNITY_COUNCIL">Community</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Target dropdown */}
                <div className="relative min-w-[125px] flex-1 sm:flex-none">
                  <select
                    aria-label="Filter by Target Audience"
                    value={filters.target}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        target: e.target.value as "all" | AnnouncementTargetType,
                        page: 1,
                      });
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50/70 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 cursor-pointer"
                  >
                    <option value="all">All Audiences</option>
                    <option value="ALL_RESIDENTS">All Residents</option>
                    <option value="BLOCK">Specific Blocks</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Priority dropdown */}
                <div className="relative min-w-[115px] flex-1 sm:flex-none">
                  <select
                    aria-label="Filter by Priority"
                    value={filters.priority}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        priority: e.target.value as "all" | AnnouncementPriority,
                        page: 1,
                      });
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50/70 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 cursor-pointer"
                  >
                    <option value="all">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset filters"
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 cursor-pointer shrink-0"
                >
                  <RotateCcw size={13} className="text-slate-400" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Segmented Status Pills + Balanced Results Counter */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              {/* Status Tabs Pills in refined segmented track */}
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100/70 border border-slate-200/50 overflow-x-auto scrollbar-none">
                {[
                  {
                    key: "all" as const,
                    label: "All Announcements",
                    count: stats?.total ?? pagination.total,
                  },
                  {
                    key: "PUBLISHED" as const,
                    label: "Published",
                    count: stats?.published ?? 0,
                  },
                  {
                    key: "DRAFT" as const,
                    label: "Drafts",
                    count: stats?.draft ?? 0,
                  },
                  {
                    key: "ARCHIVED" as const,
                    label: "Archived",
                    count: stats?.archived ?? 0,
                  },
                ].map((tab) => {
                  const isActive = filters.status === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        setFilters({ ...filters, status: tab.key, page: 1 })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-[#0F5F45] text-white shadow-xs font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Balanced Right Side: Result Summary & Filter Feedback */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 shrink-0">
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-[#0F5F45] text-[11px] font-medium border border-emerald-200/60">
                    Filters active
                  </span>
                )}
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-slate-700">
                    {announcements.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-slate-700">
                    {pagination.total}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* 4. ANNOUNCEMENT CONTENT AREA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              /* LOADING SKELETON */
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="size-10 rounded-lg bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-50 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              /* ERROR STATE */
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-rose-600 font-medium">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load announcements from server."}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-[#0F5F45] text-white text-xs font-semibold rounded-lg hover:bg-[#0B4D38] transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : announcements.length === 0 ? (
              /* EMPTY STATE */
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="size-14 rounded-2xl bg-[#E7F4EE] border border-[#D0EADF] text-[#0F5F45] flex items-center justify-center mb-4 shadow-xs">
                  <Megaphone className="size-7 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  No announcements found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">
                  {filters.search || filters.status !== "all" || filters.type !== "all"
                    ? "Try adjusting your search query or filters to find what you're looking for."
                    : "Create your first community announcement to keep residents informed."}
                </p>
                <div className="flex items-center gap-3">
                  {(filters.search || filters.status !== "all" || filters.type !== "all") && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreateOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0F5F45] hover:bg-[#0B4D38] shadow-sm transition-colors"
                  >
                    + Create Announcement
                  </button>
                </div>
              </div>
            ) : (
              /* ANNOUNCEMENT ROWS */
              <div className="divide-y divide-slate-100">
                {announcements.map((announcement) => {
                  const typeMeta = getTypeStyle(announcement.type);
                  const isMenuOpen = actionMenuId === announcement.id;
                  const authorDisplay =
                    announcement.creator?.name ||
                    announcement.createdBy ||
                    "Manager";

                  return (
                    <div
                      key={announcement.id}
                      onClick={() => setViewingItem(announcement)}
                      className="group p-4 sm:px-5 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* LEFT & CENTER */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`size-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${typeMeta.bg}`}
                        >
                          {typeMeta.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0F5F45] transition-colors truncate">
                              {announcement.title}
                            </h3>
                            <span className="text-[11px] font-medium text-slate-400">
                              • {typeMeta.name}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1 mt-1 leading-snug">
                            {announcement.message}
                          </p>

                          <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-400">
                            <span>{formatRelativeTime(announcement.createdAt)}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-600 truncate max-w-[200px]">
                              By {authorDisplay}
                            </span>
                            {announcement.expiresAt && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600">
                                  Expires {formatRelativeTime(announcement.expiresAt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Badges & Action Menu */}
                      <div
                        className="flex items-center gap-2.5 shrink-0 self-end sm:self-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Target Audience Badge */}
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                          {announcement.targetType === "ALL_RESIDENTS"
                            ? "All Residents"
                            : announcement.targetBlocks &&
                              announcement.targetBlocks.length > 0
                              ? announcement.targetBlocks.map((b) => b.code).join(", ")
                              : "Specific Blocks"}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${announcement.priority === "URGENT" ||
                              announcement.priority === "HIGH"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : announcement.priority === "NORMAL"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                        >
                          {announcement.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${announcement.status === "PUBLISHED"
                              ? "bg-[#E7F4EE] text-[#0F5F45] border border-[#D0EADF]"
                              : announcement.status === "DRAFT"
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                        >
                          {announcement.status}
                        </span>

                        {/* Three-dot action menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuId(
                                isMenuOpen ? null : announcement.id
                              )
                            }
                            aria-label="More actions"
                            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  setViewingItem(announcement);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye size={14} className="text-slate-400" />
                                <span>View Details</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  setEditingItem(announcement);
                                  setIsCreateOpen(true);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 size={14} className="text-slate-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  const nextStatus: AnnouncementStatus =
                                    announcement.status === "PUBLISHED"
                                      ? "DRAFT"
                                      : "PUBLISHED";
                                  handleToggleStatus(announcement.id, nextStatus);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileEdit size={14} className="text-slate-400" />
                                <span>
                                  {announcement.status === "PUBLISHED"
                                    ? "Move to Draft"
                                    : "Publish"}
                                </span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  setDeletingItem(announcement);
                                }}
                                className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && pagination.total > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-slate-800">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="font-semibold text-slate-800">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-slate-800">
                    {pagination.total}
                  </strong>{" "}
                  announcements
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || isFetching}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 font-medium text-slate-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={
                      pagination.page >= pagination.totalPages || isFetching
                    }
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.min(pagination.totalPages, prev.page + 1),
                      }))
                    }
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. RIGHT SIDEBAR / INSIGHTS (4 or 3 columns on XL) */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-4">
          {/* Card 1: Announcement Types Breakdown */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Filter by Type
              </h3>
              <span className="text-[11px] text-slate-400">Categories</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {[
                {
                  type: "GENERAL" as AnnouncementType,
                  label: "General",
                  icon: FileText,
                  color: "text-[#0F5F45] bg-[#E7F4EE]",
                },
                {
                  type: "MAINTENANCE" as AnnouncementType,
                  label: "Maintenance",
                  icon: Wrench,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  type: "EVENTS_SOCIAL" as AnnouncementType,
                  label: "Events & Social",
                  icon: PartyPopper,
                  color: "text-purple-600 bg-purple-50",
                },
                {
                  type: "EMERGENCY" as AnnouncementType,
                  label: "Emergency",
                  icon: Flame,
                  color: "text-rose-600 bg-rose-50",
                },
                {
                  type: "COMMUNITY_COUNCIL" as AnnouncementType,
                  label: "Community",
                  icon: Users2,
                  color: "text-emerald-600 bg-emerald-50",
                },
              ].map((row) => {
                const Icon = row.icon;
                const isSelected = filters.type === row.type;

                return (
                  <button
                    key={row.type}
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        type: isSelected ? "all" : row.type,
                        page: 1,
                      }));
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all group ${isSelected
                        ? "bg-[#E7F4EE] border border-[#D0EADF] text-[#0F5F45] font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`size-7 rounded-md flex items-center justify-center shrink-0 ${row.color}`}
                      >
                        <Icon size={14} />
                      </div>
                      <span>{row.label}</span>
                    </div>

                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Quick Tips Checklist */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-[#0F5F45]" />
              Announcement Best Practices
            </h3>

            <div className="space-y-2.5 pt-1">
              {[
                "Select 'Specific Blocks' to target only relevant towers",
                "Use priority flags to signal urgent building updates",
                "Set expiry dates to auto-archive outdated notices",
                "Review drafts before broadcasting to mobile app",
                "Keep notice titles brief and descriptive",
              ].map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-600"
                >
                  <div className="size-1.5 rounded-full bg-[#0F5F45] shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. CREATE / EDIT DRAWER */}
      <AnnouncementDrawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editItem={editingItem}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* 7. DETAIL VIEW DRAWER */}
      <AnnouncementDetailDrawer
        isOpen={Boolean(viewingItem)}
        announcement={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={(item) => {
          setViewingItem(null);
          setEditingItem(item);
          setIsCreateOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={(item) => {
          setDeletingItem(item);
        }}
      />

      {/* 8. DELETE CONFIRMATION DIALOG */}
      <AnnouncementDeleteDialog
        isOpen={Boolean(deletingItem)}
        announcement={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />

      {/* 9. EMERGENCY BROADCAST MODAL */}
      <EmergencyBroadcastModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onSubmit={handleBroadcastEmergency}
        isSubmitting={broadcastEmergencyMutation.isPending}
      />
    </div>
  );
}

"use client";

import React from "react";
import {
  X,
  Calendar,
  User,
  Building,
  Clock,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
  PartyPopper,
  Flame,
  Users2,
  Shield,
  FileText,
} from "lucide-react";
import type {
  AnnouncementItem,
  AnnouncementStatus,
  AnnouncementType,
} from "../types";

interface DetailDrawerProps {
  isOpen: boolean;
  announcement: AnnouncementItem | null;
  onClose: () => void;
  onEdit: (announcement: AnnouncementItem) => void;
  onToggleStatus: (id: string, newStatus: AnnouncementStatus) => void;
  onDelete: (announcement: AnnouncementItem) => void;
}

export function AnnouncementDetailDrawer({
  isOpen,
  announcement,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: DetailDrawerProps) {
  if (!isOpen || !announcement) return null;

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case "MAINTENANCE":
        return <Wrench className="size-4 text-blue-600" />;
      case "EMERGENCY":
        return <Flame className="size-4 text-rose-600" />;
      case "EVENTS_SOCIAL":
        return <PartyPopper className="size-4 text-purple-600" />;
      case "COMMUNITY_COUNCIL":
        return <Users2 className="size-4 text-emerald-600" />;
      case "GENERAL":
      default:
        return <FileText className="size-4 text-[#0F5F45]" />;
    }
  };

  const getTypeLabel = (type: AnnouncementType) => {
    switch (type) {
      case "MAINTENANCE":
        return "Maintenance";
      case "EMERGENCY":
        return "Emergency";
      case "EVENTS_SOCIAL":
        return "Events & Social";
      case "COMMUNITY_COUNCIL":
        return "Community";
      case "GENERAL":
      default:
        return "General";
    }
  };

  const formattedCreated = new Date(announcement.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const formattedExpiry = announcement.expiresAt
    ? new Date(announcement.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No expiration set";

  const creatorName =
    announcement.creator?.name || announcement.createdBy || "Property Staff";
  const creatorRole =
    announcement.creator?.email ||
    announcement.creatorRole ||
    "Property Manager";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-slate-200">
        {/* Top bar */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Announcement Overview
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono font-medium text-[#0F5F45]">
              ID: {announcement.id.slice(-6)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Type Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                {getTypeIcon(announcement.type)}
                <span>{getTypeLabel(announcement.type)}</span>
              </span>

              {/* Priority Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  announcement.priority === "URGENT" ||
                  announcement.priority === "HIGH"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : announcement.priority === "NORMAL"
                    ? "bg-[#E7F4EE] text-[#0F5F45] border-[#D0EADF]"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {announcement.priority} Priority
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  announcement.status === "PUBLISHED"
                    ? "bg-[#E7F4EE] text-[#0F5F45] border-[#D0EADF]"
                    : announcement.status === "DRAFT"
                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {announcement.status === "PUBLISHED" && (
                  <CheckCircle2 size={13} />
                )}
                {announcement.status === "ARCHIVED" && (
                  <AlertCircle size={13} />
                )}
                <span>{announcement.status}</span>
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Full Message Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Broadcast Message
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {announcement.message}
            </p>
          </div>

          {/* Audience & Delivery Specification */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Audience
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building size={16} className="text-[#0F5F45]" />
                <span className="text-xs font-semibold text-slate-800">
                  {announcement.targetType === "ALL_RESIDENTS"
                    ? "All Residents & Owners"
                    : "Targeted Blocks Only"}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E7F4EE] text-[#0F5F45] border border-[#D0EADF]">
                {announcement.targetType === "ALL_RESIDENTS"
                  ? "Broadcast to all units"
                  : `${
                      announcement.targetBlocks?.length ||
                      announcement.targetIds?.length ||
                      0
                    } blocks targeted`}
              </span>
            </div>

            {announcement.targetType === "BLOCK" &&
              ((announcement.targetBlocks &&
                announcement.targetBlocks.length > 0) ||
                (announcement.targetIds &&
                  announcement.targetIds.length > 0)) && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 block mb-2">
                    Delivered to active residents of:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {announcement.targetBlocks &&
                    announcement.targetBlocks.length > 0
                      ? announcement.targetBlocks.map((b) => (
                          <span
                            key={b.id}
                            className="px-2.5 py-1 bg-[#E7F4EE] text-[#0F5F45] rounded-md text-xs font-semibold border border-[#D0EADF]"
                          >
                            {b.blockname} ({b.code})
                          </span>
                        ))
                      : announcement.targetIds?.map((id) => (
                          <span
                            key={id}
                            className="px-2.5 py-1 bg-[#E7F4EE] text-[#0F5F45] rounded-md text-xs font-semibold border border-[#D0EADF] font-mono text-[11px]"
                          >
                            Block #{id.slice(-4)}
                          </span>
                        ))}
                  </div>
                </div>
              )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <User size={15} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Created By
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 truncate">
                {creatorName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{creatorRole}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={15} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Created Date
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {formattedCreated}
              </p>
              <p className="text-[11px] text-slate-500">System logged</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={15} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Expiration
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {formattedExpiry}
              </p>
              <p className="text-[11px] text-slate-500">
                {announcement.expiresAt ? "Auto-archives" : "Permanent notice"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Eye size={15} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Status
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {announcement.status}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {announcement.status === "PUBLISHED"
                  ? "Live on resident feed"
                  : "Not visible to residents"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onDelete(announcement)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-colors"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const nextStatus: AnnouncementStatus =
                  announcement.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                onToggleStatus(announcement.id, nextStatus);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
            >
              <Shield size={14} className="text-slate-500" />
              <span>
                {announcement.status === "PUBLISHED" ? "Move to Draft" : "Publish"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(announcement)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0F5F45] hover:bg-[#0B4D38] shadow-sm transition-colors"
            >
              <Edit3 size={14} />
              <span>Edit Announcement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

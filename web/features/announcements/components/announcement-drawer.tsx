"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  FileEdit,
  Clock,
  Building,
  Check,
  Calendar,
  Loader2,
} from "lucide-react";
import type {
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementType,
  CreateAnnouncementFormData,
} from "../types";
import { useActiveBlocksQuery } from "../hooks/use-announcements-query";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementFormData, editId?: string) => void;
  editItem?: AnnouncementItem | null;
  isSubmitting?: boolean;
}

export function AnnouncementDrawer({
  isOpen,
  onClose,
  onSubmit,
  editItem,
  isSubmitting = false,
}: DrawerProps) {
  if (!isOpen) return null;

  return (
    <AnnouncementDrawerForm
      key={editItem?.id || "new"}
      onClose={onClose}
      onSubmit={onSubmit}
      editItem={editItem}
      isSubmitting={isSubmitting}
    />
  );
}

function AnnouncementDrawerForm({
  onClose,
  onSubmit,
  editItem,
  isSubmitting = false,
}: Omit<DrawerProps, "isOpen">) {
  const { data: activeBlocks = [], isLoading: isBlocksLoading } =
    useActiveBlocksQuery();

  const [title, setTitle] = useState(editItem?.title || "");
  const [message, setMessage] = useState(editItem?.message || "");
  const [type, setType] = useState<AnnouncementType>(editItem?.type || "GENERAL");
  const [priority, setPriority] = useState<AnnouncementPriority>(
    editItem?.priority || "NORMAL"
  );
  const [targetType, setTargetType] = useState<AnnouncementTargetType>(
    editItem?.targetType || "ALL_RESIDENTS"
  );
  const [targetBlocks, setTargetBlocks] = useState<string[]>(
    editItem?.targetIds ||
      editItem?.targetBlocks?.map((b) => b.id) ||
      []
  );
  const [hasExpiry, setHasExpiry] = useState(Boolean(editItem?.expiresAt));
  const [expiresAt, setExpiresAt] = useState(
    editItem?.expiresAt ? editItem.expiresAt.split("T")[0] : ""
  );

  const handleTypeChange = (newType: AnnouncementType) => {
    setType(newType);
  };

  const toggleBlock = (blockId: string) => {
    if (targetBlocks.includes(blockId)) {
      setTargetBlocks(targetBlocks.filter((b) => b !== blockId));
    } else {
      setTargetBlocks([...targetBlocks, blockId]);
    }
  };

  const handleAction = (statusToSet: AnnouncementStatus) => {
    if (!title.trim() || !message.trim()) {
      alert("Please provide both title and announcement message.");
      return;
    }

    if (targetType === "BLOCK" && targetBlocks.length === 0) {
      alert("Please select at least one active block when targeting specific blocks.");
      return;
    }

    onSubmit(
      {
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        targetType,
        targetIds: targetType === "BLOCK" ? targetBlocks : [],
        hasExpiry,
        expiresAt: hasExpiry && expiresAt ? `${expiresAt}T23:59:59.000Z` : "",
        status: statusToSet,
      },
      editItem ? editItem.id : undefined
    );
  };

  const typesConfig: Array<{
    value: AnnouncementType;
    label: string;
    desc: string;
  }> = [
    { value: "GENERAL", label: "General", desc: "Routine community notice" },
    { value: "MAINTENANCE", label: "Maintenance", desc: "Repairs & shutdowns" },
    { value: "EVENTS_SOCIAL", label: "Events & Social", desc: "Celebrations & sports" },
    { value: "COMMUNITY_COUNCIL", label: "Community", desc: "Meetings & amenities" },
  ];

  const prioritiesConfig: Array<{
    value: AnnouncementPriority;
    label: string;
    color: string;
  }> = [
      { value: "LOW", label: "Low", color: "text-slate-700 bg-slate-100 border-slate-200" },
      { value: "NORMAL", label: "Normal", color: "text-[#0F5F45] bg-[#E7F4EE] border-[#D0EADF]" },
      { value: "HIGH", label: "High", color: "text-amber-700 bg-amber-50 border-amber-200" },
      { value: "URGENT", label: "Urgent", color: "text-rose-700 bg-rose-50 border-rose-200" },
    ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-slate-200">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {editItem ? "Edit Announcement" : "Create Announcement"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create an important update for your apartment community.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#0F5F45]" />
                Basic Information
              </h3>
              <span className="text-[11px] text-slate-400">Required</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                disabled={isSubmitting}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Water Supply Maintenance"
                className="w-full h-10 px-3 text-sm text-slate-800 bg-white rounded-lg border border-slate-200 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 transition-all outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Message Content
              </label>
              <textarea
                rows={4}
                value={message}
                disabled={isSubmitting}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the complete announcement details, instructions, or schedules for residents..."
                className="w-full p-3 text-sm text-slate-800 bg-white rounded-lg border border-slate-200 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 transition-all outline-none resize-none leading-relaxed disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keep the first sentence concise. It will be used for mobile push previews.
              </p>
            </div>
          </div>

          {/* Section 2: Announcement Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#0F5F45]" />
              Announcement Details
            </h3>

            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Announcement Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {typesConfig.map((t) => {
                  const isSelected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleTypeChange(t.value)}
                      className={`p-2.5 text-left rounded-lg border transition-all ${isSelected
                          ? "border-[#0F5F45] bg-[#E7F4EE]/60 text-[#0F5F45] ring-1 ring-[#0F5F45]/20 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{t.label}</span>
                        {isSelected && <Check size={14} className="text-[#0F5F45]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {prioritiesConfig.map((p) => {
                  const isSelected = priority === p.value;
                  const isEmergencyLocked = type === "EMERGENCY" && p.value !== "URGENT";
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={isSubmitting || isEmergencyLocked}
                      onClick={() => setPriority(p.value)}
                      className={`h-9 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${isSelected
                          ? "border-[#0F5F45] bg-[#0F5F45] text-white shadow-xs"
                          : isEmergencyLocked
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span>{p.label}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
              {type === "EMERGENCY" && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  Emergency announcements require Urgent priority and broadcast to All Residents.
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Target Audience */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#0F5F45]" />
                Target Audience
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {activeBlocks.length} active {activeBlocks.length === 1 ? "block" : "blocks"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${targetType === "ALL_RESIDENTS"
                    ? "border-[#0F5F45] bg-[#E7F4EE]/40 text-[#0F5F45] ring-1 ring-[#0F5F45]/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <input
                  type="radio"
                  name="targetAudience"
                  disabled={isSubmitting || type === "EMERGENCY"}
                  checked={targetType === "ALL_RESIDENTS"}
                  onChange={() => setTargetType("ALL_RESIDENTS")}
                  className="size-4 text-[#0F5F45] focus:ring-[#0F5F45]"
                />
                <div>
                  <div className="text-xs font-semibold">All Residents</div>
                  <div className="text-[11px] text-slate-500">
                    Broadcast to entire apartment
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${type === "EMERGENCY"
                    ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                    : targetType === "BLOCK"
                      ? "border-[#0F5F45] bg-[#E7F4EE]/40 text-[#0F5F45] ring-1 ring-[#0F5F45]/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <input
                  type="radio"
                  name="targetAudience"
                  disabled={isSubmitting || type === "EMERGENCY"}
                  checked={targetType === "BLOCK"}
                  onChange={() => setTargetType("BLOCK")}
                  className="size-4 text-[#0F5F45] focus:ring-[#0F5F45]"
                />
                <div>
                  <div className="text-xs font-semibold">Specific Blocks</div>
                  <div className="text-[11px] text-slate-500">
                    Target select active blocks
                  </div>
                </div>
              </label>
            </div>

            {/* Dynamic Multi-Select for Real Active Blocks */}
            {targetType === "BLOCK" && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Select Active Blocks
                  </span>
                  <span className="text-xs text-[#0F5F45] font-semibold">
                    {targetBlocks.length} selected
                  </span>
                </div>

                {isBlocksLoading ? (
                  <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-[#0F5F45]" />
                    <span className="text-xs">Loading active blocks...</span>
                  </div>
                ) : activeBlocks.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-amber-200 text-amber-800 text-xs">
                    No active blocks found for this apartment. Please add or activate blocks first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {activeBlocks.map((block) => {
                      const isSelected = targetBlocks.includes(block.id);
                      return (
                        <button
                          key={block.id}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => toggleBlock(block.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all ${isSelected
                              ? "bg-[#0F5F45] text-white border-[#0F5F45] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building size={14} className="shrink-0" />
                            <span className="truncate">{block.blockname}</span>
                          </div>
                          <span
                            className={`text-[11px] shrink-0 font-mono font-semibold ${isSelected ? "text-emerald-100" : "text-slate-400"
                              }`}
                          >
                            {block.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Schedule & Expiration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#0F5F45]" />
              Schedule & Expiration
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-slate-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Set Expiration Date
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Automatically archives post-event
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={isSubmitting}
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="size-4 text-[#0F5F45] rounded focus:ring-[#0F5F45] cursor-pointer"
              />
            </div>

            {hasExpiry && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-medium text-slate-700">
                  Expiry Date
                </label>
                <div className="relative">
                  <Calendar size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    disabled={isSubmitting}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 pl-9 pr-3 text-sm text-slate-800 bg-white rounded-lg border border-slate-200 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 transition-all outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction("DRAFT")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin text-slate-500" />
              ) : (
                <FileEdit size={14} className="text-slate-500" />
              )}
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction("PUBLISHED")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0F5F45] hover:bg-[#0B4D38] shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>Publish Announcement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

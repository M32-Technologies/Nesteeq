"use client";

import React, { useState } from "react";
import { X, Plus, Loader2, Megaphone } from "lucide-react";
import type {
  AnnouncementPriority,
  AnnouncementType,
  CreateAnnouncementFormData,
} from "../../types";

interface PostNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateAnnouncementFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function PostNoticeModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: PostNoticeModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("GENERAL");
  const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL");
  const [targetType, setTargetType] = useState<"ALL_RESIDENTS" | "BLOCK">("ALL_RESIDENTS");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    await onSubmit({
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      status: "PUBLISHED",
      targetType,
      targetIds: [],
      hasExpiry,
      expiresAt: hasExpiry ? expiresAt : "",
    });

    setTitle("");
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Megaphone className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Post Community Notice
              </h3>
              <p className="text-xs text-slate-500">
                Broadcast a message or event to Greenwood Heights residents.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Annual Autumn Cultural Gala & Food Truck Carnival"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
              >
                <option value="GENERAL">General Notice</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EVENTS_SOCIAL">Community Event</option>
                <option value="COMMUNITY_COUNCIL">Council Report</option>
                <option value="EMERGENCY">Security / Emergency</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as AnnouncementPriority)
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Audience
            </label>
            <div className="flex items-center gap-4 text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  checked={targetType === "ALL_RESIDENTS"}
                  onChange={() => setTargetType("ALL_RESIDENTS")}
                  className="text-indigo-600"
                />
                <span>All Residents</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  checked={targetType === "BLOCK"}
                  onChange={() => setTargetType("BLOCK")}
                  className="text-indigo-600"
                />
                <span>Block A Only</span>
              </label>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notice Content *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide comprehensive details, guidelines, venue and timings..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Expiry Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 font-medium">
                Set expiration date
              </span>
            </label>

            {hasExpiry && (
              <input
                type="date"
                required={hasExpiry}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-indigo-600"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              <span>Publish Notice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

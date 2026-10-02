"use client";

import React from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import type { AnnouncementItem } from "../types";

interface DeleteDialogProps {
  isOpen: boolean;
  announcement: AnnouncementItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isDeleting?: boolean;
}

export function AnnouncementDeleteDialog({
  isOpen,
  announcement,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteDialogProps) {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={isDeleting ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          disabled={isDeleting}
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[17px] font-semibold text-slate-900 leading-snug">
              Delete announcement?
            </h3>
            <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
              This action cannot be undone. The announcement{" "}
              <span className="font-semibold text-slate-700">
                &ldquo;{announcement.title}&rdquo;
              </span>{" "}
              will be permanently removed from all residents and staff views.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(announcement.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            <span>Delete Announcement</span>
          </button>
        </div>
      </div>
    </div>
  );
}

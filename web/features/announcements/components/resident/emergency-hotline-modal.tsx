"use client";

import React from "react";
import {
  X,
  Phone,
  Clock,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Radio,
  ExternalLink,
} from "lucide-react";
import type { CriticalAlertData } from "../../types";

interface EmergencyHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: CriticalAlertData | null;
}

export function EmergencyHotlineModal({
  isOpen,
  onClose,
  alert,
}: EmergencyHotlineModalProps) {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl ring-1 ring-rose-500/20 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient top glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hotline dialog"
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div className="relative flex shrink-0 items-center justify-center">
            <span className="absolute inline-flex size-12 animate-ping rounded-2xl bg-rose-400 opacity-20" />
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30">
              <ShieldAlert className="size-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                <Radio className="size-3 animate-pulse" />
                <span>{alert.badgeText || "CRITICAL ALERT"}</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug mt-1.5">
              {alert.title}
            </h3>
          </div>
        </div>

        {/* Timing and Affected Scope Banner */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 p-3.5 text-xs">
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-rose-600 shadow-2xs">
              <Clock className="size-3.5" />
            </div>
            <span>{alert.scheduleText}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-rose-600 shadow-2xs">
              <Building2 className="size-3.5" />
            </div>
            <span className="truncate">
              Affects:{" "}
              {alert.affectedBlocks && alert.affectedBlocks.length > 0
                ? alert.affectedBlocks.join(", ")
                : "All Society Residents"}
            </span>
          </div>
        </div>

        {/* Action Guidelines */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resident Advisory & Immediate Action Steps
          </h4>
          <div className="mt-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
              {(alert.actionGuidelines || []).map((guideline, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hotline Contacts List */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Emergency Society Hotlines
          </h4>
          <div className="mt-2.5 space-y-2.5">
            {(alert.hotlineNumbers || []).map((hotline, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-rose-200 hover:shadow-xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {hotline.label}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {hotline.description}
                  </p>
                </div>
                <a
                  href={`tel:${hotline.number.replace(/\s+/g, "")}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 hover:shadow-md transition active:scale-95"
                >
                  <Phone className="size-3.5" />
                  <span>{hotline.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs cursor-pointer active:scale-95"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

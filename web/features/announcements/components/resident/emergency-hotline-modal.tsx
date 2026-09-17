"use client";

import React from "react";
import {
  X,
  Phone,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle2,
  ShieldAlert,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {alert.badgeText}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">
              {alert.title}
            </h3>
          </div>
        </div>

        {/* Timing and Affected Scope Banner */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-red-50/60 border border-red-100 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="size-4 text-red-500 shrink-0" />
            <span>{alert.scheduleText}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="size-4 text-red-500 shrink-0" />
            <span>
              Affects:{" "}
              {alert.affectedBlocks && alert.affectedBlocks.length > 0
                ? alert.affectedBlocks.join(", ")
                : "All Society Residents"}
            </span>
          </div>
        </div>

        {/* Action Guidelines */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Resident Advisory & Action Steps
          </h4>
          <ul className="mt-2 space-y-2 text-xs text-slate-700">
            {(alert.actionGuidelines || []).map((guideline, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hotline Contacts List */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Emergency Society Hotlines
          </h4>
          <div className="mt-2 space-y-2">
            {(alert.hotlineNumbers || []).map((hotline, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {hotline.label}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {hotline.description}
                  </p>
                </div>
                <a
                  href={`tel:${hotline.number.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition"
                >
                  <Phone className="size-3.5" />
                  <span>{hotline.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

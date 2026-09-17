"use client";

import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { CriticalAlertData } from "../../types";

interface CriticalAlertBannerProps {
  alert: CriticalAlertData | null;
  onOpenHotline: () => void;
}

export function CriticalAlertBanner({
  alert,
  onOpenHotline,
}: CriticalAlertBannerProps) {
  if (!alert) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-red-200/70 bg-[#FFF5F5] p-5 shadow-xs transition-all hover:border-red-300"
      style={{
        boxShadow: "0 1px 3px rgba(239, 68, 68, 0.08)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Warning Icon Badge */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E11D48] text-white shadow-xs">
            <AlertTriangle className="size-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Tag + Time Header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[#E11D48] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {alert.badgeText}
              </span>
              <span className="text-[13px] font-medium text-slate-700">
                {alert.scheduleText}
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-1 text-[17px] font-bold text-slate-900 sm:text-[18px]">
              {alert.title}
            </h2>

            {/* Description */}
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
              {alert.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenHotline}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-red-700 shadow-xs transition hover:bg-red-50/80 hover:border-red-300 focus:outline-hidden"
          >
            <span>Details & Hotline</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

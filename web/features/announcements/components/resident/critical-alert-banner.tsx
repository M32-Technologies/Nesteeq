"use client";

import React from "react";
import { AlertTriangle, ArrowRight, Clock, ShieldAlert, Radio } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50/90 via-red-50/40 to-white p-5 sm:p-6 shadow-[0_8px_28px_rgba(239,68,68,0.12)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(239,68,68,0.16)] hover:border-rose-300">
      {/* Subtle background ambient pulse glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-rose-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rose-500 via-red-500 to-amber-500" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Icon & Text Content */}
        <div className="flex items-start gap-4">
          {/* Pulsing Beacon Icon */}
          <div className="relative flex shrink-0 items-center justify-center">
            <span className="absolute inline-flex size-12 animate-ping rounded-2xl bg-rose-400 opacity-25" />
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 ring-4 ring-rose-100">
              <ShieldAlert className="size-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                <Radio className="size-3 animate-pulse" />
                <span>{alert.badgeText || "CRITICAL ALERT"}</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-white/90 px-2.5 py-0.5 text-[11.5px] font-medium text-rose-800 shadow-2xs backdrop-blur-xs">
                <Clock className="size-3 text-rose-500" />
                <span>{alert.scheduleText || "Active Advisory"}</span>
              </span>

              {alert.affectedBlocks && alert.affectedBlocks.length > 0 && (
                <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  Target: {alert.affectedBlocks.join(", ")}
                </span>
              )}
            </div>

            {/* Alert Headline */}
            <h2 className="text-base sm:text-[18px] font-bold tracking-tight text-slate-900 leading-snug">
              {alert.title}
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-[13.5px] leading-relaxed text-slate-600 max-w-4xl line-clamp-2 sm:line-clamp-none">
              {alert.description}
            </p>
          </div>
        </div>

        {/* Right: Hotline & Details Action */}
        <div className="flex sm:shrink-0 items-center justify-start lg:justify-end pl-16 lg:pl-0">
          <button
            type="button"
            onClick={onOpenHotline}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4.5 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-md shadow-rose-600/25 transition-all duration-200 hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/35 active:scale-[0.98] cursor-pointer"
          >
            <span>Details & Hotline</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ShieldCheck, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";

interface ResidentHeaderProps {
  userName: string;
  unitText?: string;
  hasCriticalAlert?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ResidentHeader({
  userName,
  unitText = "Assigned Flat",
  hasCriticalAlert = false,
  onRefresh,
  isRefreshing = false,
}: ResidentHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: "🌤️" };
    if (hour < 17) return { text: "Good afternoon", icon: "☀️" };
    return { text: "Good evening", icon: "🌙" };
  };

  const { text: greetingText, icon: greetingIcon } = getGreeting();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
      <div className="space-y-2">
        {/* Title Greeting */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
            {greetingText}, {userName}! {greetingIcon}
          </h1>
        </div>

        {/* Resident & Unit Context Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700 border border-blue-200/70 shadow-2xs">
            {unitText}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200/70 shadow-2xs">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Verified Resident</span>
          </span>
        </div>
      </div>

      {/* Right Controls: Community Status Beacon & Quick Refresh */}
      <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold border shadow-2xs ${
            hasCriticalAlert
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50/80 text-emerald-800 border-emerald-200/80"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              hasCriticalAlert
                ? "bg-rose-600 animate-ping"
                : "bg-emerald-500 animate-pulse"
            }`}
          />
          <span>
            {hasCriticalAlert ? "Emergency Advisory" : "Community: Normal"}
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

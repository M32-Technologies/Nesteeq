"use client";

import React from "react";
import { Bell, BellOff, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useWebPush } from "@/features/notifications/hooks/use-web-push";

export function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = useWebPush();

  const handleToggle = async () => {
    if (isLoading) return;
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xs mt-6">
      {/* Card Header */}
      <div className="flex items-center gap-3 pb-4 sm:pb-5 border-b border-[#F1F5F9] mb-5 sm:mb-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0A3D2D] ring-1 ring-[#D8EADB]">
          <Bell className="size-4.5 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Push Notifications
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
            Manage browser push alerts for visitor arrivals, deliveries, and emergency SOS on this device.
          </p>
        </div>
      </div>

      {/* Setting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              Desktop & Mobile Push Alerts
            </span>
            {isSubscribed ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                <CheckCircle2 className="size-3" />
                Active
              </span>
            ) : permission === "denied" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-600/20">
                <AlertTriangle className="size-3" />
                Blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <BellOff className="size-3" />
                Disabled
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            {!isSupported
              ? "Web Push notifications are not supported on this browser."
              : permission === "denied"
              ? "Notifications are blocked by your browser settings. To enable, click the lock icon next to your URL bar and allow notifications."
              : isSubscribed
              ? "This device is registered to receive instant alerts even when Nesteeq is closed."
              : "Enable to receive urgent alerts on this device when visitors or deliveries arrive at the gate."}
          </p>
        </div>

        {/* Toggle Switch */}
        {isSupported && permission !== "denied" && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={isSubscribed}
              onClick={handleToggle}
              disabled={isLoading}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0A3D2D] focus:ring-offset-2 disabled:opacity-50
                ${isSubscribed ? "bg-[#0A3D2D]" : "bg-slate-200"}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                  ${isSubscribed ? "translate-x-5" : "translate-x-0"}
                `}
              >
                {isLoading && (
                  <Loader2 className="size-3 text-slate-400 animate-spin m-1" />
                )}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

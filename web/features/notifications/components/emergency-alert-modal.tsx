"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  ShieldAlert,
  X,
} from "lucide-react";
import type { NotificationItem } from "../types";

export interface EmergencyAlertModalProps {
  emergency: NotificationItem | null;
  onClose: () => void;
  userRole?: string | null;
}

function playEmergencyChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(784, ctx.currentTime, 0.25); // G5
    playTone(987.77, ctx.currentTime + 0.2, 0.35); // B5
  } catch {
    // Autoplay restrictions or unsupported audio
  }
}

export function EmergencyAlertModal({
  emergency,
  onClose,
  userRole,
}: EmergencyAlertModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Play chime and lock background scroll when emergency is active
  useEffect(() => {
    if (!emergency) return;

    playEmergencyChime();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [emergency, onClose]);

  if (!mounted || !emergency) return null;

  const handleNavigateToAnnouncements = () => {
    onClose();
    const role = (userRole || "").toLowerCase();
    if (role.includes("resident")) {
      router.push("/resident/announcements");
    } else {
      router.push("/dashboard/announcements");
    }
  };

  const cleanTitle =
    emergency.title?.replace(/^[🚨\s*]+/, "").trim() ||
    "Emergency Notice Broadcast";

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Heavy dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Urgent Hazard Header Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs ring-1 ring-white/30 shadow-inner">
                <ShieldAlert className="size-6 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-white" />
                </span>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Critical Emergency Alert
                </span>
                <h3
                  id="emergency-modal-title"
                  className="mt-1 text-lg font-bold leading-snug tracking-tight text-white"
                >
                  {cleanTitle}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close emergency alert"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Message Content Area */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Main Emergency Message */}
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            {emergency.message}
          </div>

          {/* Safety Advisory Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50/70 p-3.5 text-xs text-amber-900">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-snug">
              Please follow the instructions calmly. If you or someone nearby
              requires immediate assistance, contact emergency services or gate
              security immediately.
            </p>
          </div>

          {/* Rapid Emergency Helpline */}
          <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2.5 text-xs text-rose-900">
            <span className="flex items-center gap-2 font-medium">
              <PhoneCall className="size-3.5 text-rose-600" />
              National Emergency Helpline
            </span>
            <a
              href="tel:112"
              className="font-bold text-rose-700 hover:underline"
            >
              Dial 112
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="border-t border-slate-100 bg-slate-50/90 px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleNavigateToAnnouncements}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span>View in Announcements</span>
            <ExternalLink className="size-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-4" />
            <span>I Acknowledge & Understand</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

"use client";

import React from "react";
import Link from "next/link";
import {
  Car,
  MapPin,
  BatteryCharging,
  Radio,
  AlertOctagon,
  Sparkles,
  Zap,
} from "lucide-react";

export function ResidentParkingCard() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shadow-2xs font-extrabold">
            P
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] sm:text-base font-bold text-slate-900">
                Assigned Bay: B1 — A24
              </h3>
              <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                Covered
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Basement 1, Section A • Direct lift access
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert("Basement 1 parking bay map opened.")}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <MapPin className="size-3.5 text-slate-400" />
          <span>Bay Map</span>
        </button>
      </div>

      {/* Vehicle 1: Honda City */}
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/40 via-white to-white p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Honda City (Sedan)
            </h4>
            <p className="text-xs font-mono font-semibold text-slate-500">
              KA-03-MG-2041
            </p>
          </div>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
          <span>Boom Barrier RFID: <strong className="font-mono text-slate-700">#88219</strong></span>
          <span className="font-bold text-emerald-700">Auto-Pass: 24/7</span>
        </div>
      </div>

      {/* Vehicle 2: Ather 450X (EV) */}
      <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50/40 via-white to-white p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Ather 450X (EV)
            </h4>
            <p className="text-xs font-mono font-semibold text-slate-500">
              KA-03-EV-8912
            </p>
          </div>
          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10.5px] font-bold text-sky-800 flex items-center gap-1">
            <Zap className="size-3" />
            <span>EV Ready</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
          <span>Smart Charger: <strong className="text-slate-700 font-mono">#EV-B1-24</strong></span>
          <span className="font-bold text-sky-700 flex items-center gap-1">
            <BatteryCharging className="size-3.5" />
            <span>78% Charged</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => alert("Guest parking pass generation dialog opened.")}
          className="rounded-xl border border-slate-200/90 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          Guest Parking Pass
        </button>

        <button
          type="button"
          onClick={() => alert("EV charging session initiated at Point #EV-B1-24.")}
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
        >
          Activate EV Point
        </button>
      </div>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => alert("Report submitted to security desk.")}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline transition cursor-pointer inline-flex items-center gap-1"
        >
          <AlertOctagon className="size-3.5" />
          <span>Report Illegal Bay Obstruction</span>
        </button>
      </div>
    </div>
  );
}

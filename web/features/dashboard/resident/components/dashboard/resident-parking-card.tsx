"use client";

import React from "react";
import Link from "next/link";
import {
  Car,
  AlertOctagon,
  ShieldCheck,
} from "lucide-react";
import { useResidentDashboard } from "../../hooks/use-resident-dashboard";

export function ResidentParkingCard() {
  const { apartmentName, flatUnitName } = useResidentDashboard();

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
                Parking & Bay Status
              </h3>
              <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {flatUnitName} • {apartmentName}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State / Real status */}
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
        <Car className="size-6 text-slate-400 mx-auto" />
        <p className="text-xs font-bold text-slate-700">No Vehicles Linked</p>
        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
          Contact security or management desk to link four-wheelers or two-wheelers for automated boom barrier RFID access.
        </p>
      </div>

      <div className="text-center pt-1">
        <Link
          href="/resident/parking"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition inline-flex items-center gap-1"
        >
          <span>Manage Vehicles & Bays →</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Car,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";

export function ResidentParkingPage() {
  const { apartmentName, flatUnitName } = useResidentDashboard();

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Parking, Vehicles & Services
          </h1>
          <p className="mt-1 text-sm text-[#637083]">
            Manage assigned parking bays, RFID boom-barrier passes, EV chargers, and amenities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Guest parking slot pass dialog opened.")}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#064C44] cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Car className="size-4" />
          <span>New Guest Parking</span>
        </button>
      </div>

      {/* Assigned Parking Bay Summary */}
      <div className="rounded-lg border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#07584F]/10 text-[#07584F] font-bold text-lg">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#111111]">
                  Parking & Bay Status: {flatUnitName}
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Active Unit
                </span>
              </div>
              <p className="text-xs text-[#637083]">
                {apartmentName} • Automated Gate Barrier Clearance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>RFID Boom Barrier Clearance Active</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5">
            <span className="text-xs font-medium text-[#637083]">Assigned Bay</span>
            <p className="text-lg font-semibold text-[#111111] mt-1">Designated for {flatUnitName}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>Covered Basement Parking</span>
            </p>
          </div>

          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5">
            <span className="text-xs font-medium text-[#637083]">EV Charging Station</span>
            <p className="text-lg font-semibold text-[#111111] mt-1">Available on Request</p>
            <p className="text-[11px] text-[#637083] font-medium mt-0.5 flex items-center gap-1">
              <Zap className="size-3 text-[#07584F]" />
              <span>Smart AC Fast Charger</span>
            </p>
          </div>

          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5">
            <span className="text-xs font-medium text-[#637083]">Guest Parking Quota</span>
            <p className="text-lg font-semibold text-[#111111] mt-1">2 Slots / Month</p>
            <p className="text-[11px] text-[#637083] font-medium mt-0.5">
              Subject to security gate clearance
            </p>
          </div>
        </div>
      </div>

      {/* Linked Vehicles Section */}
      <div className="rounded-lg border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111111]">
            Registered Vehicles
          </h2>
          <button
            type="button"
            onClick={() => alert("Vehicle registration modal opened.")}
            className="text-xs font-semibold text-[#07584F] hover:underline cursor-pointer"
          >
            + Register Vehicle
          </button>
        </div>

        <div className="rounded-lg border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-8 text-center space-y-2">
          <Car className="size-6 text-[#7C8782] mx-auto" />
          <p className="text-sm font-semibold text-[#111111]">
            No Vehicles Registered Yet
          </p>
          <p className="text-xs text-[#637083] max-w-sm mx-auto">
            Contact your society management desk or register your four-wheeler or two-wheeler here for automatic RFID boom-barrier opening at the main gate.
          </p>
        </div>
      </div>
    </div>
  );
}

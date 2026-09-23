"use client"

import { Building2, MapPin } from "lucide-react"

import type { JobDetails } from "../services/jobs.service"

type JobLocationCardProps = {
  locationInfo: JobDetails["locationInfo"]
}

export default function JobLocationCard({ locationInfo }: JobLocationCardProps) {
  const isHex = (val?: string | null) =>
    Boolean(val && /^[0-9a-fA-F]{24}$/.test(val.trim()))

  const flatClean = isHex(locationInfo.flat) ? "Unit" : locationInfo.flat || "Unit"
  const blockClean = isHex(locationInfo.block) ? "Apartment" : locationInfo.block || "Apartment"

  const unitDisplay = flatClean.toLowerCase().startsWith("flat")
    ? flatClean
    : flatClean.toLowerCase().includes("kitchen") ||
      flatClean.toLowerCase().includes("pipe") ||
      flatClean.toLowerCase().includes("corridor") ||
      flatClean.toLowerCase().includes("unit")
    ? flatClean
    : `Flat ${flatClean}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Building2 size={16} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Location Details
        </h3>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin size={16} className="text-[#0F5F45]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unit Location
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            Flat {locationInfo.flat}
            {unitDisplay}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {locationInfo.block} • {locationInfo.floor}
            {blockClean} • {locationInfo.floor}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-400">Block</p>
            <p className="mt-1 font-semibold text-slate-800">
              {locationInfo.block}
              {blockClean}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-400">Floor</p>
            <p className="mt-1 font-semibold text-slate-800">
              {locationInfo.floor}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
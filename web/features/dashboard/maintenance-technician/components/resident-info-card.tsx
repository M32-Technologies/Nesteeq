"use client"

import { Phone, User } from "lucide-react"

import type { JobDetails } from "../services/jobs.service"

type ResidentInfoCardProps = {
  residentInfo: JobDetails["residentInfo"]
}

export default function ResidentInfoCard({ residentInfo }: ResidentInfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
          <User size={16} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Resident Information
        </h3>
      </div>

      <div className="mt-4 space-y-3.5 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Resident Name
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {residentInfo.name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Occupancy Type
            </p>
            <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {residentInfo.residentType}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Contact Number
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 font-semibold text-slate-800">
              <Phone size={13} className="text-slate-400" />
              <a
                href={`tel:${residentInfo.contactNumber}`}
                className="hover:text-[#0F5F45] hover:underline"
              >
                {residentInfo.contactNumber}
              </a>
            </div>
          </div>
        </div>

        <p className="pt-2 text-[11px] text-slate-400">
          * Displayed under least-privilege technician access policies.
        </p>
      </div>
    </div>
  )
}
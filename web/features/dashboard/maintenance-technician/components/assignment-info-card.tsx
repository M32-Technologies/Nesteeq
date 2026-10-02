"use client"

import { Calendar, UserCheck } from "lucide-react"

import type { JobDetails } from "../services/jobs.service"

type AssignmentInfoCardProps = {
  assignmentInfo: JobDetails["assignmentInfo"]
  currentStatus: string
  formatDate: (dateString?: string) => string
}

const statusLabels: Record<string, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}

export default function AssignmentInfoCard({
  assignmentInfo,
  currentStatus,
  formatDate,
}: AssignmentInfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <UserCheck size={16} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Assignment Information
        </h3>
      </div>

      <div className="mt-4 space-y-3.5 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Assigned By
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {assignmentInfo.assignedBy}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Assigned Date
            </p>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-700">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(assignmentInfo.assignedDate)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Current Status
            </p>
            <div className="mt-1 font-semibold text-slate-800">
              {statusLabels[currentStatus] || currentStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
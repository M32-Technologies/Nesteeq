"use client"

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Phone,
  User,
  UserRoundCog,
  Wrench,
  X,
} from "lucide-react"

import type {
  MaintenanceWorkOrder,
  WorkPriority,
  WorkProgressStage,
} from "../types/maintenance"

interface WorkProgressDrawerProps {
  workOrder: MaintenanceWorkOrder | null
  open: boolean
  onClose: () => void
}

const stageBadgeStyles: Record<WorkProgressStage, string> = {
  ASSIGNED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  INSPECTION: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
}

const stageLabels: Record<WorkProgressStage, string> = {
  ASSIGNED: "Worker Assigned",
  IN_PROGRESS: "Work In Progress",
  ON_HOLD: "Awaiting Parts / Hold",
  INSPECTION: "Under Quality Inspection",
  COMPLETED: "Work Completed",
}

const priorityBadgeStyles: Record<WorkPriority, string> = {
  URGENT: "bg-red-50 text-red-700 ring-1 ring-red-200/60 font-semibold",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/60",
  NORMAL: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
}

export default function WorkProgressDrawer({
  workOrder,
  open,
  onClose,
}: WorkProgressDrawerProps) {
  if (!open || !workOrder) return null

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleString()
  }

  const steps = [
    { title: "Task Scheduled & Assigned", done: true },
    {
      title: "Technician Dispatched & On Site",
      done: workOrder.stage !== "ASSIGNED",
    },
    {
      title: "Work In Progress",
      done:
        workOrder.stage === "IN_PROGRESS" ||
        workOrder.stage === "INSPECTION" ||
        workOrder.stage === "COMPLETED",
    },
    {
      title: "Quality & Safety Inspection",
      done: workOrder.stage === "INSPECTION" || workOrder.stage === "COMPLETED",
    },
    {
      title: "Completed & Verified",
      done: workOrder.stage === "COMPLETED",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-[#0F5F45]">
                  {workOrder.jobId}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageBadgeStyles[workOrder.stage]}`}
                >
                  {stageLabels[workOrder.stage]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Work progress and technician execution tracking
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-6 overflow-y-auto p-6 text-sm">
            {/* Progress Bar Header */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Overall Completion
                </span>
                <span className="font-bold tabular-nums text-[#0F5F45]">
                  {workOrder.progressPercentage}%
                </span>
              </div>

              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0F5F45] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, workOrder.progressPercentage))}%` }}
                />
              </div>

              {/* Progress Milestones */}
              <div className="mt-4 space-y-3 pt-2">
                {steps.map((step, idx) => (
                  <div key={step.title} className="flex items-center gap-3">
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        step.done
                          ? "bg-[#0F5F45] text-white"
                          : "border border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {step.done ? <CheckCircle2 size={12} /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs ${
                        step.done
                          ? "font-medium text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Details */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Work Order Details
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs ${priorityBadgeStyles[workOrder.priority]}`}
                >
                  {workOrder.priority} Priority
                </span>
              </div>

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">
                  {workOrder.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {workOrder.description || "No specific instructions provided."}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                  <Wrench size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-700">Trade / Discipline:</span>
                  <span>{workOrder.category}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Job Location
              </h4>

              <div className="mt-2.5 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Site / Unit / Facility</p>
                  <p className="font-semibold text-slate-900">
                    {workOrder.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Worker */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assigned Worker / Technician
              </h4>

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-4">
                {workOrder.assignedWorkerName ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-[#E7F4EE] text-[#0F5F45]">
                      <UserRoundCog size={17} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {workOrder.assignedWorkerName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {workOrder.assignedWorkerTrade || "Maintenance Technician"}
                      </p>
                      {workOrder.assignedWorkerPhone && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          {workOrder.assignedWorkerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">
                    No worker currently assigned.
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Execution Timeline
              </h4>

              <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={13} className="text-slate-400" />
                    Started / Scheduled:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDate(workOrder.startedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={13} className="text-slate-400" />
                    Target Completion:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDate(workOrder.estimatedCompletion)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Actual Completed:
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDate(workOrder.completedAt)}
                  </span>
                </div>
              </div>
            </div>

            {workOrder.notes && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Supervisor & Worker Notes
                </h4>
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {workOrder.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

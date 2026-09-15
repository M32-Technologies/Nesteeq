"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react"

import {
  addProgress,
  completeWork,
  getJobById,
  startWork,
} from "../services/jobs.service"
import AssignmentInfoCard from "./assignment-info-card"
import ComplaintInfoCard from "./complaint-info-card"
import CompleteWorkDialog from "./complete-work-dialog"
import CompletionEvidenceUpload from "./completion-evidence-upload"
import JobLocationCard from "./job-location-card"
import MaintenanceCostForm from "./maintenance-cost-form"
import ResidentInfoCard from "./resident-info-card"
import StartWorkDialog from "./start-work-dialog"
import WorkProgressSection, { type TimelineItem } from "./work-progress-section"

export const jobDetailQueryKeys = {
  detail: (jobId: string) => ["maintenance-technician", "job", jobId] as const,
}

type MaintenanceJobDetailsProps = {
  jobId: string
}

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
}

const statusStyles: Record<string, { badge: string; label: string }> = {
  ASSIGNED: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Assigned",
  },
  IN_PROGRESS: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    label: "In Progress",
  },
  COMPLETED: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Completed",
  },
}

export default function MaintenanceJobDetails({ jobId }: MaintenanceJobDetailsProps) {
  const queryClient = useQueryClient()
  const [isStartWorkDialogOpen, setIsStartWorkDialogOpen] = useState(false)
  const [isStartingWork, setIsStartingWork] = useState(false)
  const [isCompleteWorkDialogOpen, setIsCompleteWorkDialogOpen] = useState(false)
  const [isCompletingWork, setIsCompletingWork] = useState(false)
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const [progressUpdates, setProgressUpdates] = useState<TimelineItem[]>([])

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: jobDetailQueryKeys.detail(jobId),
    queryFn: () => getJobById(jobId),
    staleTime: 60 * 1000,
  })

  // Initialize timeline and optimistic status once job data is loaded
  useEffect(() => {
    if (job) {
      if (!optimisticStatus) {
        setOptimisticStatus(job.assignmentInfo.currentStatus)
      }

      if (progressUpdates.length === 0) {
        if (job.assignmentInfo.currentStatus === "IN_PROGRESS") {
          setProgressUpdates([
            {
              id: "init-2",
              message: "Fault diagnosis completed. Replacement parts prepped for installation.",
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              author: "You (Technician)",
            },
            {
              id: "init-1",
              message: "Work started on site. Initial safety and operational checks done.",
              createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
              author: "You (Technician)",
            },
          ])
        }
      }
    }
  }, [job, optimisticStatus, progressUpdates.length])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString))
    } catch {
      return dateString
    }
  }

  const handleStartWork = async () => {
    try {
      setIsStartingWork(true)
      await startWork(jobId)

      setOptimisticStatus("IN_PROGRESS")
      setIsStartWorkDialogOpen(false)

      setProgressUpdates((prev) => [
        {
          id: `start-${Date.now()}`,
          message: "Work started on site by technician.",
          createdAt: new Date().toISOString(),
          author: "You (Technician)",
        },
        ...prev,
      ])

      queryClient.invalidateQueries({ queryKey: jobDetailQueryKeys.detail(jobId) })
      queryClient.invalidateQueries({ queryKey: ["maintenance-technician", "jobs"] })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start maintenance job")
    } finally {
      setIsStartingWork(false)
    }
  }

  const handleAddProgress = async (message: string) => {
    try {
      setIsSubmittingProgress(true)
      const res = await addProgress(jobId, message)

      setProgressUpdates((prev) => [
        {
          id: `update-${Date.now()}`,
          message: res.message || message,
          createdAt: res.createdAt || new Date().toISOString(),
          author: "You (Technician)",
        },
        ...prev,
      ])
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add progress update")
    } finally {
      setIsSubmittingProgress(false)
    }
  }

  const handleCompleteWork = async (payload: {
    workSummary: string
    notes?: string
  }) => {
    try {
      setIsCompletingWork(true)
      const res = await completeWork(jobId, payload)

      setOptimisticStatus("COMPLETED")
      setIsCompleteWorkDialogOpen(false)

      setProgressUpdates((prev) => [
        {
          id: `complete-${Date.now()}`,
          message: `Work completed: ${payload.workSummary}${
            payload.notes ? `\nNotes: ${payload.notes}` : ""
          }`,
          createdAt: res.completedAt || new Date().toISOString(),
          author: "You (Technician)",
        },
        ...prev,
      ])

      queryClient.invalidateQueries({ queryKey: jobDetailQueryKeys.detail(jobId) })
      queryClient.invalidateQueries({ queryKey: ["maintenance-technician", "jobs"] })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark work as completed")
    } finally {
      setIsCompletingWork(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-slate-100" />
            <div className="h-4 w-64 rounded bg-slate-100" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
            >
              <div className="h-5 w-40 rounded bg-slate-100" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <AlertCircle size={20} className="shrink-0" />
        <div>
          <p className="font-semibold">Unable to load job details</p>
          <p className="text-xs text-red-600">
            {error instanceof Error ? error.message : "Job record not found."}
          </p>
        </div>
      </div>
    )
  }

  const currentStatus = optimisticStatus || job.assignmentInfo.currentStatus
  const statusInfo = statusStyles[currentStatus] || {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    label: currentStatus,
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-[#0F5F45]">
              {job.jobId}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badge}`}
            >
              {currentStatus === "IN_PROGRESS" ? (
                <Activity size={12} className="animate-pulse" />
              ) : currentStatus === "COMPLETED" ? (
                <CheckCircle2 size={12} />
              ) : (
                <Clock size={12} />
              )}
              <span>{statusInfo.label}</span>
            </span>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                priorityStyles[job.complaintInfo.priority] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {job.complaintInfo.priority} Priority
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {job.complaintInfo.title}
          </h2>
        </div>

        {/* Action Button: Start Work, Complete Work, or Status indicator */}
        <div>
          {currentStatus === "ASSIGNED" ? (
            <button
              type="button"
              onClick={() => setIsStartWorkDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c4e38] focus:outline-none focus:ring-2 focus:ring-[#0F5F45]/20"
            >
              <Play size={16} fill="currentColor" />
              Start Work
            </button>
          ) : currentStatus === "IN_PROGRESS" ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                <Activity size={14} className="animate-pulse" />
                Work In Progress
              </span>
              <button
                type="button"
                onClick={() => setIsCompleteWorkDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c4e38] focus:outline-none focus:ring-2 focus:ring-[#0F5F45]/20"
              >
                <CheckCircle2 size={15} />
                Complete Work
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={16} />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Grid of Modular Information Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComplaintInfoCard
          jobId={job.jobId}
          complaintInfo={job.complaintInfo}
          formatDate={formatDate}
        />

        <JobLocationCard locationInfo={job.locationInfo} />

        <ResidentInfoCard residentInfo={job.residentInfo} />

        <AssignmentInfoCard
          assignmentInfo={job.assignmentInfo}
          currentStatus={currentStatus}
          formatDate={formatDate}
        />
      </div>

      {/* Active Work Operations: Evidence Upload & Cost Submission (only when IN_PROGRESS) */}
      {currentStatus === "IN_PROGRESS" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompletionEvidenceUpload
            jobId={job.jobId}
            onUploadSuccess={(ev) => {
              setProgressUpdates((prev) => [
                {
                  id: `ev-${Date.now()}`,
                  message: `Uploaded completion/work evidence: ${ev.fileName}`,
                  createdAt: new Date().toISOString(),
                  author: "You (Technician)",
                },
                ...prev,
              ])
            }}
          />

          <MaintenanceCostForm
            jobId={job.jobId}
            onCostSubmitted={(cost) => {
              setProgressUpdates((prev) => [
                {
                  id: `cost-${Date.now()}`,
                  message: `Submitted maintenance cost: ₹${cost.amount.toFixed(2)} - ${cost.description}`,
                  createdAt: new Date().toISOString(),
                  author: "You (Technician)",
                },
                ...prev,
              ])
            }}
          />
        </div>
      )}

      {/* Work Progress & Timeline Component */}
      <WorkProgressSection
        jobId={job.jobId}
        updates={progressUpdates}
        onAddUpdate={handleAddProgress}
        isSubmitting={isSubmittingProgress}
        formatDate={formatDate}
        isReadOnly={currentStatus !== "IN_PROGRESS"}
      />

      {/* Start Work Confirmation Modal */}
      <StartWorkDialog
        open={isStartWorkDialogOpen}
        jobId={job.jobId}
        isLoading={isStartingWork}
        onConfirm={handleStartWork}
        onClose={() => setIsStartWorkDialogOpen(false)}
      />

      {/* Complete Work Modal */}
      <CompleteWorkDialog
        open={isCompleteWorkDialogOpen}
        jobId={job.jobId}
        isLoading={isCompletingWork}
        onConfirm={handleCompleteWork}
        onClose={() => setIsCompleteWorkDialogOpen(false)}
      />
    </div>
  )
}
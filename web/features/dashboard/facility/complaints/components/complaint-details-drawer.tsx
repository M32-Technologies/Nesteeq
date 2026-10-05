"use client"

import type { FormEventHandler } from "react"
import {
  AlertTriangle,
  Eye,
  Gauge,
  Loader2,
  Pencil,
  UserCheck,
} from "lucide-react"

import {
  complaintCategories,
  complaintStatuses,
  priorities,
  type Complaint,
  type ComplaintStatus,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  ActivityTimeline,
  Drawer,
  ErrorState,
  FormLabel,
  FormSelect,
  formatDate,
  formatId,
  formatLabel,
  InfoGrid,
  PriorityBadge,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/features/dashboard/facility/shared/components/facility-ui"
import { TechnicianSelect } from "@/features/dashboard/facility/shared/components/technician-select"
import { ComplaintExpenseCard } from "@/features/dashboard/facility/complaints/components/complaint-expense-card"
import { ComplaintMaintenanceSection } from "@/features/dashboard/facility/complaints/components/complaint-maintenance-section"

function getMediaUrl(url: string) {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}` : `/${url.replace(/^\//, "")}`
}

export type ComplaintDrawerMode = "details" | "assign" | "edit" | "status"

export function ComplaintDetailsDrawer({
  open,
  mode = "details",
  onModeChange,
  complaint,
  isLoading,
  isError,
  error,
  isRetrying,
  onRetry,
  onClose,
  relatedMaintenance = [],
  isRelatedMaintenanceLoading = false,
  canCreateMaintenance = false,
  statusOptions = [],
  canApprove = false,
  canCancel = false,
  onAssign,
  onStatusUpdate,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onCreateMaintenance,
  isAssigning = false,
  isUpdatingStatus = false,
  isUpdating = false,
  isApproving = false,
  isRejecting = false,
  isCancelling = false,
  isCreatingMaintenance = false,
  onApproveExpense,
  onRejectExpense,
  isApprovingExpense = false,
  isRejectingExpense = false,
}: {
  open: boolean
  mode?: ComplaintDrawerMode
  onModeChange?: (mode: ComplaintDrawerMode) => void
  complaint: Complaint | null
  isLoading: boolean
  isError: boolean
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  onClose: () => void
  relatedMaintenance?: Maintenance[]
  isRelatedMaintenanceLoading?: boolean
  canCreateMaintenance: boolean
  statusOptions: ComplaintStatus[]
  canApprove: boolean
  canCancel: boolean
  onAssign: FormEventHandler<HTMLFormElement>
  onStatusUpdate: FormEventHandler<HTMLFormElement>
  onEdit: FormEventHandler<HTMLFormElement>
  onApprove: FormEventHandler<HTMLFormElement>
  onReject: FormEventHandler<HTMLFormElement>
  onCancel: FormEventHandler<HTMLFormElement>
  onCreateMaintenance: FormEventHandler<HTMLFormElement>
  onApproveExpense?: () => void
  onRejectExpense?: (reason?: string) => void
  isApprovingExpense?: boolean
  isRejectingExpense?: boolean
  isAssigning: boolean
  isUpdatingStatus: boolean
  isUpdating: boolean
  isApproving: boolean
  isRejecting: boolean
  isCancelling: boolean
  isCreatingMaintenance: boolean
}) {
  const drawerTitle =
    mode === "assign"
      ? "Assign Technician"
      : mode === "edit" || mode === "status"
      ? "Edit Complaint & Status"
      : complaint?.title || "Complaint Details"

  const currentAssignedId = complaint
    ? typeof (complaint as any).assignedStaff === "object"
      ? (complaint as any).assignedStaff?._id || (complaint as any).assignedStaff?.id
      : (complaint as any).assignedStaff ||
        (typeof complaint.assignedTo === "object"
          ? complaint.assignedTo?._id || (complaint.assignedTo as any)?.id
          : complaint.assignedTo || "")
    : ""

  return (
    <Drawer
      open={open}
      title={drawerTitle}
      subtitle={complaint ? formatId(complaint._id) : undefined}
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-[#07584F]" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load details"
          message={getApiErrorMessage(
            error,
            "The complaint details could not be loaded."
          )}
          isRetrying={isRetrying}
          onRetry={onRetry}
        />
      ) : complaint ? (
        <div>
          {/* Mode 1: View Details (Read-only Overview) */}
          {mode === "details" && (
            <div className="space-y-6">
              <section className="border-b border-[#E8EDF2] pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-slate-600">
                    {formatLabel(complaint.category)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#111111]">
                  {complaint.title}
                </h2>
                {complaint.description && (
                  <p className="mt-2 text-[14px] leading-6 text-[#4E5B67] whitespace-pre-line">
                    {complaint.description
                      .replace(/\[Attached Photo Reference:[^\]]+\]/gi, "")
                      .replace(/\[Image:\s*[^\]]+\]/gi, "")
                      .trim()}
                  </p>
                )}
              </section>

              <section className="border-b border-[#E8EDF2] pb-5">
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Complaint Information
                </h3>
                <div className="mt-4">
                  <InfoGrid
                    items={[
                      {
                        label: "Complaint ID",
                        value: complaint._id,
                      },
                      {
                        label: "Resident",
                        value:
                          typeof complaint.residentId === "object"
                            ? complaint.residentId?.name || complaint.residentId?._id
                            : complaint.residentId || "Resident",
                      },
                      {
                        label: "Flat / Apartment",
                        value:
                          complaint.flatId ||
                          complaint.apartmentId ||
                          "Common Area",
                      },
                      {
                        label: "Category",
                        value: formatLabel(complaint.category),
                      },
                      {
                        label: "Assigned technician",
                        value: (() => {
                          const staff =
                            typeof complaint.assignedStaff === "object"
                              ? complaint.assignedStaff
                              : null
                          const to =
                            typeof complaint.assignedTo === "object"
                              ? complaint.assignedTo
                              : null
                          const techName =
                            staff?.name ||
                            staff?.fullName ||
                            complaint.assignedTechnicianName ||
                            to?.name ||
                            to?.fullName
                          return techName || "Not assigned"
                        })(),
                      },
                      {
                        label: "Created Date",
                        value: formatDate(complaint.createdAt),
                      },
                      {
                        label: "Last Updated",
                        value: formatDate(complaint.updatedAt),
                      },
                    ]}
                  />
                </div>
              </section>

              {/* Attached Photos / Evidence */}
              {(() => {
                const complaintImages = Array.from(
                  new Set([
                    ...(Array.isArray(complaint.images) ? complaint.images : []),
                    ...(Array.isArray(complaint.attachments) ? complaint.attachments : []),
                  ].filter(Boolean))
                )

                if (complaintImages.length === 0) return null

                return (
                  <section className="border-b border-[#E8EDF2] py-5">
                    <h3 className="text-[15px] font-semibold text-[#111111] mb-3">
                      Attached Photos ({complaintImages.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {complaintImages.map((img, idx) => {
                        const resolved = getMediaUrl(img)
                        return (
                          <a
                            key={idx}
                            href={resolved}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:ring-2 hover:ring-primary/50"
                          >
                            <img
                              src={resolved}
                              alt={`Complaint photo ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.opacity = "0.4"
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-[11px] font-medium text-white bg-black/70 px-2 py-1 rounded shadow-sm transition-opacity">
                                View full
                              </span>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </section>
                )
              })()}

              {/* Linked Maintenance Section */}
              <ComplaintMaintenanceSection
                complaint={complaint}
                relatedMaintenance={relatedMaintenance}
                isLoading={isRelatedMaintenanceLoading}
                canCreateMaintenance={canCreateMaintenance}
                onCreateMaintenance={onCreateMaintenance}
                isCreatingMaintenance={isCreatingMaintenance}
              />

              {/* Submitted Expense (if any) */}
              {complaint.expenseAmount != null && (
                <ComplaintExpenseCard
                  complaint={complaint}
                  onApproveExpense={onApproveExpense}
                  onRejectExpense={onRejectExpense}
                  isApproving={isApprovingExpense}
                  isRejecting={isRejectingExpense}
                />
              )}

              {/* Activity Log */}
              <section className="pb-5">
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Activity Log
                </h3>
                <div className="mt-4">
                  <ActivityTimeline notes={complaint.activityNotes} />
                </div>
              </section>
            </div>
          )}

          {/* Mode 2: Assign Technician */}
          {mode === "assign" && (
            <form onSubmit={onAssign} className="space-y-5">
              <div className="rounded-xl border border-[#EEF2F5] bg-[#FBFCFD] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatId(complaint._id)}
                  </span>
                  <div className="flex gap-1.5">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[#111111]">
                  {complaint.title}
                </h3>
              </div>

              {/* Assign Technician: with TechnicianSelect dropdown */}
              <div className="space-y-3 rounded-xl border border-[#E2E8EE] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <UserCheck className="size-4 text-[#5542F6]" />
                  <span>Assign Technician</span>
                </div>
                <FormLabel label="Select Technician">
                  <TechnicianSelect
                    name="assignedStaff"
                    defaultValue={currentAssignedId}
                    placeholder="Choose a technician..."
                  />
                </FormLabel>
                <FormLabel label="Remarks / Instructions">
                  <TextArea
                    name="remarks"
                    placeholder="Add instructions or assignment notes for the technician..."
                  />
                </FormLabel>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <SubmitButton isLoading={isAssigning}>
                  Assign Technician
                </SubmitButton>
              </div>
            </form>
          )}

          {/* Mode 3: Edit / Update Status & Cancel */}
          {(mode === "edit" || mode === "status") && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#EEF2F5] bg-[#FBFCFD] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatId(complaint._id)}
                  </span>
                  <div className="flex gap-1.5">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[#111111]">
                  {complaint.title}
                </h3>
              </div>

              {/* Update Status Form */}
              <form
                onSubmit={onStatusUpdate}
                className="space-y-3 rounded-xl border border-[#E2E8EE] bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <Gauge className="size-4 text-[#07584F]" />
                  <span>Update Status</span>
                </div>
                <FormLabel label="Status">
                  <FormSelect
                    name="status"
                    options={
                      statusOptions.length > 0
                        ? statusOptions
                        : complaintStatuses.filter((s) => s !== "CANCELLED")
                    }
                    defaultValue={complaint.status}
                    required
                  />
                </FormLabel>
                <FormLabel label="Remarks / Notes">
                  <TextArea
                    name="remarks"
                    placeholder="Add status change remarks..."
                  />
                </FormLabel>
                <div className="pt-1">
                  <SubmitButton isLoading={isUpdatingStatus}>
                    Update Status
                  </SubmitButton>
                </div>
              </form>

              {/* Edit Complaint Details Form */}
              <form
                onSubmit={onEdit}
                className="space-y-4 rounded-xl border border-[#E2E8EE] bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <Pencil className="size-4 text-[#946415]" />
                  <span>Edit Complaint</span>
                </div>

                <FormLabel label="Title">
                  <TextInput
                    name="title"
                    required
                    minLength={3}
                    defaultValue={complaint.title}
                  />
                </FormLabel>

                <FormLabel label="Description">
                  <TextArea
                    name="description"
                    required
                    minLength={10}
                    defaultValue={complaint.description}
                  />
                </FormLabel>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormLabel label="Category">
                    <FormSelect
                      name="category"
                      options={complaintCategories}
                      defaultValue={complaint.category}
                      required
                    />
                  </FormLabel>
                  <FormLabel label="Priority">
                    <FormSelect
                      name="priority"
                      options={priorities}
                      defaultValue={complaint.priority}
                      required
                    />
                  </FormLabel>
                </div>

                <div className="pt-2">
                  <SubmitButton isLoading={isUpdating}>
                    Save Changes
                  </SubmitButton>
                </div>
              </form>

              {/* Cancel Complaint: Dedicated Red Section */}
              <form
                onSubmit={onCancel}
                className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="size-4 text-red-600" />
                  <span>Cancel Complaint</span>
                </div>
                <p className="text-xs text-red-600">
                  Cancelling this complaint will set its status to CANCELLED.
                </p>
                <FormLabel label="Cancellation Reason (Required)">
                  <TextArea
                    name="reason"
                    required
                    placeholder="State reason for cancelling this complaint..."
                  />
                </FormLabel>
                <div>
                  <SubmitButton tone="danger" isLoading={isCancelling}>
                    Cancel Complaint
                  </SubmitButton>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </Drawer>
  )
}

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
  maintenanceStatuses,
  priorities,
  type Maintenance,
  type MaintenanceStatus,
} from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { complaintCategories } from "@/features/dashboard/facility/shared/types/common.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  ActivityTimeline,
  Drawer,
  ErrorState,
  FormLabel,
  FormSelect,
  formatCurrency,
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

export type MaintenanceDrawerMode = "details" | "assign" | "edit"

export function MaintenanceDetailsDrawer({
  open,
  mode = "details",
  maintenance,
  isLoading,
  isError,
  error,
  isRetrying,
  onRetry,
  onClose,
  statusOptions = [],
  canApprove = false,
  canReviewCost = false,
  canClose = false,
  canCancel = false,
  onAssignAndStatus,
  onAssign,
  onStatusUpdate,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onCloseMaintenance,
  onApproveCost,
  onRejectCost,
  isSavingAssignAndStatus = false,
  isAssigning = false,
  isUpdatingStatus = false,
  isUpdating = false,
  isApproving = false,
  isRejecting = false,
  isCancelling = false,
  isClosing = false,
  isApprovingCost = false,
  isRejectingCost = false,
}: {
  open: boolean
  mode?: MaintenanceDrawerMode
  maintenance: Maintenance | null
  isLoading: boolean
  isError: boolean
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  onClose: () => void
  statusOptions?: MaintenanceStatus[]
  canApprove?: boolean
  canReviewCost?: boolean
  canClose?: boolean
  canCancel?: boolean
  onAssignAndStatus?: FormEventHandler<HTMLFormElement>
  onAssign?: FormEventHandler<HTMLFormElement>
  onStatusUpdate?: FormEventHandler<HTMLFormElement>
  onEdit?: FormEventHandler<HTMLFormElement>
  onApprove?: FormEventHandler<HTMLFormElement>
  onReject?: FormEventHandler<HTMLFormElement>
  onCancel?: FormEventHandler<HTMLFormElement>
  onCloseMaintenance?: FormEventHandler<HTMLFormElement>
  onApproveCost?: FormEventHandler<HTMLFormElement>
  onRejectCost?: FormEventHandler<HTMLFormElement>
  isSavingAssignAndStatus?: boolean
  isAssigning?: boolean
  isUpdatingStatus?: boolean
  isUpdating?: boolean
  isApproving?: boolean
  isRejecting?: boolean
  isCancelling?: boolean
  isClosing?: boolean
  isApprovingCost?: boolean
  isRejectingCost?: boolean
}) {
  const drawerTitle =
    mode === "assign"
      ? "Assign Technician"
      : mode === "edit"
      ? "Edit Maintenance"
      : maintenance?.title || "Maintenance Details"

  return (
    <Drawer
      open={open}
      title={drawerTitle}
      subtitle={maintenance ? formatId(maintenance._id) : undefined}
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
            "The maintenance details could not be loaded."
          )}
          isRetrying={isRetrying}
          onRetry={onRetry}
        />
      ) : maintenance ? (
        <div>
          {/* Mode 1: View Details (Read-only Overview) */}
          {mode === "details" && (
            <div className="space-y-6">
              <section className="border-b border-[#E8EDF2] pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={maintenance.status} />
                  <PriorityBadge priority={maintenance.priority} />
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-slate-600">
                    {formatLabel(maintenance.category)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#111111]">
                  {maintenance.title}
                </h2>
                {maintenance.description && (
                  <p className="mt-2 text-[14px] leading-6 text-[#4E5B67]">
                    {maintenance.description}
                  </p>
                )}
              </section>

              <section className="border-b border-[#E8EDF2] pb-5">
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Maintenance Information
                </h3>
                <div className="mt-4">
                  <InfoGrid
                    items={[
                      {
                        label: "Maintenance ID",
                        value: maintenance._id,
                      },
                      {
                        label: "Category",
                        value: formatLabel(maintenance.category),
                      },
                      {
                        label: "Technician",
                        value:
                          typeof maintenance.assignedTo === "object"
                            ? maintenance.assignedTo?.name || maintenance.assignedTo?._id
                            : maintenance.assignedTo || "Unassigned",
                      },
                      {
                        label: "Estimated cost",
                        value: formatCurrency(maintenance.estimatedCost),
                      },
                      {
                        label: "Actual cost",
                        value: formatCurrency(maintenance.finalCost),
                      },
                      {
                        label: "Linked Complaint",
                        value: maintenance.complaintId || "None",
                      },
                      {
                        label: "Created Date",
                        value: formatDate(maintenance.createdAt),
                      },
                      {
                        label: "Last Updated",
                        value: formatDate(maintenance.updatedAt),
                      },
                    ]}
                  />
                </div>
              </section>

              <section className="pb-5">
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Activity Log
                </h3>
                <div className="mt-4">
                  <ActivityTimeline notes={maintenance.activityNotes} />
                </div>
              </section>
            </div>
          )}

          {/* Mode 2: Assign Technician & Update Status */}
          {mode === "assign" && (
            <form onSubmit={onAssignAndStatus || onAssign} className="space-y-5">
              <div className="rounded-xl border border-[#EEF2F5] bg-[#FBFCFD] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatId(maintenance._id)}
                  </span>
                  <div className="flex gap-1.5">
                    <StatusBadge status={maintenance.status} />
                    <PriorityBadge priority={maintenance.priority} />
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[#111111]">
                  {maintenance.title}
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
                    defaultValue={
                      typeof maintenance.assignedTo === "object"
                        ? maintenance.assignedTo?._id
                        : maintenance.assignedTo || ""
                    }
                    placeholder="Choose a technician..."
                  />
                </FormLabel>
              </div>

              {/* Update Status: Status selector & Remarks */}
              <div className="space-y-3 rounded-xl border border-[#E2E8EE] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <Gauge className="size-4 text-[#07584F]" />
                  <span>Update Status</span>
                </div>
                <FormLabel label="Status">
                  <FormSelect
                    name="status"
                    options={maintenanceStatuses.filter((s) => s !== "CANCELLED")}
                    defaultValue={maintenance.status}
                    required
                  />
                </FormLabel>
                <FormLabel label="Remarks / Notes">
                  <TextArea
                    name="remarks"
                    placeholder="Add assignment or status change remarks..."
                  />
                </FormLabel>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <SubmitButton isLoading={isSavingAssignAndStatus || isAssigning || isUpdatingStatus}>
                  Save Assignment & Status
                </SubmitButton>
              </div>
            </form>
          )}

          {/* Mode 3: Edit Maintenance & Cancel */}
          {mode === "edit" && (
            <div className="space-y-6">
              {/* Edit Maintenance Form */}
              <form
                onSubmit={onEdit}
                className="space-y-4 rounded-xl border border-[#E2E8EE] bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                  <Pencil className="size-4 text-[#946415]" />
                  <span>Edit Maintenance</span>
                </div>

                <FormLabel label="Title">
                  <TextInput
                    name="title"
                    required
                    minLength={3}
                    defaultValue={maintenance.title}
                  />
                </FormLabel>

                <FormLabel label="Description">
                  <TextArea
                    name="description"
                    required
                    minLength={10}
                    defaultValue={maintenance.description}
                  />
                </FormLabel>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FormLabel label="Category">
                    <FormSelect
                      name="category"
                      options={complaintCategories}
                      defaultValue={maintenance.category}
                      required
                    />
                  </FormLabel>
                  <FormLabel label="Priority">
                    <FormSelect
                      name="priority"
                      options={priorities}
                      defaultValue={maintenance.priority}
                      required
                    />
                  </FormLabel>
                  <FormLabel label="Estimated Cost">
                    <TextInput
                      name="estimatedCost"
                      type="number"
                      defaultValue={maintenance.estimatedCost}
                    />
                  </FormLabel>
                </div>

                <div className="pt-2">
                  <SubmitButton isLoading={isUpdating}>
                    Save Changes
                  </SubmitButton>
                </div>
              </form>

              {/* Cancel Maintenance: Dedicated Red Section */}
              <form
                onSubmit={onCancel}
                className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="size-4 text-red-600" />
                  <span>Cancel Maintenance</span>
                </div>
                <p className="text-xs text-red-600">
                  Cancelling this maintenance job will set its status to CANCELLED.
                </p>
                <FormLabel label="Cancellation Reason">
                  <TextArea
                    name="reason"
                    required
                    placeholder="Cancellation reason..."
                  />
                </FormLabel>
                <div>
                  <SubmitButton tone="danger" isLoading={isCancelling}>
                    Cancel Maintenance
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

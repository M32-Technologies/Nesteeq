import type { FormEventHandler } from "react"
import { Loader2 } from "lucide-react"

import type {
  Complaint,
  Maintenance,
  MaintenanceStatus,
} from "../../facility.types"
import { getApiErrorMessage } from "../../facility.api"
import {
  ActivityTimeline,
  Drawer,
  ErrorState,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  InfoGrid,
  PriorityBadge,
  StatusBadge,
} from "../facility-ui"
import { MaintenanceActions } from "./maintenance-actions"

type ProgressStatus = "IN_PROGRESS" | "ON_HOLD"

export function MaintenanceDetailsDrawer({
  open,
  maintenance,
  isLoading,
  isError,
  error,
  isRetrying,
  onRetry,
  onDrawerClose,
  relatedComplaint,
  isRelatedComplaintLoading,
  statusOptions,
  progressOptions,
  canApprove,
  canReviewCost,
  canClose,
  canCancel,
  onAssign,
  onStatusUpdate,
  onProgressUpdate,
  onEdit,
  onApprove,
  onReject,
  onApproveCost,
  onRejectCost,
  onClose,
  onCancel,
  isAssigning,
  isUpdatingStatus,
  isUpdatingProgress,
  isUpdating,
  isApproving,
  isRejecting,
  isApprovingCost,
  isRejectingCost,
  isClosing,
  isCancelling,
}: {
  open: boolean
  maintenance: Maintenance | null
  isLoading: boolean
  isError: boolean
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  onDrawerClose: () => void
  relatedComplaint?: Complaint
  isRelatedComplaintLoading: boolean
  statusOptions: MaintenanceStatus[]
  progressOptions: readonly ProgressStatus[]
  canApprove: boolean
  canReviewCost: boolean
  canClose: boolean
  canCancel: boolean
  onAssign: FormEventHandler<HTMLFormElement>
  onStatusUpdate: FormEventHandler<HTMLFormElement>
  onProgressUpdate: FormEventHandler<HTMLFormElement>
  onEdit: FormEventHandler<HTMLFormElement>
  onApprove: FormEventHandler<HTMLFormElement>
  onReject: FormEventHandler<HTMLFormElement>
  onApproveCost: FormEventHandler<HTMLFormElement>
  onRejectCost: FormEventHandler<HTMLFormElement>
  onClose: FormEventHandler<HTMLFormElement>
  onCancel: FormEventHandler<HTMLFormElement>
  isAssigning: boolean
  isUpdatingStatus: boolean
  isUpdatingProgress: boolean
  isUpdating: boolean
  isApproving: boolean
  isRejecting: boolean
  isApprovingCost: boolean
  isRejectingCost: boolean
  isClosing: boolean
  isCancelling: boolean
}) {
  return (
    <Drawer
      open={open}
      title={maintenance?.title || "Maintenance"}
      subtitle={maintenance ? formatId(maintenance._id) : undefined}
      onClose={onDrawerClose}
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
          <section className="border-b border-[#E8EDF2] pb-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={maintenance.status} />
              <PriorityBadge priority={maintenance.priority} />
            </div>
            <p className="mt-4 text-[14px] leading-6 text-[#4E5B67]">
              {maintenance.description}
            </p>
          </section>

          <section className="border-b border-[#E8EDF2] py-5">
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
                    label: "Complaint",
                    value: formatId(maintenance.complaint),
                  },
                  {
                    label: "Resident",
                    value: formatId(maintenance.resident),
                  },
                  {
                    label: "Apartment",
                    value: formatId(maintenance.apartment),
                  },
                  {
                    label: "Unit",
                    value: formatId(maintenance.flat),
                  },
                  {
                    label: "Category",
                    value: formatLabel(maintenance.category),
                  },
                  {
                    label: "Technician",
                    value: formatId(maintenance.assignedStaff),
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
                    label: "Cost review",
                    value: formatLabel(maintenance.costReview?.status),
                  },
                  {
                    label: "Submitted amount",
                    value: formatCurrency(
                      maintenance.costReview?.submittedAmount
                    ),
                  },
                  {
                    label: "Forwarded to",
                    value:
                      maintenance.costReview?.forwardedToRole ||
                      "Not set",
                  },
                  {
                    label: "Created",
                    value: formatDate(maintenance.createdAt),
                  },
                  {
                    label: "Started",
                    value: formatDate(maintenance.startedAt),
                  },
                  {
                    label: "Completed",
                    value: formatDate(maintenance.completedAt),
                  },
                ]}
              />
            </div>
          </section>

          <section className="border-b border-[#E8EDF2] py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Related Complaint
            </h3>
            <div className="mt-4">
              {isRelatedComplaintLoading ? (
                <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                  Loading complaint...
                </div>
              ) : relatedComplaint ? (
                <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#111111]">
                        {relatedComplaint.title}
                      </p>
                      <p className="mt-1 text-[12px] text-[#66737F]">
                        {formatId(relatedComplaint._id)} -{" "}
                        {formatDate(relatedComplaint.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={relatedComplaint.status} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                  Related complaint is unavailable.
                </div>
              )}
            </div>
          </section>

          <section className="border-b border-[#E8EDF2] py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Completion And Approval
            </h3>
            <div className="mt-4">
              <InfoGrid
                items={[
                  {
                    label: "Completion details",
                    value: maintenance.completionDetails?.details || "Not set",
                  },
                  {
                    label: "Work notes",
                    value: maintenance.completionDetails?.workNotes || "Not set",
                  },
                  {
                    label: "Completed by",
                    value: formatId(
                      maintenance.completionDetails?.completedBy
                    ),
                  },
                  {
                    label: "Approval status",
                    value: formatLabel(maintenance.approvalDetails?.status),
                  },
                  {
                    label: "Reviewed by",
                    value: formatId(maintenance.approvalDetails?.reviewedBy),
                  },
                  {
                    label: "Reviewed at",
                    value: formatDate(maintenance.approvalDetails?.reviewedAt),
                  },
                  {
                    label: "Approval remarks",
                    value: maintenance.approvalDetails?.remarks || "Not set",
                  },
                  {
                    label: "Rejection reason",
                    value:
                      maintenance.approvalDetails?.rejectionReason ||
                      "Not set",
                  },
                ]}
              />
            </div>
          </section>

          <section className="border-b border-[#E8EDF2] py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Cost Review
            </h3>
            <div className="mt-4">
              <InfoGrid
                items={[
                  {
                    label: "Review status",
                    value: formatLabel(maintenance.costReview?.status),
                  },
                  {
                    label: "Submitted amount",
                    value: formatCurrency(
                      maintenance.costReview?.submittedAmount
                    ),
                  },
                  {
                    label: "Submitted by",
                    value: formatId(maintenance.costReview?.submittedBy),
                  },
                  {
                    label: "Submitted at",
                    value: formatDate(maintenance.costReview?.submittedAt),
                  },
                  {
                    label: "Reviewed by",
                    value: formatId(maintenance.costReview?.reviewedBy),
                  },
                  {
                    label: "Reviewed at",
                    value: formatDate(maintenance.costReview?.reviewedAt),
                  },
                  {
                    label: "Forwarded to",
                    value:
                      maintenance.costReview?.forwardedToRole ||
                      "Not set",
                  },
                  {
                    label: "Forwarded at",
                    value: formatDate(maintenance.costReview?.forwardedAt),
                  },
                  {
                    label: "Cost remarks",
                    value: maintenance.costReview?.remarks || "Not set",
                  },
                  {
                    label: "Cost rejection reason",
                    value:
                      maintenance.costReview?.rejectionReason ||
                      "Not set",
                  },
                ]}
              />
            </div>
          </section>

          <MaintenanceActions
            maintenance={maintenance}
            statusOptions={statusOptions}
            progressOptions={progressOptions}
            canApprove={canApprove}
            canReviewCost={canReviewCost}
            canClose={canClose}
            canCancel={canCancel}
            onAssign={onAssign}
            onStatusUpdate={onStatusUpdate}
            onProgressUpdate={onProgressUpdate}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
            onApproveCost={onApproveCost}
            onRejectCost={onRejectCost}
            onClose={onClose}
            onCancel={onCancel}
            isAssigning={isAssigning}
            isUpdatingStatus={isUpdatingStatus}
            isUpdatingProgress={isUpdatingProgress}
            isUpdating={isUpdating}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isApprovingCost={isApprovingCost}
            isRejectingCost={isRejectingCost}
            isClosing={isClosing}
            isCancelling={isCancelling}
          />

          <section className="py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Notes And Progress
            </h3>
            <div className="mt-4">
              <ActivityTimeline
                notes={[
                  ...(maintenance.managerRemarks ?? []),
                  ...(maintenance.workNotes ?? []),
                ]}
                progress={maintenance.progressUpdates}
              />
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  )
}

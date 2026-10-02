import type { FormEventHandler } from "react"
import { Loader2 } from "lucide-react"

import type {
  Maintenance,
  MaintenanceStatus,
} from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
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
} from "@/features/dashboard/facility/shared/components/facility-ui"
import { MaintenanceActions } from "@/features/dashboard/facility/maintenance/components/maintenance-actions"

export function MaintenanceDetailsDrawer({
  open,
  maintenance,
  isLoading,
  isError,
  error,
  isRetrying,
  onRetry,
  onClose,
  statusOptions,
  canApprove,
  canReviewCost,
  canClose,
  canCancel,
  onAssign,
  onStatusUpdate,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onCloseMaintenance,
  onApproveCost,
  onRejectCost,
  isAssigning,
  isUpdatingStatus,
  isUpdating,
  isApproving,
  isRejecting,
  isCancelling,
  isClosing,
  isApprovingCost,
  isRejectingCost,
}: {
  open: boolean
  maintenance: Maintenance | null
  isLoading: boolean
  isError: boolean
  error: unknown
  isRetrying: boolean
  onRetry: () => void
  onClose: () => void
  statusOptions: MaintenanceStatus[]
  canApprove: boolean
  canReviewCost: boolean
  canClose: boolean
  canCancel: boolean
  onAssign: FormEventHandler<HTMLFormElement>
  onStatusUpdate: FormEventHandler<HTMLFormElement>
  onEdit: FormEventHandler<HTMLFormElement>
  onApprove: FormEventHandler<HTMLFormElement>
  onReject: FormEventHandler<HTMLFormElement>
  onCancel: FormEventHandler<HTMLFormElement>
  onCloseMaintenance: FormEventHandler<HTMLFormElement>
  onApproveCost: FormEventHandler<HTMLFormElement>
  onRejectCost: FormEventHandler<HTMLFormElement>
  isAssigning: boolean
  isUpdatingStatus: boolean
  isUpdating: boolean
  isApproving: boolean
  isRejecting: boolean
  isCancelling: boolean
  isClosing: boolean
  isApprovingCost: boolean
  isRejectingCost: boolean
}) {
  return (
    <Drawer
      open={open}
      title={maintenance?.title || "Maintenance"}
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
                    label: "Category",
                    value: formatLabel(maintenance.category),
                  },
                  {
                    label: "Technician",
                    value: formatId(typeof maintenance.assignedTo === 'object' ? maintenance.assignedTo?._id : maintenance.assignedTo),
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
                    label: "Created",
                    value: formatDate(maintenance.createdAt),
                  },
                  {
                    label: "Updated",
                    value: formatDate(maintenance.updatedAt),
                  },
                ]}
              />
            </div>
          </section>

          <MaintenanceActions
            maintenance={maintenance}
            statusOptions={statusOptions}
            canApprove={canApprove}
            canReviewCost={canReviewCost}
            canClose={canClose}
            canCancel={canCancel}
            onAssign={onAssign}
            onStatusUpdate={onStatusUpdate}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
            onCloseMaintenance={onCloseMaintenance}
            onApproveCost={onApproveCost}
            onRejectCost={onRejectCost}
            isAssigning={isAssigning}
            isUpdatingStatus={isUpdatingStatus}
            isUpdating={isUpdating}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isCancelling={isCancelling}
            isClosing={isClosing}
            isApprovingCost={isApprovingCost}
            isRejectingCost={isRejectingCost}
          />

          <section className="py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Activity
            </h3>
            <div className="mt-4">
              <ActivityTimeline notes={maintenance.activityNotes} />
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  )
}

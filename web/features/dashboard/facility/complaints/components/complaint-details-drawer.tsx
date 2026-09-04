import type { FormEventHandler } from "react"
import { Loader2 } from "lucide-react"

import type {
  Complaint,
  ComplaintStatus,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  ActivityTimeline,
  Drawer,
  ErrorState,
  formatDate,
  formatId,
  formatLabel,
  InfoGrid,
  PriorityBadge,
  StatusBadge,
} from "@/features/dashboard/facility/shared/components/facility-ui"
import { ComplaintActions } from "@/features/dashboard/facility/complaints/components/complaint-actions"
import { ComplaintMaintenanceSection } from "@/features/dashboard/facility/complaints/components/complaint-maintenance-section"

export function ComplaintDetailsDrawer({
  open,
  complaint,
  isLoading,
  isError,
  error,
  isRetrying,
  onRetry,
  onClose,
  relatedMaintenance = [],
  isRelatedMaintenanceLoading = false,
  canCreateMaintenance,
  statusOptions,
  canApprove,
  canCancel,
  onAssign,
  onStatusUpdate,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onCreateMaintenance,
  isAssigning,
  isUpdatingStatus,
  isUpdating,
  isApproving,
  isRejecting,
  isCancelling,
  isCreatingMaintenance,
}: {
  open: boolean
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
  isAssigning: boolean
  isUpdatingStatus: boolean
  isUpdating: boolean
  isApproving: boolean
  isRejecting: boolean
  isCancelling: boolean
  isCreatingMaintenance: boolean
}) {
  return (
    <Drawer
      open={open}
      title={complaint?.title || "Complaint"}
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
          <section className="border-b border-[#E8EDF2] pb-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <p className="mt-4 text-[14px] leading-6 text-[#4E5B67]">
              {complaint.description}
            </p>
          </section>

          <section className="border-b border-[#E8EDF2] py-5">
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
                    value: formatId(typeof complaint.residentId === "object" ? complaint.residentId?.name : complaint.residentId),
                  },
                  {
                    label: "Category",
                    value: formatLabel(complaint.category),
                  },
                  {
                    label: "Assigned technician",
                    value: formatId(typeof complaint.assignedTo === "object" ? complaint.assignedTo?.name : complaint.assignedTo),
                  },
                  {
                    label: "Created",
                    value: formatDate(complaint.createdAt),
                  },
                  {
                    label: "Updated",
                    value: formatDate(complaint.updatedAt),
                  },
                ]}
              />
            </div>
          </section>

          <ComplaintMaintenanceSection
            relatedMaintenance={relatedMaintenance}
            isLoading={isRelatedMaintenanceLoading}
            canCreateMaintenance={canCreateMaintenance}
            onCreateMaintenance={onCreateMaintenance}
            isCreatingMaintenance={isCreatingMaintenance}
          />

          <ComplaintActions
            complaint={complaint}
            statusOptions={statusOptions}
            canApprove={canApprove}
            canCancel={canCancel}
            onAssign={onAssign}
            onStatusUpdate={onStatusUpdate}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
            isAssigning={isAssigning}
            isUpdatingStatus={isUpdatingStatus}
            isUpdating={isUpdating}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isCancelling={isCancelling}
          />

          <section className="py-5">
            <h3 className="text-[15px] font-semibold text-[#111111]">
              Activity
            </h3>
            <div className="mt-4">
              <ActivityTimeline notes={complaint.activityNotes} />
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  )
}

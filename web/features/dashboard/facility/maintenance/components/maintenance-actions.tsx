import type { FormEventHandler } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Pencil,
  UserRoundCog,
} from "lucide-react"

import {
  priorities,
  type Maintenance,
  type MaintenanceStatus,
} from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import { complaintCategories } from "@/features/dashboard/facility/shared/types/common.types"
import {
  FormLabel,
  FormSelect,
  formatCurrency,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function MaintenanceActions({
  maintenance,
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
  maintenance: Maintenance
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
    <section className="border-b border-[#E8EDF2] py-5">
      <h3 className="text-[15px] font-semibold text-[#111111]">Actions</h3>

      <div className="mt-4 grid gap-4">
        <form
          onSubmit={onAssign}
          className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
            <UserRoundCog className="size-4 text-[#2E639B]" />
            Assign Technician
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormLabel label="Technician user ID">
              <TextInput
                name="assignedStaff"
                required
                placeholder="64f..."
                defaultValue={typeof maintenance.assignedTo === 'object' ? maintenance.assignedTo?._id : maintenance.assignedTo}
              />
            </FormLabel>
          </div>
          <FormLabel label="Remarks">
            <TextArea name="remarks" placeholder="Remarks" />
          </FormLabel>
          <div>
            <SubmitButton isLoading={isAssigning}>Assign</SubmitButton>
          </div>
        </form>

        {statusOptions.length > 0 ? (
          <form
            onSubmit={onStatusUpdate}
            className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
              <Gauge className="size-4 text-[#07584F]" />
              Update Status
            </div>
            <FormLabel label="Status">
              <FormSelect
                name="status"
                options={statusOptions}
                defaultValue={statusOptions[0]}
                required
              />
            </FormLabel>
            <FormLabel label="Remarks">
              <TextArea name="remarks" placeholder="Remarks" />
            </FormLabel>
            <div>
              <SubmitButton isLoading={isUpdatingStatus}>
                Update Status
              </SubmitButton>
            </div>
          </form>
        ) : null}

        <form
          onSubmit={onEdit}
          className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
            <Pencil className="size-4 text-[#946415]" />
            Edit Maintenance
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
            <FormLabel label="Estimated cost">
              <TextInput
                name="estimatedCost"
                type="number"
                defaultValue={maintenance.estimatedCost}
              />
            </FormLabel>
          </div>
          <div>
            <SubmitButton isLoading={isUpdating}>Save Changes</SubmitButton>
          </div>
        </form>

        {canReviewCost ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <form
              onSubmit={onApproveCost}
              className="grid gap-3 rounded-lg border border-[#B6DEC5] bg-[#F8FCF9] p-4"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#26733E]" />
                Approve Submitted Cost ({formatCurrency(maintenance.finalCost)})
              </div>
              <FormLabel label="Remarks">
                <TextArea name="remarks" placeholder="Cost approval remarks" />
              </FormLabel>
              <div>
                <SubmitButton isLoading={isApprovingCost}>
                  Approve Cost
                </SubmitButton>
              </div>
            </form>

            <form
              onSubmit={onRejectCost}
              className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                <AlertTriangle className="size-4 text-[#A23D3D]" />
                Reject Submitted Cost
              </div>
              <FormLabel label="Reason">
                <TextArea
                  name="reason"
                  required
                  placeholder="Cost rejection reason"
                />
              </FormLabel>
              <div>
                <SubmitButton tone="danger" isLoading={isRejectingCost}>
                  Reject Cost
                </SubmitButton>
              </div>
            </form>
          </div>
        ) : null}

        {canApprove ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <form
              onSubmit={onApprove}
              className="grid gap-3 rounded-lg border border-[#B6DEC5] bg-[#F8FCF9] p-4"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#26733E]" />
                Approve Maintenance
              </div>
              <FormLabel label="Remarks">
                <TextArea name="remarks" placeholder="Approval remarks" />
              </FormLabel>
              <div>
                <SubmitButton isLoading={isApproving}>Approve</SubmitButton>
              </div>
            </form>

            <form
              onSubmit={onReject}
              className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                <AlertTriangle className="size-4 text-[#A23D3D]" />
                Reject Maintenance
              </div>
              <FormLabel label="Reason">
                <TextArea
                  name="reason"
                  required
                  placeholder="Rejection reason"
                />
              </FormLabel>
              <div>
                <SubmitButton tone="danger" isLoading={isRejecting}>
                  Reject
                </SubmitButton>
              </div>
            </form>
          </div>
        ) : null}

        {canClose ? (
          <form
            onSubmit={onCloseMaintenance}
            className="grid gap-3 rounded-lg border border-[#C8CDD3] bg-[#F8FAFC] p-4"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
              <CheckCircle2 className="size-4 text-[#4B5561]" />
              Close Maintenance
            </div>
            <FormLabel label="Remarks">
              <TextArea name="remarks" placeholder="Closing remarks" />
            </FormLabel>
            <div>
              <SubmitButton isLoading={isClosing}>Close Work</SubmitButton>
            </div>
          </form>
        ) : null}

        {canCancel ? (
          <form
            onSubmit={onCancel}
            className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
              <AlertTriangle className="size-4 text-[#A23D3D]" />
              Cancel Maintenance
            </div>
            <FormLabel label="Reason">
              <TextArea name="reason" placeholder="Cancellation reason" />
            </FormLabel>
            <div>
              <SubmitButton tone="danger" isLoading={isCancelling}>
                Cancel Maintenance
              </SubmitButton>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  )
}

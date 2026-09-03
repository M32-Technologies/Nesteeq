import { Ban } from "lucide-react"
import type { VisitorParkingSlot } from "../../../security/services/parking.service"
import { useUpdateParkingStatusMutation } from "../hooks/use-parking-queries"

type OutOfServiceDialogProps = {
  slot: VisitorParkingSlot
  onClose: () => void
}

export function OutOfServiceDialog({ slot, onClose }: OutOfServiceDialogProps) {
  const updateStatusMutation = useUpdateParkingStatusMutation()

  const handleConfirm = () => {
    updateStatusMutation.mutate(
      { slotId: slot._id, status: "OUT_OF_SERVICE" },
      {
        onSuccess: onClose,
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Ban size={24} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Mark {slot.slotNumber} out of service?
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          This slot will not be available for new parking assignments.
        </p>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending}
            className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

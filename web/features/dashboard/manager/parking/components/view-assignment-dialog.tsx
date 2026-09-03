import { X } from "lucide-react"
import type { VisitorParkingSlot } from "../../../security/services/parking.service"

type ViewAssignmentDialogProps = {
  slot: VisitorParkingSlot
  onClose: () => void
}

export function ViewAssignmentDialog({ slot, onClose }: ViewAssignmentDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Parking Slot</p>
                <p className="text-sm font-medium text-slate-900">{slot.slotNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Flat</p>
                <p className="text-sm font-medium text-slate-900">{slot.currentAssignment?.flatNumber || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Visitor</p>
                <p className="text-sm font-medium text-slate-900">{slot.currentAssignment?.visitorName || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Vehicle Type</p>
                <p className="text-sm font-medium text-slate-900">{slot.currentAssignment?.vehicleType || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Vehicle Number</p>
                <p className="text-sm font-medium text-slate-900">{slot.currentAssignment?.vehicleNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Assigned At</p>
                <p className="text-sm font-medium text-slate-900">
                  {slot.currentAssignment?.assignedAt ? new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  }).format(new Date(slot.currentAssignment.assignedAt)) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

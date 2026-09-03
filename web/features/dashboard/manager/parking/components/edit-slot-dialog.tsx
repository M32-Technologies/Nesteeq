import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"

import type { VisitorParkingSlot } from "../../../security/services/parking.service"
import { useUpdateParkingSlotMutation } from "../hooks/use-parking-queries"
import { editSlotSchema } from "../schemas/parking.schema"
import type { EditSlotFormValues } from "../types/parking.types"

type EditSlotDialogProps = {
  slot: VisitorParkingSlot
  onClose: () => void
}

export function EditSlotDialog({ slot, onClose }: EditSlotDialogProps) {
  const updateSlotMutation = useUpdateParkingSlotMutation()

  const editForm = useForm<EditSlotFormValues>({
    resolver: zodResolver(editSlotSchema),
    defaultValues: {
      slotNumber: slot.slotNumber,
      notes: slot.notes || "",
    }
  })

  // In case slot changes while open
  useEffect(() => {
    editForm.reset({
      slotNumber: slot.slotNumber,
      notes: slot.notes || "",
    })
  }, [slot, editForm])

  const handleEditSubmit = (data: EditSlotFormValues) => {
    updateSlotMutation.mutate(
      {
        slotId: slot._id,
        slotNumber: data.slotNumber,
        notes: data.notes,
      },
      {
        onSuccess: onClose,
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit Parking Slot</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Slot Number</label>
              <input
                {...editForm.register("slotNumber")}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
              />
              {editForm.formState.errors.slotNumber && (
                <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.slotNumber.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                {...editForm.register("notes")}
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
                placeholder="E.g. Near Block A entrance"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateSlotMutation.isPending}
              className="h-10 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white transition hover:bg-[#0B4D38] disabled:opacity-50"
            >
              {updateSlotMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

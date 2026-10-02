"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Hammer, X } from "lucide-react"
import { toast } from "sonner"

import { createMaintenance } from "@/features/dashboard/facility/complaints/api/complaints.api"
import type { MaintenanceTaskTemplate, Priority } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import {
  FormLabel,
  FormSelect,
  MaintenanceTypeSelect,
  SubmitButton,
  TechnicianSelect,
  TextArea,
  TextInput,
} from "@/features/dashboard/facility/shared/components"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  readFormString,
  readOptionalNumber,
} from "@/features/dashboard/facility/shared/utils/form-helpers"

export interface CreateMaintenanceModalProps {
  open: boolean
  onClose: () => void
}

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export function CreateMaintenanceModal({
  open,
  onClose,
}: CreateMaintenanceModalProps) {
  const queryClient = useQueryClient()
  const [selectedTitle, setSelectedTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("MAINTENANCE")

  const createMutation = useMutation({
    mutationFn: createMaintenance,
    onSuccess: async () => {
      toast.success("Maintenance task created successfully")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance"] }),
        queryClient.invalidateQueries({ queryKey: ["facility-maintenance-stats"] }),
      ])
      onClose()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create maintenance task"))
    },
  })

  if (!open) return null

  const handleTypeChange = (_id: string, template?: MaintenanceTaskTemplate) => {
    if (template) {
      setSelectedTitle(template.title)
      setSelectedCategory(template.category)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const title =
      selectedTitle.trim() ||
      readFormString(formData, "title") ||
      readFormString(formData, "maintenanceTitle") ||
      "Routine Maintenance"

    const category =
      selectedCategory.trim() ||
      readFormString(formData, "category") ||
      "MAINTENANCE"

    const priority =
      (readFormString(formData, "priority") as Priority) ||
      "MEDIUM"

    const assignedStaff =
      readFormString(formData, "assignedStaff") ||
      readFormString(formData, "technicianId") ||
      readFormString(formData, "assignedTo") ||
      undefined

    const estimatedCost = readOptionalNumber(formData, "estimatedCost")
    const remarks = readFormString(formData, "remarks")
    const description =
      remarks && remarks.trim().length >= 10
        ? remarks.trim()
        : `${title} scheduled maintenance work.${remarks ? ` Note: ${remarks.trim()}` : ""}`

    createMutation.mutate({
      title,
      category,
      priority,
      assignedStaff: assignedStaff || undefined,
      assignedTo: assignedStaff || undefined,
      estimatedCost: estimatedCost ?? undefined,
      remarks: remarks || undefined,
      description,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#071D35]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-[620px] rounded-xl border border-[#DDE5EC] bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#EAF4F0] text-[#07584F]">
              <Hammer className="size-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#111111]">
                Create Maintenance
              </h2>
              <p className="text-[12px] text-[#66737F]">
                Schedule routine facility servicing or preventive maintenance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#66737F] hover:bg-[#F3F5F7] hover:text-[#111111]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormLabel label="Maintenance Type / Template">
              <MaintenanceTypeSelect
                name="maintenanceType"
                placeholder="Choose template / type..."
                onChange={handleTypeChange}
              />
            </FormLabel>

            <FormLabel label="Task Title">
              <input
                name="title"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                placeholder="e.g. Electrical Repair"
                required
                className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] text-[#111111] outline-none transition placeholder:text-[#9AA5AF] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
              />
            </FormLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormLabel label="Assign Technician">
              <TechnicianSelect
                name="assignedStaff"
                placeholder="Select technician (optional)..."
              />
            </FormLabel>

            <FormLabel label="Priority">
              <FormSelect
                name="priority"
                defaultValue="MEDIUM"
                options={PRIORITY_OPTIONS}
              />
            </FormLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormLabel label="Estimated Cost (₹)">
              <TextInput
                name="estimatedCost"
                type="number"
                placeholder="0"
              />
            </FormLabel>

            <FormLabel label="Category">
              <input
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value.toUpperCase())}
                placeholder="ELECTRICAL, PLUMBING, etc."
                className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] text-[#111111] outline-none transition placeholder:text-[#9AA5AF] focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
              />
            </FormLabel>
          </div>

          <FormLabel label="Instructions & Work Notes">
            <TextArea
              name="remarks"
              placeholder="Provide work details, location notes, or specific instructions for technician..."
            />
          </FormLabel>

          <div className="flex items-center justify-end gap-3 border-t border-[#E8EDF2] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DDE5EC] px-4 py-2.5 text-[13px] font-semibold text-[#5B6875] transition hover:bg-[#F6F8FA]"
            >
              Cancel
            </button>
            <SubmitButton isLoading={createMutation.isPending}>
              Create Maintenance
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}


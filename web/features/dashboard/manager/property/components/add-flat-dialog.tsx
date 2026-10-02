"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  useCreatePropertyFlatMutation,
  usePropertyBlocksQuery,
} from "../hooks/use-property-query"
import type { CreatePropertyFlatInput } from "../types/property"
import { Portal } from "@/components/portal"

type AddFlatDialogProps = {
  open: boolean
  onClose: () => void
}

const addFlatSchema = z.object({
  blockId: z.string().trim().min(1, "Block is required"),
  floorNumber: z.coerce
    .number({
      message: "Floor is required",
    })
    .int("Floor must be a whole number")
    .min(1, "Floor must be greater than 0"),
  flatNumber: z.coerce
    .number({
      message: "Unit number is required",
    })
    .int("Unit number must be a whole number")
    .min(1, "Unit number must be greater than 0")
    .max(99, "Unit number cannot exceed 99"),
})

type AddFlatFormValues = z.input<typeof addFlatSchema>

const fieldClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"

export default function AddFlatDialog({ open, onClose }: AddFlatDialogProps) {
  const createFlat = useCreatePropertyFlatMutation()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery({ status: "active" })
  const [formError, setFormError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<AddFlatFormValues>({
    resolver: zodResolver(addFlatSchema),
    defaultValues: {
      blockId: "",
      floorNumber: "",
      flatNumber: "",
    },
  })
  const selectedBlockId = useWatch({ control, name: "blockId" })
  const selectedFloorNumber = useWatch({ control, name: "floorNumber" })
  const selectedUnitNumber = useWatch({ control, name: "flatNumber" })

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId)
  const floorOptions = selectedBlock
    ? Array.from(
      { length: selectedBlock.totalFloors },
      (_, index) => index + 1
    )
    : []

  const generatedPreview = useMemo(() => {
    if (!selectedBlock?.code || !selectedFloorNumber || !selectedUnitNumber) {
      return null
    }
    const unitNum = Number(selectedUnitNumber)
    if (!Number.isInteger(unitNum) || unitNum <= 0) return null
    const unitPad = String(unitNum).padStart(2, "0")
    return `${selectedBlock.code}-${selectedFloorNumber}${unitPad}`
  }, [selectedBlock, selectedFloorNumber, selectedUnitNumber])

  const blockOptions = useMemo(
    () =>
      blocks.map((block) => ({
        label: `${block.blockname} (${block.code})`,
        value: block.id,
      })),
    [blocks]
  )

  if (!open) {
    return null
  }

  const closeDialog = () => {
    if (createFlat.isPending) return

    reset()
    setFormError("")
    clearErrors()
    onClose()
  }

  const submitFlat = async (values: AddFlatFormValues) => {
    const input: CreatePropertyFlatInput = {
      blockId: values.blockId,
      floorNumber: Number(values.floorNumber),
      flatNumber: Number(values.flatNumber),
    }

    try {
      setFormError("")
      await createFlat.mutateAsync(input)
      toast.success("Flat created successfully")
      reset()
      clearErrors()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create flat"

      toast.error(message)
      setFormError(message)
    }
  }

  return (
    <Portal>
      <div
        style={{ zIndex: 1000 }}
        className="fixed inset-0 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center"
      >
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[82px] items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              Add Flat
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              Create a single flat under an active block.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={createFlat.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close add flat modal"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitFlat)}>
          <div className="space-y-5 px-6 py-5">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Block *
              </span>
              <div className="relative">
                <select
                  disabled={isBlocksLoading || createFlat.isPending}
                  {...register("blockId", {
                    onChange: () => {
                      setValue("floorNumber", "")
                    },
                  })}
                  className={`${fieldClassName} appearance-none pr-10`}
                >
                  <option value="">
                    {isBlocksLoading ? "Loading blocks..." : "Select block"}
                  </option>
                  {blockOptions.map((block) => (
                    <option key={block.value} value={block.value}>
                      {block.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
              {errors.blockId?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.blockId.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Floor *
              </span>
              <div className="relative">
                <select
                  disabled={
                    !selectedBlockId ||
                    isBlocksLoading ||
                    createFlat.isPending
                  }
                  {...register("floorNumber")}
                  className={`${fieldClassName} appearance-none pr-10`}
                >
                  <option value="">
                    {selectedBlockId ? "Select floor" : "Select block first"}
                  </option>
                  {floorOptions.map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
              {errors.floorNumber?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.floorNumber.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Unit Number *
              </span>
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                inputMode="numeric"
                placeholder="Example: 1, 2, 3"
                disabled={createFlat.isPending}
                onKeyDown={(event) => {
                  if (["-", "+", ".", "e", "E"].includes(event.key)) {
                    event.preventDefault()
                  }
                }}
                {...register("flatNumber")}
                className={fieldClassName}
              />
              <span className="mt-1.5 block text-xs font-medium text-slate-500">
                The door or unit number on this floor (e.g. 1, 2, 3).
              </span>
              {errors.flatNumber?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.flatNumber.message}
                </span>
              )}
              {generatedPreview && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-800">
                  <span>Will be created as:</span>
                  <span className="rounded bg-white px-2 py-0.5 font-mono font-bold text-emerald-800 shadow-sm border border-emerald-200">
                    {generatedPreview}
                  </span>
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeDialog}
              disabled={createFlat.isPending}
              className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createFlat.isPending}
              className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] text-sm font-semibold text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createFlat.isPending ? "Creating..." : "Create Flat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Portal>
)
}

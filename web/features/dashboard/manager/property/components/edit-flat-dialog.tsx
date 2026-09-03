"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  usePropertyBlocksQuery,
  useUpdatePropertyFlatMutation,
} from "../hooks/use-property-query"
import type { PropertyFlat, UpdatePropertyFlatInput } from "../types/property"

type EditFlatDialogProps = {
  flat: PropertyFlat | null
  onClose: () => void
}

const editFlatSchema = z.object({
  floorNumber: z.coerce
    .number({
      message: "Floor is required",
    })
    .int("Floor must be a whole number")
    .min(1, "Floor must be greater than 0"),
  flatNumber: z
    .string()
    .trim()
    .min(1, "Flat number is required")
    .max(30, "Flat number must be 30 characters or less"),
})

type EditFlatFormValues = z.input<typeof editFlatSchema>

const fieldClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"

export default function EditFlatDialog({
  flat,
  onClose,
}: EditFlatDialogProps) {
  const updateFlat = useUpdatePropertyFlatMutation()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery({ status: "active" })
  const [formError, setFormError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EditFlatFormValues>({
    resolver: zodResolver(editFlatSchema),
    defaultValues: {
      floorNumber: "",
      flatNumber: "",
    },
  })

  const currentBlock = useMemo(
    () => blocks.find((block) => block.id === flat?.blockId),
    [blocks, flat?.blockId]
  )
  const floorCount = currentBlock?.totalFloors ?? flat?.floorNumber ?? 0
  const floorOptions = floorCount
    ? Array.from({ length: floorCount }, (_, index) => index + 1)
    : []
  const open = Boolean(flat)

  useEffect(() => {
    if (!flat) return

    reset({
      floorNumber: String(flat.floorNumber),
      flatNumber: flat.flatNumber,
    })
    setFormError("")
    clearErrors()
  }, [clearErrors, flat, reset])

  if (!open || !flat) {
    return null
  }

  const closeDialog = () => {
    if (updateFlat.isPending) return

    setFormError("")
    clearErrors()
    onClose()
  }

  const submitEdit = async (values: EditFlatFormValues) => {
    const nextFloorNumber = Number(values.floorNumber)
    const nextFlatNumber = values.flatNumber.trim().toUpperCase()
    const input: UpdatePropertyFlatInput = {}

    if (nextFloorNumber !== flat.floorNumber) {
      input.floorNumber = nextFloorNumber
    }

    if (nextFlatNumber !== flat.flatNumber) {
      input.flatNumber = nextFlatNumber
    }

    if (Object.keys(input).length === 0) {
      setFormError("Update at least one field before saving")
      return
    }

    try {
      setFormError("")
      await updateFlat.mutateAsync({
        flatId: flat.id,
        input,
      })
      toast.success("Flat updated successfully")
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update flat"

      if (message === "Flat number already exists in the block") {
        setError("flatNumber", {
          type: "server",
          message,
        })
        return
      }

      if (
        message === "Invalid floor number" ||
        message === "Floor exceeds the block's total floors"
      ) {
        setError("floorNumber", {
          type: "server",
          message,
        })
        return
      }

      toast.error(message)
      setFormError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 sm:items-center">
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[82px] items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              Edit Flat
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              Update the flat number or floor.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={updateFlat.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close edit flat dialog"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitEdit)}>
          <div className="space-y-5 px-6 py-5">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Block
              </span>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {flat.block?.blockname ?? flat.blockId}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Code {flat.block?.code ?? "-"} | Read only
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Floor *
              </span>
              <div className="relative">
                <select
                  disabled={isBlocksLoading || updateFlat.isPending}
                  {...register("floorNumber")}
                  className={`${fieldClassName} appearance-none pr-10`}
                >
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
                Flat Number *
              </span>
              <input
                type="text"
                disabled={updateFlat.isPending}
                {...register("flatNumber", {
                  onChange: (event) => {
                    event.target.value = event.target.value.toUpperCase()
                  },
                })}
                className={fieldClassName}
              />
              {errors.flatNumber?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.flatNumber.message}
                </span>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeDialog}
              disabled={updateFlat.isPending}
              className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateFlat.isPending}
              className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] text-sm font-semibold text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {updateFlat.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

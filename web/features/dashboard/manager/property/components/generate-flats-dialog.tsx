"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  useCreatePropertyFlatMutation,
  usePropertyBlocksQuery,
} from "../hooks/use-property-query"

type GenerateFlatsDialogProps = {
  open: boolean
  onClose: () => void
}

const generateFlatsSchema = z.object({
  blockId: z.string().trim().min(1, "Block is required"),
  unitsPerFloor: z.coerce
    .number({
      message: "Units per floor is required",
    })
    .int("Units per floor must be a whole number")
    .min(1, "Units per floor must be greater than 0")
    .max(100, "Units per floor cannot exceed 100"),
})

type GenerateFlatsFormValues = z.input<typeof generateFlatsSchema>

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"

export default function GenerateFlatsDialog({
  open,
  onClose,
}: GenerateFlatsDialogProps) {
  const createFlat = useCreatePropertyFlatMutation()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery({ status: "active" })
  const [formError, setFormError] = useState("")
  const [selectedFlatNumbers, setSelectedFlatNumbers] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    reset,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<GenerateFlatsFormValues>({
    resolver: zodResolver(generateFlatsSchema),
    defaultValues: {
      blockId: "",
      unitsPerFloor: "",
    },
  })
  const selectedBlockId = useWatch({ control, name: "blockId" })
  const unitsPerFloorValue = useWatch({ control, name: "unitsPerFloor" })
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId)
  const unitsPerFloor = Number(unitsPerFloorValue)
  const canPreview =
    selectedBlock &&
    Number.isInteger(unitsPerFloor) &&
    unitsPerFloor > 0 &&
    unitsPerFloor <= 100
  const flatPreview = useMemo(
    () =>
      canPreview
        ? Array.from({ length: selectedBlock.totalFloors }, (_, floorIndex) => {
            const floor = floorIndex + 1

            return {
              floor,
              flats: Array.from({ length: unitsPerFloor }, (_, unitIndex) => ({
                flatNumber: `${selectedBlock.code}-${floor}${String(
                  unitIndex + 1
                ).padStart(2, "0")}`,
                floorNumber: floor,
              })),
            }
          })
        : [],
    [canPreview, selectedBlock, unitsPerFloor]
  )
  const totalPreviewCount = flatPreview.reduce(
    (total, floor) => total + floor.flats.length,
    0
  )
  const selectedFlatNumberSet = useMemo(
    () => new Set(selectedFlatNumbers),
    [selectedFlatNumbers]
  )
  const selectedFlats = useMemo(
    () =>
      flatPreview
        .flatMap((floor) => floor.flats)
        .filter((flat) => selectedFlatNumberSet.has(flat.flatNumber)),
    [flatPreview, selectedFlatNumberSet]
  )
  const removedFlatCount = totalPreviewCount - selectedFlats.length

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedFlatNumbers(
        flatPreview.flatMap((floor) =>
          floor.flats.map((flat) => flat.flatNumber)
        )
      )
    })
  }, [flatPreview])

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
    setSelectedFlatNumbers([])
    setFormError("")
    clearErrors()
    onClose()
  }

  const submitGenerate = async (values: GenerateFlatsFormValues) => {
    if (selectedFlats.length === 0) {
      setFormError("Select at least one flat to create")
      return
    }

    let createdCount = 0

    try {
      setFormError("")
      for (const flat of selectedFlats) {
        await createFlat.mutateAsync({
          blockId: values.blockId,
          floorNumber: flat.floorNumber,
          flatNumber: flat.flatNumber,
        })
        createdCount += 1
      }

      toast.success(`${selectedFlats.length} flats created successfully`)
      reset()
      setSelectedFlatNumbers([])
      clearErrors()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate flats"
      const errorMessage =
        createdCount > 0
          ? `${createdCount} flats created, then failed: ${message}`
          : message

      toast.error(errorMessage)
      setFormError(errorMessage)
    }
  }

  const resetSelectedFlats = () => {
    setSelectedFlatNumbers(
      flatPreview.flatMap((floor) =>
        floor.flats.map((flat) => flat.flatNumber)
      )
    )
  }

  const removeFlat = (flatNumber: string) => {
    setSelectedFlatNumbers((currentFlatNumbers) =>
      currentFlatNumbers.filter((currentFlatNumber) => currentFlatNumber !== flatNumber)
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-4">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-6 text-slate-900">
              Generate Flats
            </h2>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
              Generate flats for every floor in a selected block.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={createFlat.isPending}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close generate flats modal"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(submitGenerate)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Block *
                </span>
                <div className="relative">
                  <select
                    disabled={isBlocksLoading || createFlat.isPending}
                    {...register("blockId")}
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
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Units / Floor *
                </span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  placeholder="Example: 4"
                  disabled={createFlat.isPending}
                  onKeyDown={(event) => {
                    if (["-", "+", ".", "e", "E"].includes(event.key)) {
                      event.preventDefault()
                    }
                  }}
                  {...register("unitsPerFloor")}
                  className={fieldClassName}
                />
                {errors.unitsPerFloor?.message && (
                  <span className="mt-1 block text-xs font-medium text-red-600">
                    {errors.unitsPerFloor.message}
                  </span>
                )}
              </label>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  Generated flat preview
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {selectedFlats.length} of {totalPreviewCount} flats
                </span>
              </div>

              {flatPreview.length > 0 ? (
                <div className="mt-3 max-h-[180px] space-y-3 overflow-y-auto pr-1">
                  {removedFlatCount > 0 && (
                    <button
                      type="button"
                      onClick={resetSelectedFlats}
                      disabled={createFlat.isPending}
                      className="text-xs font-semibold text-[#0F5F45] transition hover:text-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Restore removed flats
                    </button>
                  )}
                  {flatPreview.map((floor) => (
                    <div key={floor.floor}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Floor {floor.floor}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {floor.flats.map((flat) => {
                          const isSelected = selectedFlatNumberSet.has(
                            flat.flatNumber
                          )

                          return (
                            <button
                              key={flat.flatNumber}
                              type="button"
                              onClick={() => removeFlat(flat.flatNumber)}
                              disabled={!isSelected || createFlat.isPending}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                                isSelected
                                  ? "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  : "border-slate-200 bg-slate-100 text-slate-400 line-through"
                              }`}
                              title={
                                isSelected
                                  ? `Remove ${flat.flatNumber}`
                                  : `${flat.flatNumber} removed`
                              }
                            >
                              {flat.flatNumber}
                              {isSelected && <X size={12} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                  Select a block and enter units per floor to preview flat
                  numbers.
                </p>
              )}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:grid-cols-2">
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
              disabled={createFlat.isPending || selectedFlats.length === 0}
              className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] text-sm font-semibold text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createFlat.isPending ? "Creating..." : "Create Selected Flats"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Grid2X2Plus, X } from "lucide-react"

import type { VisitorParkingSlotStatus } from "../../../security/services/parking.service"
import {
  useGenerateParkingSlotsMutation,
  useParkingSlotsQuery,
} from "../hooks/use-parking-queries"

import ParkingSummary from "./parking-summary"
import ParkingTable from "./parking-table"
import { generateSlotsSchema } from "../schemas/parking.schema"
import type { GenerateSlotsFormValues, ParkingStatusFilter } from "../types/parking.types"


const GENERATE_FORM_DEFAULTS: GenerateSlotsFormValues = {
  prefix: "P",
  totalSlots: 80,
  startNumber: 1,
}

export default function ParkingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState<ParkingStatusFilter>("ALL")

  const [page, setPage] = useState(1)

  const [isGenerateOpen, setIsGenerateOpen] =
    useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
      setPage(1) // Reset page on search change
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  // Reset page when status filter changes
  const handleStatusChange = (status: ParkingStatusFilter) => {
    setStatusFilter(status)
    setPage(1)
  }

  const {
    data,
    isLoading,
  } = useParkingSlotsQuery({
    search: debouncedSearchQuery || undefined,
    status:
      statusFilter === "ALL"
        ? undefined
        : statusFilter,
    page,
    limit: 10,
  })

  const generateMutation =
    useGenerateParkingSlotsMutation()

  const generateForm =
    useForm<GenerateSlotsFormValues>({
      resolver: zodResolver(generateSlotsSchema),
      defaultValues: GENERATE_FORM_DEFAULTS,
    })

  const prefix = generateForm.watch("prefix")
  const totalSlots = generateForm.watch("totalSlots")
  const startNumber =
    generateForm.watch("startNumber")

  const previewPrefix =
    prefix?.trim().toUpperCase() ?? ""

  const previewEndNumber =
    Number.isInteger(totalSlots) &&
    Number.isInteger(startNumber)
      ? startNumber + totalSlots - 1
      : 0

  const handleGenerateSubmit = (
    formData: GenerateSlotsFormValues
  ) => {
    generateMutation.mutate(
      {
        ...formData,
        prefix: formData.prefix
          .trim()
          .toUpperCase(),
      },
      {
        onSuccess: () => {
          setIsGenerateOpen(false)
          generateForm.reset(
            GENERATE_FORM_DEFAULTS
          )
        },
      }
    )
  }

  const handleGenerateDialogClose = () => {
    if (generateMutation.isPending) return

    setIsGenerateOpen(false)
    generateForm.reset(GENERATE_FORM_DEFAULTS)
  }

  const hasConfiguredSlots =
    (data?.summary?.totalVisitorSlots ?? 0) > 0

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL"

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Parking
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage parking slots, availability,
            and current assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0B4D38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45] focus-visible:ring-offset-2 xl:self-auto"
        >
          <Grid2X2Plus
            size={16}
            strokeWidth={2.25}
          />
          Generate Parking Slots
        </button>
      </div>

      {/* Summary */}
      <ParkingSummary
        summary={data?.summary}
        isLoading={isLoading}
      />

      {/* First-time empty state */}
      {!isLoading &&
        !hasConfiguredSlots &&
        !hasActiveFilters && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <Grid2X2Plus size={32} />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              No parking slots configured
            </h2>

            <p className="mx-auto mb-8 max-w-sm text-sm text-slate-500">
              Generate parking slots to start
              managing parking for this property.
            </p>

            <button
              type="button"
              onClick={() =>
                setIsGenerateOpen(true)
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0B4D38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F45] focus-visible:ring-offset-2"
            >
              <Grid2X2Plus
                size={16}
                strokeWidth={2.25}
              />
              Generate Parking Slots
            </button>
          </div>
        )}

      {/* Parking table */}
      {(isLoading ||
        hasConfiguredSlots ||
        hasActiveFilters) && (
        <ParkingTable
          slots={data?.slots ?? []}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          isLoading={isLoading}
          page={data?.pagination?.page ?? page}
          totalPages={data?.pagination?.totalPages ?? 1}
          totalCount={data?.pagination?.totalCount ?? 0}
          onSearchChange={setSearchQuery}
          onStatusChange={handleStatusChange}
          onPageChange={setPage}
        />
      )}

      {/* Generate Parking Slots Dialog */}
      {isGenerateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-parking-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2
                id="generate-parking-title"
                className="text-lg font-semibold text-slate-900"
              >
                Generate Parking Slots
              </h2>

              <button
                type="button"
                onClick={
                  handleGenerateDialogClose
                }
                disabled={
                  generateMutation.isPending
                }
                aria-label="Close generate parking slots dialog"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={generateForm.handleSubmit(
                handleGenerateSubmit
              )}
              className="p-6"
            >
              <div className="space-y-4">
                {/* Prefix */}
                <div>
                  <label
                    htmlFor="parking-prefix"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Slot Prefix
                  </label>

                  <input
                    id="parking-prefix"
                    {...generateForm.register(
                      "prefix"
                    )}
                    autoComplete="off"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
                  />

                  <p className="mt-1.5 text-[13px] text-slate-500">
                    Used to generate slot numbers
                    such as P-001.
                  </p>

                  {generateForm.formState.errors
                    .prefix && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        generateForm.formState
                          .errors.prefix.message
                      }
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Total Slots */}
                  <div>
                    <label
                      htmlFor="parking-total-slots"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Number of Slots
                    </label>

                    <input
                      id="parking-total-slots"
                      type="number"
                      min={1}
                      max={500}
                      {...generateForm.register(
                        "totalSlots",
                        {
                          valueAsNumber: true,
                        }
                      )}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
                    />

                    {generateForm.formState.errors
                      .totalSlots && (
                      <p className="mt-1 text-xs text-red-600">
                        {
                          generateForm
                            .formState.errors
                            .totalSlots.message
                        }
                      </p>
                    )}
                  </div>

                  {/* Starting Number */}
                  <div>
                    <label
                      htmlFor="parking-start-number"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Starting Number
                    </label>

                    <input
                      id="parking-start-number"
                      type="number"
                      min={1}
                      {...generateForm.register(
                        "startNumber",
                        {
                          valueAsNumber: true,
                        }
                      )}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#0F5F45] focus:ring-1 focus:ring-[#0F5F45]"
                    />

                    {generateForm.formState.errors
                      .startNumber && (
                      <p className="mt-1 text-xs text-red-600">
                        {
                          generateForm
                            .formState.errors
                            .startNumber.message
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {previewPrefix &&
                  Number.isInteger(totalSlots) &&
                  totalSlots > 0 &&
                  Number.isInteger(
                    startNumber
                  ) &&
                  startNumber > 0 && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-medium text-slate-500">
                        Preview
                      </p>

                      <p className="text-sm text-slate-700">
                        Slots will be generated
                        from
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {previewPrefix}-
                        {String(
                          startNumber
                        ).padStart(3, "0")}
                        {" → "}
                        {previewPrefix}-
                        {String(
                          previewEndNumber
                        ).padStart(3, "0")}
                      </p>
                    </div>
                  )}
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    handleGenerateDialogClose
                  }
                  disabled={
                    generateMutation.isPending
                  }
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    generateMutation.isPending
                  }
                  className="h-10 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generateMutation.isPending
                    ? "Generating..."
                    : "Generate Slots"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
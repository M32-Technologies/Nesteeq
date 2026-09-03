import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers3,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import type {
  FlatAdvancedFilters,
  PropertyBlock,
  PropertyFlat,
  PropertyFlatListParams,
  PropertyFlatStatus,
  PropertyOccupancyStatus,
} from "../types/property"
import EditFlatDialog from "./edit-flat-dialog"
import FlatActionsMenu from "./flat-actions-menu"
import FlatDetailsSheet from "./flat-details-sheet"
import FlatStatusDialog from "./flat-status-dialog"

type FlatsTableSectionProps = {
  blocks: PropertyBlock[]
  flats: PropertyFlat[]
  search: string
  blockId: string
  page: number
  totalPages: number
  totalCount: number
  advancedFilterCount: number
  isLoading: boolean
  isError: boolean
  error: unknown
  filterOpen: boolean
  draftFilters: FlatAdvancedFilters
  onSearchChange: (value: string) => void
  onBlockChange: (value: string) => void
  onPageChange: (value: number | ((value: number) => number)) => void
  onOpenFilters: () => void
  onCloseFilters: () => void
  onDraftFilterChange: (filters: FlatAdvancedFilters) => void
  onResetDraftFilters: () => void
  onApplyFilters: () => void
  onReset: () => void
}

const occupancyStyles: Record<PropertyOccupancyStatus, string> = {
  VACANT: "bg-slate-100 text-slate-700",
  OWNER: "bg-blue-50 text-blue-700",
  TENANT: "bg-amber-50 text-amber-700",
}

const statusStyles: Record<PropertyFlatStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-600",
}

export default function FlatsTableSection({
  blocks,
  flats,
  search,
  blockId,
  page,
  totalPages,
  totalCount,
  advancedFilterCount,
  isLoading,
  isError,
  error,
  filterOpen,
  draftFilters,
  onSearchChange,
  onBlockChange,
  onPageChange,
  onOpenFilters,
  onCloseFilters,
  onDraftFilterChange,
  onResetDraftFilters,
  onApplyFilters,
  onReset,
}: FlatsTableSectionProps) {
  const [openActionFlatId, setOpenActionFlatId] = useState<string | null>(null)
  const [detailsFlatId, setDetailsFlatId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editFlat, setEditFlat] = useState<PropertyFlat | null>(null)
  const [statusAction, setStatusAction] = useState<{
    flat: PropertyFlat
    status: PropertyFlatStatus
  } | null>(null)

  const openDetails = (flat: PropertyFlat) => {
    setDetailsFlatId(flat.id)
    setDetailsOpen(true)
    setOpenActionFlatId(null)
  }

  const openEdit = (flat: PropertyFlat) => {
    setEditFlat(flat)
    setOpenActionFlatId(null)
  }

  const openDeactivate = (flat: PropertyFlat) => {
    setStatusAction({ flat, status: "inactive" })
    setOpenActionFlatId(null)
  }

  const openActivate = (flat: PropertyFlat) => {
    setStatusAction({ flat, status: "active" })
    setOpenActionFlatId(null)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search flat or block..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>

            <div className="relative w-full lg:w-[180px]">
              <select
                value={blockId}
                onChange={(event) => onBlockChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="all">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.blockname}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>

            <button
              type="button"
              onClick={onOpenFilters}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-slate-950 lg:w-[130px]"
            >
              <SlidersHorizontal size={15} />
              Filters
              {advancedFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0F5F45] px-1.5 text-[11px] font-semibold text-white">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-slate-950 lg:w-[110px]"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Flat
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Block
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Floor
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Occupancy
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Resident
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!isLoading &&
                !isError &&
                flats.map((flat) => {
                  const occupancyLabel =
                    flat.occupancyStatus === "VACANT"
                      ? "Vacant"
                      : flat.occupancyStatus === "OWNER"
                        ? "Owner"
                        : "Tenant"

                  return (
                    <tr
                      key={flat.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0F5F45]">
                            <Layers3 size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              <button
                                type="button"
                                onClick={() => openDetails(flat)}
                                className="truncate text-left transition hover:text-[#0F5F45]"
                              >
                                {flat.flatNumber}
                              </button>
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              Block {flat.block?.code ?? "-"} | Floor{" "}
                              {flat.floorNumber || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {flat.block?.blockname ?? flat.blockId}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Code {flat.block?.code ?? "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {flat.floorNumber || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${occupancyStyles[flat.occupancyStatus]}`}
                        >
                          {occupancyLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {flat.resident?.name ?? (flat.residentId ? "Assigned" : "-")}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[flat.status]}`}
                        >
                          {flat.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <FlatActionsMenu
                          flat={flat}
                          open={openActionFlatId === flat.id}
                          onToggle={() =>
                            setOpenActionFlatId((currentFlatId) =>
                              currentFlatId === flat.id ? null : flat.id
                            )
                          }
                          onViewDetails={() => openDetails(flat)}
                          onEdit={() => openEdit(flat)}
                          onDeactivate={() => openDeactivate(flat)}
                          onReactivate={() => openActivate(flat)}
                        />
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
              Loading flats...
            </div>
          )}

          {isError && (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
              {error instanceof Error ? error.message : "Failed to load flats"}
            </div>
          )}

          {!isLoading && !isError && flats.length === 0 && (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
              No flats found
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500">
            {totalCount} flats
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() =>
                onPageChange((currentPage) => Math.max(1, currentPage - 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0F5F45] px-2 text-sm font-medium text-white shadow-sm"
            >
              {page}
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() =>
                onPageChange((currentPage) =>
                  Math.min(totalPages, currentPage + 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <FlatDetailsSheet
        flatId={detailsFlatId}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onEdit={openEdit}
      />

      <EditFlatDialog flat={editFlat} onClose={() => setEditFlat(null)} />

      <FlatStatusDialog
        flat={statusAction?.flat ?? null}
        status={statusAction?.status ?? null}
        onClose={() => setStatusAction(null)}
      />

      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 sm:items-center">
          <div className="w-full max-w-[720px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex min-h-[88px] items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold leading-7 text-slate-950">
                  Filter flats
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-5 text-slate-500">
                  Choose the flat details you want to show in the table.
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseFilters}
                aria-label="Close filters"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={19} />
              </button>
            </div>

            <div className="px-5 py-6 sm:px-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Floor
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={draftFilters.floorNumber}
                    onChange={(event) =>
                      onDraftFilterChange({
                        ...draftFilters,
                        floorNumber: event.target.value,
                      })
                    }
                    placeholder="Example: 4"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                  />
                  <span className="mt-1.5 block text-xs font-medium text-slate-500">
                    Leave empty to include every floor.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Occupancy type
                  </span>
                  <select
                    value={draftFilters.occupancyStatus}
                    onChange={(event) =>
                      onDraftFilterChange({
                        ...draftFilters,
                        occupancyStatus: event.target.value as
                          | "all"
                          | PropertyOccupancyStatus,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                  >
                    <option value="all">Any occupancy</option>
                    <option value="VACANT">Vacant flats</option>
                    <option value="OWNER">Owner occupied</option>
                    <option value="TENANT">Tenant occupied</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Record status
                  </span>
                  <select
                    value={draftFilters.status}
                    onChange={(event) =>
                      onDraftFilterChange({
                        ...draftFilters,
                        status: event.target.value as "all" | PropertyFlatStatus,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                  >
                    <option value="all">Any status</option>
                    <option value="active">Active flats</option>
                    <option value="inactive">Inactive flats</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Sort table by
                  </span>
                  <select
                    value={draftFilters.sortBy}
                    onChange={(event) =>
                      onDraftFilterChange({
                        ...draftFilters,
                        sortBy:
                          event.target.value as NonNullable<
                            PropertyFlatListParams["sortBy"]
                          >,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                  >
                    <option value="flatNumber">Flat number</option>
                    <option value="floorNumber">Floor number</option>
                    <option value="occupancyStatus">Occupancy type</option>
                    <option value="status">Record status</option>
                    <option value="createdAt">Newest created</option>
                    <option value="updatedAt">Recently updated</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Order
                  </span>
                  <select
                    value={draftFilters.sortOrder}
                    onChange={(event) =>
                      onDraftFilterChange({
                        ...draftFilters,
                        sortOrder:
                          event.target.value as NonNullable<
                            PropertyFlatListParams["sortOrder"]
                          >,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={onResetDraftFilters}
                className="flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-[150px]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onApplyFilters}
                className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] px-5 text-sm font-semibold text-white transition hover:bg-[#0B4D38] sm:w-[150px]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

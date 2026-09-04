"use client"

import { useState } from "react"
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Search,
} from "lucide-react"

import type { VisitorParkingSlot, VisitorParkingSlotStatus } from "../../../security/services/parking.service"
import { useUpdateParkingStatusMutation } from "../hooks/use-parking-queries"
import { EditSlotDialog } from "./edit-slot-dialog"
import { OutOfServiceDialog } from "./out-of-service-dialog"
import { ViewAssignmentDialog } from "./view-assignment-dialog"

type ParkingTableProps = {
  slots: VisitorParkingSlot[]
  statusFilter: VisitorParkingSlotStatus
  searchQuery: string
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: VisitorParkingSlotStatus) => void
  onPageChange: (value: number | ((value: number) => number)) => void
}

const statusBadgeStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  OCCUPIED: "bg-sky-50 text-sky-700",
  RESERVED: "bg-amber-50 text-amber-700",
  OUT_OF_SERVICE: "bg-red-50 text-red-600",
}

const statusDisplay: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  OUT_OF_SERVICE: "Out of Service",
}

export default function ParkingTable({
  slots,
  statusFilter,
  searchQuery,
  isLoading,
  page,
  totalPages,
  totalCount,
  onSearchChange,
  onStatusChange,
  onPageChange,
}: ParkingTableProps) {

  const [openActionSlotId, setOpenActionSlotId] = useState<string | null>(null)
  
  // Dialog states
  const [editSlot, setEditSlot] = useState<VisitorParkingSlot | null>(null)
  const [viewAssignmentSlot, setViewAssignmentSlot] = useState<VisitorParkingSlot | null>(null)
  const [outOfServiceSlot, setOutOfServiceSlot] = useState<VisitorParkingSlot | null>(null)

  const updateStatusMutation = useUpdateParkingStatusMutation()

  const openEditDialog = (slot: VisitorParkingSlot) => {
    setEditSlot(slot)
    setOpenActionSlotId(null)
  }

  const handleStatusChange = (slotId: string, status: "AVAILABLE" | "RESERVED" | "OUT_OF_SERVICE") => {
    updateStatusMutation.mutate({ slotId, status })
    setOpenActionSlotId(null)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-8">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search parking slot..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>

            <div className="relative w-full lg:w-[180px]">
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value as VisitorParkingSlotStatus)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slot Number
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Assignment
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vehicle
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Updated
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!isLoading && slots.length > 0 && slots.map((slot) => {
                const assignment = slot.currentAssignment
                const updatedAt = assignment?.assignedAt
                  ? new Intl.DateTimeFormat("en-IN", {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(assignment.assignedAt))
                  : "N/A"

                return (
                  <tr key={slot._id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4 align-middle text-sm font-semibold text-slate-900">
                      {slot.slotNumber}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeStyles[slot.status] || ""}`}>
                        {statusDisplay[slot.status] || slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-slate-600">
                      {assignment ? (
                        <div>
                          <div className="font-medium text-slate-900">
                            {assignment.flatNumber ? `Flat ${assignment.flatNumber}` : "No Flat"}
                          </div>
                          <div>{assignment.visitorName}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-slate-600">
                      {assignment ? (
                        <div>
                          <div className="font-medium text-slate-900">{assignment.vehicleNumber}</div>
                          <div>{assignment.vehicleType || "Unknown"}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm font-medium text-slate-600">
                      {updatedAt}
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setOpenActionSlotId(current => current === slot._id ? null : slot._id)}
                          aria-expanded={openActionSlotId === slot._id}
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionSlotId === slot._id && (
                          <div className="absolute right-0 top-9 z-20 w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                            <button
                              type="button"
                              onClick={() => openEditDialog(slot)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil size={15} />
                              Edit Slot
                            </button>

                            {slot.status === "OCCUPIED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewAssignmentSlot(slot)
                                  setOpenActionSlotId(null)
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye size={15} />
                                View Assignment
                              </button>
                            )}

                            {slot.status !== "OCCUPIED" && slot.status !== "RESERVED" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(slot._id, "RESERVED")}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <CheckCircle2 size={15} />
                                Reserve Slot
                              </button>
                            )}

                            {slot.status !== "OCCUPIED" && slot.status !== "AVAILABLE" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(slot._id, "AVAILABLE")}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <CheckCircle2 size={15} />
                                Mark Available
                              </button>
                            )}

                            {slot.status !== "OCCUPIED" && slot.status !== "OUT_OF_SERVICE" && (
                              <>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOutOfServiceSlot(slot)
                                    setOpenActionSlotId(null)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  <Ban size={15} />
                                  Mark Out of Service
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0F5F45]" />
            </div>
          )}

          {!isLoading && slots.length === 0 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-medium text-slate-900">No parking slots found</p>
              <p className="mt-1 text-sm text-slate-500">Try changing your search or status filter.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500">
            {totalCount} slots
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

      {editSlot && (
        <EditSlotDialog 
          slot={editSlot} 
          onClose={() => setEditSlot(null)} 
        />
      )}

      {outOfServiceSlot && (
        <OutOfServiceDialog 
          slot={outOfServiceSlot} 
          onClose={() => setOutOfServiceSlot(null)} 
        />
      )}

      {viewAssignmentSlot && (
        <ViewAssignmentDialog 
          slot={viewAssignmentSlot} 
          onClose={() => setViewAssignmentSlot(null)} 
        />
      )}
    </>
  )
}

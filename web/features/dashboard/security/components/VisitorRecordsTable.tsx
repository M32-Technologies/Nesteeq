"use client"

import type { VisitorParkingSlot } from "../schemas/parking"
import type {
  VisitorPagination,
  VisitorRecord,
} from "../schemas/visitor"
import { getParkingVehicleTypeLabel } from "../constants/parking-vehicle-types"
import {
  PaginationControls,
  StatusBadge,
  formatDateTime,
  tableClassName,
  tableWrapClassName,
  tdClassName,
  thClassName,
} from "./SecurityUi"
import { VisitorParkingActions } from "./VisitorParkingActions"

export function VisitorRecordsTable({
  records,
  pagination,
  availableSlots,
  availableSlotsLoading,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckout,
  onPageChange,
  onView,
}: {
  records: VisitorRecord[]
  pagination?: VisitorPagination
  availableSlots: VisitorParkingSlot[]
  availableSlotsLoading: boolean
  isCheckingIn: boolean
  isCheckingOut: boolean
  onCheckIn: (record: VisitorRecord) => void
  onCheckout: (record: VisitorRecord) => void
  onPageChange: (page: number) => void
  onView: (record: VisitorRecord) => void
}) {
  return (
    <>
      <div className={tableWrapClassName}>
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={thClassName}>Visitor</th>
              <th className={thClassName}>Phone</th>
              <th className={thClassName}>Flat / Unit</th>
              <th className={thClassName}>Purpose</th>
              <th className={thClassName}>Entry Type</th>
              <th className={thClassName}>Expected / Check-In Time</th>
              <th className={thClassName}>Check-Out Time</th>
              <th className={thClassName}>Vehicle Number</th>
              <th className={thClassName}>Vehicle Type</th>
              <th className={thClassName}>Parking Slot</th>
              <th className={thClassName}>Status</th>
              <th className={thClassName}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record._id}>
                <td className={tdClassName}>
                  <p className="font-medium">{record.visitorName}</p>
                </td>
                <td className={tdClassName}>
                  {record.visitorPhone || "-"}
                </td>
                <td className={tdClassName}>
                  {record.flatNumber || "-"}
                </td>
                <td className={tdClassName}>
                  {record.purpose || "-"}
                </td>
                <td className={tdClassName}>
                  {record.entryType === "PASS"
                    ? "Pre-Approved / Pass"
                    : "Manual"}
                </td>
                <td className={tdClassName}>
                  {formatDateTime(
                    record.status === "UPCOMING"
                      ? record.expectedAt
                      : record.checkedInAt
                  )}
                </td>
                <td className={tdClassName}>
                  {formatDateTime(record.checkedOutAt)}
                </td>
                <td className={tdClassName}>
                  {record.vehicleNumber &&
                  record.vehicleNumber.trim() &&
                  record.vehicleNumber.trim().toLowerCase() !== "no vehicle" &&
                  record.vehicleNumber.trim().toLowerCase() !== "none"
                    ? record.vehicleNumber
                    : "No vehicle"}
                </td>
                <td className={tdClassName}>
                  {record.vehicleNumber &&
                  record.vehicleNumber.trim() &&
                  record.vehicleNumber.trim().toLowerCase() !== "no vehicle" &&
                  record.vehicleNumber.trim().toLowerCase() !== "none"
                    ? getParkingVehicleTypeLabel(record.vehicleType)
                    : "-"}
                </td>
                <td className={tdClassName}>
                  {record.parkingSlotNumber ? (
                    <span
                      className={
                        record.parkingAssignmentStatus === "ACTIVE"
                          ? "font-semibold text-[#07584F]"
                          : "text-[#637083]"
                      }
                    >
                      {record.parkingSlotNumber}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={tdClassName}>
                  <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={record.status} />
                    {record.status === "ACTIVE" && record.departedFromFlatAt && (
                      <span
                        title={`Resident confirmed visitor exited flat at ${new Date(record.departedFromFlatAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300 animate-pulse whitespace-nowrap"
                      >
                        <span>🚶</span>
                        <span>Left Flat (Headed to Gate)</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className={tdClassName}>
                  <VisitorParkingActions
                    record={record}
                    availableSlots={availableSlots}
                    availableSlotsLoading={availableSlotsLoading}
                    isCheckingIn={isCheckingIn}
                    isCheckingOut={isCheckingOut}
                    onCheckIn={onCheckIn}
                    onCheckout={onCheckout}
                    onView={onView}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
          onPageChange={onPageChange}
        />
      ) : null}
    </>
  )
}

"use client"

import type { VisitorParkingSlot } from "../services/parking.service"
import {
  DetailGrid,
  DetailModal,
  StatusBadge,
  formatDateTime,
  formatLabel,
} from "./SecurityUi"

export function ParkingDetails({
  slot,
  onClose,
}: {
  slot: VisitorParkingSlot | null
  onClose: () => void
}) {
  if (!slot) return null

  return (
    <DetailModal
      title={`Slot ${slot.slotNumber}`}
      subtitle={`Parking ${formatLabel(slot.status)}`}
      onClose={onClose}
    >
      <DetailGrid
        items={[
          {
            label: "Status",
            value: <StatusBadge status={slot.status} />,
          },
          {
            label: "Vehicle Number",
            value: slot.currentAssignment?.vehicleNumber ?? "-",
          },
          {
            label: "Vehicle Type",
            value: slot.currentAssignment?.vehicleType ?? "-",
          },
          {
            label: "Visitor",
            value: slot.currentAssignment?.visitorName ?? "-",
          },
          {
            label: "Visiting Flat",
            value:
              slot.currentAssignment?.flatNumber ??
              slot.currentAssignment?.flatId ??
              "-",
          },
          {
            label: "Assigned Time",
            value: formatDateTime(
              slot.currentAssignment?.assignedAt
            ),
          },
          {
            label: "Slot Notes",
            value: slot.notes ?? "-",
          },
          {
            label: "Assignment Notes",
            value: slot.currentAssignment?.notes ?? "-",
          },
        ]}
      />
    </DetailModal>
  )
}

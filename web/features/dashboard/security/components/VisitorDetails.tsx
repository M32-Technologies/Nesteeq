"use client"

import type { VisitorRecord } from "../schemas/visitor"
import { getParkingVehicleTypeLabel } from "../constants/parking-vehicle-types"
import {
  DetailGrid,
  DetailModal,
  StatusBadge,
  formatDateTime,
  formatLabel,
} from "./SecurityUi"

export function VisitorDetails({
  record,
  onClose,
}: {
  record: VisitorRecord | null
  onClose: () => void
}) {
  if (!record) return null

  const isPassEntry = record.entryType === "PASS"
  const detailItems = [
    {
      label: "Status",
      value: <StatusBadge status={record.status} />,
    },
    {
      label: "Entry Type",
      value: isPassEntry ? "Pre-Approved / Pass" : "Manual",
    },
    {
      label: "Flat / Unit",
      value: record.flatNumber ?? "-",
    },
    {
      label: "Phone",
      value: record.visitorPhone ?? "-",
    },
    {
      label: "Purpose",
      value: record.purpose ?? "-",
    },
    {
      label: "Vehicle Number",
      value: record.vehicleNumber ?? "-",
    },
    {
      label: "Vehicle Type",
      value: getParkingVehicleTypeLabel(record.vehicleType),
    },
    {
      label: "Parking Slot",
      value: record.parkingSlotNumber ?? "-",
    },
    {
      label: "Parking Status",
      value: record.parkingAssignmentStatus ? (
        <StatusBadge status={record.parkingAssignmentStatus} />
      ) : (
        "-"
      ),
    },
    {
      label: "Parking Assigned",
      value: formatDateTime(record.parkingAssignedAt),
    },
    {
      label: "Parking Released",
      value:
        record.parkingAssignmentStatus === "ACTIVE"
          ? "Not released"
          : formatDateTime(record.parkingReleasedAt),
    },
    ...(isPassEntry
      ? [
          {
            label: "Expected Time",
            value: formatDateTime(record.expectedAt),
          },
          {
            label: "Valid Until",
            value: formatDateTime(record.validUntil),
          },
        ]
      : []),
    {
      label: "Check-In Time",
      value: formatDateTime(record.checkedInAt),
    },
    {
      label: "Check-Out Time",
      value:
        record.status === "ACTIVE"
          ? "Not checked out"
          : formatDateTime(record.checkedOutAt),
    },
  ]

  return (
    <DetailModal
      title={record.visitorName}
      subtitle={`Visitor ${formatLabel(record.status)}`}
      onClose={onClose}
    >
      <DetailGrid items={detailItems} />
    </DetailModal>
  )
}

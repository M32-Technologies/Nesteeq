"use client"

import type { VisitorRecord } from "../services/visitor.service"
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

  return (
    <DetailModal
      title={record.visitorName}
      subtitle={`Visitor ${formatLabel(record.status)}`}
      onClose={onClose}
    >
      <DetailGrid
        items={[
          {
            label: "Status",
            value: <StatusBadge status={record.status} />,
          },
          {
            label: "Entry Type",
            value:
              record.entryType === "PASS"
                ? "Pre-Approved / Pass"
                : "Manual",
          },
          {
            label: "Flat / Unit",
            value: record.flatNumber ?? record.flatId,
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
            label: "Expected Time",
            value: formatDateTime(record.expectedAt),
          },
          {
            label: "Valid Until",
            value: formatDateTime(record.validUntil),
          },
          {
            label: "Check-In Time",
            value: formatDateTime(record.checkedInAt),
          },
          {
            label: "Check-Out Time",
            value: formatDateTime(record.checkedOutAt),
          },
        ]}
      />
    </DetailModal>
  )
}

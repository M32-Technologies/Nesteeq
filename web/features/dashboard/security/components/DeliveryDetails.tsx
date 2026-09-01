"use client"

import type { SecurityDelivery } from "../services/delivery.service"
import {
  DetailGrid,
  DetailModal,
  StatusBadge,
  formatDateTime,
  formatLabel,
} from "./SecurityUi"

export function DeliveryDetails({
  delivery,
  onClose,
}: {
  delivery: SecurityDelivery | null
  onClose: () => void
}) {
  if (!delivery) return null

  return (
    <DetailModal
      title={delivery.deliveryCompany}
      subtitle={`Delivery ${formatLabel(delivery.status)}`}
      onClose={onClose}
    >
      <DetailGrid
        items={[
          {
            label: "Status",
            value: <StatusBadge status={delivery.status} />,
          },
          {
            label: "Type",
            value: formatLabel(delivery.deliveryType),
          },
          {
            label: "Flat / Unit",
            value: delivery.flatNumber ?? delivery.flatId,
          },
          {
            label: "Resident",
            value:
              delivery.residentName ??
              delivery.residentId ??
              "-",
          },
          {
            label: "Delivery Person",
            value: delivery.deliveryPersonName ?? "-",
          },
          {
            label: "Delivery Phone",
            value: delivery.deliveryPersonPhone ?? "-",
          },
          {
            label: "Tracking / Order ID",
            value: delivery.trackingId ?? "-",
          },
          {
            label: "Description",
            value: delivery.packageDescription ?? "-",
          },
          {
            label: "Received",
            value: formatDateTime(delivery.receivedAt),
          },
          {
            label: "Notified",
            value: formatDateTime(delivery.notifiedAt),
          },
          {
            label: "Collected",
            value: formatDateTime(delivery.collectedAt),
          },
          {
            label: "Returned",
            value: formatDateTime(delivery.returnedAt),
          },
          {
            label: "Notes",
            value: delivery.notes ?? "-",
          },
        ]}
      />
    </DetailModal>
  )
}

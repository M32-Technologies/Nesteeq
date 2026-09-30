"use client"

import type { SecurityDelivery } from "../schemas/delivery"
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
            value: delivery.flatNumber ?? "-",
          },
          {
            label: "Resident",
            value: delivery.residentName ?? "-",
          },
          {
            label: "Resident Phone",
            value: delivery.residentPhone ?? "-",
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
            label: "Description",
            value: delivery.packageDescription ?? "-",
          },
          {
            label: "Received",
            value: formatDateTime(delivery.receivedAt),
          },
          {
            label: "Collected",
            value: formatDateTime(delivery.collectedAt),
          },
          {
            label: "Returned",
            value: formatDateTime(delivery.returnedAt),
          },
        ]}
      />
    </DetailModal>
  )
}

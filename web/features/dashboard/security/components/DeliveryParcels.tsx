"use client"

import { useState } from "react"
import {
  BellRing,
  CheckCircle2,
  Eye,
  RotateCcw,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import {
  useCreateDelivery,
  useDeliveries,
  useUpdateDeliveryStatus,
} from "../hooks/useDeliveries"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityFlats } from "../hooks/useSecurityData"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import type {
  DeliveryStatus,
  DeliveryType,
  SecurityDelivery,
} from "../services/delivery.service"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
  StatusBadge,
  formatDateTime,
  formatLabel,
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  primaryButtonClassName,
  tableClassName,
  tableWrapClassName,
  tdClassName,
  thClassName,
} from "./SecurityUi"
import { ConfirmActionModal } from "./ConfirmActionModal"
import { DeliveryDetails } from "./DeliveryDetails"
import {
  DeliveryForm,
  type DeliveryFormState,
} from "./DeliveryForm"

const PAGE_SIZE = 10

const statusFilters: Array<{
  label: string
  value: DeliveryStatus
}> = [
  { label: "All", value: "ALL" },
  { label: "Waiting", value: "WAITING" },
  { label: "Resident Notified", value: "NOTIFIED" },
  { label: "Collected", value: "COLLECTED" },
  { label: "Returned", value: "RETURNED" },
]

export function DeliveryParcels() {
  const [status, setStatus] =
    useState<DeliveryStatus>("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedDelivery, setSelectedDelivery] =
    useState<SecurityDelivery | null>(null)
  const [confirmDelivery, setConfirmDelivery] =
    useState<{
      delivery: SecurityDelivery
      status: Exclude<DeliveryStatus, "ALL">
    } | null>(null)
  const [form, setForm] = useState<DeliveryFormState>({
    deliveryType: "PARCEL" as DeliveryType,
    flatId: "",
    residentId: "",
    deliveryCompany: "",
    deliveryPersonName: "",
    deliveryPersonPhone: "",
    trackingId: "",
    packageDescription: "",
    notes: "",
  })

  const flatsQuery = useSecurityFlats()
  const debouncedSearch = useDebouncedValue(search, 350)
  const deliveriesQuery = useDeliveries({
    status,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  })
  const createMutation = useCreateDelivery()
  const updateStatusMutation = useUpdateDeliveryStatus()

  const flats = flatsQuery.data?.flats ?? []
  const deliveries = deliveriesQuery.data?.deliveries ?? []
  const pagination = deliveriesQuery.data?.pagination

  const resetForm = () => {
    setForm({
      deliveryType: "PARCEL",
      flatId: "",
      residentId: "",
      deliveryCompany: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      trackingId: "",
      packageDescription: "",
      notes: "",
    })
  }

  const handleCreate = async () => {
    if (!form.flatId || !form.deliveryCompany.trim()) {
      toast.error("Flat and delivery company are required")
      return
    }

    try {
      await createMutation.mutateAsync({
        deliveryType: form.deliveryType,
        flatId: form.flatId,
        residentId: form.residentId || undefined,
        deliveryCompany: form.deliveryCompany,
        deliveryPersonName:
          form.deliveryPersonName || undefined,
        deliveryPersonPhone:
          form.deliveryPersonPhone || undefined,
        trackingId: form.trackingId || undefined,
        packageDescription:
          form.packageDescription || undefined,
        notes: form.notes || undefined,
      })

      toast.success("Delivery recorded")
      resetForm()
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to record delivery"
        )
      )
    }
  }

  const handleStatusUpdate = async (
    delivery: SecurityDelivery,
    nextStatus: Exclude<DeliveryStatus, "ALL">,
    rethrow = false
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        deliveryId: delivery._id,
        status: nextStatus,
      })

      toast.success("Delivery updated")
      setConfirmDelivery(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to update delivery"
        )
      )

      if (rethrow) {
        throw error
      }
    }
  }

  const setFilterStatus = (value: DeliveryStatus) => {
    setStatus(value)
    setPage(1)
  }

  const setSearchQuery = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">
          Delivery & Parcels
        </h1>
        <p className="text-sm text-[#637083]">
          Record gate deliveries, notify residents, and close parcel history.
        </p>
      </div>

      <DeliveryForm
        flats={flats}
        flatsLoading={flatsQuery.isLoading}
        form={form}
        isSubmitting={createMutation.isPending}
        onFormChange={setForm}
        onSubmit={handleCreate}
      />

      <div className={panelClassName}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8782]" />
            <input
              type="search"
              className={`${inputClassName} pl-9`}
              value={search}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search flat, resident, company, person, or tracking ID"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  status === filter.value
                    ? primaryButtonClassName
                    : outlineButtonClassName
                }
                onClick={() => setFilterStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {deliveriesQuery.isLoading ? (
        <LoadingState label="Loading deliveries..." />
      ) : deliveriesQuery.isError ? (
        <ErrorState label="Unable to load deliveries." />
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="No deliveries found"
          description="Newly recorded deliveries will appear here."
        />
      ) : (
        <>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={thClassName}>Type</th>
                  <th className={thClassName}>Flat</th>
                  <th className={thClassName}>Resident</th>
                  <th className={thClassName}>Delivery Company</th>
                  <th className={thClassName}>Received Time</th>
                  <th className={thClassName}>Status</th>
                  <th className={thClassName}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery._id}>
                    <td className={tdClassName}>
                      {formatLabel(delivery.deliveryType)}
                    </td>
                    <td className={tdClassName}>
                      {delivery.flatNumber || delivery.flatId}
                    </td>
                    <td className={tdClassName}>
                      <p>
                        {delivery.residentName ||
                          delivery.residentId ||
                          "-"}
                      </p>
                      {delivery.residentPhone ? (
                        <p className="text-xs text-[#637083]">
                          {delivery.residentPhone}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdClassName}>
                      <p className="font-medium">
                        {delivery.deliveryCompany}
                      </p>
                      {delivery.trackingId ? (
                        <p className="text-xs text-[#637083]">
                          {delivery.trackingId}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdClassName}>
                      {formatDateTime(delivery.receivedAt)}
                    </td>
                    <td className={tdClassName}>
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className={tdClassName}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={outlineButtonClassName}
                          onClick={() =>
                            setSelectedDelivery(delivery)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        {delivery.status === "WAITING" ? (
                          <button
                            type="button"
                            className={outlineButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                  delivery,
                                  "NOTIFIED"
                                )
                            }
                          >
                            <BellRing className="h-4 w-4" />
                            Notify
                          </button>
                        ) : null}

                        {delivery.status === "WAITING" ||
                        delivery.status === "NOTIFIED" ? (
                          <>
                            <button
                              type="button"
                              className={primaryButtonClassName}
                              disabled={
                                updateStatusMutation.isPending
                              }
                              onClick={() =>
                                setConfirmDelivery({
                                  delivery,
                                  status: "COLLECTED",
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Collected
                            </button>
                            <button
                              type="button"
                              className={outlineButtonClassName}
                              disabled={
                                updateStatusMutation.isPending
                              }
                              onClick={() =>
                                setConfirmDelivery({
                                  delivery,
                                  status: "RETURNED",
                                })
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                              Returned
                            </button>
                          </>
                        ) : null}
                      </div>
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
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <DeliveryDetails
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
      />

      <ConfirmActionModal
        actionLabel={
          confirmDelivery?.status === "RETURNED"
            ? "Mark Returned"
            : "Mark Collected"
        }
        isOpen={Boolean(confirmDelivery)}
        isSubmitting={updateStatusMutation.isPending}
        message={
          confirmDelivery?.status === "RETURNED"
            ? "Mark this delivery as returned?"
            : "Mark this delivery as collected?"
        }
        title="Update Delivery Status"
        variant={
          confirmDelivery?.status === "RETURNED"
            ? "danger"
            : "primary"
        }
        onClose={() => setConfirmDelivery(null)}
        onConfirm={() =>
          confirmDelivery
            ? handleStatusUpdate(
                confirmDelivery.delivery,
                confirmDelivery.status,
                true
              )
            : Promise.resolve()
        }
      />
    </div>
  )
}

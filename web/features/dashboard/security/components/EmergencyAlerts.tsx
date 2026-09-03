"use client"

import { useState } from "react"
import {
  BellRing,
  CheckCircle2,
  Eye,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  useEmergencyAlerts,
  useUpdateEmergencyAlertStatus,
} from "../hooks/useAlerts"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import type {
  EmergencyAlert,
  EmergencyAlertStatus,
} from "../services/alert.service"
import {
  DetailGrid,
  DetailModal,
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
import { ResolveAlertModal } from "./ResolveAlertModal"

const PAGE_SIZE = 10

const statusFilters: Array<{
  label: string
  value: EmergencyAlertStatus
}> = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Acknowledged", value: "ACKNOWLEDGED" },
  { label: "Responding", value: "RESPONDING" },
  { label: "Resolved", value: "RESOLVED" },
]

export function EmergencyAlerts() {
  const [status, setStatus] =
    useState<EmergencyAlertStatus>("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedAlert, setSelectedAlert] =
    useState<EmergencyAlert | null>(null)
  const [resolvingAlert, setResolvingAlert] =
    useState<EmergencyAlert | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const alertsQuery = useEmergencyAlerts({
    status,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  })
  const updateStatusMutation =
    useUpdateEmergencyAlertStatus()

  const alerts = alertsQuery.data?.alerts ?? []
  const pagination = alertsQuery.data?.pagination

  const handleStatusUpdate = async (
    alert: EmergencyAlert,
    nextStatus: Exclude<EmergencyAlertStatus, "ALL">
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        alertId: alert._id,
        status: nextStatus,
      })

      toast.success("Emergency alert updated")
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to update emergency alert"
        )
      )
    }
  }

  const handleResolveAlert = async (
    resolutionNotes: string
  ) => {
    if (!resolvingAlert) return

    try {
      await updateStatusMutation.mutateAsync({
        alertId: resolvingAlert._id,
        status: "RESOLVED",
        resolutionNotes,
      })

      toast.success("Emergency alert resolved")
      setResolvingAlert(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to resolve emergency alert"
        )
      )
      throw error
    }
  }

  const setFilterStatus = (value: EmergencyAlertStatus) => {
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
          Emergency / SOS Alerts
        </h1>
        <p className="text-sm text-[#637083]">
          Track active emergencies, response status, and resolved alert history.
        </p>
      </div>

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
              placeholder="Search alert type, resident, flat, or message"
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

      {alertsQuery.isLoading ? (
        <LoadingState label="Loading emergency alerts..." />
      ) : alertsQuery.isError ? (
        <ErrorState label="Unable to load emergency alerts." />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No emergency alerts found"
          description="Emergency alerts will remain available here after resolution."
        />
      ) : (
        <>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={thClassName}>Alert Type</th>
                  <th className={thClassName}>Resident</th>
                  <th className={thClassName}>Flat / Unit</th>
                  <th className={thClassName}>Triggered Time</th>
                  <th className={thClassName}>Status</th>
                  <th className={thClassName}>Message</th>
                  <th className={thClassName}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert._id}
                    className={
                      alert.status === "ACTIVE"
                        ? "bg-red-50/45"
                        : undefined
                    }
                  >
                    <td className={tdClassName}>
                      <p className="font-medium">
                        {formatLabel(alert.alertType)}
                      </p>
                    </td>
                    <td className={tdClassName}>
                      <p>
                        {alert.residentName ||
                          alert.residentId}
                      </p>
                      {alert.residentPhone ? (
                        <p className="text-xs text-[#637083]">
                          {alert.residentPhone}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdClassName}>
                      {alert.flatNumber || alert.flatId}
                    </td>
                    <td className={tdClassName}>
                      {formatDateTime(alert.triggeredAt)}
                    </td>
                    <td className={tdClassName}>
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className={tdClassName}>
                      {alert.message || "-"}
                    </td>
                    <td className={tdClassName}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={outlineButtonClassName}
                          onClick={() =>
                            setSelectedAlert(alert)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        {alert.status === "ACTIVE" ? (
                          <button
                            type="button"
                            className={outlineButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                alert,
                                "ACKNOWLEDGED"
                              )
                            }
                          >
                            <BellRing className="h-4 w-4" />
                            Acknowledge
                          </button>
                        ) : null}

                        {alert.status === "ACTIVE" ||
                        alert.status === "ACKNOWLEDGED" ? (
                          <button
                            type="button"
                            className={primaryButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                alert,
                                "RESPONDING"
                              )
                            }
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Responding
                          </button>
                        ) : null}

                        {alert.status !== "RESOLVED" ? (
                          <button
                            type="button"
                            className={outlineButtonClassName}
                            disabled={
                              updateStatusMutation.isPending
                            }
                            onClick={() => setResolvingAlert(alert)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Resolve
                          </button>
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

      {selectedAlert ? (
        <DetailModal
          title={formatLabel(selectedAlert.alertType)}
          subtitle={`Alert ${formatLabel(selectedAlert.status)}`}
          onClose={() => setSelectedAlert(null)}
        >
          <DetailGrid
            items={[
              {
                label: "Status",
                value: <StatusBadge status={selectedAlert.status} />,
              },
              {
                label: "Resident",
                value:
                  selectedAlert.residentName ??
                  selectedAlert.residentId,
              },
              {
                label: "Phone",
                value: selectedAlert.residentPhone ?? "-",
              },
              {
                label: "Flat / Unit",
                value:
                  selectedAlert.flatNumber ??
                  selectedAlert.flatId,
              },
              {
                label: "Triggered",
                value: formatDateTime(
                  selectedAlert.triggeredAt
                ),
              },
              {
                label: "Acknowledged",
                value: formatDateTime(
                  selectedAlert.acknowledgedAt
                ),
              },
              {
                label: "Responding",
                value: formatDateTime(
                  selectedAlert.respondingAt
                ),
              },
              {
                label: "Resolved",
                value: formatDateTime(
                  selectedAlert.resolvedAt
                ),
              },
              {
                label: "Message",
                value: selectedAlert.message ?? "-",
              },
              {
                label: "Resolution Notes",
                value: selectedAlert.resolutionNotes ?? "-",
              },
            ]}
          />
        </DetailModal>
      ) : null}

      <ResolveAlertModal
        alert={resolvingAlert}
        isSubmitting={updateStatusMutation.isPending}
        onClose={() => setResolvingAlert(null)}
        onResolve={handleResolveAlert}
      />
    </div>
  )
}

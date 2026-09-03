"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, LogIn, LogOut } from "lucide-react"
import { toast } from "sonner"

import {
  useCheckInVisitor,
  useCheckoutVisitor,
  useRegisterManualVisitor,
  useVerifyVisitorPass,
  useVisitorRecords,
} from "../hooks/useVisitors"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityFlats } from "../hooks/useSecurityData"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import type {
  VisitorPass,
  VisitorRecord,
  VisitorRecordEntryType,
  VisitorRecordStatus,
} from "../services/visitor.service"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
  StatusBadge,
  formatDateTime,
  outlineButtonClassName,
  primaryButtonClassName,
  tableClassName,
  tableWrapClassName,
  tdClassName,
  thClassName,
} from "./SecurityUi"
import { ConfirmActionModal } from "./ConfirmActionModal"
import { VisitorDetails } from "./VisitorDetails"
import { VisitorFilters } from "./VisitorFilters"
import {
  ManualVisitorPanel,
  VisitorEntryModeButtons,
  VisitorScanPanel,
  type VisitorEntryMode,
} from "./VisitorEntryPanels"

const PAGE_SIZE = 10

export function SecurityVisitors() {
  const searchParams = useSearchParams()

  const [token, setToken] = useState("")
  const [verifiedPass, setVerifiedPass] =
    useState<VisitorPass | null>(null)
  const [selectedRecord, setSelectedRecord] =
    useState<VisitorRecord | null>(null)
  const [checkoutRecord, setCheckoutRecord] =
    useState<VisitorRecord | null>(null)
  const [status, setStatus] =
    useState<VisitorRecordStatus>("ALL")
  const [entryType, setEntryType] =
    useState<VisitorRecordEntryType>("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [manualForm, setManualForm] = useState({
    flatId: "",
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    vehicleNumber: "",
  })

  const initialMode =
    searchParams.get("mode") === "manual"
      ? "manual"
      : "scan"

  const [mode, setMode] =
    useState<VisitorEntryMode>(initialMode)

  const flatsQuery = useSecurityFlats()
  const debouncedSearch = useDebouncedValue(search, 350)
  const visitorRecordsQuery = useVisitorRecords({
    status,
    entryType,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const verifyPassMutation = useVerifyVisitorPass()
  const checkInMutation = useCheckInVisitor()
  const checkoutMutation = useCheckoutVisitor()
  const manualEntryMutation = useRegisterManualVisitor()

  const flats = flatsQuery.data?.flats ?? []
  const records = visitorRecordsQuery.data?.records ?? []
  const pagination = visitorRecordsQuery.data?.pagination

  const handleVerify = async () => {
    if (!token.trim()) {
      toast.error("Enter or scan a visitor token")
      return
    }

    try {
      const result = await verifyPassMutation.mutateAsync(
        token.trim()
      )

      setVerifiedPass(result)
      toast.success("Visitor pass verified")
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to verify visitor pass"
        )
      )
    }
  }

  const handleTokenChange = (value: string) => {
    setToken(value)

    if (verifiedPass) {
      setVerifiedPass(null)
    }
  }

  const handleVerifiedCheckIn = async () => {
    if (!verifiedPass?._id) return

    try {
      await checkInMutation.mutateAsync(verifiedPass._id)
      toast.success("Visitor checked in successfully")
      setToken("")
      setVerifiedPass(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to check in visitor"
        )
      )
    }
  }

  const handleRecordCheckIn = async (record: VisitorRecord) => {
    if (!record.visitorPassId) return

    try {
      await checkInMutation.mutateAsync(record.visitorPassId)
      toast.success("Visitor checked in successfully")
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to check in visitor"
        )
      )
    }
  }

  const handleCheckout = async () => {
    if (!checkoutRecord?.visitId) return

    try {
      await checkoutMutation.mutateAsync(checkoutRecord.visitId)
      toast.success("Visitor checked out successfully")
      setCheckoutRecord(null)
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to check out visitor"
        )
      )
      throw error
    }
  }

  const handleManualEntry = async () => {
    if (manualEntryMutation.isPending) return

    if (
      !manualForm.flatId ||
      !manualForm.visitorName.trim()
    ) {
      toast.error("Flat and visitor name are required")
      return
    }

    try {
      await manualEntryMutation.mutateAsync({
        flatId: manualForm.flatId,
        visitorName: manualForm.visitorName,
        visitorPhone:
          manualForm.visitorPhone || undefined,
        purpose: manualForm.purpose || undefined,
        vehicleNumber:
          manualForm.vehicleNumber || undefined,
      })

      toast.success("Visitor registered and checked in")

      setManualForm({
        flatId: "",
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        vehicleNumber: "",
      })
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to register visitor"
        )
      )
    }
  }

  const setFilterStatus = (value: VisitorRecordStatus) => {
    setStatus(value)
    setPage(1)
  }

  const setFilterEntryType = (
    value: VisitorRecordEntryType
  ) => {
    setEntryType(value)
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
          Visitors
        </h1>

        <p className="text-sm text-[#637083]">
          Manage upcoming passes, active entries, and completed visits.
        </p>
      </div>

      <VisitorEntryModeButtons
        mode={mode}
        onModeChange={setMode}
      />

      {mode === "scan" ? (
        <VisitorScanPanel
          token={token}
          verifiedPass={verifiedPass}
          isCheckingIn={checkInMutation.isPending}
          isVerifying={verifyPassMutation.isPending}
          onCheckIn={handleVerifiedCheckIn}
          onTokenChange={handleTokenChange}
          onVerify={handleVerify}
        />
      ) : (
        <ManualVisitorPanel
          flats={flats}
          flatsLoading={flatsQuery.isLoading}
          form={manualForm}
          isSubmitting={manualEntryMutation.isPending}
          onFormChange={setManualForm}
          onSubmit={handleManualEntry}
        />
      )}

      <VisitorFilters
        entryType={entryType}
        search={search}
        status={status}
        onEntryTypeChange={setFilterEntryType}
        onSearchChange={setSearchQuery}
        onStatusChange={setFilterStatus}
      />

      {visitorRecordsQuery.isLoading ? (
        <LoadingState label="Loading visitor records..." />
      ) : visitorRecordsQuery.isError ? (
        <ErrorState label="Unable to load visitor records." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No visitor records found"
          description="Try a different search or filter."
        />
      ) : (
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
                  <th className={thClassName}>
                    Expected / Check-In Time
                  </th>
                  <th className={thClassName}>Check-Out Time</th>
                  <th className={thClassName}>Vehicle Number</th>
                  <th className={thClassName}>Status</th>
                  <th className={thClassName}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td className={tdClassName}>
                      <p className="font-medium">
                        {record.visitorName}
                      </p>
                    </td>
                    <td className={tdClassName}>
                      {record.visitorPhone || "-"}
                    </td>
                    <td className={tdClassName}>
                      {record.flatNumber || record.flatId}
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
                      {record.vehicleNumber || "-"}
                    </td>
                    <td className={tdClassName}>
                      <StatusBadge status={record.status} />
                    </td>
                    <td className={tdClassName}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={outlineButtonClassName}
                          onClick={() =>
                            setSelectedRecord(record)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        {record.status === "UPCOMING" ? (
                          <button
                            type="button"
                            className={primaryButtonClassName}
                            onClick={() =>
                              handleRecordCheckIn(record)
                            }
                            disabled={
                              checkInMutation.isPending ||
                              !record.visitorPassId
                            }
                          >
                            <LogIn className="h-4 w-4" />
                            Check In
                          </button>
                        ) : null}

                        {record.status === "ACTIVE" ? (
                          <button
                            type="button"
                            className={primaryButtonClassName}
                            onClick={() =>
                              setCheckoutRecord(record)
                            }
                            disabled={
                              checkoutMutation.isPending ||
                              !record.visitId
                            }
                          >
                            <LogOut className="h-4 w-4" />
                            Check Out
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

      <VisitorDetails
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <ConfirmActionModal
        actionLabel="Check Out"
        isOpen={Boolean(checkoutRecord)}
        isSubmitting={checkoutMutation.isPending}
        message={
          checkoutRecord
            ? `Are you sure you want to check out ${checkoutRecord.visitorName} from Flat ${checkoutRecord.flatNumber || checkoutRecord.flatId}?`
            : ""
        }
        title="Check Out Visitor"
        variant="danger"
        onClose={() => setCheckoutRecord(null)}
        onConfirm={handleCheckout}
      />
    </div>
  )
}

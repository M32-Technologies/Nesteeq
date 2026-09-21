"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import {
  useCheckInVisitor,
  useCheckoutVisitor,
  useRegisterManualVisitor,
  useVerifyVisitorPass,
  useVisitorRecords,
} from "../hooks/useVisitors"
import {
  useAssignParkingSlot,
  useParkingSlots,
} from "../hooks/useParking"
import { toParkingVehicleType } from "../constants/parking-vehicle-types"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityFlats } from "../hooks/useSecurityData"
import { getSecurityApiErrorMessage } from "../utils/api-error"
import {
  isValidVehicleNumber,
  normalizeVehicleNumber,
} from "../utils/vehicle-validation"
import type {
  VisitorPass,
  VisitorRecord,
  VisitorRecordEntryType,
  VisitorRecordStatus,
} from "../schemas/visitor"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "./SecurityUi"
import { ConfirmActionModal } from "./ConfirmActionModal"
import { VisitorDetails } from "./VisitorDetails"
import { VisitorFilters } from "./VisitorFilters"
import { VisitorRecordsTable } from "./VisitorRecordsTable"
import {
  ManualVisitorPanel,
  VisitorEntryModeButtons,
  VisitorScanPanel,
  type VisitorEntryMode,
} from "./VisitorEntryPanels"

const PAGE_SIZE = 10
const indianMobileNumberRegex =
  /^(?:\+91|91|0)?[6-9]\d{9}$/

const normalizePhoneNumber = (value: string) =>
  value.replace(/[\s-]/g, "")

const isValidIndianPhoneNumber = (value: string) =>
  indianMobileNumberRegex.test(normalizePhoneNumber(value))

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
    vehicleType: "",
    parkingSlotId: "",
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
  const manualVehicleType = toParkingVehicleType(manualForm.vehicleType)
  const manualAvailableSlotsQuery = useParkingSlots({
    status: "AVAILABLE",
    vehicleType: manualVehicleType,
    limit: 100,
  }, {
    enabled: Boolean(manualVehicleType),
  })
  const verifyPassMutation = useVerifyVisitorPass()
  const checkInMutation = useCheckInVisitor()
  const checkoutMutation = useCheckoutVisitor()
  const manualEntryMutation = useRegisterManualVisitor()
  const assignParkingMutation = useAssignParkingSlot()

  const flats = flatsQuery.data?.flats ?? []
  const records = visitorRecordsQuery.data?.records ?? []
  const manualAvailableSlots = (
    manualAvailableSlotsQuery.data?.slots ?? []
  ).filter(
    (slot) =>
      slot.status === "AVAILABLE" && !slot.currentAssignment
  )
  const pagination = visitorRecordsQuery.data?.pagination

  const handleVerify = async () => {
    await verifyToken(token)
  }

  const verifyToken = async (tokenValue: string) => {
    const trimmedToken = tokenValue.trim()

    if (!trimmedToken) {
      toast.error("Enter or scan a visitor token")
      return false
    }

    setToken(trimmedToken)
    setVerifiedPass(null)

    try {
      const result = await verifyPassMutation.mutateAsync(
        trimmedToken
      )

      setVerifiedPass(result)
      toast.success("Visitor pass verified")
      return true
    } catch (error) {
      toast.error(
        getSecurityApiErrorMessage(
          error,
          "Unable to verify visitor pass"
        )
      )
      return false
    }
  }

  const handleTokenChange = (value: string) => {
    setToken(value)

    if (verifiedPass) {
      setVerifiedPass(null)
    }
  }

  const handleVerifiedCheckIn = async () => {
    const trimmedToken = token.trim()

    if (!verifiedPass || !trimmedToken) return

    try {
      await checkInMutation.mutateAsync({
        token: trimmedToken,
      })
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
      await checkInMutation.mutateAsync({
        visitorPassId: record.visitorPassId,
      })
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

    const trimmedVisitorPhone =
      manualForm.visitorPhone.trim()
    const normalizedVehicleNumber = normalizeVehicleNumber(
      manualForm.vehicleNumber
    )
    const vehicleType = toParkingVehicleType(manualForm.vehicleType)

    if (
      !manualForm.flatId ||
      !manualForm.visitorName.trim()
    ) {
      toast.error("Flat and visitor name are required")
      return
    }

    if (
      trimmedVisitorPhone &&
      !isValidIndianPhoneNumber(trimmedVisitorPhone)
    ) {
      toast.error("Enter a valid mobile number")
      return
    }

    if (
      normalizedVehicleNumber &&
      !isValidVehicleNumber(normalizedVehicleNumber)
    ) {
      toast.error("Enter a valid vehicle number")
      return
    }

    if (normalizedVehicleNumber && !vehicleType) {
      toast.error("Vehicle type is required when vehicle number is added")
      return
    }

    if (manualForm.vehicleType && !normalizedVehicleNumber) {
      toast.error("Vehicle number is required when vehicle type is added")
      return
    }

    if (
      manualForm.parkingSlotId &&
      !normalizedVehicleNumber
    ) {
      toast.error("Vehicle number is required for parking")
      return
    }

    if (manualForm.parkingSlotId && !vehicleType) {
      toast.error("Vehicle type is required for parking")
      return
    }

    try {
      const visit = await manualEntryMutation.mutateAsync({
        flatId: manualForm.flatId,
        visitorName: manualForm.visitorName,
        visitorPhone:
          trimmedVisitorPhone || undefined,
        purpose: manualForm.purpose || undefined,
        vehicleNumber:
          normalizedVehicleNumber || undefined,
        vehicleType: vehicleType || undefined,
      })

      if (manualForm.parkingSlotId) {
        if (!vehicleType) {
          toast.error("Vehicle type is required for parking")
          return
        }

        try {
          await assignParkingMutation.mutateAsync({
            slotId: manualForm.parkingSlotId,
            flatId: manualForm.flatId,
            visitorVisitId: visit._id,
            visitorName: manualForm.visitorName,
            vehicleNumber: normalizedVehicleNumber,
            vehicleType,
          })
          toast.success("Visitor registered and parking assigned")
        } catch (error) {
          toast.error(
            getSecurityApiErrorMessage(
              error,
              "Visitor registered, but unable to assign parking"
            )
          )
        }
      } else {
        toast.success("Visitor registered and checked in")
      }

      setManualForm({
        flatId: "",
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        vehicleNumber: "",
        vehicleType: "",
        parkingSlotId: "",
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
          onScan={verifyToken}
          onTokenChange={handleTokenChange}
          onVerify={handleVerify}
        />
      ) : (
        <ManualVisitorPanel
          flats={flats}
          flatsLoading={flatsQuery.isLoading}
          form={manualForm}
          availableSlots={manualAvailableSlots}
          availableSlotsLoading={manualAvailableSlotsQuery.isLoading}
          isSubmitting={
            manualEntryMutation.isPending ||
            assignParkingMutation.isPending
          }
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
        <VisitorRecordsTable
          records={records}
          pagination={pagination}
          availableSlots={[]}
          availableSlotsLoading={false}
          isCheckingIn={checkInMutation.isPending}
          isCheckingOut={checkoutMutation.isPending}
          onCheckIn={handleRecordCheckIn}
          onCheckout={setCheckoutRecord}
          onPageChange={setPage}
          onView={setSelectedRecord}
        />
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
            ? `Are you sure you want to check out ${checkoutRecord.visitorName} from Flat ${checkoutRecord.flatNumber || "-"}?`
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

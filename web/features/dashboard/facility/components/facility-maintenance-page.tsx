"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  approveMaintenance,
  approveMaintenanceCost,
  assignMaintenance,
  cancelMaintenance,
  closeMaintenance,
  getApiErrorMessage,
  invalidateFacilityData,
  rejectMaintenance,
  rejectMaintenanceCost,
  updateMaintenance,
  updateMaintenanceProgress,
  updateMaintenanceStatus,
  useComplaint,
  useMaintenance,
  useMaintenanceDetail,
  useMaintenanceStats,
} from "../facility.api"
import {
  type AssignPayload,
  type ComplaintCategory,
  type Maintenance,
  type MaintenanceStatus,
  type MaintenanceUpdatePayload,
  type Priority,
} from "../facility.types"
import {
  matchesSearch,
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "../facility.utils"
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  priorityWeight,
} from "./facility-ui"
import { MaintenanceDetailsDrawer } from "./maintenance/maintenance-details-drawer"
import {
  MaintenanceFilters,
  type MaintenanceSortKey,
} from "./maintenance/maintenance-filters"
import { MaintenanceStats } from "./maintenance/maintenance-stats"
import { MaintenanceTable } from "./maintenance/maintenance-table"

const maintenanceManagerTransitions: Partial<
  Record<MaintenanceStatus, MaintenanceStatus[]>
> = {
  PENDING: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["ON_HOLD"],
  ON_HOLD: ["IN_PROGRESS"],
  REJECTED: ["ASSIGNED", "IN_PROGRESS"],
}

const cancellableMaintenanceStatuses = new Set<MaintenanceStatus>([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
])

const approvalMaintenanceStatuses = new Set<MaintenanceStatus>([
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
])

function getMaintenanceStatusOptions(status: MaintenanceStatus) {
  return maintenanceManagerTransitions[status] ?? []
}

function getProgressStatusOptions(status: MaintenanceStatus) {
  if (status === "ASSIGNED" || status === "REJECTED") {
    return ["IN_PROGRESS"] as const
  }

  if (status === "IN_PROGRESS" || status === "ON_HOLD") {
    return ["IN_PROGRESS", "ON_HOLD"] as const
  }

  return [] as const
}

function getMaintenanceSearchValues(item: Maintenance) {
  return [
    item._id,
    item.complaint,
    item.title,
    item.description,
    item.resident,
    item.apartment,
    item.flat,
    item.category,
    item.priority,
    item.status,
    item.assignedStaff,
  ]
}

function sortMaintenance(items: Maintenance[], sort: MaintenanceSortKey) {
  return [...items].sort((left, right) => {
    if (sort === "oldest") {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    }

    if (sort === "priority") {
      return priorityWeight(right.priority) - priorityWeight(left.priority)
    }

    if (sort === "status") {
      return left.status.localeCompare(right.status)
    }

    if (sort === "category") {
      return left.category.localeCompare(right.category)
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

export default function FacilityMaintenancePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | MaintenanceStatus>("all")
  const [priority, setPriority] = useState<"all" | Priority>("all")
  const [category, setCategory] = useState<"all" | ComplaintCategory>("all")
  const [sort, setSort] = useState<MaintenanceSortKey>("newest")
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(
    null
  )

  const maintenanceQuery = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      category: category === "all" ? undefined : category,
      page: 1,
      limit: 100,
    }),
    [category, priority, status]
  )

  const maintenanceListQuery = useMaintenance(maintenanceQuery)
  const statsQuery = useMaintenanceStats()
  const detailQuery = useMaintenanceDetail(selectedMaintenanceId)
  const selectedMaintenance = detailQuery.data ?? null
  const relatedComplaintQuery = useComplaint(selectedMaintenance?.complaint ?? null)

  const maintenance = useMemo(
    () => maintenanceListQuery.data?.maintenance ?? [],
    [maintenanceListQuery.data?.maintenance]
  )
  const visibleMaintenance = useMemo(() => {
    const filtered = maintenance.filter((item) =>
      matchesSearch(getMaintenanceSearchValues(item), search)
    )

    return sortMaintenance(filtered, sort)
  }, [maintenance, search, sort])

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Maintenance updated")
    await invalidateFacilityData(queryClient)
  }

  const assignMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AssignPayload
    }) => assignMaintenance(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to assign maintenance")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
      remarks,
    }: {
      id: string
      status: MaintenanceStatus
      remarks?: string
    }) =>
      updateMaintenanceStatus(id, {
        status: nextStatus,
        remarks,
      }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update status")),
  })

  const progressMutation = useMutation({
    mutationFn: ({
      id,
      progressDetails,
      status: nextStatus,
      remarks,
    }: {
      id: string
      progressDetails: string
      status?: "IN_PROGRESS" | "ON_HOLD"
      remarks?: string
    }) =>
      updateMaintenanceProgress(id, {
        progressDetails,
        status: nextStatus,
        remarks,
      }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update progress")),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: MaintenanceUpdatePayload
    }) => updateMaintenance(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update maintenance")),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      approveMaintenance(id, remarks),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve maintenance")),
  })

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      remarks,
    }: {
      id: string
      reason: string
      remarks?: string
    }) => rejectMaintenance(id, { reason, remarks }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject maintenance")),
  })

  const approveCostMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      approveMaintenanceCost(id, remarks),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve maintenance cost")),
  })

  const rejectCostMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      remarks,
    }: {
      id: string
      reason: string
      remarks?: string
    }) => rejectMaintenanceCost(id, { reason, remarks }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject maintenance cost")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelMaintenance(id, reason),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel maintenance")),
  })

  const closeMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      closeMaintenance(id, remarks),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to close maintenance")),
  })

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)
    const assignedStaff = readRequiredFormString(formData, "assignedStaff")

    if (!assignedStaff) {
      toast.error("Technician user ID is required")
      return
    }

    assignMutation.mutate({
      id: selectedMaintenance._id,
      payload: {
        assignedStaff,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)
    const nextStatus = readRequiredFormString(formData, "status") as MaintenanceStatus

    statusMutation.mutate({
      id: selectedMaintenance._id,
      status: nextStatus,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleProgressUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)
    const progressDetails = readRequiredFormString(formData, "progressDetails")

    if (progressDetails.length < 5) {
      toast.error("Progress details must be at least 5 characters")
      return
    }

    progressMutation.mutate({
      id: selectedMaintenance._id,
      progressDetails,
      status: readFormString(formData, "status") as "IN_PROGRESS" | "ON_HOLD",
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)

    updateMutation.mutate({
      id: selectedMaintenance._id,
      payload: {
        title: readFormString(formData, "title"),
        description: readFormString(formData, "description"),
        category: readFormString(formData, "category") as ComplaintCategory,
        priority: readFormString(formData, "priority") as Priority,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
        managerRemarks: readFormString(formData, "managerRemarks"),
      },
    })
  }

  const handleApprove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)

    approveMutation.mutate({
      id: selectedMaintenance._id,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleReject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)
    const reason = readRequiredFormString(formData, "reason")

    if (!reason) {
      toast.error("Rejection reason is required")
      return
    }

    rejectMutation.mutate({
      id: selectedMaintenance._id,
      reason,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleApproveCost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)

    approveCostMutation.mutate({
      id: selectedMaintenance._id,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleRejectCost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)
    const reason = readRequiredFormString(formData, "reason")

    if (!reason) {
      toast.error("Cost rejection reason is required")
      return
    }

    rejectCostMutation.mutate({
      id: selectedMaintenance._id,
      reason,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleCancel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const confirmed = window.confirm("Cancel this maintenance work?")
    if (!confirmed) return

    const formData = new FormData(event.currentTarget)

    cancelMutation.mutate({
      id: selectedMaintenance._id,
      reason: readFormString(formData, "reason"),
    })
  }

  const handleClose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMaintenance) return

    const formData = new FormData(event.currentTarget)

    closeMutation.mutate({
      id: selectedMaintenance._id,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const statusOptions = selectedMaintenance
    ? getMaintenanceStatusOptions(selectedMaintenance.status)
    : []
  const progressOptions = selectedMaintenance
    ? getProgressStatusOptions(selectedMaintenance.status)
    : []
  const canApprove = selectedMaintenance
    ? approvalMaintenanceStatuses.has(selectedMaintenance.status)
    : false
  const canCancel = selectedMaintenance
    ? cancellableMaintenanceStatuses.has(selectedMaintenance.status)
    : false
  const canClose = selectedMaintenance?.status === "APPROVED"
  const canReviewCost = selectedMaintenance?.costReview?.status === "SUBMITTED"

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader title="Maintenance" eyebrow="Facility Manager" />

        <MaintenanceStats stats={statsQuery.data} />

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <MaintenanceFilters
            search={search}
            status={status}
            priority={priority}
            category={category}
            sort={sort}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />

          {maintenanceListQuery.isPending ? (
            <LoadingRows />
          ) : maintenanceListQuery.isError ? (
            <ErrorState
              title="Unable to load maintenance"
              message={getApiErrorMessage(
                maintenanceListQuery.error,
                "The maintenance list could not be loaded."
              )}
              isRetrying={maintenanceListQuery.isFetching}
              onRetry={() => void maintenanceListQuery.refetch()}
            />
          ) : visibleMaintenance.length === 0 ? (
            <EmptyState
              title="No maintenance found"
              message="There is no maintenance work matching the current view."
            />
          ) : (
            <MaintenanceTable
              maintenance={visibleMaintenance}
              onSelectMaintenance={setSelectedMaintenanceId}
            />
          )}
        </div>
      </div>

      <MaintenanceDetailsDrawer
        open={Boolean(selectedMaintenanceId)}
        maintenance={selectedMaintenance}
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        error={detailQuery.error}
        isRetrying={detailQuery.isFetching}
        onRetry={() => void detailQuery.refetch()}
        onDrawerClose={() => setSelectedMaintenanceId(null)}
        relatedComplaint={relatedComplaintQuery.data}
        isRelatedComplaintLoading={relatedComplaintQuery.isPending}
        statusOptions={statusOptions}
        progressOptions={progressOptions}
        canApprove={canApprove}
        canReviewCost={canReviewCost}
        canClose={canClose}
        canCancel={canCancel}
        onAssign={handleAssign}
        onStatusUpdate={handleStatusUpdate}
        onProgressUpdate={handleProgressUpdate}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        onApproveCost={handleApproveCost}
        onRejectCost={handleRejectCost}
        onClose={handleClose}
        onCancel={handleCancel}
        isAssigning={assignMutation.isPending}
        isUpdatingStatus={statusMutation.isPending}
        isUpdatingProgress={progressMutation.isPending}
        isUpdating={updateMutation.isPending}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isApprovingCost={approveCostMutation.isPending}
        isRejectingCost={rejectCostMutation.isPending}
        isClosing={closeMutation.isPending}
        isCancelling={cancelMutation.isPending}
      />
    </div>
  )
}

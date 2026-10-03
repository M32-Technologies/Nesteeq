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
  rejectMaintenance,
  rejectMaintenanceCost,
  updateMaintenance,
  updateMaintenanceStatus,
} from "@/features/dashboard/facility/maintenance/api/maintenance.api"
import {
  useMaintenanceDetailsQuery,
  useMaintenanceQuery,
  useMaintenanceStatsQuery,
} from "@/features/dashboard/facility/maintenance/hooks/use-maintenance-queries"
import type {
  Maintenance,
  MaintenanceStatus,
  MaintenanceUpdatePayload,
  Priority,
} from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import type { AssignPayload } from "@/features/dashboard/facility/shared/types/common.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  matchesSearch,
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "@/features/dashboard/facility/shared/utils/form-helpers"
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  priorityWeight,
} from "@/features/dashboard/facility/shared/components/facility-ui"
import { CreateMaintenanceModal } from "@/features/dashboard/facility/maintenance/components/create-maintenance-modal"
import { MaintenanceDetailsDrawer } from "@/features/dashboard/facility/maintenance/components/maintenance-details-drawer"
import {
  MaintenanceFilters,
  type MaintenanceSortKey,
} from "@/features/dashboard/facility/maintenance/components/maintenance-filters"
import { MaintenanceStats } from "@/features/dashboard/facility/maintenance/components/maintenance-stats"
import { MaintenanceTable } from "@/features/dashboard/facility/maintenance/components/maintenance-table"

const maintenanceManagerTransitions: Partial<
  Record<MaintenanceStatus, MaintenanceStatus[]>
> = {
  PENDING: ["ASSIGNED", "ON_HOLD"],
  ASSIGNED: ["IN_PROGRESS", "ON_HOLD"],
  IN_PROGRESS: ["ON_HOLD"],
  ON_HOLD: ["IN_PROGRESS"],
  WORK_COMPLETED: ["AWAITING_APPROVAL"],
  APPROVED: ["CLOSED"],
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

function getMaintenanceSearchValues(item: Maintenance) {
  return [
    item._id,
    item.title,
    item.description,
    item.category,
    item.priority,
    item.status,
    typeof item.assignedTo === "object" ? item.assignedTo?.name : item.assignedTo,
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

export function FacilityMaintenancePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | MaintenanceStatus>("all")
  const [priority, setPriority] = useState<"all" | Priority>("all")
  const [category, setCategory] = useState<"all" | string>("all")
  const [sort, setSort] = useState<MaintenanceSortKey>("newest")
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(
    null
  )
  const [drawerMode, setDrawerMode] = useState<"details" | "assign" | "edit">("details")
  const [isSavingAssignAndStatus, setIsSavingAssignAndStatus] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenMaintenance = (
    id: string,
    mode: "details" | "assign" | "edit" = "details"
  ) => {
    setSelectedMaintenanceId(id)
    setDrawerMode(mode)
  }

  const handleCloseDrawer = () => {
    setSelectedMaintenanceId(null)
    setDrawerMode("details")
  }

  const maintenanceQueryObj = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      category: category === "all" ? undefined : category,
      page: 1,
      limit: 100,
    }),
    [category, priority, status]
  )

  const maintenanceQuery = useMaintenanceQuery(maintenanceQueryObj)
  const statsQuery = useMaintenanceStatsQuery()
  const detailQuery = useMaintenanceDetailsQuery(selectedMaintenanceId)

  const maintenanceList = useMemo(
    () => maintenanceQuery.data?.maintenance ?? [],
    [maintenanceQuery.data?.maintenance]
  )
  const visibleMaintenance = useMemo(() => {
    const filtered = maintenanceList.filter((item) =>
      matchesSearch(getMaintenanceSearchValues(item), search)
    )

    return sortMaintenance(filtered, sort)
  }, [maintenanceList, search, sort])

  const selectedItem = detailQuery.data ?? null

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Maintenance updated")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expense-approvals"] }),
      queryClient.invalidateQueries({ queryKey: ["facility-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["maintenances"] }),
      queryClient.invalidateQueries({ queryKey: ["facility-maintenance"] }),
      queryClient.invalidateQueries({ queryKey: ["facility-maintenance-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["maintenance-technician"] }),
      queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
    ])
    await detailQuery.refetch()
    handleCloseDrawer()
  }

  const assignMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AssignPayload
    }) => assignMaintenance(id, payload),
    onSuccess: () => void handleSuccess("Maintenance assigned"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to assign maintenance")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
      notes,
    }: {
      id: string
      status: MaintenanceStatus
      notes?: string
    }) =>
      updateMaintenanceStatus(id, {
        status: nextStatus,
        notes,
      }),
    onSuccess: () => void handleSuccess("Status updated"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update status")),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: MaintenanceUpdatePayload
    }) => updateMaintenance(id, payload),
    onSuccess: () => void handleSuccess("Maintenance saved"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update maintenance")),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveMaintenance(id, { notes }),
    onSuccess: () => void handleSuccess("Maintenance approved"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve maintenance")),
  })

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      notes,
    }: {
      id: string
      reason: string
      notes?: string
    }) => rejectMaintenance(id, { reason }),
    onSuccess: () => void handleSuccess("Maintenance rejected"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject maintenance")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelMaintenance(id, { reason }),
    onSuccess: () => void handleSuccess("Maintenance cancelled"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel maintenance")),
  })

  const closeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      closeMaintenance(id, { notes }),
    onSuccess: () => void handleSuccess("Maintenance closed"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to close maintenance")),
  })

  const approveCostMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveMaintenanceCost(id, { notes }),
    onSuccess: () => void handleSuccess("Maintenance cost approved"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve cost")),
  })

  const rejectCostMutation = useMutation({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string
      reason: string
    }) => rejectMaintenanceCost(id, { reason }),
    onSuccess: () => void handleSuccess("Maintenance cost rejected"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject cost")),
  })

  const handleAssignAndStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)
    const selectedTechnicianId =
      readFormString(formData, "assignedStaff") ||
      readFormString(formData, "assignedStaffId") ||
      readFormString(formData, "technicianUserId") ||
      readFormString(formData, "assignedTo") ||
      readFormString(formData, "technicianId")
    const nextStatus = readFormString(formData, "status") as MaintenanceStatus | undefined
    const remarks = readFormString(formData, "remarks")

    const currentStaffId =
      typeof (selectedItem as any).assignedStaff === "object"
        ? (selectedItem as any).assignedStaff?._id || (selectedItem as any).assignedStaff?.id || (selectedItem as any).assignedStaff?.userId
        : (selectedItem as any).assignedStaff ||
          (typeof selectedItem.assignedTo === "object"
            ? selectedItem.assignedTo?._id || (selectedItem.assignedTo as any)?.id || (selectedItem.assignedTo as any)?.userId
            : selectedItem.assignedTo || "")

    const isTechnicianChanged = Boolean(
      selectedTechnicianId &&
      currentStaffId &&
      selectedTechnicianId !== currentStaffId &&
      String(selectedTechnicianId) !== String(currentStaffId)
    ) || Boolean(selectedTechnicianId && !currentStaffId)

    const isStatusChanged = Boolean(nextStatus && nextStatus !== selectedItem.status)

    if (!isTechnicianChanged && !isStatusChanged && (!remarks || !remarks.trim())) {
      toast.info("No changes to save")
      return
    }

    try {
      setIsSavingAssignAndStatus(true)

      if (isTechnicianChanged) {
        await assignMaintenance(selectedItem._id, {
          assignedStaff: selectedTechnicianId,
          assignedTo: selectedTechnicianId,
          technicianId: selectedTechnicianId,
          status: nextStatus,
          remarks: remarks || undefined,
          notes: remarks || undefined,
        } as any)
      } else if (isStatusChanged && nextStatus) {
        await updateMaintenanceStatus(selectedItem._id, {
          status: nextStatus,
          remarks: remarks || undefined,
          notes: remarks || undefined,
        })
      } else if (selectedTechnicianId) {
        await assignMaintenance(selectedItem._id, {
          assignedStaff: selectedTechnicianId,
          assignedTo: selectedTechnicianId,
          technicianId: selectedTechnicianId,
          status: nextStatus,
          remarks: remarks || undefined,
          notes: remarks || undefined,
        } as any)
      }

      toast.success("Assignment & Status updated")
      await queryClient.invalidateQueries({ queryKey: ["facility-maintenance"] })
      await detailQuery.refetch()
      handleCloseDrawer()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update assignment or status"))
    } finally {
      setIsSavingAssignAndStatus(false)
    }
  }

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)
    const assignedStaff =
      readRequiredFormString(formData, "assignedStaff") ||
      readRequiredFormString(formData, "assignedStaffId") ||
      readRequiredFormString(formData, "assignedTo") ||
      readRequiredFormString(formData, "technicianId")

    if (!assignedStaff) {
      toast.error("Technician user ID is required")
      return
    }

    assignMutation.mutate({
      id: selectedItem._id,
      payload: {
        assignedStaff,
        assignedTo: assignedStaff,
        technicianId: assignedStaff,
        notes: readFormString(formData, "remarks"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)
    const nextStatus = readRequiredFormString(formData, "status") as MaintenanceStatus

    statusMutation.mutate({
      id: selectedItem._id,
      status: nextStatus,
      notes: readFormString(formData, "remarks"),
    })
  }

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)

    updateMutation.mutate({
      id: selectedItem._id,
      payload: {
        title: readFormString(formData, "title"),
        description: readFormString(formData, "description"),
        category: readFormString(formData, "category"),
        priority: readFormString(formData, "priority") as Priority,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
      },
    })
  }

  const handleApprove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)

    approveMutation.mutate({
      id: selectedItem._id,
      notes: readFormString(formData, "remarks"),
    })
  }

  const handleReject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)
    const reason = readRequiredFormString(formData, "reason")

    if (!reason) {
      toast.error("Rejection reason is required")
      return
    }

    rejectMutation.mutate({
      id: selectedItem._id,
      reason,
      notes: readFormString(formData, "remarks"),
    })
  }

  const handleCancel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const confirmed = window.confirm("Cancel this maintenance work?")
    if (!confirmed) return

    const formData = new FormData(event.currentTarget)

    cancelMutation.mutate({
      id: selectedItem._id,
      reason: readFormString(formData, "reason"),
    })
  }

  const handleClose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)

    closeMutation.mutate({
      id: selectedItem._id,
      notes: readFormString(formData, "remarks"),
    })
  }

  const handleApproveCost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)

    approveCostMutation.mutate({
      id: selectedItem._id,
      notes: readFormString(formData, "remarks"),
    })
  }

  const handleRejectCost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(event.currentTarget)
    const reason = readRequiredFormString(formData, "reason")

    if (!reason) {
      toast.error("Reason is required to reject cost")
      return
    }

    rejectCostMutation.mutate({
      id: selectedItem._id,
      reason,
    })
  }

  const statusOptions = selectedItem
    ? getMaintenanceStatusOptions(selectedItem.status)
    : []
  const canApprove = selectedItem
    ? approvalMaintenanceStatuses.has(selectedItem.status)
    : false
  const canCancel = selectedItem
    ? cancellableMaintenanceStatuses.has(selectedItem.status)
    : false
  const canClose = selectedItem ? selectedItem.status === "APPROVED" : false
  const canReviewCost = selectedItem
    ? selectedItem.costStatus === "SUBMITTED"
    : false

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader
          title="Maintenance"
          eyebrow="Facility Manager"
          actions={
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#064C44] active:scale-[0.98]"
            >
              <span>+</span>
              <span>Create Maintenance</span>
            </button>
          }
        />

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

          {maintenanceQuery.isPending ? (
            <LoadingRows />
          ) : maintenanceQuery.isError ? (
            <ErrorState
              title="Unable to load maintenance"
              message={getApiErrorMessage(
                maintenanceQuery.error,
                "The maintenance list could not be loaded."
              )}
              isRetrying={maintenanceQuery.isFetching}
              onRetry={() => void maintenanceQuery.refetch()}
            />
          ) : visibleMaintenance.length === 0 ? (
            <EmptyState
              title="No maintenance tasks found"
              message="There are no maintenance tasks matching the current view."
            />
          ) : (
            <MaintenanceTable
              maintenance={visibleMaintenance}
              onSelectMaintenance={handleOpenMaintenance}
            />
          )}
        </div>
      </div>

      <MaintenanceDetailsDrawer
        open={Boolean(selectedMaintenanceId)}
        mode={drawerMode}
        maintenance={selectedItem}
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        error={detailQuery.error}
        isRetrying={detailQuery.isFetching}
        onRetry={() => void detailQuery.refetch()}
        onClose={handleCloseDrawer}
        statusOptions={statusOptions}
        canApprove={canApprove}
        canCancel={canCancel}
        canClose={canClose}
        canReviewCost={canReviewCost}
        onAssignAndStatus={handleAssignAndStatus}
        onAssign={handleAssign}
        onStatusUpdate={handleStatusUpdate}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
        onCloseMaintenance={handleClose}
        onApproveCost={handleApproveCost}
        onRejectCost={handleRejectCost}
        isSavingAssignAndStatus={isSavingAssignAndStatus}
        isAssigning={assignMutation.isPending}
        isUpdatingStatus={statusMutation.isPending}
        isUpdating={updateMutation.isPending}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isCancelling={cancelMutation.isPending}
        isClosing={closeMutation.isPending}
        isApprovingCost={approveCostMutation.isPending}
        isRejectingCost={rejectCostMutation.isPending}
      />

      <CreateMaintenanceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

export default FacilityMaintenancePage

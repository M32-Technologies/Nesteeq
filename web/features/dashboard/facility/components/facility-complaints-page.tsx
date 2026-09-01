"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  approveComplaint,
  assignComplaint,
  cancelComplaint,
  createMaintenance,
  getApiErrorMessage,
  invalidateFacilityData,
  rejectComplaint,
  updateComplaint,
  updateComplaintStatus,
  useComplaint,
  useComplaintMaintenance,
  useComplaints,
  useComplaintStats,
} from "../facility.api"
import {
  type AssignPayload,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type ComplaintUpdatePayload,
  type Priority,
} from "../facility.types"
import {
  matchesSearch,
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "../facility.utils"
import { ComplaintDetailsDrawer } from "./complaints/complaint-details-drawer"
import {
  ComplaintsFilters,
  type ComplaintSortKey,
} from "./complaints/complaints-filters"
import { ComplaintsStats } from "./complaints/complaints-stats"
import { ComplaintsTable } from "./complaints/complaints-table"
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  priorityWeight,
} from "./facility-ui"

const complaintManagerTransitions: Partial<
  Record<ComplaintStatus, ComplaintStatus[]>
> = {
  PENDING: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  APPROVED: ["CLOSED"],
  REJECTED: ["ASSIGNED", "IN_PROGRESS"],
}

const cancellableComplaintStatuses = new Set<ComplaintStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
])

const approvalComplaintStatuses = new Set<ComplaintStatus>([
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
])

const activeMaintenanceStatuses = new Set([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
])

function getComplaintStatusOptions(status: ComplaintStatus) {
  return complaintManagerTransitions[status] ?? []
}

function getComplaintSearchValues(complaint: Complaint) {
  return [
    complaint._id,
    complaint.title,
    complaint.description,
    complaint.resident,
    complaint.apartment,
    complaint.flat,
    complaint.category,
    complaint.priority,
    complaint.status,
    complaint.assignedStaff,
  ]
}

function sortComplaints(complaints: Complaint[], sort: ComplaintSortKey) {
  return [...complaints].sort((left, right) => {
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

export default function FacilityComplaintsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | ComplaintStatus>("all")
  const [priority, setPriority] = useState<"all" | Priority>("all")
  const [category, setCategory] = useState<"all" | ComplaintCategory>("all")
  const [sort, setSort] = useState<ComplaintSortKey>("newest")
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null
  )

  const complaintQuery = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      category: category === "all" ? undefined : category,
      page: 1,
      limit: 100,
    }),
    [category, priority, status]
  )

  const complaintsQuery = useComplaints(complaintQuery)
  const statsQuery = useComplaintStats()
  const detailQuery = useComplaint(selectedComplaintId)
  const relatedMaintenanceQuery = useComplaintMaintenance(selectedComplaintId)

  const complaints = useMemo(
    () => complaintsQuery.data?.complaints ?? [],
    [complaintsQuery.data?.complaints]
  )
  const visibleComplaints = useMemo(() => {
    const filtered = complaints.filter((complaint) =>
      matchesSearch(getComplaintSearchValues(complaint), search)
    )

    return sortComplaints(filtered, sort)
  }, [complaints, search, sort])

  const selectedComplaint = detailQuery.data ?? null

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Complaint updated")
    await invalidateFacilityData(queryClient)
  }

  const assignMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AssignPayload
    }) => assignComplaint(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to assign complaint")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
      remarks,
    }: {
      id: string
      status: ComplaintStatus
      remarks?: string
    }) =>
      updateComplaintStatus(id, {
        status: nextStatus,
        remarks,
      }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update status")),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ComplaintUpdatePayload
    }) => updateComplaint(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update complaint")),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      approveComplaint(id, remarks),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve complaint")),
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
    }) => rejectComplaint(id, { reason, remarks }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject complaint")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelComplaint(id, reason),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel complaint")),
  })

  const createMaintenanceMutation = useMutation({
    mutationFn: ({
      complaint,
      assignedStaff,
      estimatedCost,
      remarks,
    }: {
      complaint: string
      assignedStaff?: string
      estimatedCost?: number
      remarks?: string
    }) =>
      createMaintenance({
        complaint,
        assignedStaff,
        estimatedCost,
        remarks,
      }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to create maintenance")),
  })

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)
    const assignedStaff = readRequiredFormString(formData, "assignedStaff")

    if (!assignedStaff) {
      toast.error("Technician user ID is required")
      return
    }

    assignMutation.mutate({
      id: selectedComplaint._id,
      payload: {
        assignedStaff,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)
    const nextStatus = readRequiredFormString(formData, "status") as ComplaintStatus

    statusMutation.mutate({
      id: selectedComplaint._id,
      status: nextStatus,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)

    updateMutation.mutate({
      id: selectedComplaint._id,
      payload: {
        title: readFormString(formData, "title"),
        description: readFormString(formData, "description"),
        category: readFormString(formData, "category") as ComplaintCategory,
        priority: readFormString(formData, "priority") as Priority,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  const handleApprove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)

    approveMutation.mutate({
      id: selectedComplaint._id,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleReject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)
    const reason = readRequiredFormString(formData, "reason")

    if (!reason) {
      toast.error("Rejection reason is required")
      return
    }

    rejectMutation.mutate({
      id: selectedComplaint._id,
      reason,
      remarks: readFormString(formData, "remarks"),
    })
  }

  const handleCancel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const confirmed = window.confirm("Cancel this complaint?")
    if (!confirmed) return

    const formData = new FormData(event.currentTarget)

    cancelMutation.mutate({
      id: selectedComplaint._id,
      reason: readFormString(formData, "reason"),
    })
  }

  const handleCreateMaintenance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)

    createMaintenanceMutation.mutate({
      complaint: selectedComplaint._id,
      assignedStaff: readFormString(formData, "assignedStaff"),
      estimatedCost: readOptionalNumber(formData, "estimatedCost"),
      remarks: readFormString(formData, "remarks"),
    })
  }

  const statusOptions = selectedComplaint
    ? getComplaintStatusOptions(selectedComplaint.status)
    : []
  const canApprove = selectedComplaint
    ? approvalComplaintStatuses.has(selectedComplaint.status)
    : false
  const canCancel = selectedComplaint
    ? cancellableComplaintStatuses.has(selectedComplaint.status)
    : false

  const relatedMaintenance = relatedMaintenanceQuery.data?.maintenance ?? []
  const hasActiveMaintenance = relatedMaintenance.some((item) =>
    activeMaintenanceStatuses.has(item.status)
  )
  const canCreateMaintenance =
    selectedComplaint &&
    !hasActiveMaintenance &&
    ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REJECTED"].includes(
      selectedComplaint.status
    )

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader title="Complaints" eyebrow="Facility Manager" />

        <ComplaintsStats stats={statsQuery.data} />

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <ComplaintsFilters
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

          {complaintsQuery.isPending ? (
            <LoadingRows />
          ) : complaintsQuery.isError ? (
            <ErrorState
              title="Unable to load complaints"
              message={getApiErrorMessage(
                complaintsQuery.error,
                "The complaints list could not be loaded."
              )}
              isRetrying={complaintsQuery.isFetching}
              onRetry={() => void complaintsQuery.refetch()}
            />
          ) : visibleComplaints.length === 0 ? (
            <EmptyState
              title="No complaints found"
              message="There are no complaints matching the current view."
            />
          ) : (
            <ComplaintsTable
              complaints={visibleComplaints}
              onSelectComplaint={setSelectedComplaintId}
            />
          )}
        </div>
      </div>

      <ComplaintDetailsDrawer
        open={Boolean(selectedComplaintId)}
        complaint={selectedComplaint}
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        error={detailQuery.error}
        isRetrying={detailQuery.isFetching}
        onRetry={() => void detailQuery.refetch()}
        onClose={() => setSelectedComplaintId(null)}
        relatedMaintenance={relatedMaintenance}
        isRelatedMaintenanceLoading={relatedMaintenanceQuery.isPending}
        canCreateMaintenance={Boolean(canCreateMaintenance)}
        statusOptions={statusOptions}
        canApprove={canApprove}
        canCancel={canCancel}
        onAssign={handleAssign}
        onStatusUpdate={handleStatusUpdate}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
        onCreateMaintenance={handleCreateMaintenance}
        isAssigning={assignMutation.isPending}
        isUpdatingStatus={statusMutation.isPending}
        isUpdating={updateMutation.isPending}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isCancelling={cancelMutation.isPending}
        isCreatingMaintenance={createMaintenanceMutation.isPending}
      />
    </div>
  )
}

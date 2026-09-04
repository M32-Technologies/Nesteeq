"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  approveComplaint,
  assignComplaint,
  cancelComplaint,
  createMaintenance,
  rejectComplaint,
  updateComplaint,
  updateComplaintStatus,
} from "@/features/dashboard/facility/complaints/api/complaints.api"
import {
  useComplaint,
  useComplaints,
  useComplaintStats,
} from "@/features/dashboard/facility/complaints/hooks/use-complaints-queries"
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintUpdatePayload,
  Priority,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import type { AssignPayload } from "@/features/dashboard/facility/shared/types/common.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  matchesSearch,
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "@/features/dashboard/facility/shared/utils/form-helpers"
import { ComplaintDetailsDrawer } from "@/features/dashboard/facility/complaints/components/complaint-details-drawer"
import {
  ComplaintsFilters,
  type ComplaintSortKey,
} from "@/features/dashboard/facility/complaints/components/complaints-filters"
import { ComplaintsStats } from "@/features/dashboard/facility/complaints/components/complaints-stats"
import { ComplaintsTable } from "@/features/dashboard/facility/complaints/components/complaints-table"
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  priorityWeight,
} from "@/features/dashboard/facility/shared/components/facility-ui"

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

function getComplaintStatusOptions(status: ComplaintStatus) {
  return complaintManagerTransitions[status] ?? []
}

function getComplaintSearchValues(complaint: Complaint) {
  return [
    complaint._id,
    complaint.title,
    complaint.description,
    typeof complaint.residentId === "object" ? complaint.residentId?.name : complaint.residentId,
    complaint.category,
    complaint.priority,
    complaint.status,
    typeof complaint.assignedTo === "object" ? complaint.assignedTo?.name : complaint.assignedTo,
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

export function FacilityComplaintsPage() {
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
    await queryClient.invalidateQueries({ queryKey: ["facility-complaints"] })
  }

  const assignMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AssignPayload
    }) => assignComplaint(id, payload),
    onSuccess: () => void handleSuccess("Complaint assigned successfully"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to assign complaint")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
      notes,
    }: {
      id: string
      status: ComplaintStatus
      notes?: string
    }) =>
      updateComplaintStatus(id, {
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
      payload: ComplaintUpdatePayload
    }) => updateComplaint(id, payload),
    onSuccess: () => void handleSuccess("Complaint details saved"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update complaint")),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveComplaint(id, { notes }),
    onSuccess: () => void handleSuccess("Complaint approved"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to approve complaint")),
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
    }) => rejectComplaint(id, { reason }),
    onSuccess: () => void handleSuccess("Complaint rejected"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reject complaint")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelComplaint(id, { reason }),
    onSuccess: () => void handleSuccess("Complaint cancelled"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel complaint")),
  })

  const createMaintenanceMutation = useMutation({
    mutationFn: (payload: {
      title: string
      description?: string
      priority?: string
      assignedTo?: string
      complaintId?: string
    }) => createMaintenance(payload),
    onSuccess: () => void handleSuccess("Maintenance task created"),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to create maintenance")),
  })

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)
    const assignedTo = readRequiredFormString(formData, "assignedStaff")

    if (!assignedTo) {
      toast.error("Technician user ID is required")
      return
    }

    assignMutation.mutate({
      id: selectedComplaint._id,
      payload: {
        assignedTo,
        notes: readFormString(formData, "remarks"),
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
      notes: readFormString(formData, "remarks"),
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
      },
    })
  }

  const handleApprove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedComplaint) return

    const formData = new FormData(event.currentTarget)

    approveMutation.mutate({
      id: selectedComplaint._id,
      notes: readFormString(formData, "remarks"),
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
      notes: readFormString(formData, "remarks"),
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
      title: selectedComplaint.title,
      description: selectedComplaint.description,
      priority: selectedComplaint.priority,
      complaintId: selectedComplaint._id,
      assignedTo: readFormString(formData, "assignedStaff"),
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

  const canCreateMaintenance =
    selectedComplaint &&
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
        relatedMaintenance={[]}
        isRelatedMaintenanceLoading={false}
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

export default FacilityComplaintsPage

"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Gauge,
  Hammer,
  Loader2,
  Pencil,
  Timer,
  UserRoundCog,
  Wrench,
} from "lucide-react"
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
  complaintCategories,
  maintenanceStatuses,
  priorities,
  type AssignPayload,
  type ComplaintCategory,
  type Maintenance,
  type MaintenanceStatus,
  type MaintenanceUpdatePayload,
  type Priority,
} from "../facility.types"
import {
  ActivityTimeline,
  Drawer,
  EmptyState,
  ErrorState,
  FilterSelect,
  FormLabel,
  FormSelect,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  InfoGrid,
  LoadingRows,
  MetricCard,
  PageHeader,
  PriorityBadge,
  priorityWeight,
  SearchBox,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  Toolbar,
} from "./facility-ui"
import {
  matchesSearch,
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "../facility.utils"

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

type SortKey = "newest" | "oldest" | "priority" | "status" | "category"

const sortOptions = ["newest", "oldest", "priority", "status", "category"] as const

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

function sortMaintenance(items: Maintenance[], sort: SortKey) {
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
  const [sort, setSort] = useState<SortKey>("newest")
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total maintenance"
            value={statsQuery.data?.total}
            icon={Wrench}
            tone="green"
          />
          <MetricCard
            title="Pending"
            value={statsQuery.data?.pending}
            icon={Timer}
            tone="amber"
          />
          <MetricCard
            title="Assigned"
            value={statsQuery.data?.assigned}
            icon={UserRoundCog}
            tone="blue"
          />
          <MetricCard
            title="In progress"
            value={statsQuery.data?.inProgress}
            icon={Gauge}
            tone="green"
          />
          <MetricCard
            title="Completed"
            value={statsQuery.data?.completed}
            icon={CheckCircle2}
            tone="gray"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search maintenance"
            />
            <FilterSelect
              label="status"
              value={status}
              options={maintenanceStatuses}
              onChange={setStatus}
            />
            <FilterSelect
              label="priority"
              value={priority}
              options={priorities}
              onChange={setPriority}
            />
            <FilterSelect
              label="category"
              value={category}
              options={complaintCategories}
              onChange={setCategory}
            />
            <FilterSelect
              label="sort"
              value={sort}
              options={sortOptions}
              onChange={(value) => {
                if (value !== "all") setSort(value)
              }}
            />
          </Toolbar>

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
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1240px] text-left">
                  <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                    <tr>
                      <th className="px-4 py-3">Maintenance ID</th>
                      <th className="px-4 py-3">Complaint</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Apartment/Unit</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Technician</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {visibleMaintenance.map((item) => (
                      <tr
                        key={item._id}
                        className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
                      >
                        <td className="px-4 py-4 font-semibold text-[#111111]">
                          {formatId(item._id)}
                        </td>
                        <td className="px-4 py-4">{formatId(item.complaint)}</td>
                        <td className="px-4 py-4">{formatId(item.resident)}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{formatId(item.apartment)}</div>
                          <div className="mt-1 text-[12px] text-[#8793A0]">
                            {formatId(item.flat)}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatLabel(item.category)}</td>
                        <td className="max-w-[260px] px-4 py-4">
                          <div className="truncate font-medium text-[#111111]">
                            {item.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                            {item.description}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatId(item.assignedStaff)}</td>
                        <td className="px-4 py-4">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="px-4 py-4 text-[12px] text-[#66737F]">
                          <div>Estimate: {formatCurrency(item.estimatedCost)}</div>
                          <div className="mt-1">Actual: {formatCurrency(item.finalCost)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-4 text-[12px] text-[#66737F]">
                          <div>{formatDate(item.createdAt)}</div>
                          <div className="mt-1">{formatDate(item.completedAt)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedMaintenanceId(item._id)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                              aria-label="View maintenance"
                            >
                              <Eye className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#EEF2F5] lg:hidden">
                {visibleMaintenance.map((item) => (
                  <article key={item._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#07584F]">
                          {formatId(item._id)}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                          {item.title}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMaintenanceId(item._id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                        aria-label="View maintenance"
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
                      <span>{formatLabel(item.category)}</span>
                      <span>
                        {formatId(item.apartment)} / {formatId(item.flat)}
                      </span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedMaintenanceId)}
        title={selectedMaintenance?.title || "Maintenance"}
        subtitle={selectedMaintenance ? formatId(selectedMaintenance._id) : undefined}
        onClose={() => setSelectedMaintenanceId(null)}
      >
        {detailQuery.isPending ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#07584F]" />
          </div>
        ) : detailQuery.isError ? (
          <ErrorState
            title="Unable to load details"
            message={getApiErrorMessage(
              detailQuery.error,
              "The maintenance details could not be loaded."
            )}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : selectedMaintenance ? (
          <div>
            <section className="border-b border-[#E8EDF2] pb-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedMaintenance.status} />
                <PriorityBadge priority={selectedMaintenance.priority} />
              </div>
              <p className="mt-4 text-[14px] leading-6 text-[#4E5B67]">
                {selectedMaintenance.description}
              </p>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Maintenance Information
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Maintenance ID",
                      value: selectedMaintenance._id,
                    },
                    {
                      label: "Complaint",
                      value: formatId(selectedMaintenance.complaint),
                    },
                    {
                      label: "Resident",
                      value: formatId(selectedMaintenance.resident),
                    },
                    {
                      label: "Apartment",
                      value: formatId(selectedMaintenance.apartment),
                    },
                    {
                      label: "Unit",
                      value: formatId(selectedMaintenance.flat),
                    },
                    {
                      label: "Category",
                      value: formatLabel(selectedMaintenance.category),
                    },
                    {
                      label: "Technician",
                      value: formatId(selectedMaintenance.assignedStaff),
                    },
                    {
                      label: "Estimated cost",
                      value: formatCurrency(selectedMaintenance.estimatedCost),
                    },
                    {
                      label: "Actual cost",
                      value: formatCurrency(selectedMaintenance.finalCost),
                    },
                    {
                      label: "Cost review",
                      value: formatLabel(selectedMaintenance.costReview?.status),
                    },
                    {
                      label: "Submitted amount",
                      value: formatCurrency(
                        selectedMaintenance.costReview?.submittedAmount
                      ),
                    },
                    {
                      label: "Forwarded to",
                      value:
                        selectedMaintenance.costReview?.forwardedToRole ||
                        "Not set",
                    },
                    {
                      label: "Created",
                      value: formatDate(selectedMaintenance.createdAt),
                    },
                    {
                      label: "Started",
                      value: formatDate(selectedMaintenance.startedAt),
                    },
                    {
                      label: "Completed",
                      value: formatDate(selectedMaintenance.completedAt),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Related Complaint
              </h3>
              <div className="mt-4">
                {relatedComplaintQuery.isPending ? (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                    Loading complaint...
                  </div>
                ) : relatedComplaintQuery.data ? (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#111111]">
                          {relatedComplaintQuery.data.title}
                        </p>
                        <p className="mt-1 text-[12px] text-[#66737F]">
                          {formatId(relatedComplaintQuery.data._id)} -{" "}
                          {formatDate(relatedComplaintQuery.data.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={relatedComplaintQuery.data.status} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                    Related complaint is unavailable.
                  </div>
                )}
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Completion And Approval
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Completion details",
                      value: selectedMaintenance.completionDetails?.details || "Not set",
                    },
                    {
                      label: "Work notes",
                      value: selectedMaintenance.completionDetails?.workNotes || "Not set",
                    },
                    {
                      label: "Completed by",
                      value: formatId(
                        selectedMaintenance.completionDetails?.completedBy
                      ),
                    },
                    {
                      label: "Approval status",
                      value: formatLabel(selectedMaintenance.approvalDetails?.status),
                    },
                    {
                      label: "Reviewed by",
                      value: formatId(selectedMaintenance.approvalDetails?.reviewedBy),
                    },
                    {
                      label: "Reviewed at",
                      value: formatDate(selectedMaintenance.approvalDetails?.reviewedAt),
                    },
                    {
                      label: "Approval remarks",
                      value: selectedMaintenance.approvalDetails?.remarks || "Not set",
                    },
                    {
                      label: "Rejection reason",
                      value:
                        selectedMaintenance.approvalDetails?.rejectionReason ||
                        "Not set",
                    },
                  ]}
                />
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Cost Review
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Review status",
                      value: formatLabel(selectedMaintenance.costReview?.status),
                    },
                    {
                      label: "Submitted amount",
                      value: formatCurrency(
                        selectedMaintenance.costReview?.submittedAmount
                      ),
                    },
                    {
                      label: "Submitted by",
                      value: formatId(selectedMaintenance.costReview?.submittedBy),
                    },
                    {
                      label: "Submitted at",
                      value: formatDate(selectedMaintenance.costReview?.submittedAt),
                    },
                    {
                      label: "Reviewed by",
                      value: formatId(selectedMaintenance.costReview?.reviewedBy),
                    },
                    {
                      label: "Reviewed at",
                      value: formatDate(selectedMaintenance.costReview?.reviewedAt),
                    },
                    {
                      label: "Forwarded to",
                      value:
                        selectedMaintenance.costReview?.forwardedToRole ||
                        "Not set",
                    },
                    {
                      label: "Forwarded at",
                      value: formatDate(selectedMaintenance.costReview?.forwardedAt),
                    },
                    {
                      label: "Cost remarks",
                      value: selectedMaintenance.costReview?.remarks || "Not set",
                    },
                    {
                      label: "Cost rejection reason",
                      value:
                        selectedMaintenance.costReview?.rejectionReason ||
                        "Not set",
                    },
                  ]}
                />
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Actions
              </h3>

              <div className="mt-4 grid gap-4">
                <form
                  onSubmit={handleAssign}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <UserRoundCog className="size-4 text-[#2E639B]" />
                    Assign Technician
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormLabel label="Technician user ID">
                      <TextInput
                        name="assignedStaff"
                        required
                        placeholder="64f..."
                        defaultValue={selectedMaintenance.assignedStaff}
                      />
                    </FormLabel>
                    <FormLabel label="Estimated cost">
                      <TextInput
                        name="estimatedCost"
                        type="number"
                        placeholder="0"
                        defaultValue={selectedMaintenance.estimatedCost}
                      />
                    </FormLabel>
                  </div>
                  <FormLabel label="Remarks">
                    <TextArea name="remarks" placeholder="Remarks" />
                  </FormLabel>
                  <div>
                    <SubmitButton isLoading={assignMutation.isPending}>
                      Assign
                    </SubmitButton>
                  </div>
                </form>

                {statusOptions.length > 0 ? (
                  <form
                    onSubmit={handleStatusUpdate}
                    className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <Gauge className="size-4 text-[#07584F]" />
                      Update Status
                    </div>
                    <FormLabel label="Status">
                      <FormSelect
                        name="status"
                        options={statusOptions}
                        defaultValue={statusOptions[0]}
                        required
                      />
                    </FormLabel>
                    <FormLabel label="Remarks">
                      <TextArea name="remarks" placeholder="Remarks" />
                    </FormLabel>
                    <div>
                      <SubmitButton isLoading={statusMutation.isPending}>
                        Update Status
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}

                {progressOptions.length > 0 ? (
                  <form
                    onSubmit={handleProgressUpdate}
                    className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <Hammer className="size-4 text-[#07584F]" />
                      Update Progress
                    </div>
                    <FormLabel label="Progress details">
                      <TextArea
                        name="progressDetails"
                        required
                        minLength={5}
                        placeholder="Progress details"
                      />
                    </FormLabel>
                    <FormLabel label="Status">
                      <FormSelect
                        name="status"
                        options={progressOptions}
                        defaultValue={progressOptions[0]}
                      />
                    </FormLabel>
                    <FormLabel label="Remarks">
                      <TextArea name="remarks" placeholder="Remarks" />
                    </FormLabel>
                    <div>
                      <SubmitButton isLoading={progressMutation.isPending}>
                        Save Progress
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}

                <form
                  onSubmit={handleEdit}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <Pencil className="size-4 text-[#946415]" />
                    Edit Maintenance
                  </div>
                  <FormLabel label="Title">
                    <TextInput
                      name="title"
                      required
                      minLength={3}
                      defaultValue={selectedMaintenance.title}
                    />
                  </FormLabel>
                  <FormLabel label="Description">
                    <TextArea
                      name="description"
                      required
                      minLength={10}
                      defaultValue={selectedMaintenance.description}
                    />
                  </FormLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormLabel label="Category">
                      <FormSelect
                        name="category"
                        options={complaintCategories}
                        defaultValue={selectedMaintenance.category}
                        required
                      />
                    </FormLabel>
                    <FormLabel label="Priority">
                      <FormSelect
                        name="priority"
                        options={priorities}
                        defaultValue={selectedMaintenance.priority}
                        required
                      />
                    </FormLabel>
                    <FormLabel label="Estimated cost">
                      <TextInput
                        name="estimatedCost"
                        type="number"
                        defaultValue={selectedMaintenance.estimatedCost}
                      />
                    </FormLabel>
                  </div>
                  <FormLabel label="Manager remarks">
                    <TextArea name="managerRemarks" placeholder="Manager remarks" />
                  </FormLabel>
                  <div>
                    <SubmitButton isLoading={updateMutation.isPending}>
                      Save Changes
                    </SubmitButton>
                  </div>
                </form>

                {canApprove ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <form
                      onSubmit={handleApprove}
                      className="grid gap-3 rounded-lg border border-[#B6DEC5] bg-[#F8FCF9] p-4"
                    >
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                        <CheckCircle2 className="size-4 text-[#26733E]" />
                        Approve Maintenance
                      </div>
                      <FormLabel label="Remarks">
                        <TextArea name="remarks" placeholder="Approval remarks" />
                      </FormLabel>
                      <div>
                        <SubmitButton isLoading={approveMutation.isPending}>
                          Approve
                        </SubmitButton>
                      </div>
                    </form>

                    <form
                      onSubmit={handleReject}
                      className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
                    >
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                        <AlertTriangle className="size-4 text-[#A23D3D]" />
                        Reject Maintenance
                      </div>
                      <FormLabel label="Reason">
                        <TextArea
                          name="reason"
                          required
                          placeholder="Rejection reason"
                        />
                      </FormLabel>
                      <FormLabel label="Remarks">
                        <TextArea name="remarks" placeholder="Remarks" />
                      </FormLabel>
                      <div>
                        <SubmitButton
                          tone="danger"
                          isLoading={rejectMutation.isPending}
                        >
                          Reject
                        </SubmitButton>
                      </div>
                    </form>
                  </div>
                ) : null}

                {canReviewCost ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <form
                      onSubmit={handleApproveCost}
                      className="grid gap-3 rounded-lg border border-[#B6DEC5] bg-[#F8FCF9] p-4"
                    >
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                        <CheckCircle2 className="size-4 text-[#26733E]" />
                        Approve Cost
                      </div>
                      <div className="rounded-lg border border-[#E2E8EE] bg-white p-3 text-[13px] font-semibold text-[#26313D]">
                        {formatCurrency(
                          selectedMaintenance.costReview?.submittedAmount ??
                            selectedMaintenance.finalCost
                        )}
                      </div>
                      <FormLabel label="Remarks">
                        <TextArea name="remarks" placeholder="Cost approval remarks" />
                      </FormLabel>
                      <div>
                        <SubmitButton isLoading={approveCostMutation.isPending}>
                          Approve And Forward
                        </SubmitButton>
                      </div>
                    </form>

                    <form
                      onSubmit={handleRejectCost}
                      className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
                    >
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                        <AlertTriangle className="size-4 text-[#A23D3D]" />
                        Reject Cost
                      </div>
                      <FormLabel label="Reason">
                        <TextArea
                          name="reason"
                          required
                          placeholder="Cost rejection reason"
                        />
                      </FormLabel>
                      <FormLabel label="Remarks">
                        <TextArea name="remarks" placeholder="Remarks" />
                      </FormLabel>
                      <div>
                        <SubmitButton
                          tone="danger"
                          isLoading={rejectCostMutation.isPending}
                        >
                          Reject Cost
                        </SubmitButton>
                      </div>
                    </form>
                  </div>
                ) : null}

                {canClose ? (
                  <form
                    onSubmit={handleClose}
                    className="grid gap-3 rounded-lg border border-[#B6DEC5] bg-[#F8FCF9] p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <CheckCircle2 className="size-4 text-[#26733E]" />
                      Close Maintenance
                    </div>
                    <FormLabel label="Remarks">
                      <TextArea name="remarks" placeholder="Closing remarks" />
                    </FormLabel>
                    <div>
                      <SubmitButton isLoading={closeMutation.isPending}>
                        Close
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}

                {canCancel ? (
                  <form
                    onSubmit={handleCancel}
                    className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <AlertTriangle className="size-4 text-[#A23D3D]" />
                      Cancel Maintenance
                    </div>
                    <FormLabel label="Reason">
                      <TextArea name="reason" placeholder="Cancellation reason" />
                    </FormLabel>
                    <div>
                      <SubmitButton tone="danger" isLoading={cancelMutation.isPending}>
                        Cancel Maintenance
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
              </div>
            </section>

            <section className="py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Notes And Progress
              </h3>
              <div className="mt-4">
                <ActivityTimeline
                  notes={[
                    ...(selectedMaintenance.managerRemarks ?? []),
                    ...(selectedMaintenance.workNotes ?? []),
                  ]}
                  progress={selectedMaintenance.progressUpdates}
                />
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

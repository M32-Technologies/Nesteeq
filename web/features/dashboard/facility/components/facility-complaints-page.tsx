"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Gauge,
  Hammer,
  Loader2,
  Pencil,
  Timer,
  UserRoundCog,
} from "lucide-react"
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
  complaintCategories,
  complaintStatuses,
  priorities,
  type AssignPayload,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type ComplaintUpdatePayload,
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

type SortKey = "newest" | "oldest" | "priority" | "status" | "category"

const sortOptions = ["newest", "oldest", "priority", "status", "category"] as const

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

function sortComplaints(complaints: Complaint[], sort: SortKey) {
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
  const [sort, setSort] = useState<SortKey>("newest")
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total complaints"
            value={statsQuery.data?.total}
            icon={ClipboardList}
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
            title="Resolved"
            value={statsQuery.data?.resolved}
            icon={CheckCircle2}
            tone="gray"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search complaints"
            />
            <FilterSelect
              label="status"
              value={status}
              options={complaintStatuses}
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
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                    <tr>
                      <th className="px-4 py-3">Complaint ID</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Apartment/Unit</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Technician</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {visibleComplaints.map((complaint) => (
                      <tr
                        key={complaint._id}
                        className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
                      >
                        <td className="px-4 py-4 font-semibold text-[#111111]">
                          {formatId(complaint._id)}
                        </td>
                        <td className="px-4 py-4">{formatId(complaint.resident)}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{formatId(complaint.apartment)}</div>
                          <div className="mt-1 text-[12px] text-[#8793A0]">
                            {formatId(complaint.flat)}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatLabel(complaint.category)}</td>
                        <td className="max-w-[260px] px-4 py-4">
                          <div className="truncate font-medium text-[#111111]">
                            {complaint.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                            {complaint.description}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td className="px-4 py-4 text-[12px] text-[#66737F]">
                          {formatDate(complaint.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          {formatId(complaint.assignedStaff)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedComplaintId(complaint._id)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                              aria-label="View complaint"
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
                {visibleComplaints.map((complaint) => (
                  <article key={complaint._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#07584F]">
                          {formatId(complaint._id)}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                          {complaint.title}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedComplaintId(complaint._id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                        aria-label="View complaint"
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
                      <span>{formatLabel(complaint.category)}</span>
                      <span>
                        {formatId(complaint.apartment)} / {formatId(complaint.flat)}
                      </span>
                      <span>{formatDate(complaint.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedComplaintId)}
        title={selectedComplaint?.title || "Complaint"}
        subtitle={selectedComplaint ? formatId(selectedComplaint._id) : undefined}
        onClose={() => setSelectedComplaintId(null)}
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
              "The complaint details could not be loaded."
            )}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : selectedComplaint ? (
          <div>
            <section className="border-b border-[#E8EDF2] pb-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedComplaint.status} />
                <PriorityBadge priority={selectedComplaint.priority} />
              </div>
              <p className="mt-4 text-[14px] leading-6 text-[#4E5B67]">
                {selectedComplaint.description}
              </p>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Complaint Information
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Complaint ID",
                      value: selectedComplaint._id,
                    },
                    {
                      label: "Resident",
                      value: formatId(selectedComplaint.resident),
                    },
                    {
                      label: "Apartment",
                      value: formatId(selectedComplaint.apartment),
                    },
                    {
                      label: "Unit",
                      value: formatId(selectedComplaint.flat),
                    },
                    {
                      label: "Category",
                      value: formatLabel(selectedComplaint.category),
                    },
                    {
                      label: "Assigned technician",
                      value: formatId(selectedComplaint.assignedStaff),
                    },
                    {
                      label: "Estimated cost",
                      value: formatCurrency(selectedComplaint.estimatedCost),
                    },
                    {
                      label: "Final cost",
                      value: formatCurrency(selectedComplaint.finalCost),
                    },
                    {
                      label: "Created",
                      value: formatDate(selectedComplaint.createdAt),
                    },
                    {
                      label: "Updated",
                      value: formatDate(selectedComplaint.updatedAt),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Maintenance
              </h3>
              <div className="mt-4">
                {relatedMaintenanceQuery.isPending ? (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                    Loading maintenance...
                  </div>
                ) : relatedMaintenance.length > 0 ? (
                  <div className="space-y-3">
                    {relatedMaintenance.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-[#111111]">
                              {formatId(item._id)}
                            </p>
                            <p className="mt-1 text-[12px] text-[#66737F]">
                              {formatLabel(item.category)} - {formatDate(item.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="mt-3 grid gap-2 text-[12px] text-[#66737F] sm:grid-cols-3">
                          <span>Technician: {formatId(item.assignedStaff)}</span>
                          <span>Estimate: {formatCurrency(item.estimatedCost)}</span>
                          <span>Actual: {formatCurrency(item.finalCost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                    No maintenance work is linked.
                  </div>
                )}

                {canCreateMaintenance ? (
                  <form
                    onSubmit={handleCreateMaintenance}
                    className="mt-4 grid gap-3 rounded-lg border border-[#E2E8EE] bg-white p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <Hammer className="size-4 text-[#07584F]" />
                      Create maintenance work
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormLabel label="Technician user ID">
                        <TextInput name="assignedStaff" placeholder="64f..." />
                      </FormLabel>
                      <FormLabel label="Estimated cost">
                        <TextInput name="estimatedCost" type="number" placeholder="0" />
                      </FormLabel>
                    </div>
                    <FormLabel label="Remarks">
                      <TextArea name="remarks" placeholder="Remarks" />
                    </FormLabel>
                    <div>
                      <SubmitButton isLoading={createMaintenanceMutation.isPending}>
                        Create Maintenance
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
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
                        defaultValue={selectedComplaint.assignedStaff}
                      />
                    </FormLabel>
                    <FormLabel label="Estimated cost">
                      <TextInput
                        name="estimatedCost"
                        type="number"
                        placeholder="0"
                        defaultValue={selectedComplaint.estimatedCost}
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

                <form
                  onSubmit={handleEdit}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <Pencil className="size-4 text-[#946415]" />
                    Edit Complaint
                  </div>
                  <FormLabel label="Title">
                    <TextInput
                      name="title"
                      required
                      minLength={3}
                      defaultValue={selectedComplaint.title}
                    />
                  </FormLabel>
                  <FormLabel label="Description">
                    <TextArea
                      name="description"
                      required
                      minLength={10}
                      defaultValue={selectedComplaint.description}
                    />
                  </FormLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormLabel label="Category">
                      <FormSelect
                        name="category"
                        options={complaintCategories}
                        defaultValue={selectedComplaint.category}
                        required
                      />
                    </FormLabel>
                    <FormLabel label="Priority">
                      <FormSelect
                        name="priority"
                        options={priorities}
                        defaultValue={selectedComplaint.priority}
                        required
                      />
                    </FormLabel>
                    <FormLabel label="Estimated cost">
                      <TextInput
                        name="estimatedCost"
                        type="number"
                        defaultValue={selectedComplaint.estimatedCost}
                      />
                    </FormLabel>
                  </div>
                  <FormLabel label="Remarks">
                    <TextArea name="remarks" placeholder="Remarks" />
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
                        Approve Complaint
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
                        Reject Complaint
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

                {canCancel ? (
                  <form
                    onSubmit={handleCancel}
                    className="grid gap-3 rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                      <AlertTriangle className="size-4 text-[#A23D3D]" />
                      Cancel Complaint
                    </div>
                    <FormLabel label="Reason">
                      <TextArea name="reason" placeholder="Cancellation reason" />
                    </FormLabel>
                    <div>
                      <SubmitButton tone="danger" isLoading={cancelMutation.isPending}>
                        Cancel Complaint
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
              </div>
            </section>

            <section className="py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Activity
              </h3>
              <div className="mt-4">
                <ActivityTimeline notes={selectedComplaint.remarks} />
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

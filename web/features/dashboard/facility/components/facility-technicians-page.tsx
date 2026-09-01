"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Power,
  UserRoundCheck,
  UserRoundCog,
  UserRoundX,
  UsersRound,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import {
  assignTechnicianWork,
  deactivateTechnician,
  getApiErrorMessage,
  invalidateFacilityData,
  updateTechnician,
  updateTechnicianStatus,
  updateTechnicianTaskStatus,
  useTechnicianDetail,
  useTechnicians,
  useTechnicianStats,
  useTechnicianTasks,
} from "../facility.api"
import {
  complaintCategories,
  technicianStatuses,
  type AssignTechnicianWorkPayload,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type Maintenance,
  type MaintenanceStatus,
  type Technician,
  type TechnicianStatus,
  type UpdateTechnicianPayload,
  type UpdateTechnicianTaskStatusPayload,
} from "../facility.types"
import {
  Drawer,
  EmptyState,
  ErrorState,
  FilterSelect,
  FormLabel,
  FormSelect,
  cn,
  formatDate,
  formatId,
  formatLabel,
  InfoGrid,
  LoadingRows,
  MetricCard,
  PageHeader,
  PriorityBadge,
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

type SortKey = "newest" | "oldest" | "name" | "status"
type TaskView = "active" | "completed"

const sortOptions = ["newest", "oldest", "name", "status"] as const

const workTypeOptions = ["complaint", "maintenance"] as const
const taskTypeOptions = ["complaint", "maintenance"] as const
const taskViewOptions = ["active", "completed"] as const
const workStatusOptions = [
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "CLOSED",
] as const
const completedWorkStatuses = new Set(["APPROVED", "CLOSED"])
const activeWorkStatuses = new Set([
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
])

const technicianStatusTone: Record<TechnicianStatus, string> = {
  ACTIVE: "border-[#B6DEC5] bg-[#EDF8F0] text-[#26733E]",
  BUSY: "border-[#BFD8F7] bg-[#EEF6FF] text-[#2E639B]",
  ON_LEAVE: "border-[#F2D39A] bg-[#FFF8EA] text-[#946415]",
  INACTIVE: "border-[#D6DCE3] bg-[#F3F5F7] text-[#687481]",
}

function TechnicianStatusBadge({ status }: { status: TechnicianStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2.5 text-[11px] font-semibold",
        technicianStatusTone[status]
      )}
    >
      {formatLabel(status)}
    </span>
  )
}

function getTechnicianSearchValues(technician: Technician) {
  return [
    technician._id,
    technician.userId,
    technician.fullName,
    technician.email,
    technician.phone,
    technician.apartmentId,
    technician.employeeCode,
    technician.status,
    technician.shift,
    ...(technician.specializations ?? []),
  ]
}

function sortTechnicians(technicians: Technician[], sort: SortKey) {
  return [...technicians].sort((left, right) => {
    if (sort === "oldest") {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    }

    if (sort === "name") {
      return left.fullName.localeCompare(right.fullName)
    }

    if (sort === "status") {
      return left.status.localeCompare(right.status)
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

function readSpecializations(formData: FormData) {
  return formData
    .getAll("specializations")
    .filter((value): value is ComplaintCategory =>
      typeof value === "string" &&
      (complaintCategories as readonly string[]).includes(value)
    )
}

function WorkList({
  title,
  type,
  items,
}: {
  title: string
  type: "complaint" | "maintenance"
  items: Array<Complaint | Maintenance>
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
        No assigned {title.toLowerCase()}.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E2E8EE]">
      <div className="border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
        {title}
      </div>
      <div className="divide-y divide-[#EEF2F5]">
        {items.map((item) => (
          <article key={`${type}-${item._id}`} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#07584F]">
                  {formatId(item._id)}
                </p>
                <h4 className="mt-1 line-clamp-2 text-[14px] font-semibold text-[#111111]">
                  {item.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
                  {item.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <StatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-[12px] text-[#66737F] sm:grid-cols-3">
              <span>{formatLabel(item.category)}</span>
              <span>
                {formatId(item.apartment)} / {formatId(item.flat)}
              </span>
              <span>{formatDate(item.updatedAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function filterWorkByView<TItem extends Complaint | Maintenance>(
  items: TItem[],
  view: "all" | TaskView
) {
  if (view === "completed") {
    return items.filter((item) => completedWorkStatuses.has(item.status))
  }

  if (view === "active") {
    return items.filter((item) => activeWorkStatuses.has(item.status))
  }

  return items
}

function WorkloadSummary({
  total,
  active,
  completed,
}: {
  total: number
  active: number
  completed: number
}) {
  const rows = [
    ["Assigned tasks", total],
    ["Active tasks", active],
    ["Completed tasks", completed],
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
            {label}
          </div>
          <div className="mt-2 text-[22px] font-semibold text-[#111111]">
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

function SpecializationCheckboxes({
  defaultValue = [],
}: {
  defaultValue?: ComplaintCategory[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {complaintCategories.map((category) => (
        <label
          key={category}
          className="flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D]"
        >
          <input
            type="checkbox"
            name="specializations"
            value={category}
            defaultChecked={defaultValue.includes(category)}
            className="size-4 accent-[#07584F]"
          />
          {formatLabel(category)}
        </label>
      ))}
    </div>
  )
}

export default function FacilityTechniciansPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | TechnicianStatus>("all")
  const [specialization, setSpecialization] = useState<"all" | ComplaintCategory>("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [taskType, setTaskType] = useState<"all" | "complaint" | "maintenance">("all")
  const [taskView, setTaskView] = useState<"all" | TaskView>("all")
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(
    null
  )

  const technicianQuery = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      specialization: specialization === "all" ? undefined : specialization,
      search: search || undefined,
      page: 1,
      limit: 100,
    }),
    [search, specialization, status]
  )

  const techniciansQuery = useTechnicians(technicianQuery)
  const statsQuery = useTechnicianStats()
  const detailQuery = useTechnicianDetail(selectedTechnicianId)
  const selectedTechnician = detailQuery.data ?? null
  const tasksQuery = useTechnicianTasks(selectedTechnicianId, {
    type: taskType,
    page: 1,
    limit: 100,
  })
  const taskComplaints = tasksQuery.data?.complaints ?? []
  const taskMaintenance = tasksQuery.data?.maintenance ?? []
  const allTaskItems = [...taskComplaints, ...taskMaintenance]
  const activeTaskCount = allTaskItems.filter((item) =>
    activeWorkStatuses.has(item.status)
  ).length
  const completedTaskCount = allTaskItems.filter((item) =>
    completedWorkStatuses.has(item.status)
  ).length
  const filteredTaskComplaints = filterWorkByView(taskComplaints, taskView)
  const filteredTaskMaintenance = filterWorkByView(taskMaintenance, taskView)

  const technicians = useMemo(
    () => techniciansQuery.data?.technicians ?? [],
    [techniciansQuery.data?.technicians]
  )
  const visibleTechnicians = useMemo(() => {
    const filtered = technicians.filter((technician) =>
      matchesSearch(getTechnicianSearchValues(technician), search)
    )

    return sortTechnicians(filtered, sort)
  }, [search, sort, technicians])

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Technician updated")
    await invalidateFacilityData(queryClient)
  }

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTechnicianPayload
    }) => updateTechnician(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update technician")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
      notes,
    }: {
      id: string
      status: TechnicianStatus
      notes?: string
    }) => updateTechnicianStatus(id, { status: nextStatus, notes }),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update technician status")),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateTechnician(id),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to deactivate technician")),
  })

  const assignWorkMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AssignTechnicianWorkPayload
    }) => assignTechnicianWork(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to assign work")),
  })

  const taskStatusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTechnicianTaskStatusPayload
    }) => updateTechnicianTaskStatus(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update task status")),
  })

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return

    const formData = new FormData(event.currentTarget)

    updateMutation.mutate({
      id: selectedTechnician._id,
      payload: {
        fullName: readFormString(formData, "fullName"),
        email: readFormString(formData, "email"),
        phone: readFormString(formData, "phone"),
        apartmentId: readFormString(formData, "apartmentId"),
        employeeCode: readFormString(formData, "employeeCode"),
        specializations: readSpecializations(formData),
        shift: readFormString(formData, "shift"),
        notes: readFormString(formData, "notes"),
      },
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return

    const formData = new FormData(event.currentTarget)

    statusMutation.mutate({
      id: selectedTechnician._id,
      status: readRequiredFormString(formData, "status") as TechnicianStatus,
      notes: readFormString(formData, "notes"),
    })
  }

  const handleDeactivate = () => {
    if (!selectedTechnician) return

    const confirmed = window.confirm("Deactivate this technician?")
    if (!confirmed) return

    deactivateMutation.mutate(selectedTechnician._id)
  }

  const handleAssignWork = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return

    const formData = new FormData(event.currentTarget)
    const workId = readRequiredFormString(formData, "workId")

    if (!workId) {
      toast.error("Work ID is required")
      return
    }

    assignWorkMutation.mutate({
      id: selectedTechnician._id,
      payload: {
        workType: readRequiredFormString(formData, "workType") as
          | "complaint"
          | "maintenance",
        workId,
        estimatedCost: readOptionalNumber(formData, "estimatedCost"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  const handleTaskStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return

    const formData = new FormData(event.currentTarget)
    const workId = readRequiredFormString(formData, "workId")

    if (!workId) {
      toast.error("Work ID is required")
      return
    }

    taskStatusMutation.mutate({
      id: selectedTechnician._id,
      payload: {
        workType: readRequiredFormString(formData, "workType") as
          | "complaint"
          | "maintenance",
        workId,
        status: readRequiredFormString(formData, "status") as
          | ComplaintStatus
          | MaintenanceStatus,
        progressDetails: readFormString(formData, "progressDetails"),
        completionDetails: readFormString(formData, "completionDetails"),
        finalCost: readOptionalNumber(formData, "finalCost"),
        workNotes: readFormString(formData, "workNotes"),
        remarks: readFormString(formData, "remarks"),
      },
    })
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader
          title="Technicians"
          eyebrow="Facility Manager"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total technicians"
            value={statsQuery.data?.total}
            icon={UsersRound}
            tone="green"
          />
          <MetricCard
            title="Active"
            value={statsQuery.data?.active}
            icon={UserRoundCheck}
            tone="green"
          />
          <MetricCard
            title="Busy"
            value={statsQuery.data?.busy}
            icon={BriefcaseBusiness}
            tone="blue"
          />
          <MetricCard
            title="On leave"
            value={statsQuery.data?.onLeave}
            icon={UserRoundCog}
            tone="amber"
          />
          <MetricCard
            title="Inactive"
            value={statsQuery.data?.inactive}
            icon={UserRoundX}
            tone="gray"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search technicians"
            />
            <FilterSelect
              label="status"
              value={status}
              options={technicianStatuses}
              onChange={setStatus}
            />
            <FilterSelect
              label="specialization"
              value={specialization}
              options={complaintCategories}
              onChange={setSpecialization}
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

          {techniciansQuery.isPending ? (
            <LoadingRows />
          ) : techniciansQuery.isError ? (
            <ErrorState
              title="Unable to load technicians"
              message={getApiErrorMessage(
                techniciansQuery.error,
                "The technician list could not be loaded."
              )}
              isRetrying={techniciansQuery.isFetching}
              onRetry={() => void techniciansQuery.refetch()}
            />
          ) : visibleTechnicians.length === 0 ? (
            <EmptyState
              title="No technicians found"
              message="Technicians assigned to this apartment will appear here."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                    <tr>
                      <th className="px-4 py-3">Technician</th>
                      <th className="px-4 py-3">User ID</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Apartment</th>
                      <th className="px-4 py-3">Specializations</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {visibleTechnicians.map((technician) => (
                      <tr
                        key={technician._id}
                        className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#111111]">
                            {technician.fullName}
                          </div>
                          <div className="mt-1 text-[12px] text-[#8793A0]">
                            {technician.employeeCode || formatId(technician._id)}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatId(technician.userId)}</td>
                        <td className="px-4 py-4">
                          <div>{technician.email || "Not set"}</div>
                          <div className="mt-1 text-[12px] text-[#8793A0]">
                            {technician.phone || "Not set"}
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatId(technician.apartmentId)}</td>
                        <td className="max-w-[260px] px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {technician.specializations.length > 0 ? (
                              technician.specializations.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-md bg-[#EEF6FF] px-2 py-1 text-[11px] font-semibold text-[#2E639B]"
                                >
                                  {formatLabel(item)}
                                </span>
                              ))
                            ) : (
                              <span className="text-[12px] text-[#8793A0]">
                                Not set
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">{technician.shift || "Not set"}</td>
                        <td className="px-4 py-4">
                          <TechnicianStatusBadge status={technician.status} />
                        </td>
                        <td className="px-4 py-4 text-[12px] text-[#66737F]">
                          {formatDate(technician.joinedAt ?? technician.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedTechnicianId(technician._id)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                              aria-label="View technician"
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
                {visibleTechnicians.map((technician) => (
                  <article key={technician._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#07584F]">
                          {formatId(technician.userId)}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                          {technician.fullName}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTechnicianId(technician._id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                        aria-label="View technician"
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <TechnicianStatusBadge status={technician.status} />
                      {technician.specializations.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="inline-flex min-h-7 items-center rounded-md border border-[#BFD8F7] bg-[#EEF6FF] px-2.5 text-[11px] font-semibold text-[#2E639B]"
                        >
                          {formatLabel(item)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
                      <span>{technician.email || "No email"}</span>
                      <span>{technician.phone || "No phone"}</span>
                      <span>{formatId(technician.apartmentId)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedTechnicianId)}
        title={selectedTechnician?.fullName || "Technician"}
        subtitle={selectedTechnician ? formatId(selectedTechnician.userId) : undefined}
        onClose={() => setSelectedTechnicianId(null)}
      >
        {detailQuery.isPending ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#07584F]" />
          </div>
        ) : detailQuery.isError ? (
          <ErrorState
            title="Unable to load technician"
            message={getApiErrorMessage(
              detailQuery.error,
              "The technician details could not be loaded."
            )}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : selectedTechnician ? (
          <div>
            <section className="border-b border-[#E8EDF2] pb-5">
              <div className="flex flex-wrap gap-2">
                <TechnicianStatusBadge status={selectedTechnician.status} />
                {selectedTechnician.specializations.map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-7 items-center rounded-md border border-[#BFD8F7] bg-[#EEF6FF] px-2.5 text-[11px] font-semibold text-[#2E639B]"
                  >
                    {formatLabel(item)}
                  </span>
                ))}
              </div>
              {selectedTechnician.notes ? (
                <p className="mt-4 text-[14px] leading-6 text-[#4E5B67]">
                  {selectedTechnician.notes}
                </p>
              ) : null}
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Technician Information
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Technician ID",
                      value: selectedTechnician._id,
                    },
                    {
                      label: "Auth user ID",
                      value: selectedTechnician.userId,
                    },
                    {
                      label: "Email",
                      value: selectedTechnician.email || "Not set",
                    },
                    {
                      label: "Phone",
                      value: selectedTechnician.phone || "Not set",
                    },
                    {
                      label: "Apartment",
                      value: formatId(selectedTechnician.apartmentId),
                    },
                    {
                      label: "Employee code",
                      value: selectedTechnician.employeeCode || "Not set",
                    },
                    {
                      label: "Shift",
                      value: selectedTechnician.shift || "Not set",
                    },
                    {
                      label: "Joined",
                      value: formatDate(
                        selectedTechnician.joinedAt ?? selectedTechnician.createdAt
                      ),
                    },
                    {
                      label: "Deactivated",
                      value: formatDate(selectedTechnician.deactivatedAt),
                    },
                    {
                      label: "Updated",
                      value: formatDate(selectedTechnician.updatedAt),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Assigned Work
                </h3>
                <div className="flex flex-wrap gap-2">
                  <FilterSelect
                    label="work"
                    value={taskType}
                    options={taskTypeOptions}
                    onChange={(value) => setTaskType(value === "all" ? "all" : value)}
                  />
                  <FilterSelect
                    label="tasks"
                    value={taskView}
                    options={taskViewOptions}
                    onChange={(value) => setTaskView(value === "all" ? "all" : value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {tasksQuery.isPending ? (
                  <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
                    Loading assigned work...
                  </div>
                ) : tasksQuery.isError ? (
                  <ErrorState
                    title="Unable to load assigned work"
                    message={getApiErrorMessage(
                      tasksQuery.error,
                      "Assigned work could not be loaded."
                    )}
                    isRetrying={tasksQuery.isFetching}
                    onRetry={() => void tasksQuery.refetch()}
                  />
                ) : tasksQuery.data &&
                  tasksQuery.data.complaints.length === 0 &&
                  tasksQuery.data.maintenance.length === 0 ? (
                  <EmptyState
                    title="No assigned work"
                    message="Assigned complaints and maintenance tasks will appear here."
                  />
                ) : (
                  <>
                    <WorkloadSummary
                      total={allTaskItems.length}
                      active={activeTaskCount}
                      completed={completedTaskCount}
                    />
                    {filteredTaskComplaints.length === 0 &&
                    filteredTaskMaintenance.length === 0 ? (
                      <EmptyState
                        title="No matching work"
                        message="Try changing the task type or task status filter."
                      />
                    ) : (
                      <>
                        {taskType !== "maintenance" ? (
                          <WorkList
                            title="Complaints"
                            type="complaint"
                            items={filteredTaskComplaints}
                          />
                        ) : null}
                        {taskType !== "complaint" ? (
                          <WorkList
                            title="Maintenance"
                            type="maintenance"
                            items={filteredTaskMaintenance}
                          />
                        ) : null}
                      </>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="border-b border-[#E8EDF2] py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Technician Activity
              </h3>
              <div className="mt-4">
                <InfoGrid
                  items={[
                    {
                      label: "Current status",
                      value: formatLabel(selectedTechnician.status),
                    },
                    {
                      label: "Assigned work",
                      value: allTaskItems.length,
                    },
                    {
                      label: "Active work",
                      value: activeTaskCount,
                    },
                    {
                      label: "Completed work",
                      value: completedTaskCount,
                    },
                    {
                      label: "Joined",
                      value: formatDate(
                        selectedTechnician.joinedAt ?? selectedTechnician.createdAt
                      ),
                    },
                    {
                      label: "Last updated",
                      value: formatDate(selectedTechnician.updatedAt),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="py-5">
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Actions
              </h3>

              <div className="mt-4 grid gap-4">
                <form
                  onSubmit={handleEdit}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <Pencil className="size-4 text-[#946415]" />
                    Edit Technician
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormLabel label="Full name">
                      <TextInput
                        name="fullName"
                        required
                        minLength={2}
                        defaultValue={selectedTechnician.fullName}
                      />
                    </FormLabel>
                    <FormLabel label="Email">
                      <TextInput name="email" defaultValue={selectedTechnician.email} />
                    </FormLabel>
                    <FormLabel label="Phone">
                      <TextInput name="phone" defaultValue={selectedTechnician.phone} />
                    </FormLabel>
                    <FormLabel label="Apartment ID">
                      <TextInput
                        name="apartmentId"
                        defaultValue={selectedTechnician.apartmentId}
                      />
                    </FormLabel>
                    <FormLabel label="Employee code">
                      <TextInput
                        name="employeeCode"
                        defaultValue={selectedTechnician.employeeCode}
                      />
                    </FormLabel>
                    <FormLabel label="Shift">
                      <TextInput name="shift" defaultValue={selectedTechnician.shift} />
                    </FormLabel>
                  </div>
                  <FormLabel label="Specializations">
                    <SpecializationCheckboxes
                      defaultValue={selectedTechnician.specializations}
                    />
                  </FormLabel>
                  <FormLabel label="Notes">
                    <TextArea name="notes" defaultValue={selectedTechnician.notes} />
                  </FormLabel>
                  <div>
                    <SubmitButton isLoading={updateMutation.isPending}>
                      Save Changes
                    </SubmitButton>
                  </div>
                </form>

                <form
                  onSubmit={handleStatusUpdate}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <Power className="size-4 text-[#07584F]" />
                    Technician Status
                  </div>
                  <FormLabel label="Status">
                    <FormSelect
                      name="status"
                      options={technicianStatuses}
                      defaultValue={selectedTechnician.status}
                      required
                    />
                  </FormLabel>
                  <FormLabel label="Notes">
                    <TextArea name="notes" placeholder="Status notes" />
                  </FormLabel>
                  <div className="flex flex-wrap gap-3">
                    <SubmitButton isLoading={statusMutation.isPending}>
                      Update Status
                    </SubmitButton>
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      disabled={
                        selectedTechnician.status === "INACTIVE" ||
                        deactivateMutation.isPending
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#A23D3D] px-4 text-[13px] font-semibold text-white transition hover:bg-[#8F3333] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deactivateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserRoundX className="size-4" />
                      )}
                      Deactivate
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handleAssignWork}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <Wrench className="size-4 text-[#2E639B]" />
                    Assign Work
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormLabel label="Work type">
                      <FormSelect name="workType" options={workTypeOptions} required />
                    </FormLabel>
                    <FormLabel label="Work ID">
                      <TextInput name="workId" required placeholder="Complaint or maintenance ID" />
                    </FormLabel>
                    <FormLabel label="Estimated cost">
                      <TextInput name="estimatedCost" type="number" />
                    </FormLabel>
                  </div>
                  <FormLabel label="Remarks">
                    <TextArea name="remarks" placeholder="Assignment remarks" />
                  </FormLabel>
                  <div>
                    <SubmitButton isLoading={assignWorkMutation.isPending}>
                      Assign Work
                    </SubmitButton>
                  </div>
                </form>

                <form
                  onSubmit={handleTaskStatusUpdate}
                  className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
                    <CheckCircle2 className="size-4 text-[#26733E]" />
                    Update Work Status
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormLabel label="Work type">
                      <FormSelect name="workType" options={workTypeOptions} required />
                    </FormLabel>
                    <FormLabel label="Work ID">
                      <TextInput name="workId" required placeholder="Assigned work ID" />
                    </FormLabel>
                    <FormLabel label="Status">
                      <FormSelect name="status" options={workStatusOptions} required />
                    </FormLabel>
                  </div>
                  <FormLabel label="Progress details">
                    <TextArea name="progressDetails" placeholder="Progress update" />
                  </FormLabel>
                  <FormLabel label="Completion details">
                    <TextArea name="completionDetails" placeholder="Required when completing work" />
                  </FormLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormLabel label="Final cost">
                      <TextInput name="finalCost" type="number" />
                    </FormLabel>
                    <FormLabel label="Work notes">
                      <TextInput name="workNotes" placeholder="Optional" />
                    </FormLabel>
                  </div>
                  <FormLabel label="Remarks">
                    <TextArea name="remarks" placeholder="Status remarks" />
                  </FormLabel>
                  <div>
                    <SubmitButton isLoading={taskStatusMutation.isPending}>
                      Update Work Status
                    </SubmitButton>
                  </div>
                </form>

                {selectedTechnician.status === "INACTIVE" ? (
                  <div className="rounded-lg border border-[#F0C0C0] bg-[#FFF8F8] p-4 text-[13px] leading-6 text-[#A23D3D]">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>
                        This technician is inactive and cannot receive new assignments.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

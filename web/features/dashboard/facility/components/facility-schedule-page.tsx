"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutList,
  Loader2,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import {
  cancelSchedule,
  createSchedule,
  deleteSchedule,
  getApiErrorMessage,
  invalidateFacilityData,
  rescheduleSchedule,
  updateSchedule,
  updateScheduleStatus,
  useComplaints,
  useMaintenance,
  useMySchedules,
  useScheduleDetail,
  useSchedules,
  useScheduleStats,
  useTechnicians,
} from "../facility.api"
import {
  priorities,
  scheduleStatuses,
  scheduleWorkTypes,
  type Complaint,
  type CreateSchedulePayload,
  type Maintenance,
  type Priority,
  type ReschedulePayload,
  type Schedule,
  type ScheduleQuery,
  type ScheduleStatus,
  type ScheduleWorkType,
  type Technician,
  type UpdateSchedulePayload,
  type UpdateScheduleStatusPayload,
} from "../facility.types"
import {
  ActivityTimeline,
  Drawer,
  EmptyState,
  ErrorState,
  FilterSelect,
  FormLabel,
  FormSelect,
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
  cn,
  formatDate,
  formatId,
  formatLabel,
} from "./facility-ui"
import {
  readFormString,
  readOptionalNumber,
  readRequiredFormString,
} from "../facility.utils"

type SchedulePageMode = "manager" | "technician"
type ViewMode = "list" | "calendar"

type FacilitySchedulePageProps = {
  mode?: SchedulePageMode
}

const activeScheduleStatuses = new Set<ScheduleStatus>([
  "SCHEDULED",
  "RESCHEDULED",
  "IN_PROGRESS",
])

const pad = (value: number) => String(value).padStart(2, "0")

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toInputDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return toDateInput(date)
}

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
  }
}

function getCalendarDays(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

function getTechnicianName(schedule: Schedule, technicians: Technician[]) {
  const technician = technicians.find((item) => item._id === schedule.technician)
  return technician?.fullName || `Technician ${formatId(schedule.technicianUserId)}`
}

function getWorkLabel(schedule: Schedule) {
  const id = schedule.workType === "complaint" ? schedule.complaint : schedule.maintenance
  return `${formatLabel(schedule.workType)} ${formatId(id)}`
}

function formatScheduleDate(schedule: Schedule) {
  return formatDate(schedule.startAt)
}

function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
  )
}

function groupSchedulesByDate(schedules: Schedule[]) {
  return schedules.reduce<Record<string, Schedule[]>>((groups, schedule) => {
    const key = toInputDate(schedule.startAt)
    groups[key] = [...(groups[key] ?? []), schedule]
    return groups
  }, {})
}

function OptionText({
  title,
  detail,
}: {
  title: string
  detail?: string | null
}) {
  return (
    <>
      {title}
      {detail ? ` - ${detail}` : ""}
    </>
  )
}

function ScheduleForm({
  mode,
  schedule,
  technicians,
  complaints,
  maintenance,
  workType,
  onWorkTypeChange,
  onSubmit,
  isLoading,
}: {
  mode: "create" | "edit" | "reschedule"
  schedule?: Schedule | null
  technicians: Technician[]
  complaints: Complaint[]
  maintenance: Maintenance[]
  workType: ScheduleWorkType
  onWorkTypeChange: (value: ScheduleWorkType) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isLoading?: boolean
}) {
  const isReschedule = mode === "reschedule"
  const selectableTechnicians = technicians.filter(
    (technician) => technician.status !== "INACTIVE" && technician.status !== "ON_LEAVE"
  )

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {!isReschedule ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormLabel label="Title">
              <TextInput
                name="title"
                required
                minLength={3}
                defaultValue={schedule?.title}
              />
            </FormLabel>
            <FormLabel label="Priority">
              <FormSelect
                name="priority"
                options={priorities}
                defaultValue={schedule?.priority ?? "MEDIUM"}
              />
            </FormLabel>
          </div>

          <FormLabel label="Description">
            <TextArea
              name="description"
              placeholder="Describe the scheduled work"
              defaultValue={schedule?.description}
            />
          </FormLabel>
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <FormLabel label="Technician">
          <select
            name="technician"
            required
            defaultValue={schedule?.technician ?? ""}
            className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
          >
            <option value="" disabled>
              Select technician
            </option>
            {selectableTechnicians.map((technician) => (
              <option key={technician._id} value={technician._id}>
                <OptionText
                  title={technician.fullName}
                  detail={formatLabel(technician.status)}
                />
              </option>
            ))}
          </select>
        </FormLabel>

        {!isReschedule ? (
          <FormLabel label="Work type">
            <select
              name="workType"
              value={workType}
              onChange={(event) =>
                onWorkTypeChange(event.target.value as ScheduleWorkType)
              }
              className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
            >
              {scheduleWorkTypes.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </FormLabel>
        ) : null}
      </div>

      {!isReschedule ? (
        workType === "complaint" ? (
          <FormLabel label="Complaint">
            <select
              name="complaint"
              required
              defaultValue={schedule?.complaint ?? ""}
              className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
            >
              <option value="" disabled>
                Select complaint
              </option>
              {complaints.map((complaint) => (
                <option key={complaint._id} value={complaint._id}>
                  <OptionText
                    title={complaint.title}
                    detail={`${formatLabel(complaint.status)} / ${formatId(complaint.flat)}`}
                  />
                </option>
              ))}
            </select>
          </FormLabel>
        ) : (
          <FormLabel label="Maintenance">
            <select
              name="maintenance"
              required
              defaultValue={schedule?.maintenance ?? ""}
              className="h-10 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
            >
              <option value="" disabled>
                Select maintenance
              </option>
              {maintenance.map((item) => (
                <option key={item._id} value={item._id}>
                  <OptionText
                    title={item.title}
                    detail={`${formatLabel(item.status)} / ${formatId(item.flat)}`}
                  />
                </option>
              ))}
            </select>
          </FormLabel>
        )
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <FormLabel label="Date">
          <TextInput
            name="scheduledDate"
            type="date"
            required
            defaultValue={toInputDate(schedule?.scheduledDate)}
          />
        </FormLabel>
        <FormLabel label="Start time">
          <TextInput
            name="startTime"
            type="time"
            required
            defaultValue={schedule?.startTime}
          />
        </FormLabel>
        <FormLabel label="End time">
          <TextInput
            name="endTime"
            type="time"
            required
            defaultValue={schedule?.endTime}
          />
        </FormLabel>
      </div>

      <FormLabel label="Notes">
        <TextArea
          name="notes"
          placeholder="Internal notes or technician instructions"
          defaultValue={schedule?.notes}
        />
      </FormLabel>

      <div>
        <SubmitButton isLoading={isLoading}>
          {mode === "create"
            ? "Create Schedule"
            : mode === "reschedule"
              ? "Reschedule"
              : "Update Schedule"}
        </SubmitButton>
      </div>
    </form>
  )
}

function CalendarView({
  month,
  schedules,
  selectedDate,
  onMonthChange,
  onDateSelect,
  onScheduleSelect,
}: {
  month: Date
  schedules: Schedule[]
  selectedDate: string
  onMonthChange: (month: Date) => void
  onDateSelect: (date: string) => void
  onScheduleSelect: (id: string) => void
}) {
  const days = getCalendarDays(month)
  const grouped = groupSchedulesByDate(schedules)
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(month)

  const moveMonth = (offset: number) => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1))
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111111]">
            {monthLabel}
          </h2>
          <p className="mt-1 text-[12px] text-[#66737F]">
            Scheduled work by day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(new Date())}
            className="h-9 rounded-lg border border-[#DDE5EC] bg-white px-3 text-[12px] font-semibold text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#E2E8EE] bg-[#FBFCFD] text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-2 py-3">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-7">
        {days.map((day) => {
          const key = toDateInput(day)
          const items = sortSchedules(grouped[key] ?? [])
          const isCurrentMonth = day.getMonth() === month.getMonth()
          const isSelected = selectedDate === key

          return (
            <div
              key={key}
              className={cn(
                "min-h-[132px] border-b border-r border-[#EEF2F5] p-2",
                !isCurrentMonth && "bg-[#FBFCFD] text-[#A2ACB6]",
                isSelected && "bg-[#EAF4F0]"
              )}
            >
              <button
                type="button"
                onClick={() => onDateSelect(key)}
                className="flex size-7 items-center justify-center rounded-md text-[12px] font-semibold text-[#26313D] transition hover:bg-white"
              >
                {day.getDate()}
              </button>
              <div className="mt-2 space-y-1">
                {items.slice(0, 3).map((schedule) => (
                  <button
                    key={schedule._id}
                    type="button"
                    onClick={() => onScheduleSelect(schedule._id)}
                    className="block w-full truncate rounded-md border border-[#DDE5EC] bg-white px-2 py-1 text-left text-[11px] font-medium text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
                  >
                    {schedule.startTime} {schedule.title}
                  </button>
                ))}
                {items.length > 3 ? (
                  <div className="px-2 text-[11px] font-medium text-[#8793A0]">
                    +{items.length - 3} more
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function FacilitySchedulePage({
  mode = "manager",
}: FacilitySchedulePageProps) {
  const queryClient = useQueryClient()
  const isManager = mode === "manager"
  const [search, setSearch] = useState("")
  const [date, setDate] = useState("")
  const [technician, setTechnician] = useState<"all" | string>("all")
  const [status, setStatus] = useState<"all" | ScheduleStatus>("all")
  const [priority, setPriority] = useState<"all" | Priority>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [month, setMonth] = useState(new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [formWorkType, setFormWorkType] = useState<ScheduleWorkType>("maintenance")

  const monthBounds = useMemo(() => getMonthBounds(month), [month])
  const scheduleQuery = useMemo<ScheduleQuery>(
    () => ({
      date: date || undefined,
      startDate: date ? undefined : monthBounds.startDate,
      endDate: date ? undefined : monthBounds.endDate,
      technician: isManager && technician !== "all" ? technician : undefined,
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      search: search || undefined,
      page: 1,
      limit: 100,
    }),
    [date, isManager, monthBounds.endDate, monthBounds.startDate, priority, search, status, technician]
  )

  const managerSchedulesQuery = useSchedules(scheduleQuery, isManager)
  const technicianSchedulesQuery = useMySchedules(scheduleQuery, !isManager)
  const schedulesQuery = isManager ? managerSchedulesQuery : technicianSchedulesQuery
  const statsQuery = useScheduleStats()
  const techniciansQuery = useTechnicians({ page: 1, limit: 100 }, isManager)
  const complaintsQuery = useComplaints({ page: 1, limit: 100 }, isManager)
  const maintenanceQuery = useMaintenance({ page: 1, limit: 100 }, isManager)
  const detailQuery = useScheduleDetail(selectedScheduleId)

  const schedules = useMemo(
    () => sortSchedules(schedulesQuery.data?.schedules ?? []),
    [schedulesQuery.data?.schedules]
  )
  const selectedSchedule = detailQuery.data ?? null
  const technicians = techniciansQuery.data?.technicians ?? []
  const complaints = complaintsQuery.data?.complaints ?? []
  const maintenance = maintenanceQuery.data?.maintenance ?? []

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Schedule updated")
    await invalidateFacilityData(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: (response) => {
      setCreateOpen(false)
      void handleSuccess(response.message)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to create schedule")),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateSchedulePayload
    }) => updateSchedule(id, payload),
    onSuccess: (response) => {
      setEditOpen(false)
      void handleSuccess(response.message)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update schedule")),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: ReschedulePayload
    }) => rescheduleSchedule(id, payload),
    onSuccess: (response) => {
      setRescheduleOpen(false)
      void handleSuccess(response.message)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to reschedule")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelSchedule(id, reason),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel schedule")),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: (response) => {
      setSelectedScheduleId(null)
      void handleSuccess(response.message)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to delete schedule")),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateScheduleStatusPayload
    }) => updateScheduleStatus(id, payload),
    onSuccess: (response) => void handleSuccess(response.message),
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to update schedule status")),
  })

  const buildSchedulePayload = (formData: FormData): CreateSchedulePayload | null => {
    const workType = readRequiredFormString(formData, "workType") as ScheduleWorkType
    const workId = readRequiredFormString(formData, workType)
    const technicianId = readRequiredFormString(formData, "technician")
    const scheduledDate = readRequiredFormString(formData, "scheduledDate")
    const startTime = readRequiredFormString(formData, "startTime")
    const endTime = readRequiredFormString(formData, "endTime")
    const title = readRequiredFormString(formData, "title")

    if (!title || !technicianId || !workId || !scheduledDate || !startTime || !endTime) {
      toast.error("Title, technician, work item, date, start time and end time are required")
      return null
    }

    return {
      title,
      description: readFormString(formData, "description"),
      technician: technicianId,
      workType,
      complaint: workType === "complaint" ? workId : undefined,
      maintenance: workType === "maintenance" ? workId : undefined,
      scheduledDate,
      startTime,
      endTime,
      priority: readRequiredFormString(formData, "priority") as Priority,
      notes: readFormString(formData, "notes"),
    }
  }

  const buildReschedulePayload = (formData: FormData): ReschedulePayload | null => {
    const technicianId = readRequiredFormString(formData, "technician")
    const scheduledDate = readRequiredFormString(formData, "scheduledDate")
    const startTime = readRequiredFormString(formData, "startTime")
    const endTime = readRequiredFormString(formData, "endTime")

    if (!technicianId || !scheduledDate || !startTime || !endTime) {
      toast.error("Technician, date, start time and end time are required")
      return null
    }

    return {
      technician: technicianId,
      scheduledDate,
      startTime,
      endTime,
      notes: readFormString(formData, "notes"),
    }
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = buildSchedulePayload(new FormData(event.currentTarget))
    if (payload) createMutation.mutate(payload)
  }

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSchedule) return
    const payload = buildSchedulePayload(new FormData(event.currentTarget))
    if (payload) updateMutation.mutate({ id: selectedSchedule._id, payload })
  }

  const handleReschedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSchedule) return
    const payload = buildReschedulePayload(new FormData(event.currentTarget))
    if (payload) rescheduleMutation.mutate({ id: selectedSchedule._id, payload })
  }

  const handleCancel = (schedule: Schedule) => {
    const confirmed = window.confirm("Cancel this schedule?")
    if (!confirmed) return

    const reason = window.prompt("Cancellation reason") ?? undefined
    cancelMutation.mutate({ id: schedule._id, reason })
  }

  const handleDelete = (schedule: Schedule) => {
    const confirmed = window.confirm("Delete this cancelled schedule?")
    if (!confirmed) return

    deleteMutation.mutate(schedule._id)
  }

  const handleStart = (schedule: Schedule) => {
    statusMutation.mutate({
      id: schedule._id,
      payload: {
        status: "IN_PROGRESS",
        notes: "Work started from schedule",
      },
    })
  }

  const handleComplete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSchedule) return

    const formData = new FormData(event.currentTarget)
    const completionDetails = readRequiredFormString(formData, "completionDetails")

    if (!completionDetails) {
      toast.error("Completion details are required")
      return
    }

    statusMutation.mutate({
      id: selectedSchedule._id,
      payload: {
        status: "COMPLETED",
        completionDetails,
        finalCost: readOptionalNumber(formData, "finalCost"),
        notes: readFormString(formData, "notes"),
      },
    })
  }

  const openCreate = () => {
    setFormWorkType("maintenance")
    setCreateOpen(true)
  }

  const openEdit = (schedule: Schedule) => {
    setFormWorkType(schedule.workType)
    setEditOpen(true)
  }

  const summary = schedulesQuery.data?.summary
  const stats = isManager ? statsQuery.data : summary

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader
          title={isManager ? "Schedule Management" : "My Schedule"}
          eyebrow={isManager ? "Facility Manager" : "Technician"}
          actions={
            isManager ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064C44]"
              >
                <Plus className="size-4" />
                Create Schedule
              </button>
            ) : null
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Today"
            value={stats?.today}
            icon={CalendarDays}
            tone="green"
          />
          <MetricCard
            title="Upcoming"
            value={stats?.upcoming}
            icon={CalendarRange}
            tone="blue"
          />
          <MetricCard
            title="In progress"
            value={stats?.inProgress}
            icon={PlayCircle}
            tone="amber"
          />
          <MetricCard
            title="Completed"
            value={stats?.completed}
            icon={CheckCircle2}
            tone="gray"
          />
          <MetricCard
            title="Cancelled"
            value={stats?.cancelled}
            icon={XCircle}
            tone="rose"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search schedules"
            />
            <label className="block min-w-[160px]">
              <span className="sr-only">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
              />
            </label>
            {isManager ? (
              <label className="block min-w-[190px]">
                <span className="sr-only">Technician</span>
                <select
                  value={technician}
                  onChange={(event) => setTechnician(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#DDE5EC] bg-white px-3 text-[13px] font-medium text-[#26313D] outline-none transition focus:border-[#07584F] focus:ring-4 focus:ring-[#EAF4F0]"
                >
                  <option value="all">All technicians</option>
                  {technicians.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.fullName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <FilterSelect
              label="status"
              value={status}
              options={scheduleStatuses}
              onChange={setStatus}
            />
            <FilterSelect
              label="priority"
              value={priority}
              options={priorities}
              onChange={setPriority}
            />
            <div className="flex h-11 rounded-lg border border-[#DDE5EC] bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md text-[#5B6875] transition",
                  viewMode === "list" && "bg-[#EAF4F0] text-[#07584F]"
                )}
                aria-label="List view"
              >
                <LayoutList className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md text-[#5B6875] transition",
                  viewMode === "calendar" && "bg-[#EAF4F0] text-[#07584F]"
                )}
                aria-label="Calendar view"
              >
                <CalendarDays className="size-4" />
              </button>
            </div>
          </Toolbar>

          {schedulesQuery.isPending ? (
            <LoadingRows />
          ) : schedulesQuery.isError ? (
            <ErrorState
              title="Unable to load schedules"
              message={getApiErrorMessage(
                schedulesQuery.error,
                "Schedules could not be loaded."
              )}
              isRetrying={schedulesQuery.isFetching}
              onRetry={() => void schedulesQuery.refetch()}
            />
          ) : schedules.length === 0 ? (
            <EmptyState
              title="No schedules found"
              message={
                isManager
                  ? "Create schedules to coordinate maintenance work and technician availability."
                  : "Assigned schedules will appear here."
              }
            />
          ) : viewMode === "calendar" ? (
            <CalendarView
              month={month}
              schedules={schedules}
              selectedDate={date}
              onMonthChange={setMonth}
              onDateSelect={setDate}
              onScheduleSelect={setSelectedScheduleId}
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                    <tr>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Technician</th>
                      <th className="px-4 py-3">Work</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {schedules.map((schedule) => (
                      <tr
                        key={schedule._id}
                        className="text-[13px] text-[#26313D] transition hover:bg-[#FBFCFD]"
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#111111]">
                            {schedule.title}
                          </div>
                          <div className="mt-1 text-[12px] text-[#8793A0]">
                            {formatId(schedule._id)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getTechnicianName(schedule, technicians)}
                        </td>
                        <td className="px-4 py-4">{getWorkLabel(schedule)}</td>
                        <td className="px-4 py-4">{formatScheduleDate(schedule)}</td>
                        <td className="px-4 py-4">
                          {schedule.startTime} - {schedule.endTime}
                        </td>
                        <td className="px-4 py-4">
                          <PriorityBadge priority={schedule.priority} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={schedule.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedScheduleId(schedule._id)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                              aria-label="View schedule"
                            >
                              <Eye className="size-4" />
                            </button>
                            {isManager && activeScheduleStatuses.has(schedule.status) ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedScheduleId(schedule._id)
                                    openEdit(schedule)
                                  }}
                                  className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                                  aria-label="Edit schedule"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedScheduleId(schedule._id)
                                    setRescheduleOpen(true)
                                  }}
                                  className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] transition hover:border-[#07584F] hover:text-[#07584F]"
                                  aria-label="Reschedule"
                                >
                                  <RotateCcw className="size-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#EEF2F5] lg:hidden">
                {schedules.map((schedule) => (
                  <article key={schedule._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#07584F]">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#111111]">
                          {schedule.title}
                        </h2>
                        <p className="mt-1 text-[12px] text-[#66737F]">
                          {formatScheduleDate(schedule)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleId(schedule._id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875]"
                        aria-label="View schedule"
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={schedule.status} />
                      <PriorityBadge priority={schedule.priority} />
                    </div>
                    <div className="mt-3 grid gap-2 text-[12px] text-[#66737F]">
                      <span>{getTechnicianName(schedule, technicians)}</span>
                      <span>{getWorkLabel(schedule)}</span>
                      <span>
                        {formatId(schedule.apartment)} / {formatId(schedule.flat)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={createOpen}
        title="Create Schedule"
        subtitle="Assign a technician to scheduled work"
        onClose={() => setCreateOpen(false)}
      >
        <ScheduleForm
          mode="create"
          technicians={technicians}
          complaints={complaints}
          maintenance={maintenance}
          workType={formWorkType}
          onWorkTypeChange={setFormWorkType}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </Drawer>

      <Drawer
        open={editOpen && Boolean(selectedSchedule)}
        title="Edit Schedule"
        subtitle={selectedSchedule?.title}
        onClose={() => setEditOpen(false)}
      >
        <ScheduleForm
          mode="edit"
          schedule={selectedSchedule}
          technicians={technicians}
          complaints={complaints}
          maintenance={maintenance}
          workType={formWorkType}
          onWorkTypeChange={setFormWorkType}
          onSubmit={handleEdit}
          isLoading={updateMutation.isPending}
        />
      </Drawer>

      <Drawer
        open={rescheduleOpen && Boolean(selectedSchedule)}
        title="Reschedule"
        subtitle={selectedSchedule?.title}
        onClose={() => setRescheduleOpen(false)}
      >
        <ScheduleForm
          mode="reschedule"
          schedule={selectedSchedule}
          technicians={technicians}
          complaints={complaints}
          maintenance={maintenance}
          workType={formWorkType}
          onWorkTypeChange={setFormWorkType}
          onSubmit={handleReschedule}
          isLoading={rescheduleMutation.isPending}
        />
      </Drawer>

      <Drawer
        open={Boolean(selectedScheduleId)}
        title={selectedSchedule?.title || "Schedule"}
        subtitle={selectedSchedule ? getWorkLabel(selectedSchedule) : undefined}
        onClose={() => setSelectedScheduleId(null)}
      >
        {detailQuery.isPending ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#07584F]" />
          </div>
        ) : detailQuery.isError ? (
          <ErrorState
            title="Unable to load schedule"
            message={getApiErrorMessage(
              detailQuery.error,
              "Schedule details could not be loaded."
            )}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : selectedSchedule ? (
          <div className="space-y-6">
            <InfoGrid
              items={[
                {
                  label: "Technician",
                  value: getTechnicianName(selectedSchedule, technicians),
                },
                {
                  label: "Status",
                  value: <StatusBadge status={selectedSchedule.status} />,
                },
                {
                  label: "Priority",
                  value: <PriorityBadge priority={selectedSchedule.priority} />,
                },
                {
                  label: "Date",
                  value: formatScheduleDate(selectedSchedule),
                },
                {
                  label: "Time",
                  value: `${selectedSchedule.startTime} - ${selectedSchedule.endTime}`,
                },
                {
                  label: "Location",
                  value: `${formatId(selectedSchedule.apartment)} / ${formatId(
                    selectedSchedule.flat
                  )}`,
                },
              ]}
            />

            <section>
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Work Details
              </h3>
              <p className="mt-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] leading-6 text-[#66737F]">
                {selectedSchedule.description ||
                  selectedSchedule.notes ||
                  "No description added."}
              </p>
            </section>

            {isManager ? (
              <section className="flex flex-wrap gap-2">
                {activeScheduleStatuses.has(selectedSchedule.status) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(selectedSchedule)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE5EC] bg-white px-4 text-[13px] font-semibold text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setRescheduleOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE5EC] bg-white px-4 text-[13px] font-semibold text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
                    >
                      <RotateCcw className="size-4" />
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(selectedSchedule)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#A23D3D] px-4 text-[13px] font-semibold text-white transition hover:bg-[#8F3333]"
                    >
                      <XCircle className="size-4" />
                      Cancel
                    </button>
                  </>
                ) : null}
                {selectedSchedule.status === "CANCELLED" ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedSchedule)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#F0C0C0] bg-white px-4 text-[13px] font-semibold text-[#A23D3D] transition hover:bg-[#FFF0F0]"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                ) : null}
              </section>
            ) : (
              <section className="space-y-4">
                {selectedSchedule.status === "SCHEDULED" ||
                selectedSchedule.status === "RESCHEDULED" ? (
                  <button
                    type="button"
                    onClick={() => handleStart(selectedSchedule)}
                    disabled={statusMutation.isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064C44] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlayCircle className="size-4" />
                    Start Work
                  </button>
                ) : null}

                {selectedSchedule.status === "IN_PROGRESS" ? (
                  <form
                    onSubmit={handleComplete}
                    className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
                  >
                    <h3 className="text-[15px] font-semibold text-[#111111]">
                      Complete Schedule
                    </h3>
                    <div className="mt-4 grid gap-3">
                      <FormLabel label="Completion details">
                        <TextArea name="completionDetails" required minLength={10} />
                      </FormLabel>
                      <FormLabel label="Final cost">
                        <TextInput name="finalCost" type="number" />
                      </FormLabel>
                      <FormLabel label="Notes">
                        <TextArea name="notes" />
                      </FormLabel>
                    </div>
                    <div className="mt-4">
                      <SubmitButton isLoading={statusMutation.isPending}>
                        Mark Completed
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
              </section>
            )}

            <section>
              <h3 className="text-[15px] font-semibold text-[#111111]">
                Timeline
              </h3>
              <div className="mt-4">
                <ActivityTimeline
                  notes={(selectedSchedule.statusHistory ?? []).map((item) => ({
                    message: item.note || formatLabel(item.status),
                    by: item.by,
                    role: item.role,
                    createdAt: item.createdAt,
                  }))}
                />
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

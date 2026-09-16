"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import {
  cancelSchedule,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
} from "@/features/dashboard/facility/schedule/api/schedule.api"
import {
  useSchedulesQuery,
  useScheduleStatsQuery,
} from "@/features/dashboard/facility/schedule/hooks/use-schedule-queries"
import type {
  CreateSchedulePayload,
  Schedule,
  ScheduleStatus,
  ScheduleWorkType,
  UpdateSchedulePayload,
} from "@/features/dashboard/facility/schedule/types/schedule.types"
import { getApiErrorMessage } from "@/features/dashboard/facility/shared/utils/facility-error"
import {
  matchesSearch,
  readFormString,
  readRequiredFormString,
} from "@/features/dashboard/facility/shared/utils/form-helpers"
import {
  Drawer,
  EmptyState,
  ErrorState,
  FilterSelect,
  FormLabel,
  FormSelect,
  formatDate,
  formatId,
  InfoGrid,
  LoadingRows,
  MetricCard,
  PageHeader,
  SearchBox,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  Toolbar,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export function FacilitySchedulePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | ScheduleStatus>("all")
  const [workType, setWorkType] = useState<"all" | ScheduleWorkType>("all")
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const queryParams = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      workType: workType === "all" ? undefined : workType,
      page: 1,
      limit: 100,
    }),
    [status, workType]
  )

  const schedulesQuery = useSchedulesQuery(queryParams)
  const statsQuery = useScheduleStatsQuery()

  const schedules = useMemo(
    () => schedulesQuery.data?.schedules ?? [],
    [schedulesQuery.data?.schedules]
  )

  const visibleSchedules = useMemo(() => {
    return schedules.filter((item) =>
      matchesSearch([item._id, item.title, item.description, item.workType, item.status], search)
    )
  }, [schedules, search])

  const selectedSchedule = useMemo(
    () => schedules.find((s) => s._id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId]
  )

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Schedule updated")
    await queryClient.invalidateQueries({ queryKey: ["facility-schedules"] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: () => {
      setCreateOpen(false)
      void handleSuccess("Schedule created successfully")
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create schedule")),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status: nextStatus, notes }: { id: string; status: string; notes?: string }) =>
      updateScheduleStatus(id, { status: nextStatus, notes }),
    onSuccess: () => void handleSuccess("Status updated"),
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update status")),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => cancelSchedule(id, notes),
    onSuccess: () => void handleSuccess("Schedule cancelled"),
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to cancel schedule")),
  })

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    createMutation.mutate({
      title: readRequiredFormString(formData, "title"),
      description: readFormString(formData, "description"),
      workType: readRequiredFormString(formData, "workType") as ScheduleWorkType,
      assignedTo: readFormString(formData, "assignedTo"),
      scheduledDate: readRequiredFormString(formData, "scheduledDate"),
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSchedule) return
    const formData = new FormData(event.currentTarget)

    updateStatusMutation.mutate({
      id: selectedSchedule._id,
      status: readRequiredFormString(formData, "status"),
      notes: readFormString(formData, "notes"),
    })
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader
          title="Schedules"
          eyebrow="Facility Manager"
          actions={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white hover:bg-[#064C44]"
            >
              <Plus className="size-4" />
              New Schedule
            </button>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Scheduled" value={statsQuery.data?.scheduled} icon={CalendarDays} tone="blue" />
          <MetricCard title="In Progress" value={statsQuery.data?.inProgress} icon={CalendarDays} tone="amber" />
          <MetricCard title="Completed" value={statsQuery.data?.completed} icon={CheckCircle2} tone="green" />
          <MetricCard title="Total Schedules" value={statsQuery.data?.total} icon={CalendarDays} tone="gray" />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox value={search} onChange={setSearch} placeholder="Search schedules..." />
            <FilterSelect label="status" value={status} options={["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED"]} onChange={setStatus} />
            <FilterSelect label="workType" value={workType} options={["complaint", "maintenance"]} onChange={setWorkType} />
          </Toolbar>

          {schedulesQuery.isPending ? (
            <LoadingRows />
          ) : schedulesQuery.isError ? (
            <ErrorState
              title="Unable to load schedules"
              message={getApiErrorMessage(schedulesQuery.error, "Failed to load schedules list.")}
              onRetry={() => void schedulesQuery.refetch()}
            />
          ) : visibleSchedules.length === 0 ? (
            <EmptyState title="No schedules found" message="There are no schedule items matching your view." />
          ) : (
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Work Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Scheduled Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F5]">
                  {visibleSchedules.map((item) => (
                    <tr key={item._id} className="text-[13px] text-[#26313D] hover:bg-[#FBFCFD]">
                      <td className="px-4 py-4 font-semibold text-[#111111]">{item.title}</td>
                      <td className="px-4 py-4">{item.workType}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#66737F]">{formatDate(item.scheduledDate)}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedScheduleId(item._id)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-[#DDE5EC] text-[#5B6875] hover:border-[#07584F] hover:text-[#07584F]"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Drawer open={createOpen} title="New Schedule" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <FormLabel label="Title">
            <TextInput name="title" required placeholder="Preventive elevator inspection" />
          </FormLabel>
          <FormLabel label="Description">
            <TextArea name="description" placeholder="Schedule details..." />
          </FormLabel>
          <FormLabel label="Work Type">
            <FormSelect name="workType" options={["complaint", "maintenance"]} required />
          </FormLabel>
          <FormLabel label="Technician ID">
            <TextInput name="assignedTo" placeholder="64f..." />
          </FormLabel>
          <FormLabel label="Scheduled Date">
            <TextInput name="scheduledDate" type="date" required />
          </FormLabel>
          <div className="pt-2">
            <SubmitButton isLoading={createMutation.isPending}>Create Schedule</SubmitButton>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={Boolean(selectedScheduleId)}
        title={selectedSchedule?.title || "Schedule Details"}
        subtitle={selectedSchedule ? formatId(selectedSchedule._id) : undefined}
        onClose={() => setSelectedScheduleId(null)}
      >
        {selectedSchedule ? (
          <div className="space-y-6">
            <InfoGrid
              items={[
                { label: "Title", value: selectedSchedule.title },
                { label: "Work Type", value: selectedSchedule.workType },
                { label: "Status", value: <StatusBadge status={selectedSchedule.status} /> },
                { label: "Scheduled Date", value: formatDate(selectedSchedule.scheduledDate) },
              ]}
            />

            <form onSubmit={handleStatusUpdate} className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
              <h4 className="text-[13px] font-semibold text-[#111111]">Update Status</h4>
              <FormLabel label="Status">
                <FormSelect name="status" options={["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED"]} defaultValue={selectedSchedule.status} required />
              </FormLabel>
              <FormLabel label="Notes">
                <TextArea name="notes" placeholder="Remarks..." />
              </FormLabel>
              <div>
                <SubmitButton isLoading={updateStatusMutation.isPending}>Save Status</SubmitButton>
              </div>
            </form>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

export default FacilitySchedulePage

"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
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
  createTechnician,
  fetchTechnicianStats,
  updateTechnician,
  updateTechnicianStatus,
  updateTechnicianTaskStatus,
} from "@/features/dashboard/facility/technicians/api/technicians.api"
import {
  useTechnicianDetailsQuery,
  useTechniciansQuery,
} from "@/features/dashboard/facility/technicians/hooks/use-technicians-queries"
import type {
  Technician,
  TechnicianStatus,
  UpdateTechnicianPayload,
} from "@/features/dashboard/facility/technicians/types/technicians.types"
import { complaintCategories } from "@/features/dashboard/facility/shared/types/common.types"
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
  SortSelect,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  Toolbar,
} from "@/features/dashboard/facility/shared/components/facility-ui"

type SortKey = "newest" | "oldest" | "name" | "status"

const sortOptions = ["newest", "oldest", "name", "status"] as const

function sortTechnicians(list: Technician[], sort: SortKey) {
  return [...list].sort((left, right) => {
    if (sort === "oldest") {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    }
    if (sort === "name") {
      return left.name.localeCompare(right.name)
    }
    if (sort === "status") {
      return left.status.localeCompare(right.status)
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

export function FacilityTechniciansPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | TechnicianStatus>("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      page: 1,
      limit: 100,
    }),
    [status]
  )

  const techniciansQuery = useTechniciansQuery(queryParams)
  const detailQuery = useTechnicianDetailsQuery(selectedTechnicianId)

  const technicians = useMemo(
    () => techniciansQuery.data?.technicians ?? [],
    [techniciansQuery.data?.technicians]
  )

  const visibleTechnicians = useMemo(() => {
    const filtered = technicians.filter((tech) =>
      matchesSearch([tech._id, tech.name, tech.email, tech.phone, tech.status], search)
    )
    return sortTechnicians(filtered, sort)
  }, [technicians, search, sort])

  const selectedTechnician = detailQuery.data ?? null

  const handleSuccess = async (message?: string) => {
    toast.success(message || "Technician updated")
    await queryClient.invalidateQueries({ queryKey: ["facility-technicians"] })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTechnicianPayload }) =>
      updateTechnician(id, payload),
    onSuccess: () => void handleSuccess("Technician details updated"),
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update technician")),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status: nextStatus }: { id: string; status: string }) =>
      updateTechnicianStatus(id, nextStatus),
    onSuccess: () => void handleSuccess("Status updated"),
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update status")),
  })

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return
    const formData = new FormData(event.currentTarget)

    updateMutation.mutate({
      id: selectedTechnician._id,
      payload: {
        name: readFormString(formData, "name"),
        email: readFormString(formData, "email"),
        phone: readFormString(formData, "phone"),
      },
    })
  }

  const handleStatusUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTechnician) return
    const formData = new FormData(event.currentTarget)
    const nextStatus = readRequiredFormString(formData, "status")

    statusMutation.mutate({
      id: selectedTechnician._id,
      status: nextStatus,
    })
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#F6F8FA] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <PageHeader title="Technicians" eyebrow="Facility Manager" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Technicians" value={technicians.length} icon={UsersRound} tone="blue" />
          <MetricCard title="Active" value={technicians.filter((t) => t.status === "ACTIVE").length} icon={UserRoundCheck} tone="green" />
          <MetricCard title="Busy" value={technicians.filter((t) => t.status === "BUSY").length} icon={Wrench} tone="amber" />
          <MetricCard title="Inactive / Leave" value={technicians.filter((t) => t.status === "INACTIVE" || t.status === "ON_LEAVE").length} icon={UserRoundX} tone="gray" />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
          <Toolbar>
            <SearchBox value={search} onChange={setSearch} placeholder="Search technicians..." />
            <FilterSelect label="status" value={status} options={["ACTIVE", "BUSY", "ON_LEAVE", "INACTIVE"]} onChange={setStatus} />
            <SortSelect value={sort} options={sortOptions} onChange={setSort} />
          </Toolbar>

          {techniciansQuery.isPending ? (
            <LoadingRows />
          ) : techniciansQuery.isError ? (
            <ErrorState
              title="Unable to load technicians"
              message={getApiErrorMessage(techniciansQuery.error, "Failed to load technicians list.")}
              onRetry={() => void techniciansQuery.refetch()}
            />
          ) : visibleTechnicians.length === 0 ? (
            <EmptyState title="No technicians found" message="There are no technicians matching your criteria." />
          ) : (
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#FBFCFD] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8793A0]">
                  <tr>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F5]">
                  {visibleTechnicians.map((tech) => (
                    <tr key={tech._id} className="text-[13px] text-[#26313D] hover:bg-[#FBFCFD]">
                      <td className="px-4 py-4 font-semibold text-[#111111]">{tech.name}</td>
                      <td className="px-4 py-4">{tech.phone || "-"}</td>
                      <td className="px-4 py-4">{tech.email || "-"}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={tech.status} />
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#66737F]">{formatDate(tech.createdAt)}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTechnicianId(tech._id)}
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

      <Drawer
        open={Boolean(selectedTechnicianId)}
        title={selectedTechnician?.name || "Technician Details"}
        subtitle={selectedTechnician ? formatId(selectedTechnician._id) : undefined}
        onClose={() => setSelectedTechnicianId(null)}
      >
        {detailQuery.isPending ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#07584F]" />
          </div>
        ) : selectedTechnician ? (
          <div className="space-y-6">
            <section>
              <InfoGrid
                items={[
                  { label: "Name", value: selectedTechnician.name },
                  { label: "Email", value: selectedTechnician.email || "-" },
                  { label: "Phone", value: selectedTechnician.phone || "-" },
                  { label: "Status", value: <StatusBadge status={selectedTechnician.status} /> },
                ]}
              />
            </section>

            <form onSubmit={handleStatusUpdate} className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
              <h4 className="text-[13px] font-semibold text-[#111111]">Update Status</h4>
              <FormLabel label="Status">
                <FormSelect name="status" options={["ACTIVE", "BUSY", "ON_LEAVE", "INACTIVE"]} defaultValue={selectedTechnician.status} required />
              </FormLabel>
              <div>
                <SubmitButton isLoading={statusMutation.isPending}>Save Status</SubmitButton>
              </div>
            </form>

            <form onSubmit={handleEdit} className="grid gap-3 rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4">
              <h4 className="text-[13px] font-semibold text-[#111111]">Edit Details</h4>
              <FormLabel label="Name">
                <TextInput name="name" required defaultValue={selectedTechnician.name} />
              </FormLabel>
              <FormLabel label="Email">
                <TextInput name="email" defaultValue={selectedTechnician.email} />
              </FormLabel>
              <FormLabel label="Phone">
                <TextInput name="phone" defaultValue={selectedTechnician.phone} />
              </FormLabel>
              <div>
                <SubmitButton isLoading={updateMutation.isPending}>Save Changes</SubmitButton>
              </div>
            </form>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

export default FacilityTechniciansPage

"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
  UserX,
  Wrench,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { staffRoleOptions } from "../api/staff.api"
import {
  useStaffDetailsQuery,
  useUpdateStaffMutation,
  useUpdateStaffStatusMutation,
} from "../hooks/use-staff-query"
import type {
  StaffRole,
  StaffStatus,
  UpdateStaffInput,
} from "../types/staff"
import {
  formatDate,
  getInitials,
  RoleBadge,
  StatusBadge,
} from "./staff-table-section"

type DrawerMode = "view" | "edit"

type StaffDetailsDrawerProps = {
  staffId: string | null
  open: boolean
  mode: DrawerMode
  onModeChange: (mode: DrawerMode) => void
  onClose: () => void
}

type StaffFormValues = {
  name: string
  phone: string
  role: StaffRole
  maintenanceType: string
}

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"

export default function StaffDetailsDrawer({
  staffId,
  open,
  mode,
  onModeChange,
  onClose,
}: StaffDetailsDrawerProps) {
  const {
    data: staff,
    isLoading,
    isError,
    refetch,
  } = useStaffDetailsQuery(open ? staffId : null)
  const updateStaff = useUpdateStaffMutation()
  const updateStatus = useUpdateStaffStatusMutation()
  const [statusAction, setStatusAction] = useState<StaffStatus | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<StaffFormValues>({
    defaultValues: {
      name: "",
      phone: "",
      role: "security_staff",
      maintenanceType: "",
    },
  })
  const selectedRole = useWatch({ control, name: "role" })

  useEffect(() => {
    if (!staff) return

    reset({
      name: staff.name === "Unknown user" ? "" : staff.name,
      phone: staff.phone === "-" ? "" : staff.phone,
      role: staff.role,
      maintenanceType: staff.maintenanceType ?? "",
    })
  }, [staff, reset])

  if (!open) {
    return null
  }

  const submitEdit = async (values: StaffFormValues) => {
    if (!staffId) return

    const input: UpdateStaffInput = {
      name: values.name,
      phone: values.phone || null,
      role: values.role,
      maintenanceType:
        values.role === "maintenance_technician"
          ? values.maintenanceType || null
          : null,
    }

    try {
      await updateStaff.mutateAsync({
        staffId,
        input,
      })
      toast.success("Staff member updated")
      onModeChange("view")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update staff"
      )
    }
  }

  const handleStatusChange = async () => {
    if (!staffId || !staff) return

    const nextStatus: StaffStatus =
      staff.status === "inactive" ? "active" : "inactive"

    setStatusAction(nextStatus)

    try {
      await updateStatus.mutateAsync({
        staffId,
        status: nextStatus,
      })
      toast.success(
        nextStatus === "active" ? "Staff activated" : "Staff deactivated"
      )
      await refetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      )
    } finally {
      setStatusAction(null)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/20 lg:hidden"
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.08)]">
        <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "edit" ? "Edit Staff" : "Staff Details"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <DrawerSkeleton />
          ) : isError ? (
            <DrawerError onRetry={() => refetch()} />
          ) : staff ? (
            mode === "edit" ? (
              <form
                onSubmit={handleSubmit(submitEdit)}
                className="flex min-h-full flex-col"
              >
                <DrawerProfile
                  name={staff.name}
                  email={staff.email}
                  role={staff.role}
                  status={staff.status}
                />

                <div className="flex-1 space-y-5 p-5">
                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Staff Information
                    </h4>

                    <div className="mt-4 space-y-4">
                      <FormField label="Full name" error={errors.name?.message}>
                        <input
                          type="text"
                          {...register("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must contain at least 2 characters",
                            },
                          })}
                          className={fieldClassName}
                        />
                      </FormField>

                      <FormField label="Phone">
                        <input
                          type="tel"
                          {...register("phone")}
                          className={fieldClassName}
                        />
                      </FormField>

                      <FormField label="Role">
                        <select {...register("role")} className={fieldClassName}>
                          {staffRoleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      {selectedRole === "maintenance_technician" && (
                        <FormField label="Maintenance type">
                          <input
                            type="text"
                            {...register("maintenanceType")}
                            className={fieldClassName}
                          />
                        </FormField>
                      )}
                    </div>
                  </section>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={() => onModeChange("view")}
                    disabled={updateStaff.isPending}
                    className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updateStaff.isPending}
                    className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] text-sm font-medium text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updateStaff.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <DrawerProfile
                  name={staff.name}
                  email={staff.email}
                  role={staff.role}
                  status={staff.status}
                />

                <div className="space-y-5 p-5">
                  <section className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                    <div className="flex items-center justify-between border-b border-slate-100 py-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Personal Information
                      </h4>

                      <button
                        type="button"
                        onClick={() => onModeChange("edit")}
                        className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </div>

                    <DetailRow
                      icon={<Phone size={16} />}
                      label="Phone"
                      value={staff.phone}
                    />
                    <DetailRow
                      icon={<Mail size={16} />}
                      label="Email"
                      value={<span className="block max-w-[210px] truncate">{staff.email}</span>}
                    />
                    <DetailRow
                      icon={<ShieldCheck size={16} />}
                      label="Email Verified"
                      value={
                        staff.emailVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} />
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )
                      }
                    />
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                    <div className="border-b border-slate-100 py-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Role Information
                      </h4>
                    </div>

                    <DetailRow
                      icon={<UserRoundCog size={16} />}
                      label="Role"
                      value={<RoleBadge role={staff.role} />}
                    />
                    <DetailRow
                      icon={<Wrench size={16} />}
                      label="Maintenance"
                      value={
                        staff.role === "maintenance_technician"
                          ? staff.maintenanceType || "-"
                          : "-"
                      }
                    />
                    <DetailRow
                      icon={<CheckCircle2 size={16} />}
                      label="Status"
                      value={<StatusBadge status={staff.status} />}
                    />
                    <DetailRow
                      icon={<CalendarDays size={16} />}
                      label="Joined At"
                      value={formatDate(staff.joinedAt)}
                    />
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                    <div className="border-b border-slate-100 py-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Account Information
                      </h4>
                    </div>

                    <DetailRow
                      icon={<CalendarDays size={16} />}
                      label="Created At"
                      value={formatDate(staff.createdAt)}
                    />
                    <DetailRow
                      icon={<RefreshCw size={16} />}
                      label="Last Updated"
                      value={formatDate(staff.updatedAt)}
                    />
                  </section>
                </div>
              </div>
            )
          ) : null}
        </div>

        {staff && mode === "view" && (
          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-200 bg-white p-5">
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={updateStatus.isPending}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                staff.status === "inactive"
                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              {staff.status === "inactive" ? (
                <>
                  <CheckCircle2 size={16} />
                  {statusAction === "active" ? "Activating..." : "Activate"}
                </>
              ) : (
                <>
                  <UserX size={16} />
                  {statusAction === "inactive" ? "Deactivating..." : "Deactivate"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onModeChange("edit")}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] text-sm font-medium text-white transition hover:bg-[#0B4D38]"
            >
              <Pencil size={16} />
              Edit Staff
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function DrawerProfile({
  name,
  email,
  role,
  status,
}: {
  name: string
  email: string
  role: StaffRole
  status: StaffStatus
}) {
  return (
    <div className="border-b border-slate-100 px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E7F4EE] text-xl font-semibold text-[#0F5F45]">
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {name}
          </h3>

          <p className="mt-1 truncate text-sm text-slate-500">
            {email}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <RoleBadge role={role} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="flex shrink-0 items-center gap-3 text-slate-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>

      <div className="min-w-0 text-right text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, section) => (
        <div
          key={section}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DrawerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <UserX size={20} className="text-red-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        Unable to load staff
      </h3>

      <p className="mt-1 max-w-[260px] text-sm text-slate-500">
        Something went wrong while loading the staff details.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  )
}

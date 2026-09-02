"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { ChevronDown, Mail, Phone, UserRoundCog, X } from "lucide-react"
import { toast } from "sonner"

import { staffRoleOptions } from "../api/staff.api"
import { useCreateStaffInvitationMutation } from "../hooks/use-staff-query"
import type { CreateStaffInviteInput, StaffRole } from "../types/staff"

type InviteStaffModalProps = {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

type InviteStaffFormValues = {
  fullName: string
  email: string
  phoneNumber: string
  role: StaffRole
  maintenanceType: string
}

const fieldClassName =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-700 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"

export default function InviteStaffModal({
  open,
  onClose,
  onInvited,
}: InviteStaffModalProps) {
  const inviteStaff = useCreateStaffInvitationMutation()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteStaffFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "security_staff",
      maintenanceType: "",
    },
  })
  const selectedRole = useWatch({ control, name: "role" })

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  if (!open) {
    return null
  }

  const submitInvite = async (values: InviteStaffFormValues) => {
    const input: CreateStaffInviteInput = {
      fullName: values.fullName,
      email: values.email,
      phoneNumber: values.phoneNumber || null,
      role: values.role,
      maintenanceType:
        values.role === "maintenance_technician"
          ? values.maintenanceType || null
          : null,
    }

    try {
      await inviteStaff.mutateAsync(input)
      toast.success("Staff invitation sent")
      onInvited()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <div className="w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 px-7">
          <div>
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              Invite Staff
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Send access to a staff member by email.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close invite staff modal"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitInvite)}>
          <div className="space-y-5 px-7 py-6">
            <FormField label="Full name" error={errors.fullName?.message}>
              <div className="relative">
                <UserRoundCog
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Full name must contain at least 2 characters",
                    },
                  })}
                  className={`${fieldClassName} pl-11`}
                />
              </div>
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  })}
                  className={`${fieldClassName} pl-11`}
                />
              </div>
            </FormField>

            <FormField label="Phone">
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  {...register("phoneNumber")}
                  className={`${fieldClassName} pl-11`}
                />
              </div>
            </FormField>

            <FormField label="Role">
              <div className="relative">
                <select
                  {...register("role")}
                  className={`${fieldClassName} appearance-none pr-11`}
                >
                  {staffRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </FormField>

            {selectedRole === "maintenance_technician" && (
              <FormField label="Maintenance type">
                <input
                  type="text"
                  {...register("maintenanceType")}
                  placeholder="Electrical, plumbing, lift service..."
                  className={fieldClassName}
                />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-200 bg-white px-7 py-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={inviteStaff.isPending}
              className="flex h-12 items-center justify-center rounded-lg border border-slate-200 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={inviteStaff.isPending}
              className="flex h-12 items-center justify-center rounded-lg bg-[#0F5F45] text-[15px] font-semibold text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {inviteStaff.isPending ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
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
      <span className="mb-2 block text-[15px] font-bold leading-5 text-slate-700">
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

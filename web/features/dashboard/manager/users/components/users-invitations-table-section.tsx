"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MailCheck,
  MoreVertical,
  RotateCcw,
  Search,
  Send,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import {
  useInvitationsQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
} from "../hooks/use-residents-query"
import type {
  InvitationMember,
  InvitationRole,
  InvitationStatus,
} from "../types/users"

const roleOptions: { label: string; value: "all" | InvitationRole }[] = [
  { label: "All Roles", value: "all" },
  { label: "Owner", value: "owner" },
  { label: "Tenant", value: "resident" },
]

const statusOptions: { label: string; value: "all" | InvitationStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "All Status", value: "all" },
  { label: "Accepted", value: "accepted" },
  { label: "Expired", value: "expired" },
  { label: "Revoked", value: "revoked" },
]

export default function UsersInvitationsTableSection() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"all" | InvitationRole>("all")
  const [status, setStatus] = useState<"all" | InvitationStatus>("pending")
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState<string | null>(null)
  const limit = 10

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      inviteType: "residents" as const,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
      page,
      limit,
    }),
    [limit, page, role, search, status]
  )

  const {
    data,
    isLoading,
    isError,
    error,
  } = useInvitationsQuery(params)
  const resendInvitation = useResendInvitationMutation()
  const revokeInvitation = useRevokeInvitationMutation()
  const invitations = useMemo(
    () => data?.invitations ?? [],
    [data?.invitations]
  )
  const totalPages = data?.totalPages ?? 1

  const resetFilters = () => {
    setSearch("")
    setRole("all")
    setStatus("pending")
    setPage(1)
  }

  const handleResend = async (invitation: InvitationMember) => {
    setActionId(invitation.id)

    try {
      await resendInvitation.mutateAsync(invitation.id)
      toast.success("Invitation resent")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend invitation"
      )
    } finally {
      setActionId(null)
    }
  }

  const handleRevoke = async (invitation: InvitationMember) => {
    setActionId(invitation.id)

    try {
      await revokeInvitation.mutateAsync(invitation.id)
      toast.success("Invitation revoked")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke invitation"
      )
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search by invitee name or email..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          <SelectFilter
            value={role}
            onChange={(value) => {
              setRole(value as "all" | InvitationRole)
              setPage(1)
            }}
            options={roleOptions}
            widthClassName="lg:w-[210px]"
          />

          <SelectFilter
            value={status}
            onChange={(value) => {
              setStatus(value as "all" | InvitationStatus)
              setPage(1)
            }}
            options={statusOptions}
            widthClassName="lg:w-[160px]"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-slate-950 lg:w-[110px]"
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <TableHead>Invitee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Flat</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {!isLoading &&
              !isError &&
              invitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                        <MailCheck size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {invitation.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {invitation.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-[#E7F4EE] px-2.5 py-1 text-xs font-medium text-[#0F5F45]">
                      {formatRoleLabel(invitation.role)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {invitation.flat}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {invitation.phone}
                  </td>

                  <td className="px-4 py-4">
                    <InvitationStatusBadge status={invitation.status} />
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(invitation.sentAt)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(invitation.expiresAt)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="group relative inline-block text-left">
                      <button
                        type="button"
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                      >
                        <MoreVertical size={18} />
                      </button>

                      <div className="invisible absolute right-0 top-9 z-20 w-48 translate-y-1 rounded-lg border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={
                            actionId === invitation.id ||
                            invitation.status === "accepted" ||
                            invitation.status === "revoked"
                          }
                          onClick={() => handleResend(invitation)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={15} />
                          {actionId === invitation.id &&
                          resendInvitation.isPending
                            ? "Resending..."
                            : "Resend invite"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionId === invitation.id ||
                            invitation.status !== "pending"
                          }
                          onClick={() => handleRevoke(invitation)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle size={15} />
                          {actionId === invitation.id &&
                          revokeInvitation.isPending
                            ? "Revoking..."
                            : "Revoke invite"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {isLoading && <StateMessage message="Loading invitations..." />}

        {isError && (
          <StateMessage
            message={
              error instanceof Error
                ? error.message
                : "Failed to load invitations"
            }
          />
        )}

        {!isLoading && !isError && invitations.length === 0 && (
          <StateMessage message="No invitations found" />
        )}
      </div>

      <div className="flex justify-end border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0F5F45] px-2 text-sm font-medium text-white shadow-sm"
          >
            {page}
          </button>

          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() =>
              setPage((currentPage) => Math.min(totalPages, currentPage + 1))
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SelectFilter({
  value,
  onChange,
  options,
  widthClassName,
}: {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  widthClassName: string
}) {
  return (
    <div className={`relative w-full ${widthClassName}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
      />
    </div>
  )
}

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode
  align?: "left" | "right"
}) {
  const alignClassName = align === "right" ? "text-right" : "text-left"

  return (
    <th
      className={`px-4 py-3.5 ${alignClassName} text-xs font-semibold uppercase tracking-wider text-slate-500`}
    >
      {children}
    </th>
  )
}

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const styles: Record<InvitationStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    expired: "bg-slate-100 text-slate-600",
    revoked: "bg-red-50 text-red-600",
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {formatLabel(status)}
    </span>
  )
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  )
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatRoleLabel(role: InvitationRole) {
  if (role === "resident") return "Tenant"

  return formatLabel(role)
}

function formatDate(date?: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

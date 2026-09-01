"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react"

import { staffRoleOptions } from "../api/staff.api"
import { useStaffQuery } from "../hooks/use-staff-query"
import type {
  StaffMember,
  StaffRole,
  StaffStatus,
} from "../types/staff"
import StaffDetailsDrawer from "./staff-details-drawer"

const roleStyles: Record<StaffRole, string> = {
  property_manager: "bg-[#E7F4EE] text-[#0F5F45]",
  treasurer: "bg-sky-50 text-sky-700",
  facility_manager: "bg-indigo-50 text-indigo-700",
  security_staff: "bg-amber-50 text-amber-700",
  maintenance_technician: "bg-violet-50 text-violet-700",
}

export default function StaffTableSection() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<"all" | StaffRole>("all")
  const [status, setStatus] = useState<"all" | StaffStatus>("all")
  const [page, setPage] = useState(1)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view")
  const limit = 10

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
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
  } = useStaffQuery(params)
  const staff = useMemo(() => data?.staff ?? [], [data?.staff])
  const totalPages = data?.totalPages ?? 1

  const resetFilters = () => {
    setSearch("")
    setRole("all")
    setStatus("all")
    setPage(1)
  }

  const openDrawer = (staffId: string, mode: "view" | "edit") => {
    setSelectedStaffId(staffId)
    setDrawerMode(mode)
  }

  const closeDrawer = () => {
    setSelectedStaffId(null)
    setDrawerMode("view")
  }

  return (
    <>
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
                placeholder="Search by name, email or phone..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>

            <SelectFilter
              value={role}
              onChange={(value) => {
                setRole(value as "all" | StaffRole)
                setPage(1)
              }}
              options={[
                { label: "All Roles", value: "all" },
                ...staffRoleOptions,
              ]}
              widthClassName="lg:w-[230px]"
            />

            <SelectFilter
              value={status}
              onChange={(value) => {
                setStatus(value as "all" | StaffStatus)
                setPage(1)
              }}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              widthClassName="lg:w-[150px]"
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
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!isLoading &&
                !isError &&
                staff.map((member) => (
                  <StaffRow
                    key={member.id}
                    member={member}
                    onView={() => openDrawer(member.id, "view")}
                    onEdit={() => openDrawer(member.id, "edit")}
                  />
                ))}
            </tbody>
          </table>

          {isLoading && <StateMessage message="Loading staff..." />}

          {isError && (
            <StateMessage
              message={
                error instanceof Error
                  ? error.message
                  : "Failed to load staff"
              }
            />
          )}

          {!isLoading && !isError && staff.length === 0 && (
            <StateMessage message="No staff found" />
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

      <StaffDetailsDrawer
        staffId={selectedStaffId}
        open={Boolean(selectedStaffId)}
        mode={drawerMode}
        onModeChange={setDrawerMode}
        onClose={closeDrawer}
      />
    </>
  )
}

function StaffRow({
  member,
  onView,
  onEdit,
}: {
  member: StaffMember
  onView: () => void
  onEdit: () => void
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${roleStyles[member.role]}`}
          >
            {getInitials(member.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {member.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {member.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <RoleBadge role={member.role} />
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {member.role === "maintenance_technician"
          ? member.maintenanceType || "-"
          : "-"}
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {member.phone}
      </td>

      <td className="px-4 py-4">
        <StatusBadge status={member.status} />
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {formatDate(member.joinedAt)}
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
              onClick={onView}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={15} />
              View details
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit staff
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={onView}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                member.status === "inactive"
                  ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              {member.status === "inactive" ? (
                <>
                  <UserCheck size={15} />
                  Activate staff
                </>
              ) : (
                <>
                  <UserX size={15} />
                  Deactivate staff
                </>
              )}
            </button>
          </div>
        </div>
      </td>
    </tr>
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

export function RoleBadge({ role }: { role: StaffRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[role]}`}
    >
      {formatRoleLabel(role)}
    </span>
  )
}

export function StatusBadge({ status }: { status: StaffStatus }) {
  const styles: Record<StaffStatus, string> = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-red-50 text-red-600",
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

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatRoleLabel(role: StaffRole) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatDate(date?: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

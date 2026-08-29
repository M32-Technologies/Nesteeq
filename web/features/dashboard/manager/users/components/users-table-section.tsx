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

import { useResidentsQuery } from "../hooks/use-residents-query"
import type {
  ResidentStatus,
  ResidentType,
  ResidentUser,
} from "../types/users"
import UsersDetailsDrawer from "./users-details-drawer"

const typeStyles: Record<ResidentType, string> = {
  owner: "bg-[#E7F4EE] text-[#0F5F45]",
  resident: "bg-[#EEF7F2] text-[#176B50]",
}

export default function UsersTableSection() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<"all" | ResidentType>("all")
  const [blockId, setBlockId] = useState("all")
  const [status, setStatus] = useState<"all" | ResidentStatus>("all")
  const [page, setPage] = useState(1)
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view")
  const limit = 10

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      residentType: type === "all" ? undefined : type,
      blockId: blockId === "all" ? undefined : blockId,
      status: status === "all" ? undefined : status,
      page,
      limit,
    }),
    [blockId, limit, page, search, status, type]
  )

  const {
    data,
    isLoading,
    isError,
    error,
  } = useResidentsQuery(params)

  const users = useMemo(() => data?.residents ?? [], [data?.residents])
  const blockOptions = useMemo(() => getBlockOptions(users, blockId), [users, blockId])
  const totalPages = data?.totalPages ?? 1

  const resetFilters = () => {
    setSearch("")
    setType("all")
    setBlockId("all")
    setStatus("all")
    setPage(1)
  }

  const openDrawer = (residentId: string, mode: "view" | "edit") => {
    setSelectedResidentId(residentId)
    setDrawerMode(mode)
  }

  const closeDrawer = () => {
    setSelectedResidentId(null)
    setDrawerMode("view")
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
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
              placeholder="Search by name, email, phone or flat..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          <SelectFilter
            value={type}
            onChange={(value) => {
              setType(value as "all" | ResidentType)
              setPage(1)
            }}
            options={[
              { label: "All User Types", value: "all" },
              { label: "Owner", value: "owner" },
              { label: "Resident", value: "resident" },
            ]}
            widthClassName="xl:w-[170px]"
          />

          <SelectFilter
            value={blockId}
            onChange={(value) => {
              setBlockId(value)
              setPage(1)
            }}
            options={[
              { label: "All Blocks", value: "all" },
              ...blockOptions,
            ]}
            widthClassName="xl:w-[150px]"
          />

          <SelectFilter
            value={status}
            onChange={(value) => {
              setStatus(value as "all" | ResidentStatus)
              setPage(1)
            }}
            options={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
              { label: "Inactive", value: "inactive" },
            ]}
            widthClassName="xl:w-[150px]"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-slate-950"
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
              <TableHead>User</TableHead>
              <TableHead>Flat</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {!isLoading &&
              !isError &&
              users.map((user) => (
                <tr
                  key={user.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${typeStyles[user.type]}`}
                      >
                        {getInitials(user.name)}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {user.flat}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {user.block}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeStyles[user.type]}`}
                    >
                      {getTypeLabel(user.type)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {user.phone}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={user.status} />
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
                          onClick={() => openDrawer(user.id, "view")}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View details
                        </button>

                        <button
                          type="button"
                          onClick={() => openDrawer(user.id, "edit")}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit user
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {user.status === "inactive" ? (
                          <button
                            type="button"
                            onClick={() => openDrawer(user.id, "view")}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                          >
                            <UserCheck size={15} />
                            Activate user
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDrawer(user.id, "view")}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            <UserX size={15} />
                            Deactivate user
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {isLoading && <StateMessage message="Loading users..." />}

        {isError && (
          <StateMessage
            message={
              error instanceof Error
                ? error.message
                : "Failed to load users"
            }
          />
        )}

        {!isLoading && !isError && users.length === 0 && (
          <StateMessage message="No users found" />
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

      <UsersDetailsDrawer
        residentId={selectedResidentId}
        open={Boolean(selectedResidentId)}
        mode={drawerMode}
        onModeChange={setDrawerMode}
        onClose={closeDrawer}
      />
    </>
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
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 ${widthClassName}`}
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

function StatusBadge({ status }: { status: ResidentStatus }) {
  const styles: Record<ResidentStatus, string> = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-700",
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {getStatusLabel(status)}
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

function getBlockOptions(users: ResidentUser[], selectedBlockId: string) {
  const blockOptions = new Map<string, string>()

  for (const user of users) {
    if (user.blockId) {
      blockOptions.set(user.blockId, user.block)
    }
  }

  if (selectedBlockId !== "all" && !blockOptions.has(selectedBlockId)) {
    blockOptions.set(selectedBlockId, selectedBlockId)
  }

  return Array.from(blockOptions.entries()).map(([value, label]) => ({
    value,
    label,
  }))
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getTypeLabel(type: ResidentType) {
  return type === "owner" ? "Owner" : "Resident"
}

function getStatusLabel(status: ResidentStatus) {
  const labels: Record<ResidentStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
  }

  return labels[status]
}

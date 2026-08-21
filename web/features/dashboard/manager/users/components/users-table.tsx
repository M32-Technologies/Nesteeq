import {
  MoreHorizontal,
  Users,
} from "lucide-react"

import type {
  ResidentStatus,
  ResidentType,
  ResidentUser,
} from "../types/users"

type UsersTableProps = {
  users: ResidentUser[]
}

export default function UsersTable({
  users,
}: UsersTableProps) {
  return (
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#E7EBF0] bg-[#F8FAFC]">
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>

              <th className="w-[64px] px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEF1F4]">
            {users.map((user) => (
              <tr
                key={user.id}
                className="
                  bg-white
                  transition-colors
                  hover:bg-[#F8FAFC]
                "
              >
                {/* USER */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">
                        {user.name}
                      </p>

                      <p className="mt-0.5 text-xs text-[#94A3B8]">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </td>

                {/* CONTACT */}

                <td className="px-5 py-4">
                  <p className="text-sm text-[#475569]">
                    {user.email}
                  </p>

                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {user.phone}
                  </p>
                </td>

                {/* TYPE */}

                <td className="px-5 py-4">
                  <UserTypeBadge type={user.type} />
                </td>

                {/* PROPERTY */}

                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-[#334155]">
                    {user.flat}
                  </p>

                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {user.block} · {user.floor}
                  </p>
                </td>

                {/* STATUS */}

                <td className="px-5 py-4">
                  <UserStatusBadge
                    status={user.status}
                  />
                </td>

                {/* ACTION */}

                <td className="px-4 py-4">
                  <button
                    type="button"
                    aria-label={`Actions for ${user.name}`}
                    className="
                      flex
                      size-9
                      items-center
                      justify-center
                      rounded-lg
                      text-[#64748B]
                      transition-colors
                      hover:bg-[#EEF2F6]
                      hover:text-[#0F172A]
                    "
                  >
                    <MoreHorizontal className="size-[18px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#F1F5F9]">
              <Users className="size-5 text-[#64748B]" />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#0F172A]">
              No users found
            </p>

            <p className="mt-1 text-sm text-[#94A3B8]">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}

      {users.length > 0 && (
        <div
          className="
            flex
            flex-col
            gap-3
            border-t
            border-[#E7EBF0]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p className="text-sm text-[#64748B]">
            Showing{" "}
            <span className="font-medium text-[#334155]">
              {users.length}
            </span>{" "}
            users
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="
                h-9
                rounded-lg
                border
                border-[#E2E8F0]
                px-3
                text-sm
                font-medium
                text-[#64748B]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Previous
            </button>

            <button
              type="button"
              disabled
              className="
                h-9
                rounded-lg
                border
                border-[#E2E8F0]
                px-3
                text-sm
                font-medium
                text-[#64748B]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TableHead({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <th
      className="
        px-5
        py-3
        text-left
        text-[11px]
        font-semibold
        uppercase
        tracking-[0.06em]
        text-[#64748B]
      "
    >
      {children}
    </th>
  )
}

function UserAvatar({
  name,
}: {
  name: string
}) {
  const initials = name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="
        flex
        size-10
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#E8F0F8]
        text-xs
        font-semibold
        text-[#16477C]
      "
    >
      {initials}
    </div>
  )
}

function UserTypeBadge({
  type,
}: {
  type: ResidentType
}) {
  const styles: Record<ResidentType, string> = {
    owner:
      "bg-[#E9F5F1] text-[#176B57]",
    tenant:
      "bg-[#EEF3FB] text-[#315E9D]",
    resident:
      "bg-[#F4F1FA] text-[#6D4BA0]",
  }

  return (
    <span
      className={`
        inline-flex
        rounded-md
        px-2.5
        py-1
        text-xs
        font-semibold
        capitalize
        ${styles[type]}
      `}
    >
      {type}
    </span>
  )
}

function UserStatusBadge({
  status,
}: {
  status: ResidentStatus
}) {
  const styles: Record<ResidentStatus, string> = {
    active:
      "bg-[#EAF7F1] text-[#177354]",
    pending:
      "bg-[#FFF5E5] text-[#A96816]",
    inactive:
      "bg-[#F1F3F5] text-[#68737F]",
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-xs
        font-medium
        capitalize
        ${styles[status]}
      `}
    >
      <span className="size-1.5 rounded-full bg-current" />

      {status}
    </span>
  )
}

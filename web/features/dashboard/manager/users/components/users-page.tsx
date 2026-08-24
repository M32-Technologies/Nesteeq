"use client"

import { useMemo, useState } from "react"

import type {
  ResidentStatus,
  ResidentType,
} from "../types/users"
import { useResidentsQuery } from "../queries/user.querie"

import UsersHeader from "./users-header"
import UsersStats from "./users-stats"
import UsersTable from "./users-table"
import UsersToolbar from "./users-toolbar"

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<
    "all" | ResidentType
  >("all")

  const [block, setBlock] = useState("all")

  const [status, setStatus] = useState<
    "all" | ResidentStatus
  >("all")

  const residentParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      residentType:
        type === "all" ? undefined : type,
      blockId:
        block !== "all" && isMongoObjectId(block)
          ? block
          : undefined,
      status:
        status === "all" ? undefined : status,
      page: 1,
      limit: 10,
    }),
    [search, type, block, status]
  )

  const {
    data,
    isLoading,
    isError,
    error,
  } = useResidentsQuery(residentParams)

  const users = data?.residents ?? []

  const filteredUsers = useMemo(() => {
    if (
      block === "all" ||
      isMongoObjectId(block)
    ) {
      return users
    }

    return users.filter(
      (user) => user.block === block
    )
  }, [block, users])

  const stats = useMemo(
    () => ({
      totalResidents: data?.totalCount ?? 0,
      owners: users.filter(
        (user) => user.type === "owner"
      ).length,
      tenants: users.filter(
        (user) => user.type === "tenant"
      ).length,
      pendingInvites: users.filter(
        (user) => user.status === "pending"
      ).length,
    }),
    [data?.totalCount, users]
  )

  return (
    <div
      className="
        min-h-screen
        min-w-0
        bg-[#F6F8FA]
        px-4
        py-6
        sm:px-6
        lg:px-7
        xl:px-8
      "
    >
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        <UsersHeader />

        <div className="mt-6">
          <UsersStats stats={stats} />
        </div>

        <div
          className="
            mt-6
            min-w-0
            overflow-hidden
            rounded-xl
            border
            border-[#E7EBF0]
            bg-white
          "
        >
          <UsersToolbar
            search={search}
            type={type}
            block={block}
            status={status}
            onSearchChange={setSearch}
            onTypeChange={setType}
            onBlockChange={setBlock}
            onStatusChange={setStatus}
          />

          {isLoading ? (
            <StateMessage message="Loading residents..." />
          ) : isError ? (
            <StateMessage
              message={
                error instanceof Error
                  ? error.message
                  : "Failed to load residents"
              }
            />
          ) : (
            <UsersTable users={filteredUsers} />
          )}
        </div>
      </div>
    </div>
  )
}

function StateMessage({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm font-medium text-[#64748B]">
      {message}
    </div>
  )
}

function isMongoObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value)
}

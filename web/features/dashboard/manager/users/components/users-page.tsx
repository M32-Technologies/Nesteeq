"use client"

import { useMemo, useState } from "react"

import {
  mockUsers,
  mockUserStats,
} from "../data/mock.data"

import type {
  ResidentStatus,
  ResidentType,
} from "../types/users"

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

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return mockUsers.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.flat.toLowerCase().includes(query)

      const matchesType =
        type === "all" || user.type === type

      const matchesBlock =
        block === "all" || user.block === block

      const matchesStatus =
        status === "all" ||
        user.status === status

      return (
        matchesSearch &&
        matchesType &&
        matchesBlock &&
        matchesStatus
      )
    })
  }, [search, type, block, status])

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
          <UsersStats stats={mockUserStats} />
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

          <UsersTable users={filteredUsers} />
        </div>
      </div>
    </div>
  )
}

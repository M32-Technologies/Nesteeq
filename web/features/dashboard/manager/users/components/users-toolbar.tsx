import {
  ChevronDown,
  Search,
} from "lucide-react"

import type {
  ResidentStatus,
  ResidentType,
} from "../types/users"

type UsersToolbarProps = {
  search: string
  type: "all" | ResidentType
  block: string
  status: "all" | ResidentStatus

  onSearchChange: (value: string) => void
  onTypeChange: (value: "all" | ResidentType) => void
  onBlockChange: (value: string) => void
  onStatusChange: (
    value: "all" | ResidentStatus
  ) => void
}

export default function UsersToolbar({
  search,
  type,
  block,
  status,
  onSearchChange,
  onTypeChange,
  onBlockChange,
  onStatusChange,
}: UsersToolbarProps) {
  return (
    <div
      className="
        flex
        flex-col
        gap-3
        border-b
        border-[#E7EBF0]
        p-4
        lg:flex-row
        lg:items-center
      "
    >
      {/* SEARCH */}

      <div className="relative min-w-0 flex-1">
        <Search
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            size-[17px]
            -translate-y-1/2
            text-[#94A3B8]
          "
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search by name, email, phone or flat..."
          className="
            h-10
            w-full
            rounded-lg
            border
            border-[#E2E8F0]
            bg-white
            pl-10
            pr-4
            text-sm
            text-[#0F172A]
            outline-none
            transition
            placeholder:text-[#94A3B8]
            hover:border-[#CBD5E1]
            focus:border-[#16477C]
            focus:ring-4
            focus:ring-[#16477C]/10
          "
        />
      </div>

      {/* FILTERS */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-3
          lg:flex
          lg:shrink-0
        "
      >
        <SelectFilter
          value={type}
          onChange={(value) =>
            onTypeChange(
              value as "all" | ResidentType
            )
          }
          options={[
            { label: "All types", value: "all" },
            { label: "Owners", value: "owner" },
            { label: "Tenants", value: "tenant" },
            { label: "Residents", value: "resident" },
          ]}
        />

        <SelectFilter
          value={block}
          onChange={onBlockChange}
          options={[
            { label: "All blocks", value: "all" },
            { label: "Block A", value: "Block A" },
            { label: "Block B", value: "Block B" },
            { label: "Block C", value: "Block C" },
          ]}
        />

        <SelectFilter
          value={status}
          onChange={(value) =>
            onStatusChange(
              value as "all" | ResidentStatus
            )
          }
          options={[
            { label: "All status", value: "all" },
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </div>
    </div>
  )
}

type SelectFilterProps = {
  value: string
  onChange: (value: string) => void

  options: {
    label: string
    value: string
  }[]
}

function SelectFilter({
  value,
  onChange,
  options,
}: SelectFilterProps) {
  return (
    <div className="relative min-w-[140px]">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-10
          w-full
          appearance-none
          rounded-lg
          border
          border-[#E2E8F0]
          bg-white
          pl-3
          pr-9
          text-sm
          font-medium
          text-[#475569]
          outline-none
          transition
          hover:border-[#CBD5E1]
          focus:border-[#16477C]
          focus:ring-4
          focus:ring-[#16477C]/10
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          size-4
          -translate-y-1/2
          text-[#94A3B8]
        "
      />
    </div>
  )
}

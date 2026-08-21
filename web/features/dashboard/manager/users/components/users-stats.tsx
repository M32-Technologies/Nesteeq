import {
  Clock3,
  House,
  KeyRound,
  Users,
} from "lucide-react"

import type { UserStats } from "@/features/dashboard/manager/users/types/users"

type UsersStatsProps = {
  stats: UserStats
}

const statItems = [
  {
    key: "totalResidents" as const,
    title: "Total Residents",
    description: "All registered residents",
    icon: Users,
  },
  {
    key: "owners" as const,
    title: "Owners",
    description: "Registered flat owners",
    icon: House,
  },
  {
    key: "tenants" as const,
    title: "Tenants",
    description: "Currently registered tenants",
    icon: KeyRound,
  },
  {
    key: "pendingInvites" as const,
    title: "Pending Invites",
    description: "Waiting for acceptance",
    icon: Clock3,
  },
]

export default function UsersStats({
  stats,
}: UsersStatsProps) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        2xl:grid-cols-4
      "
    >
      {statItems.map((item) => {
        const Icon = item.icon

        return (
          <div
            key={item.key}
            className="
              min-w-0
              rounded-xl
              border
              border-[#E7EBF0]
              bg-white
              p-5
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#64748B]">
                  {item.title}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {stats[item.key]}
                </p>

                <p className="mt-1 truncate text-xs text-[#94A3B8]">
                  {item.description}
                </p>
              </div>

              <div
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#EEF4FA]
                  text-[#16477C]
                "
              >
                <Icon className="size-[18px] stroke-[1.8]" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
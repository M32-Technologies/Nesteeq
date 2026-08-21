import type { ReactNode } from "react"

import DashboardSidebar from "@/features/dashboard/components/dashboard-sidebar"
import type { DashboardRole } from "@/features/dashboard/config/sidebar-navigation"

type DashboardShellProps = {
  children: ReactNode
  role: DashboardRole
  user: {
    name: string
    email: string
    image?: string | null
  }
}

export default function DashboardShell({
  children,
  role,
  user,
}: DashboardShellProps) {
  return (
    <div className="min-h-svh bg-[#F7F9FB]">
      <DashboardSidebar role={role} user={user} />

      <main
        className="
          min-h-svh
          px-5
          py-5
          transition-[padding-left]
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:pl-[108px]
          lg:peer-hover/sidebar:pl-[296px]
        "
      >
        {children}
      </main>
    </div>
  )
}

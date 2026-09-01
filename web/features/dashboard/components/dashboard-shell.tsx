"use client"

import type { ReactNode } from "react"
import { useState } from "react"

import DashboardNavbar from "@/features/dashboard/components/dashboard-navbar"
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-svh bg-[#F7F9FB]">
      <DashboardSidebar
        role={role}
        user={user}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      <main
        className="
          min-h-svh
          pb-5
          pt-0
          transition-[padding-left]
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:pl-[76px]
          lg:peer-hover/sidebar:pl-[264px]
        "
      >
        <DashboardNavbar
          role={role}
          user={user}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="mt-5 px-4 sm:px-5">{children}</div>
      </main>
    </div>
  )
}

"use client"

import type { ReactNode } from "react"
import { useState } from "react"

import DashboardNavbar from "@/features/dashboard/components/dashboard-navbar"
import DashboardSidebar from "@/features/dashboard/components/dashboard-sidebar"
import { ResidentNavbar } from "@/features/dashboard/resident/components/resident-navbar"
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
  const isResident = role === "resident"

  if (isResident) {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ background: 'var(--background)' }}>
        {/* Dedicated Resident Portal Navbar (Top row + Sub-nav page tabs) with NO sidebar */}
        <ResidentNavbar user={user} />

        <main className="flex-1 w-full min-h-screen pb-12 pt-0">
          <div className="mt-5 w-full px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <DashboardSidebar
        role={role}
        user={user}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      <main
        className="
          flex-1
          min-h-screen
          pb-6
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

        <div className="mt-5 px-4 sm:px-6">{children}</div>
      </main>
    </div>
  )
}

import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import DashboardShell from "@/features/dashboard/components/dashboard-shell"
import {
  getDashboardHomePath,
  requireCurrentDashboardSession,
} from "@/lib/dashboard-auth"

type MaintenanceTechnicianLayoutProps = {
  children: ReactNode
}

export default async function MaintenanceTechnicianLayout({
  children,
}: MaintenanceTechnicianLayoutProps) {
  const dashboardSession = await requireCurrentDashboardSession()

  if (dashboardSession.role !== "maintenance_technician") {
    redirect(getDashboardHomePath(dashboardSession.role))
  }

  return (
    <DashboardShell role={dashboardSession.role} user={dashboardSession.user}>
      {children}
    </DashboardShell>
  )
}

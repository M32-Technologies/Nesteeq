import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import DashboardShell from "@/features/dashboard/components/dashboard-shell"
import {
  getDashboardHomePath,
  requireCurrentDashboardSession,
} from "@/lib/dashboard-auth"

type FacilityManagerLayoutProps = {
  children: ReactNode
}

export default async function FacilityManagerLayout({
  children,
}: FacilityManagerLayoutProps) {
  const dashboardSession = await requireCurrentDashboardSession()

  if (dashboardSession.role !== "facility_manager") {
    redirect(getDashboardHomePath(dashboardSession.role))
  }

  return (
    <DashboardShell role={dashboardSession.role} user={dashboardSession.user}>
      {children}
    </DashboardShell>
  )
}

import type { ReactNode } from "react"

import DashboardShell from "@/features/dashboard/components/dashboard-shell"
import { requireCurrentDashboardSession } from "@/lib/dashboard-auth"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const dashboardSession = await requireCurrentDashboardSession()

  return (
    <DashboardShell role={dashboardSession.role} user={dashboardSession.user}>
      {children}
    </DashboardShell>
  )
}

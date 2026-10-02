import type { ReactNode } from "react"

import DashboardShell from "@/features/dashboard/components/dashboard-shell"
import { requireCurrentDashboardSession } from "@/lib/dashboard-auth"
import { ApartmentInactiveModal } from "@/components/apartment-inactive-modal"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const dashboardSession = await requireCurrentDashboardSession()

  if (dashboardSession.apartmentStatus === "inactive") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)]">
        <ApartmentInactiveModal
          isOpen
          role={dashboardSession.role}
          apartmentName={dashboardSession.apartmentName}
          reason={dashboardSession.inactiveReason}
        />
      </div>
    )
  }

  return (
    <DashboardShell role={dashboardSession.role} user={dashboardSession.user}>
      {children}
    </DashboardShell>
  )
}

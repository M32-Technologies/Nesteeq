import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import {
  getDashboardHomePath,
  requireCurrentDashboardSession,
} from "@/lib/dashboard-auth"

type PropertyManagerLayoutProps = {
  children: ReactNode
}

export default async function PropertyManagerLayout({
  children,
}: PropertyManagerLayoutProps) {
  const dashboardSession = await requireCurrentDashboardSession()

  if (dashboardSession.role !== "property_manager") {
    redirect(getDashboardHomePath(dashboardSession.role))
  }

  return children
}

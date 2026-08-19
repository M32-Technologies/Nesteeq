import DashboardShell from "@/features/dashboard/components/dashboard-shell"
import type { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}

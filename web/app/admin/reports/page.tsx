import type { Metadata } from "next"
import ReportsPage from "@/features/admin/reports/components/reports-page"

export const metadata: Metadata = {
  title: "Reports & Logs | Nesteeq Admin OS",
  description: "Audit exports, monthly occupancy distributions, and society operational summaries.",
}

export default function AdminReportsRoute() {
  return <ReportsPage />
}

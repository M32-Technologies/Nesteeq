import type { Metadata } from "next"
import AdminDashboardPage from "@/features/admin/dashboard/components/admin-dashboard-page"

export const metadata: Metadata = {
  title: "Admin Dashboard | Nesteeq Admin OS",
  description: "Executive oversight, managed societies, growth analytics, and governance telemetry.",
}

export default function AdminDashboardRoute() {
  return <AdminDashboardPage />
}

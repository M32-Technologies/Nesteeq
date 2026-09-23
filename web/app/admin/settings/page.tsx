import type { Metadata } from "next"
import AdminSettingsPage from "@/features/admin/settings/components/admin-settings-page"

export const metadata: Metadata = {
  title: "Portal Settings | Nesteeq Admin OS",
  description: "Global system configuration, security rules, and platform management.",
}

export default function AdminSettingsRoute() {
  return <AdminSettingsPage />
}

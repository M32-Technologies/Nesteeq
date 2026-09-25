import type { Metadata } from "next"
import AdminSettingsPage from "@/features/admin/settings/components/admin-settings-page"

export const metadata: Metadata = {
  title: "Admin Profile & Settings | Nesteeq Admin OS",
  description: "Administrative profile details, security credentials, and platform access.",
}

export default function AdminSettingsRoute() {
  return <AdminSettingsPage />
}

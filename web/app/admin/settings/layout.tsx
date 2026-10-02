import type { ReactNode } from "react"
import { requireAdminSession } from "@/lib/dashboard-auth"
import AdminShell from "@/features/admin/components/admin-shell"

export default async function AdminSettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdminSession()

  return <AdminShell>{children}</AdminShell>
}

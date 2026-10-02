import type { ReactNode } from "react"
import { requireAdminSession } from "@/lib/dashboard-auth"
import AdminShell from "@/features/admin/components/admin-shell"

export default async function AdminUsersLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdminSession()

  return <AdminShell>{children}</AdminShell>
}
